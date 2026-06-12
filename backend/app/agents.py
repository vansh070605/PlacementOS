"""
agents.py  –  PlacementOS Multi-Agent Orchestration Engine
============================================================
Hardening applied (v2):

1. RATE-LIMIT RETRY  – Every call to the Gemini API is wrapped with a tenacity
   @retry decorator that:
   - Catches google.genai.errors.ClientError where the HTTP status is 429
     (Resource Exhausted / Free Tier RPM limit).
   - Uses exponential back-off: 5 s → 10 s → 20 s → 40 s → 60 s (capped).
   - Gives up after 5 attempts and raises RateLimitExceeded so the FastAPI
     route can return a clean HTTP 503 to the frontend.

2. CONCURRENCY CAP  –  _GEMINI_SEMAPHORE limits the number of agents that can
   simultaneously hold a live Gemini request to 3.  This prevents the pipeline
   from bursting all 8 agents at once and exhausting the 15-RPM free tier budget
   the moment a complex JD analysis is triggered.

3. GRACEFUL FAILURE  –  RateLimitExceeded is a first-class exception.  main.py
   catches it and returns HTTP 503 {"error": "..."} instead of a crash.
"""

import asyncio
import json
import logging
from typing import List

from google import genai
from google.genai import types

# tenacity provides production-grade retry primitives for async code.
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
    RetryError,
)

from .config import settings
from .schemas import (
    JDAnalysisResponse,
    JDExtractedData,
    MatchedProject,
    OutreachRequest,
    OutreachResponse,
    CareerCompassResponse,
    RolePathway,
    SalaryRequest,
    SalaryIntelligenceResponse,
    CompensationBand,
    CoverLetterRequest,
    CoverLetterResponse,
    ProjectAuditResponse,
    ATSScoreResponse,
    MockInterviewRequest,
    MockInterviewResponse,
)
from .vector_store import vector_store
import numpy as np
from .ml_models import local_models
from .dl_salary import predict as dl_predict

def clean_json_text(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        text = text[first_brace:last_brace+1]
    return text

# ── Logging ───────────────────────────────────────────────────────────────────
logger = logging.getLogger("placementos.agents")
logging.basicConfig(level=logging.INFO)


# ── Custom Sentinel Exception ─────────────────────────────────────────────────
class RateLimitExceeded(Exception):
    """
    Raised when all tenacity retry attempts against the Gemini API are
    exhausted because of HTTP 429 responses.  FastAPI routes catch this and
    return HTTP 503 with a user-friendly JSON message.
    """
    pass


# ── Global Concurrency Cap ────────────────────────────────────────────────────
# Prevents more than 3 agents from holding live Gemini requests simultaneously.
# With the Free Tier cap of 15 RPM (~1 req / 4 s) this is the safe upper bound
# that keeps us comfortably below the limit even under burst conditions.
_GEMINI_SEMAPHORE = asyncio.Semaphore(3)


# ── Retry Predicate ───────────────────────────────────────────────────────────
def _is_rate_limit_error(exc: BaseException) -> bool:
    """
    Returns True for 429 (Resource Exhausted) and 503 (Service Unavailable/High Demand) errors.
    This ensures tenacity retries requests during temporary traffic spikes or model overload.
    """
    try:
        from google.genai import errors as genai_errors
        if isinstance(exc, genai_errors.APIError):
            code = getattr(exc, "code", None)
            if code in (429, 503):
                return True
    except ImportError:
        pass

    # Fallback: inspect the string representation for SDK version variance
    exc_str = str(exc).lower()
    retry_keywords = ["429", "503", "resource_exhausted", "high demand", "unavailable", "overloaded"]
    return any(kw in exc_str for kw in retry_keywords)


# ── Retry Decorator Factory ───────────────────────────────────────────────────
def _gemini_retry():
    """
    Returns a fully configured tenacity retry decorator for any coroutine that
    calls the Gemini API.

    Policy:
    - retry_if_exception:  only on HTTP 429 (rate-limit errors)
    - wait_exponential:    5 s initial → multiplied by 2 each attempt → 60 s max
    - stop_after_attempt:  give up after 5 total tries (~5 + 10 + 20 + 40 + 60 s
                           worst-case wait = ~135 s before final failure)
    - before_sleep_log:    logs each retry at WARNING level for observability
    """
    return retry(
        retry=retry_if_exception(_is_rate_limit_error),
        wait=wait_exponential(multiplier=1, min=5, max=60),
        stop=stop_after_attempt(5),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True,  # Re-raise the original exception (not RetryError) after exhaustion
    )


# ── Semaphore + Retry Wrapper ─────────────────────────────────────────────────
async def _call_gemini(client: genai.Client, **kwargs):
    """
    Central choke-point for every Gemini API call in the system.

    1. Acquires _GEMINI_SEMAPHORE  → max 3 concurrent requests.
    2. Calls generate_content with tenacity retry on 429.
    3. On final exhaustion converts to RateLimitExceeded so callers get a
       clean, typed exception rather than a raw tenacity RetryError.

    Usage:
        response = await _call_gemini(self.genai_client, model=..., contents=..., config=...)
    """
    @_gemini_retry()
    async def _inner():
        # Enforce strict safety settings on every call
        safety_settings = [
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=types.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            ),
        ]
        
        # Merge or inject into config
        config = kwargs.get('config')
        if not config:
            config = types.GenerateContentConfig(safety_settings=safety_settings)
            kwargs['config'] = config
        elif isinstance(config, types.GenerateContentConfig):
            if not config.safety_settings:
                config.safety_settings = safety_settings
        
        return await client.aio.models.generate_content(**kwargs)

    async with _GEMINI_SEMAPHORE:
        try:
            return await _inner()
        except Exception as exc:
            # With reraise=True, tenacity re-raises the original 429 error
            # after exhausting all attempts.  We convert it to our sentinel
            # so FastAPI routes can return a clean HTTP 503.
            if _is_rate_limit_error(exc) or isinstance(exc, RetryError):
                logger.error(
                    "Gemini API rate limit exceeded after all retry attempts. "
                    "Raising RateLimitExceeded for HTTP 503 response."
                )
                raise RateLimitExceeded(
                    "AI capacity temporarily reached. Please try again in 60 seconds."
                ) from exc
            
            # Check for API key invalid or leaked errors (400 / 403)
            try:
                from google.genai import errors as genai_errors
                if isinstance(exc, genai_errors.ClientError):
                    status_code = getattr(exc, "code", None)
                    msg_lower = str(exc).lower()
                    if status_code in (400, 403) or "api_key" in msg_lower or "leaked" in msg_lower or "permission_denied" in msg_lower:
                        logger.error(f"Gemini API authentication failed: {exc}")
                        raise ValueError(
                            "Your GEMINI_API_KEY in backend/.env is invalid or has been reported as leaked. "
                            "Please obtain a new API key from Google AI Studio and configure it in backend/.env."
                        ) from exc
            except ImportError:
                pass

            raise  # re-raise other errors unchanged


# ═════════════════════════════════════════════════════════════════════════════
# Orchestrator
# ═════════════════════════════════════════════════════════════════════════════

class JDAnalysisOrchestrator:
    """
    Orchestrates the multi-agent asynchronous RAG pipeline:
      Agent 1 (JD Extractor)
      → Agent 2 (RAG Matcher)
      → Agent 3 (Synthesis Strategist)
      → Agent 4 (The Networker)
      → Agent 5 (The Career Compass Strategist)
      → Agent 6 (Project Auditor)
      → Agent 7 (Salary Intelligence)
      → Agent 8 (Cover Letter Forge)

    All Gemini calls are routed through _call_gemini() which enforces:
      - asyncio.Semaphore(3) concurrency cap
      - Tenacity exponential back-off retry on HTTP 429
      - RateLimitExceeded sentinel on final failure
    """

    def __init__(self):
        self._genai_client = None

    @property
    def genai_client(self) -> genai.Client:
        """
        Lazy-loaded property returning Google GenAI Client.
        Ensures client is created only when API key configuration is present.
        """
        if self._genai_client is None:
            if not settings.gemini_api_key:
                raise ValueError(
                    "GEMINI_API_KEY environment variable is not set. "
                    "Please configure it in backend/.env before running queries."
                )
            self._genai_client = genai.Client(api_key=settings.gemini_api_key)
        return self._genai_client

    # ── Agent 1: JD Extractor ─────────────────────────────────────────────────
    async def run_extractor_agent(self, job_description: str) -> JDExtractedData:
        """
        Asynchronously ingests raw JD text and leverages local Causal LLM (or Gemini API fallback)
        to isolate hard skills, soft skills, and latent requirements.
        """
        system_prompt = """
        You are a hiring manager's parser agent.
        Analyze the job description and extract:
        1. hard_skills: coding languages, frameworks, databases, tools.
        2. soft_skills: behavior, collaboration, methodologies.
        3. latent_requirements: implicit technical demands (e.g. system scaling, API design from scratch, query optimization).

        Return ONLY a JSON object matching this schema:
        {
          "hard_skills": ["skill1", "skill2"],
          "soft_skills": ["skill1", "skill2"],
          "latent_requirements": ["req1", "req2"]
        }
        """
        logger.info("Running Agent 1: JD Extractor...")
        try:
            response_text = await asyncio.to_thread(
                local_models.call_local_llm,
                system_prompt=system_prompt,
                user_input=job_description,
                temperature=0.1
            )
            clean_json = clean_json_text(response_text)
            return JDExtractedData.model_validate_json(clean_json)
        except Exception as e:
            logger.warning(f"Local Agent 1 call failed: {e}. Falling back to Gemini API.")
            prompt = f"""
            You are a hiring manager's parser agent.
            Analyze the following job description and extract key elements:
            1. Hard skills: Coding languages, developer frameworks, packages, database engines, and developer tools.
            2. Soft skills: Team styles, behavioral traits, methodologies, and communication norms.
            3. Latent requirements: Implicit demands not explicitly stated in buzzwords but implied by the role
               (e.g., system scaling, query optimization, high-throughput pipelines, API design from scratch, handling legacy migrations).

            Job Description:
            {job_description}
            """
            response = await _call_gemini(
                self.genai_client,
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=JDExtractedData,
                    temperature=0.1,
                )
            )
            return JDExtractedData.model_validate_json(response.text)

    # ── Agent 2: RAG Matcher ──────────────────────────────────────────────────
    async def run_matcher_agent(self, extracted_data: JDExtractedData) -> List[MatchedProject]:
        """
        Takes extracted terms, generates local SentenceTransformer embeddings
        (no Gemini API call, so no rate-limit risk here), and queries ChromaDB
        for the closest matching personal projects.
        """
        logger.info("Running Agent 2: RAG Matcher...")

        # Consolidate target requirements into a search query string
        query_text = (
            f"Technical stack: {', '.join(extracted_data.hard_skills)}\n"
            f"Challenges/Architecture: {' '.join(extracted_data.latent_requirements)}"
        )

        # ChromaDB now uses the local SentenceTransformer embedding function —
        # no Gemini API call, no rate-limit risk for this agent.
        matched_projects = await vector_store.query_similar_projects(query_text, limit=5)
        logger.info(f"RAG Matcher retrieved {len(matched_projects)} matching experiences from portfolio.")
        return matched_projects

    # ── Agent 3: Synthesis Strategist ────────────────────────────────────────
    async def run_synthesis_agent(
        self,
        extracted_data: JDExtractedData,
        matched_projects: List[MatchedProject]
    ) -> JDAnalysisResponse:
        """
        Cross-references job requirements with retrieved candidate projects.
        Outputs an ATS-optimized assessment.
        """
        logger.info("Running Agent 3: Synthesis Strategist...")

        projects_context_list = []
        for p in matched_projects:
            project_str = (
                f"### Project: {p.title}\n"
                f"- Description: {p.description}\n"
                f"- Technologies: {', '.join(p.technologies)}\n"
                f"- Metrics/Accomplishments: {p.metrics or 'N/A'}\n"
                f"- Database Match Score: {p.similarity_score:.2f}\n"
            )
            projects_context_list.append(project_str)

        projects_context = "\n".join(projects_context_list) if projects_context_list else "No matching projects found."

        prompt_input = f"""
        TARGET JOB REQUIREMENTS:
        - Required Hard Skills: {', '.join(extracted_data.hard_skills)}
        - Required Soft Skills: {', '.join(extracted_data.soft_skills)}
        - Latent Engineering Demands: {', '.join(extracted_data.latent_requirements)}

        CANDIDATE'S SEMANTICALLY MATCHED PORTFOLIO PROJECTS:
        {projects_context}
        """

        system_prompt = """
        You are an elite career optimizer, resume strategist, and interviewer coach.
        You have been given a structured list of target job requirements alongside semantic match results from the candidate's personal project portfolio.

        INSTRUCTIONS:
        1. Calculate a strict, objective compatibility score (alignment_score) from 0 to 100 based on technical stack matches and project scope compatibility.
        2. Evaluate each required hard and soft skill. Populate the 'skills_alignment' list specifying the matching project name (if any) and status:
           - 'matched' if fully demonstrated in portfolio.
           - 'partial' if a related technology or concept is demonstrated.
           - 'missing' if there's no project evidence of this skill.
        3. Identify major missing competencies (skill_gaps) from the JD that the candidate should address.
        4. Generate 3 to 5 tailored resume bullet points (tailored_resume_bullets). Refocus the candidate's project descriptions to align with this JD. Use the Google X-Y-Z formula: 'Accomplished [X], as measured by [Y], by doing [Z]'. Integrate quantitative metrics where possible.
        5. Provide a step-by-step interview preparation checklist (recommended_study_plan) to target identified skill gaps.

        Return ONLY a JSON object matching the following structure:
        {
          "alignment_score": 85,
          "skills_alignment": [{"skill": "Python", "project_name": "VinoMetrix", "status": "matched"}],
          "skill_gaps": ["Postgres"],
          "tailored_resume_bullets": ["Accomplished X as measured by Y by doing Z"],
          "recommended_study_plan": ["Step 1", "Step 2"]
        }
        """

        try:
            response_text = await asyncio.to_thread(
                local_models.call_local_llm,
                system_prompt=system_prompt,
                user_input=prompt_input,
                temperature=0.2
            )
            clean_json = clean_json_text(response_text)
            return JDAnalysisResponse.model_validate_json(clean_json)
        except Exception as e:
            logger.warning(f"Local Agent 3 call failed: {e}. Falling back to Gemini API.")
            prompt = f"""
            You are an elite career optimizer, resume strategist, and interviewer coach.
            You have been given a structured list of target job requirements alongside semantic match results from the candidate's personal project portfolio.

            TARGET JOB REQUIREMENTS:
            - Required Hard Skills: {', '.join(extracted_data.hard_skills)}
            - Required Soft Skills: {', '.join(extracted_data.soft_skills)}
            - Latent Engineering Demands: {', '.join(extracted_data.latent_requirements)}

            CANDIDATE'S SEMANTICALLY MATCHED PORTFOLIO PROJECTS:
            {projects_context}

            INSTRUCTIONS:
            1. Calculate a strict, objective compatibility score (alignment_score) from 0 to 100 based on technical stack matches and project scope compatibility.
            2. Evaluate each required hard and soft skill. Populate the 'skills_alignment' list specifying the matching project name (if any) and status:
               - 'matched' if fully demonstrated in portfolio.
               - 'partial' if a related technology or concept is demonstrated.
               - 'missing' if there's no project evidence of this skill.
            3. Identify major missing competencies (skill_gaps) from the JD that the candidate should address.
            4. Generate 3 to 5 tailored resume bullet points (tailored_resume_bullets). Refocus the candidate's project descriptions to align with this JD. Use the Google X-Y-Z formula: 'Accomplished [X], as measured by [Y], by doing [Z]'. Integrate quantitative metrics where possible.
            5. Provide a step-by-step interview preparation checklist (recommended_study_plan) to target identified skill gaps.
            """
            response = await _call_gemini(
                self.genai_client,
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=JDAnalysisResponse,
                    temperature=0.2,
                )
            )
            return JDAnalysisResponse.model_validate_json(response.text)

    # ── Top-level JD analysis pipeline ───────────────────────────────────────
    async def analyze_jd(self, job_description: str) -> JDAnalysisResponse:
        """Coordinates the async pipeline flow for JD analysis (Agents 1→2→3)."""
        extracted_data = await self.run_extractor_agent(job_description)
        matched_projects = await self.run_matcher_agent(extracted_data)
        response_data = await self.run_synthesis_agent(extracted_data, matched_projects)
        return response_data

    # ── Agent 4: The Networker ────────────────────────────────────────────────
    async def run_networker_agent(self, request: OutreachRequest) -> OutreachResponse:
        """
        Receives analysis context from Agent 3 and autonomously drafts humanized,
        personalized outreach messages.
        """
        logger.info(f"Running Agent 4: The Networker (tone='{request.tone}')...")

        tone_descriptors = {
            "professional": "formal, polished, and respectful — like a senior engineer reaching out thoughtfully",
            "casual": "warm, conversational, and genuine — like a peer reaching out to someone they admire",
            "confident": "direct, self-assured, and results-focused — demonstrating clear value without being arrogant",
        }
        tone_style = tone_descriptors.get(request.tone, tone_descriptors["professional"])
        bullet_preview = "\n".join(f"• {b}" for b in request.tailored_bullets[:3])

        user_input = f"""
        CANDIDATE PROFILE:
        - Name: {request.candidate_name}
        - Portfolio Projects: LitterVision (YOLOv8/DCGAN/PyTorch), QuakeIntel (React 19/Three.js/GIS), VinoMetrix (FastAPI/XGBoost)
        - Alignment Score with Target Role: {request.alignment_score}/100

        TARGET JOB DESCRIPTION SUMMARY:
        {request.job_description[:800]}

        CANDIDATE'S STRONGEST MATCHING RESUME BULLETS (from AI portfolio analysis):
        {bullet_preview}
        """

        system_prompt = f"""
        You are an elite networking strategist and communications expert. Your job is to draft
        personalized, humanized outreach messages for a software engineering candidate reaching out
        to a recruiter or hiring engineer at a company based on a target job description.

        TONE DIRECTION:
        Write in a {tone_style} style. Avoid clichés like "I hope this finds you well" or
        "I'm reaching out because". Be specific. Be human. Be memorable.

        INSTRUCTIONS:
        1. linkedin_request: Draft a LinkedIn connection request message.
           - HARD LIMIT: 300 characters maximum.
           - It must reference one concrete, specific technical skill or project that aligns with the JD.
           - Do NOT include a generic opener. Go straight to the point.
        2. follow_up_message: Draft a follow-up message for after connection is accepted.
           - 3-4 short paragraphs, conversational and specific.
           - Reference at least ONE of the candidate's named portfolio projects by name.
           - End with a clear, low-friction call to action.
           - Keep it under 200 words.
        3. subject_line: Write a compelling email subject line (under 60 characters).
           - Make it specific and curiosity-inducing — not generic.

        Return ONLY a JSON object matching this structure:
        {{
          "linkedin_request": "LinkedIn invite note under 300 chars",
          "follow_up_message": "Follow-up email under 200 words",
          "subject_line": "Email subject line under 60 chars"
        }}
        """

        try:
            response_text = await asyncio.to_thread(
                local_models.call_local_llm,
                system_prompt=system_prompt,
                user_input=user_input,
                temperature=0.75
            )
            clean_json = clean_json_text(response_text)
            result = OutreachResponse.model_validate_json(clean_json)
        except Exception as e:
            logger.warning(f"Local Agent 4 call failed: {e}. Falling back to Gemini API.")
            prompt = f"""
            You are an elite networking strategist and communications expert. Your job is to draft
            personalized, humanized outreach messages for a software engineering candidate reaching out
            to a recruiter or hiring engineer at a company based on a target job description.

            CANDIDATE PROFILE:
            - Name: {request.candidate_name}
            - Portfolio Projects: LitterVision (YOLOv8/DCGAN/PyTorch), QuakeIntel (React 19/Three.js/GIS), VinoMetrix (FastAPI/XGBoost)
            - Alignment Score with Target Role: {request.alignment_score}/100

            TARGET JOB DESCRIPTION SUMMARY:
            {request.job_description[:800]}

            CANDIDATE'S STRONGEST MATCHING RESUME BULLETS (from AI portfolio analysis):
            {bullet_preview}

            TONE DIRECTION:
            Write in a {tone_style} style. Avoid clichés like "I hope this finds you well" or
            "I'm reaching out because". Be specific. Be human. Be memorable.

            INSTRUCTIONS:
            1. linkedin_request: Draft a LinkedIn connection request message.
               - HARD LIMIT: 300 characters maximum.
               - It must reference one concrete, specific technical skill or project that aligns with the JD.
               - Do NOT include a generic opener. Go straight to the point.

            2. follow_up_message: Draft a follow-up message for after connection is accepted.
               - 3-4 short paragraphs, conversational and specific.
               - Reference at least ONE of the candidate's named portfolio projects by name.
               - End with a clear, low-friction call to action.
               - Keep it under 200 words.

            3. subject_line: Write a compelling email subject line (under 60 characters).
               - Make it specific and curiosity-inducing — not generic.
            """
            response = await _call_gemini(
                self.genai_client,
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=OutreachResponse,
                    temperature=0.75,
                )
            )
            result = OutreachResponse.model_validate_json(response.text)

        # Enforce the 300-char LinkedIn limit as a hard post-processing guard
        if len(result.linkedin_request) > 300:
            result.linkedin_request = result.linkedin_request[:297] + "..."

        logger.info("Agent 4 outreach drafts generated successfully.")
        return result

    async def run_strategist_agent(self, resume_text: str) -> CareerCompassResponse:
        """
        Analyzes raw resume text and recommends exactly 3 career role pathways
        with alignment scores and ordered skill-gap roadmaps.
        """
        logger.info("Running Agent 5: Career Compass Strategist...")

        classifier_hint = ""
        try:
            clf = local_models.career_classifier
            probs = clf.predict_proba([resume_text])[0]
            classes = clf.classes_
            ranked_classes = [c for c, p in sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)]
            classifier_hint = f"According to local Random Forest text classification, the candidate's skills map to these roles: {', '.join(ranked_classes)}."
        except Exception as e:
            logger.warning(f"Local classification failed: {e}")

        user_input = f"""
        {classifier_hint}

        CANDIDATE RESUME:
        {resume_text[:6000]}
        """

        system_prompt = """
        You are an elite career strategist and talent advisor. A candidate has uploaded their resume.
        Suggest the 3 most realistic and high-value career pathways they should pursue, ranked from most aligned to least aligned.

        INSTRUCTIONS:
        1. Identify the 3 best-fit job roles / career pathways for this candidate based on their
           demonstrated skills, projects, and experience.
        2. For each role:
           a. role_title: Use a concise, industry-standard job title.
           b. current_alignment_score: Score 0-100.
           c. core_strengths: List 3-5 specific technologies, projects, or experiences from the resume.
           d. missing_skills_roadmap: List 3-5 specific technologies or concepts to learn NEXT.
              Order them from most foundational to most advanced.
        3. resume_summary: Write a 2-3 sentence executive summary highlighting the candidate's strongest
           unique selling points across all three pathways.

        Return ONLY a JSON object matching this schema:
        {
          "suggested_roles": [
            {
              "role_title": "Software Engineer",
              "current_alignment_score": 85,
              "core_strengths": ["Python", "FastAPI"],
              "missing_skills_roadmap": ["Docker", "Kubernetes"]
            }
          ],
          "resume_summary": "Candidate shows strong expertise in..."
        }
        """

        try:
            response_text = await asyncio.to_thread(
                local_models.call_local_llm,
                system_prompt=system_prompt,
                user_input=user_input,
                temperature=0.3
            )
            clean_json = clean_json_text(response_text)
            return CareerCompassResponse.model_validate_json(clean_json)
        except Exception as e:
            logger.warning(f"Local Agent 5 call failed: {e}. Falling back to Gemini API.")
            prompt = f"""
            You are an elite career strategist and talent advisor. A candidate has uploaded their resume.
            Your task is to analyze their profile and suggest the 3 most realistic and high-value career
            pathways they should pursue, ranked from most aligned to least aligned.

            CANDIDATE RESUME (extracted text):
            \"\"\"\n{resume_text[:6000]}\n\"\"\"

            INSTRUCTIONS:
            1. Identify the 3 best-fit job roles / career pathways for this candidate based on their
               demonstrated skills, projects, and experience.
            2. For each role:
               a. role_title: Use a concise, industry-standard job title.
               b. current_alignment_score: Score 0-100. Be honest — 80+ requires demonstrated, specific experience.
               c. core_strengths: List 3-5 specific technologies, projects, or experiences from the resume.
               d. missing_skills_roadmap: List 3-5 specific technologies or concepts to learn NEXT.
                  Order them from most foundational to most advanced.
            3. resume_summary: Write a 2-3 sentence executive summary highlighting the candidate's strongest
               unique selling points across all three pathways.

            Be precise, honest, and actionable. Avoid vague filler phrases.
            """
            response = await _call_gemini(
                self.genai_client,
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=CareerCompassResponse,
                    temperature=0.3,
                )
            )
            result = CareerCompassResponse.model_validate_json(response.text)
            logger.info(
                f"Agent 5 generated {len(result.suggested_roles)} career pathways. "
                f"Top: '{result.suggested_roles[0].role_title}' @ {result.suggested_roles[0].current_alignment_score}%"
            )
            return result

    # ── Agent 7: Salary Intelligence ─────────────────────────────────────────
    async def run_salary_agent(self, request: SalaryRequest) -> SalaryIntelligenceResponse:
        """
        Synthesises compensation data patterns to produce structured salary bands.
        Calls the custom deep learning regression routines.
        """
        logger.info(
            f"Running Agent 7: Salary Intelligence "
            f"({request.role_title} | {request.location} | {request.experience_level})"
        )
        return dl_predict(request)

    # ── Agent 8: Cover Letter Forge ───────────────────────────────────────────
    async def run_cover_letter_agent(self, request: CoverLetterRequest) -> CoverLetterResponse:
        """
        Generates a tailored, non-generic cover letter by cross-referencing the JD
        with the candidate's strongest resume bullets. Supports three writing styles.
        """
        logger.info(
            f"Running Agent 8: Cover Letter Forge "
            f"(style='{request.style}', target='{request.target_company}')"
        )

        style_descriptors = {
            "professional": (
                "formal, polished, and concise. Use business-appropriate language. "
                "Lead with your strongest technical alignment point. "
                "Structure: opening hook → technical evidence → cultural fit → CTA."
            ),
            "story_driven": (
                "narrative and humanized. Open with a brief personal origin story or "
                "pivotal moment that connects your background to this role. "
                "Structure: story hook → conflict/growth → resolution (how this role fits) → CTA."
            ),
            "data_first": (
                "metrics-led and high-impact. Lead with a striking quantitative achievement. "
                "Every claim must be backed by a number or named project. "
                "Structure: bold metric hook → evidence chain (3 data points) → capability fit → CTA."
            ),
        }
        style_guide = style_descriptors.get(request.style, style_descriptors["professional"])
        bullets_text = "\n".join(f"• {b}" for b in request.tailored_bullets[:5])

        user_input = f"""
        CANDIDATE PROFILE SUMMARY:
        {request.candidate_profile or "Not provided"}

        TARGET COMPANY: {request.target_company}
        ALIGNMENT SCORE WITH ROLE: {request.alignment_score}/100

        TARGET JOB DESCRIPTION:
        {request.job_description[:1200]}

        CANDIDATE'S STRONGEST RESUME BULLETS (from AI portfolio analysis):
        {bullets_text}
        """

        system_prompt = f"""
        You are an elite career writer. Write a cover letter for the candidate.
        WRITING STYLE DIRECTIVE: Write in a {style_guide}

        HARD RULES:
        - Target length: 380-480 words. Not shorter, not longer.
        - Do NOT use any of these clichés: "I am writing to express my interest",
          "I hope this letter finds you well", "team player", "passionate about", "leverage synergies".
        - Reference {request.target_company} by name at least twice.
        - Name at least one of the candidate's portfolio projects explicitly.
        - End with a confident, specific call to action.
        - Format as plain text with paragraph breaks (no markdown, no bullet points in the letter itself).

        Return ONLY a JSON object matching this schema:
        {{
          "cover_letter": "The complete cover letter text",
          "word_count": 400,
          "key_hooks": ["hook1", "hook2"]
        }}
        """

        try:
            response_text = await asyncio.to_thread(
                local_models.call_local_llm,
                system_prompt=system_prompt,
                user_input=user_input,
                temperature=0.65
            )
            clean_json = clean_json_text(response_text)
            result = CoverLetterResponse.model_validate_json(clean_json)
        except Exception as e:
            logger.warning(f"Local Agent 8 call failed: {e}. Falling back to Gemini API.")
            prompt = f"""
            You are an elite career writer who has helped candidates land offers at Google, Stripe,
            Anthropic, and top Series B startups. Write a cover letter for the following candidate.

            CANDIDATE PROFILE SUMMARY:
            {request.candidate_profile or "Not provided"}

            TARGET COMPANY: {request.target_company}
            ALIGNMENT SCORE WITH ROLE: {request.alignment_score}/100

            TARGET JOB DESCRIPTION:
            {request.job_description[:1200]}

            CANDIDATE'S STRONGEST RESUME BULLETS (from AI portfolio analysis):
            {bullets_text}

            WRITING STYLE DIRECTIVE: Write in a {style_guide}

            HARD RULES:
            - Target length: 380-480 words. Not shorter, not longer.
            - Do NOT use any of these clichés: "I am writing to express my interest",
              "I hope this letter finds you well", "team player", "passionate about", "leverage synergies".
            - Reference {request.target_company} by name at least twice.
            - Name at least one of the candidate's portfolio projects explicitly.
            - End with a confident, specific call to action (not "feel free to contact me").
            - Format as plain text with paragraph breaks (no markdown, no bullet points in the letter itself).

            ALSO PROVIDE:
            - word_count: actual word count of the letter as an integer.
            - key_hooks: 2-4 of the strongest phrases or sentences in the letter that make it memorable.
            """
            response = await _call_gemini(
                self.genai_client,
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=CoverLetterResponse,
                    temperature=0.65,
                )
            )
            result = CoverLetterResponse.model_validate_json(response.text)

        actual_words = len(result.cover_letter.split())
        result.word_count = actual_words
        logger.info(f"Agent 8 cover letter generated. Words: {actual_words} | Hooks: {len(result.key_hooks)}")
        return result

    # ── Agent 6: Project Auditor ──────────────────────────────────────────────
    async def run_auditor_agent(self, code_content: str) -> ProjectAuditResponse:
        """
        Analyzes raw project files/snippets, generating optimization plans,
        Mermaid architecture flowcharts, tailored Google X-Y-Z resume bullets,
        and hard project-defense interview questions.
        """
        logger.info("Running Agent 6: Project Auditor...")

        user_input = f"""
        CODE CONTENT FOR ANALYSIS:
        \"\"\"
        {code_content[:15000]}
        \"\"\"
        """

        system_prompt = """
        You are an elite principal engineer and expert interviewer. Your task is to audit and analyze the project codebase / snippets.

        INSTRUCTIONS:
        1. Analyze the overall purpose of the codebase and generate:
           - A clean, optimized professional 'project_title'.
           - A high-impact 2-3 sentence 'project_description' explaining what the system does.
           - A comprehensive list of 'technologies' detected (languages, databases, frameworks, libraries, modules).
           - An estimation of any engineering accomplishments or performance metrics implied by this implementation to populate 'metrics'.
        2. In 'architecture_overview', explain the design patterns, code flow, and structural layout of the code.
        3. In 'mermaid_diagram', write a VALID, clean Mermaid.js flowchart string (using graph TD or LR) illustrating the system design and component interactions.
           - Make sure nodes have clear labels. E.g., Use double quotes for labels: A["FastAPI Server"] --> B[("ChromaDB Client")]
           - Never include markdown fences (like ```mermaid) or html tags inside the string. Just output the raw Mermaid syntax text.
        4. In 'interview_prep_questions', generate 3 to 5 realistic, challenging technical interview questions that a candidate would be asked based on their decisions in this codebase. For each question, provide a detailed, professional, and convincing answer referencing the code's decisions.
        5. In 'resume_bullets', draft 3 tailored Google X-Y-Z formula bullets referencing code details.
        6. Under the suggestions lists:
           - 'code_quality_suggestions': 2-3 actionable items on structure, type hinting, documentation, or design patterns.
           - 'performance_suggestions': 2-3 items on speed, database indexing, caching, resource/memory safety, or scalability.
           - 'security_suggestions': 2-3 items on handling sensitive env variables, sanitizing inputs, encryption, or auth.

        Return ONLY a JSON object matching the ProjectAuditResponse schema:
        {
          "project_title": "Project Title",
          "project_description": "Description",
          "technologies": ["Python", "FastAPI"],
          "metrics": "Reduced latencies by 20%",
          "architecture_overview": "Architecture notes",
          "mermaid_diagram": "graph TD\\nA --> B",
          "interview_prep_questions": [{"question": "Q?", "answer": "A"}],
          "resume_bullets": ["Accomplished X"],
          "code_quality_suggestions": ["Suggestion"],
          "performance_suggestions": ["Suggestion"],
          "security_suggestions": ["Suggestion"]
        }
        """

        try:
            response_text = await asyncio.to_thread(
                local_models.call_local_llm,
                system_prompt=system_prompt,
                user_input=user_input,
                temperature=0.2
            )
            clean_json = clean_json_text(response_text)
            result = ProjectAuditResponse.model_validate_json(clean_json)
        except Exception as e:
            logger.warning(f"Local Agent 6 call failed: {e}. Falling back to Gemini API.")
            prompt = f"""
            You are an elite principal engineer and expert interviewer. Your task is to audit and analyze the following project codebase / snippets.

            CODE CONTENT FOR ANALYSIS:
            \"\"\"
            {code_content[:15000]}
            \"\"\"

            INSTRUCTIONS:
            1. Analyze the overall purpose of the codebase and generate:
               - A clean, optimized professional 'project_title'.
               - A high-impact 2-3 sentence 'project_description' explaining what the system does.
               - A comprehensive list of 'technologies' detected (languages, databases, frameworks, libraries, modules).
               - An estimation of any engineering accomplishments or performance metrics implied by this implementation to populate 'metrics'.
            2. In 'architecture_overview', explain the design patterns, code flow, and structural layout of the code.
            3. In 'mermaid_diagram', write a VALID, clean Mermaid.js flowchart string (using graph TD or LR) illustrating the system design and component interactions.
               - Make sure nodes have clear labels. E.g., Use double quotes for labels: A["FastAPI Server"] --> B[("ChromaDB Client")]
               - Never include markdown fences (like ```mermaid) or html tags inside the string. Just output the raw Mermaid syntax text.
            4. In 'interview_prep_questions', generate 3 to 5 realistic, challenging technical interview questions that a candidate would be asked based on their decisions in this codebase. For each question, provide a detailed, professional, and convincing answer referencing the code's decisions.
            5. In 'resume_bullets', draft 3 tailored Google X-Y-Z formula bullets referencing code details.
            6. Under the suggestions lists:
               - 'code_quality_suggestions': 2-3 actionable items on structure, type hinting, documentation, or design patterns.
               - 'performance_suggestions': 2-3 items on speed, database indexing, caching, resource/memory safety, or scalability.
               - 'security_suggestions': 2-3 items on handling sensitive env variables, sanitizing inputs, encryption, or auth.
            """
            response = await _call_gemini(
                self.genai_client,
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ProjectAuditResponse,
                    temperature=0.2,
                )
            )
            result = ProjectAuditResponse.model_validate_json(response.text)

        logger.info(f"Agent 6 completed project audit for: '{result.project_title}'")
        return result

    # ── Agent 9: ATS Scorer ───────────────────────────────────────────────────
    async def run_ats_scorer_agent(self, resume_text: str, job_description: str) -> ATSScoreResponse:
        """
        Agent 9 (ATS Scorer): Evaluates a candidate's resume against a job description.
        Leverages local Cross-Encoder semantic scorer and LLM parsing with fallback.
        """
        logger.info("Triggering Agent 9: ATS Scorer")

        calibrated_score = 70
        try:
            raw_score = local_models.ats_scorer.predict([(job_description, resume_text)])[0]
            # Map score to sigmoid calibrated percentage
            calibrated_score = int(100 / (1 + np.exp(-raw_score)))
        except Exception as e:
            logger.warning(f"Local Cross-Encoder ATS rating failed: {e}")

        user_input = f"""
        Pre-Calculated Semantic Match Score: {calibrated_score}/100

        JOB DESCRIPTION:
        {job_description[:1200]}

        CANDIDATE RESUME:
        {resume_text[:4000]}
        """

        system_prompt = f"""
        You are an Applicant Tracking System (ATS) evaluator. A semantic matching module calculated a score of {calibrated_score} for this candidate.
        Evaluate the resume against the job description. Extract matched keywords, missing keywords, and formatting feedback.

        Return ONLY a JSON matching the ATSScoreResponse schema:
        {{
          "match_score": {calibrated_score},
          "matched_keywords": ["keyword1", "keyword2"],
          "missing_keywords": ["missing1", "missing2"],
          "formatting_feedback": ["feedback1", "feedback2"],
          "overall_verdict": "A brief analysis of candidate fit..."
        }}
        """

        try:
            response_text = await asyncio.to_thread(
                local_models.call_local_llm,
                system_prompt=system_prompt,
                user_input=user_input,
                temperature=0.2
            )
            clean_json = clean_json_text(response_text)
            return ATSScoreResponse.model_validate_json(clean_json)
        except Exception as e:
            logger.warning(f"Local Agent 9 LLM run failed: {e}. Falling back to Gemini.")
            prompt = f"""
            You are an ultra-strict Applicant Tracking System (ATS) and Technical Recruiter.
            Analyze the provided candidate's Resume against the provided Job Description.

            JOB DESCRIPTION:
            {job_description}

            CANDIDATE RESUME:
            {resume_text}

            Perform a rigorous evaluation and return a structured JSON object matching the requested schema.
            - match_score: A strict integer from 0 to 100 representing how well the resume matches the JD.
            - matched_keywords: List of important hard and soft skills found in both.
            - missing_keywords: List of critical skills explicitly required in the JD but missing in the resume.
            - formatting_feedback: List of any potential parsing issues (e.g. lack of experience section, odd formatting) or general improvements.
            - overall_verdict: A short paragraph summarizing the candidate's fit and next steps.
            """
            response = await _call_gemini(
                self.genai_client,
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ATSScoreResponse,
                    temperature=0.2,
                )
            )
            return ATSScoreResponse.model_validate_json(response.text)

    # ── Agent 10: Mock Interview Agent ────────────────────────────────────────
    async def run_mock_interview_agent(self, request: MockInterviewRequest) -> MockInterviewResponse:
        """
        Agent 10 (Mock Interview Agent): Conducts a mock interview based on the JD and candidate profile.
        """
        logger.info("Running Agent 10: Mock Interview Agent...")
        
        # Build conversation history
        history_str = ""
        for turn in request.conversation_history:
            history_str += f"{turn.role.capitalize()}: {turn.content}\n\n"
            
        if not history_str:
            history_str = "No conversation history yet. This is the first question."
            
        latest_ans_str = request.latest_answer if request.latest_answer else "None yet."
        
        tone_style = "Professional & Analytical (concise, direct, constructive feedback)"
        if request.ai_tone == "harsh":
            tone_style = "Critical Roast Reviewer (extremely tough, blunt, directly calls out mistakes or weaknesses, roasts weak answers, high expectations)"
        elif request.ai_tone == "encouraging":
            tone_style = "Encouraging & Constructive Mentor (supportive, warm, focuses on coaching, gives friendly hints, positive reinforcement)"
        
        user_input = f"""
        TARGET JOB DESCRIPTION:
        {request.job_description[:1500]}

        CANDIDATE PROFILE:
        {request.candidate_profile[:2000]}

        CONVERSATION HISTORY:
        {history_str}

        CANDIDATE'S LATEST ANSWER:
        {latest_ans_str}
        """

        system_prompt = f"""
        You are an expert technical and behavioral interviewer at a top-tier tech company.
        Your persona and interviewing tone should be: {tone_style}.
        Your goal is to conduct a mock interview with a candidate for a specific job description, based on their profile.

        INSTRUCTIONS:
        1. If this is the first question (no conversation history or latest answer), introduce the interview briefly and ask the first question (can be behavioral or technical based on the JD). 'feedback' should be null.
        2. If there is a latest answer, evaluate it. Provide constructive 'feedback' using the STAR (Situation, Task, Action, Result) method where applicable. Align this feedback with your tone persona.
        3. Determine the 'next_question'. It should logically follow the conversation or shift to a new relevant topic from the JD.
        4. Indicate if the next question 'is_technical' (true/false).

        Return ONLY a JSON matching the MockInterviewResponse schema:
        {{
          "feedback": "Your constructive evaluation or null",
          "next_question": "Your next follow-up question",
          "is_technical": true
        }}
        """

        try:
            response_text = await asyncio.to_thread(
                local_models.call_local_llm,
                system_prompt=system_prompt,
                user_input=user_input,
                temperature=request.ai_temperature if request.ai_temperature is not None else 0.7
            )
            clean_json = clean_json_text(response_text)
            return MockInterviewResponse.model_validate_json(clean_json)
        except Exception as e:
            logger.warning(f"Local Agent 10 call failed: {e}. Falling back to Gemini.")
            prompt = f"""
            You are an expert technical and behavioral interviewer at a top-tier tech company.
            Your persona and interviewing tone should be: {tone_style}.
            Your goal is to conduct a mock interview with a candidate for a specific job description, based on their profile.

            TARGET JOB DESCRIPTION:
            {request.job_description[:1500]}

            CANDIDATE PROFILE:
            {request.candidate_profile[:2000]}

            CONVERSATION HISTORY:
            {history_str}

            CANDIDATE'S LATEST ANSWER:
            {latest_ans_str}

            INSTRUCTIONS:
            1. If this is the first question (no conversation history or latest answer), introduce the interview briefly and ask the first question (can be behavioral or technical based on the JD). 'feedback' should be null.
            2. If there is a latest answer, evaluate it. Provide constructive 'feedback' using the STAR (Situation, Task, Action, Result) method where applicable. Align this feedback with your tone persona (e.g. if roast reviewer, call out logic gaps or resume inflation directly and sarcastically/bluntly; if mentor, suggest how to refine it gently).
            3. Determine the 'next_question'. It should logically follow the conversation or shift to a new relevant topic from the JD.
            4. Indicate if the next question 'is_technical' (true/false).
            """
            response = await _call_gemini(
                self.genai_client,
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=MockInterviewResponse,
                    temperature=request.ai_temperature if request.ai_temperature is not None else 0.7,
                )
            )
            return MockInterviewResponse.model_validate_json(response.text)


# Global orchestrator singleton instance
orchestrator = JDAnalysisOrchestrator()
