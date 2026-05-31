import os
import io
import re
import json
import uuid
import zipfile
import shutil
import asyncio
import logging
import httpx
import pdfplumber
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
import socket

from .config import settings
from .schemas import (
    JDAnalysisRequest,
    JDAnalysisResponse,
    ProjectIngest,
    OutreachRequest,
    OutreachResponse,
    CareerCompassResponse,
    SalaryRequest,
    SalaryIntelligenceResponse,
    CoverLetterRequest,
    CoverLetterResponse,
    ProjectAuditRequest,
    ProjectAuditResponse,
    ATSScoreResponse,
)
from .vector_store import vector_store
from .agents import orchestrator, RateLimitExceeded
from .dl_salary import predict as dl_predict

# ── Standardised 503 payload for rate-limit exhaustion ────────────────────────
# Returned by every endpoint when tenacity gives up after 5 retry attempts.
# The Vite/React frontend checks for this shape to show a toast notification.
_RATE_LIMIT_RESPONSE = {
    "error": "AI capacity temporarily reached. Please try again in 60 seconds."
}

# Initialize root logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("placementos.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager that handles FastAPI startup and shutdown routines.
    Reads and seeds portfolio.json into the ChromaDB vector store.
    """
    logger.info("Initializing PlacementOS Backend...")
    
    # 1. Look for initial portfolio.json and seed the vector database
    portfolio_path = settings.portfolio_json_path
    if os.path.exists(portfolio_path):
        logger.info(f"Found portfolio file at {portfolio_path}. Starting automatic ingestion...")
        try:
            with open(portfolio_path, "r", encoding="utf-8") as f:
                projects = json.load(f)
                
            for p_data in projects:
                # Validate input matching ProjectIngest schema
                project = ProjectIngest(**p_data)
                
                # Ingest to vector database (asynchronous, runs DB calls in thread pool)
                p_id = await vector_store.add_project(project)
                logger.info(f"Seeded project: '{project.title}' with vector ID: {p_id}")
            logger.info("Portfolio database seeding completed successfully.")
            
        except ValueError as ve:
            logger.warning(
                f"Startup Seeding Skipped: {ve}. "
                "The server will continue to run. Please configure GEMINI_API_KEY in backend/.env "
                "and restart the backend, or use the /api/portfolio/ingest endpoint once configured."
            )
        except Exception as e:
            logger.error(f"Failed to seed initial portfolio data: {e}", exc_info=True)
    else:
        logger.warning(f"Portfolio file '{portfolio_path}' not found. Vector store will start empty.")
        
    yield
    
    logger.info("Shutting down PlacementOS Backend...")

# Create FastAPI application instance
app = FastAPI(
    title="PlacementOS API",
    description="Multi-agent asynchronous RAG backend for parsing JDs and analyzing portfolio alignment.",
    version="1.0.0",
    lifespan=lifespan
)

# Explicit CORS configuration for Vite Frontend local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],  # Allow GET, POST, OPTIONS etc.
    allow_headers=["*"],  # Allow all default headers
)

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Simple health verification endpoint checking configuration states.
    """
    has_api_key = settings.gemini_api_key is not None and len(settings.gemini_api_key) > 0
    return {
        "status": "healthy",
        "gemini_api_key_configured": has_api_key,
        "active_models": {
            "llm": settings.gemini_model,
            "embeddings": f"{settings.local_embedding_model} (local SentenceTransformer)"
        }
    }

@app.get("/api/network-ip", status_code=status.HTTP_200_OK)
async def get_network_ip():
    """
    Returns the local network IP address of the machine running the backend.
    Useful for generating QR codes for mobile device access on the same network.
    """
    try:
        # Create a dummy socket to determine the local IP used for internet access
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Doesn't have to be reachable, just forces the OS to choose a route
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return {"ip": ip}
    except Exception as e:
        logger.error(f"Failed to determine local IP: {e}")
        return {"ip": "127.0.0.1"}

@app.post(
    "/api/analyze",
    response_model=JDAnalysisResponse,
    status_code=status.HTTP_200_OK
)
async def analyze_job_description(request: JDAnalysisRequest):
    """
    Trigger the multi-agent asynchronous pipeline to evaluate compatibility
    between a job description and the candidate's vector-indexed portfolio.
    """
    if not request.job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text cannot be empty."
        )
        
    try:
        # Run the full async multi-agent execution pipeline
        analysis_result = await orchestrator.analyze_jd(request.job_description)
        return analysis_result

    except RateLimitExceeded:
        # Gemini 429 survived all 5 retry attempts → tell frontend to back off
        logger.warning("Rate limit exceeded on /api/analyze after all retries.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_RATE_LIMIT_RESPONSE["error"],
        )
    except ValueError as ve:
        # Specific exception if GEMINI_API_KEY environment config is missing
        logger.error(f"API key error: {ve}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Error during job description analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during job description parsing or retrieval synthesis."
        )

@app.post(
    "/api/outreach",
    response_model=OutreachResponse,
    status_code=status.HTTP_200_OK
)
async def generate_outreach(request: OutreachRequest):
    """
    Triggers Agent 4 (The Networker) to generate personalized LinkedIn connection
    requests and follow-up messages based on the JD analysis output.
    Accepts alignment_score, tailored_bullets, tone, and the original job description.
    """
    if not request.job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty."
        )
    if not request.tailored_bullets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tailored_bullets cannot be empty. Run /api/analyze first."
        )
    try:
        outreach_result = await orchestrator.run_networker_agent(request)
        return outreach_result
    except RateLimitExceeded:
        logger.warning("Rate limit exceeded on /api/outreach after all retries.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_RATE_LIMIT_RESPONSE["error"],
        )
    except ValueError as ve:
        logger.error(f"API key error in outreach: {ve}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Error during outreach generation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while generating outreach messages."
        )

@app.post("/api/portfolio/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_project(project: ProjectIngest):
    """
    Dynamically ingest a new project into the portfolio vector store.
    Useful for on-the-fly portfolio additions from UI dashboard.
    """
    try:
        project_id = await vector_store.add_project(project)
        return {
            "status": "success",
            "message": f"Project '{project.title}' successfully ingested.",
            "project_id": project_id
        }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Ingestion error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest project: {str(e)}"
        )

@app.get("/api/portfolio/list")
async def list_portfolio_items():
    """
    Helper endpoint returning metadata for all portfolio items currently indexed in ChromaDB.
    """
    try:
        def _get_items():
            return vector_store.collection.get(include=["metadatas"])
            
        data = await asyncio.to_thread(_get_items)
        items = []
        if data and data["ids"]:
            for i, meta in zip(data["ids"], data["metadatas"]):
                technologies = []
                try:
                    if meta.get("technologies"):
                        technologies = json.loads(meta["technologies"])
                except Exception:
                    pass
                items.append({
                    "id": i,
                    "title": meta.get("title", ""),
                    "description": meta.get("description", ""),
                    "technologies": technologies,
                    "metrics": meta.get("metrics") or None
                })
        return {"count": len(items), "projects": items}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query portfolio list: {str(e)}"
        )

@app.delete("/api/portfolio/{project_id}", status_code=status.HTTP_200_OK)
async def delete_portfolio_item(project_id: str):
    """
    Remove a project from the vector store by its ID.
    """
    try:
        await vector_store.delete_project(project_id)
        return {"detail": f"Project {project_id} deleted successfully."}
    except Exception as e:
        logger.error(f"Failed to delete project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete the project."
        )

def _extract_text(pdf_bytes: bytes) -> str:
    """Synchronous PDF extraction, safe to run in asyncio.to_thread."""
    text_parts = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text.strip())
    return "\n\n".join(text_parts)


@app.post(
    "/api/compass/upload",
    response_model=CareerCompassResponse,
    status_code=status.HTTP_200_OK
)
async def upload_resume_for_compass(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None)
):
    """
    Career Compass: Accepts a PDF resume upload or raw resume text,
    and feeds it to Agent 5 (The Career Compass Strategist) which returns exactly
    3 AI-ranked career role pathways with alignment scores, core strengths, and
    ordered skill-gap roadmaps.
    """
    if not resume_text and not file:
        raise HTTPException(status_code=400, detail="Either file or resume_text must be provided.")
        
    if not resume_text and file:
        try:
            file_bytes = await file.read()
            resume_text = await asyncio.to_thread(_extract_text, file_bytes)
        except Exception as e:
            logger.error(f"Failed to extract pdf: {e}")
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

    if len(resume_text.strip()) < 150:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "The extracted resume text is too short (less than 150 characters). "
                "The PDF may be a scanned image. Please upload a text-based PDF."
            )
        )

    logger.info(f"Resume text extracted. Size: {len(resume_text)} chars.")

    # ── 5. Run Agent 5 ────────────────────────────────────────────────────────
    try:
        compass_result = await orchestrator.run_strategist_agent(resume_text)
        return compass_result
    except RateLimitExceeded:
        logger.warning("Rate limit exceeded on /api/compass/upload after all retries.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_RATE_LIMIT_RESPONSE["error"],
        )
    except ValueError as ve:
        logger.error(f"API key error in career compass: {ve}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Career Compass analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while analyzing the resume. Please try again."
        )


@app.post(
    "/api/salary/analyze",
    response_model=SalaryIntelligenceResponse,
    status_code=status.HTTP_200_OK
)
async def analyze_salary(request: SalaryRequest):
    """
    Salary Intelligence Agent (Agent 7):
    Returns structured compensation bands, equity norms, signing bonus range,
    negotiation floor/ceiling, a verbatim negotiation script, and market insights
    for the specified role, location, and seniority level.
    """
    if not request.role_title.strip() or not request.location.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="role_title and location are required fields."
        )
    try:
        result = dl_predict(request)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(ve))
    except Exception as e:
        logger.error(f"Salary analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Salary analysis failed. Please try again."
        )


@app.post(
    "/api/cover-letter/generate",
    response_model=CoverLetterResponse,
    status_code=status.HTTP_200_OK
)
async def generate_cover_letter(request: CoverLetterRequest):
    """
    Cover Letter Forge (Agent 8):
    Generates a tailored, non-generic cover letter cross-referencing the job description
    with the candidate's AI-analysed resume bullets. Returns full letter text, word count,
    and key hooks for quick review. Supports three writing styles.
    """
    if not request.job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="job_description cannot be empty."
        )
    if not request.tailored_bullets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tailored_bullets cannot be empty. Run /api/analyze first to get resume bullets."
        )
    try:
        result = await orchestrator.run_cover_letter_agent(request)
        return result
    except RateLimitExceeded:
        logger.warning("Rate limit exceeded on /api/cover-letter/generate after all retries.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_RATE_LIMIT_RESPONSE["error"],
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(ve))
    except Exception as e:
        logger.error(f"Cover letter generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cover letter generation failed. Please try again."
        )


def scan_directory_for_code(dir_path: str, max_chars: int = 35000) -> str:
    """
    Recursively scans the local directory, reads code files, and returns a consolidated string.
    """
    if not os.path.isdir(dir_path):
        raise ValueError(f"Path '{dir_path}' is not a valid directory or is not accessible.")

    exclude_dirs = {
        ".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build", 
        ".vite", "package-lock.json", ".next", ".idea", ".vscode"
    }
    allowed_extensions = {
        ".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".java", ".cpp", ".c", ".h", 
        ".html", ".css", ".rs", ".json", ".sql", ".sh"
    }
    
    consolidated = []
    total_len = 0
    
    for root, dirs, files in os.walk(dir_path):
        # Exclude directories in-place to optimize walk
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext not in allowed_extensions:
                continue
                
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read(12000)  # Read up to 12KB per file
                    
                rel_path = os.path.relpath(file_path, dir_path)
                header = f"\n=== File: {rel_path} ===\n"
                
                if total_len + len(header) + len(content) > max_chars:
                    remaining_space = max_chars - total_len - len(header)
                    if remaining_space > 100:
                        consolidated.append(header + content[:remaining_space] + "\n... [TRUNCATED DUE TO SIZE LIMIT] ...\n")
                    break
                    
                consolidated.append(header + content)
                total_len += len(header) + len(content)
            except Exception as e:
                logger.warning(f"Skipped file {file_path} during scan: {e}")
                
        if total_len >= max_chars:
            break
            
    return "".join(consolidated)


def parse_github_url(url: str) -> tuple[str, str]:
    """
    Extracts owner and repo name from a GitHub URL.
    Supports formats:
    - https://github.com/owner/repo
    - git@github.com:owner/repo.git
    - http://github.com/owner/repo.git
    """
    cleaned_url = url.strip()
    # Check for HTTPS/HTTP format
    match = re.search(r"github\.com/([^/]+)/([^/.]+)", cleaned_url)
    if match:
        return match.group(1), match.group(2)
        
    # Check for SSH format: git@github.com:owner/repo.git
    match_ssh = re.search(r"github\.com:([^/]+)/([^/.]+)", cleaned_url)
    if match_ssh:
        return match_ssh.group(1), match_ssh.group(2)
        
    raise ValueError(
        "Invalid GitHub repository URL. "
        "Must be in the format 'https://github.com/owner/repo'."
    )


async def fetch_github_zipball(owner: str, repo: str, target_dir: str):
    """
    Downloads the zipball of the default branch for a public repository,
    and extracts it to the target directory.
    """
    url = f"https://api.github.com/repos/{owner}/{repo}/zipball"
    headers = {
        "User-Agent": "PlacementOS-App",
        "Accept": "application/vnd.github+json"
    }
    
    logger.info(f"Downloading ZIP archive for {owner}/{repo} from GitHub API...")
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        response = await client.get(url, headers=headers)
        if response.status_code == 404:
            raise ValueError(
                f"Repository '{owner}/{repo}' not found on GitHub. "
                "Ensure the repository is public and the spelling is correct."
            )
        elif response.status_code != 200:
            raise ValueError(
                f"GitHub API returned status code {response.status_code} "
                f"({response.text[:200]})."
            )
            
        zip_bytes = io.BytesIO(response.content)
        
        # Run synchronous zip extraction in executor
        def _extract():
            with zipfile.ZipFile(zip_bytes) as zip_ref:
                zip_ref.extractall(target_dir)
                
        await asyncio.to_thread(_extract)


@app.post(
    "/api/project/audit",
    response_model=ProjectAuditResponse,
    status_code=status.HTTP_200_OK
)
async def audit_project(request: ProjectAuditRequest):
    """
    Agent 6: Project Auditor & Explainer.
    Receives either a local directory path to scan, a public GitHub URL, or direct pasted code snippets,
    and returns a structured analysis containing architecture, Mermaid diagrams,
    interview preparation Q&As, and Google X-Y-Z resume bullets.
    """
    consolidated_code = ""
    temp_dir = None
    
    try:
        if request.github_repo_url:
            url = request.github_repo_url.strip()
            logger.info(f"Auditing project from public GitHub repository: {url}")
            try:
                owner, repo = parse_github_url(url)
            except ValueError as ve:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(ve)
                )
                
            # Create a unique temporary directory inside the backend workspace folder
            data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
            os.makedirs(data_dir, exist_ok=True)
            temp_dir = os.path.join(data_dir, f"temp_github_{uuid.uuid4()}")
            os.makedirs(temp_dir, exist_ok=True)
            
            try:
                # Download and unzip the repository
                await fetch_github_zipball(owner, repo, temp_dir)
                # Scan the extracted repository
                consolidated_code = await asyncio.to_thread(scan_directory_for_code, temp_dir)
            except ValueError as ve:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(ve)
                )
            except Exception as e:
                logger.error(f"Failed to fetch or process GitHub zipball: {e}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error downloading or extracting GitHub repository: {str(e)}"
                )
                
        elif request.local_directory_path:
            path = request.local_directory_path.strip()
            logger.info(f"Auditing project from local directory path: {path}")
            try:
                # Run blocking filesystem walk in thread pool executor
                consolidated_code = await asyncio.to_thread(scan_directory_for_code, path)
            except ValueError as ve:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(ve)
                )
            except Exception as e:
                logger.error(f"Failed to scan directory: {e}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error scanning local directory: {str(e)}"
                )
                
        elif request.code_snippets:
            logger.info(f"Auditing project from {len(request.code_snippets)} code snippet(s)")
            snippet_list = []
            for snippet in request.code_snippets:
                snippet_list.append(f"\n=== File: {snippet.filename} ===\n{snippet.content}")
            consolidated_code = "\n".join(snippet_list)
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide either 'github_repo_url', 'local_directory_path', or 'code_snippets'."
            )
            
        if not consolidated_code.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No readable source code was found to analyze in this repository or directory."
            )
            
        try:
            result = await orchestrator.run_auditor_agent(consolidated_code)
            return result
        except RateLimitExceeded:
            logger.warning("Rate limit exceeded on /api/project/audit after all retries.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=_RATE_LIMIT_RESPONSE["error"],
            )
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(ve))
        except Exception as e:
            logger.error(f"Project audit failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred during project codebase analysis."
            )
            
    finally:
        # Cleanup temporary files
        if temp_dir and os.path.exists(temp_dir):
            try:
                # Run blocking cleanup in executor
                await asyncio.to_thread(shutil.rmtree, temp_dir, ignore_errors=True)
                logger.info(f"Successfully cleaned up temporary directory: {temp_dir}")
            except Exception as cleanup_err:
                logger.warning(f"Failed to delete temp dir {temp_dir}: {cleanup_err}")


@app.post(
    "/api/ats/score",
    response_model=ATSScoreResponse,
    status_code=status.HTTP_200_OK
)
async def score_resume_ats(
    job_description: str = Form(...),
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None)
):
    """
    ATS Scorer (Agent 9):
    Accepts a PDF resume OR raw resume text, and a Job Description. 
    Parses the PDF if provided, then runs Agent 9 to generate an ATS score.
    """
    if not job_description or not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description is required."
        )

    if not file and not resume_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must provide either a PDF file or raw resume text."
        )

    if file:
        if file.content_type not in ("application/pdf", "application/x-pdf"):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Only PDF files are accepted. Please upload a valid .pdf resume."
            )
        try:
            file_bytes = await file.read()
        except Exception as e:
            logger.error(f"Failed to read uploaded file: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not read the uploaded file. Please try again."
            )
        try:
            extracted_text = await asyncio.to_thread(_extract_text, file_bytes)
        except Exception as e:
            logger.error(f"PDF text extraction failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Failed to extract text from the PDF. Ensure the file is not scanned or password-protected."
            )
    else:
        extracted_text = resume_text

    if len(extracted_text.strip()) < 150:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The extracted resume text is too short. Please provide a more detailed profile."
        )

    try:
        result = await orchestrator.run_ats_scorer_agent(extracted_text, job_description)
        return result
    except RateLimitExceeded:
        logger.warning("Rate limit exceeded on /api/ats/score after all retries.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_RATE_LIMIT_RESPONSE["error"],
        )
    except ValueError as ve:
        logger.error(f"API key error in ATS Scorer: {ve}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"ATS Scorer failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while scoring the resume. Please try again."
        )
