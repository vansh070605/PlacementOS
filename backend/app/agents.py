import json
import logging
from typing import List
from google import genai
from google.genai import types
from app.config import settings
from app.schemas import (
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
)
from app.vector_store import vector_store

# Set up logging for agent orchestration traceability
logger = logging.getLogger("placementos.agents")
logging.basicConfig(level=logging.INFO)

class JDAnalysisOrchestrator:
    """
    Orchestrates the multi-agent asynchronous RAG pipeline:
    Agent 1 (JD Extractor) -> Agent 2 (RAG Matcher) -> Agent 3 (Synthesis Strategist)
    -> Agent 4 (The Networker) -> Agent 5 (The Career Compass Strategist).
    Uses the official google-genai SDK for all generation and embedding tasks.
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

    async def run_extractor_agent(self, job_description: str) -> JDExtractedData:
        """
        Agent 1: JD Extractor
        Asynchronously ingests raw JD text and leverages Gemini's structured output
        to isolate hard skills, soft skills, and latent requirements.
        """
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
        
        logger.info("Running Agent 1: JD Extractor...")
        
        response = await self.genai_client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=JDExtractedData,
                temperature=0.1,  # Low temperature for highly analytical/deterministic extraction
            )
        )
        
        # Validates and parses the structured response directly into our Pydantic model
        return JDExtractedData.model_validate_json(response.text)

    async def run_matcher_agent(self, extracted_data: JDExtractedData) -> List[MatchedProject]:
        """
        Agent 2: RAG Matcher
        Takes extracted terms, generates embeddings, and queries ChromaDB for the closest
        matching personal projects.
        """
        logger.info("Running Agent 2: RAG Matcher...")
        
        # Consolidate target requirements into a search query string
        query_text = (
            f"Technical stack: {', '.join(extracted_data.hard_skills)}\n"
            f"Challenges/Architecture: {' '.join(extracted_data.latent_requirements)}"
        )
        
        # Semantic search against the vector database
        matched_projects = await vector_store.query_similar_projects(query_text, limit=5)
        logger.info(f"RAG Matcher retrieved {len(matched_projects)} matching experiences from portfolio.")
        return matched_projects

    async def run_synthesis_agent(
        self,
        extracted_data: JDExtractedData,
        matched_projects: List[MatchedProject]
    ) -> JDAnalysisResponse:
        """
        Agent 3: Synthesis Strategist
        Cross-references job requirements with retrieved candidate projects.
        Outputs an ATS-optimized assessment in the exact format defined in JDAnalysisResponse schema.
        """
        logger.info("Running Agent 3: Synthesis Strategist...")
        
        # Construct markdown representation of matched projects to feed LLM context
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

        response = await self.genai_client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=JDAnalysisResponse,
                temperature=0.2,  # Slightly higher temp to support creative/impactful bullet point wording
            )
        )
        
        return JDAnalysisResponse.model_validate_json(response.text)

    async def analyze_jd(self, job_description: str) -> JDAnalysisResponse:
        """
        Coordinates the async pipeline flow.
        """
        # Step 1: Extract Job Description specifications
        extracted_data = await self.run_extractor_agent(job_description)
        
        # Step 2: Fetch related project experience (RAG lookup)
        matched_projects = await self.run_matcher_agent(extracted_data)
        
        # Step 3: Synthesis gap analysis and tailor resume points
        response_data = await self.run_synthesis_agent(extracted_data, matched_projects)
        return response_data

    async def run_networker_agent(self, request: OutreachRequest) -> OutreachResponse:
        """
        Agent 4: The Networker
        Receives analysis context from Agent 3 (alignment score, resume bullets)
        and the original job description, then uses Gemini structured outputs to
        autonomously draft humanized, personalized outreach messages.

        Generates:
        - A short LinkedIn connection request (hard limit: 300 characters).
        - A longer conversational follow-up message referencing specific portfolio
          projects stored in the vector DB (LitterVision, QuakeIntel, VinoMetrix).
        - A compelling email subject line.
        """
        logger.info(f"Running Agent 4: The Networker (tone='{request.tone}')...")

        # Map tone labels to clear writing style descriptors for the LLM prompt
        tone_descriptors = {
            "professional": "formal, polished, and respectful — like a senior engineer reaching out thoughtfully",
            "casual": "warm, conversational, and genuine — like a peer reaching out to someone they admire",
            "confident": "direct, self-assured, and results-focused — demonstrating clear value without being arrogant",
        }
        tone_style = tone_descriptors.get(request.tone, tone_descriptors["professional"])

        # Pull the top resume bullets (max 3) to embed as value proof in the messages
        bullet_preview = "\n".join(f"• {b}" for b in request.tailored_bullets[:3])

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
           - HARD LIMIT: 300 characters maximum (this will be rejected by LinkedIn otherwise).
           - It must reference one concrete, specific technical skill or project that aligns with the JD.
           - Do NOT include a generic opener. Go straight to the point.
           - Example format: "Hi [Name], saw [Company]'s work on [X] — my [Project] experience in [Tech] aligns directly. Would love to connect."

        2. follow_up_message: Draft a follow-up message for after connection is accepted (LinkedIn DM or cold email).
           - 3-4 short paragraphs, conversational and specific.
           - Reference at least ONE of the candidate's named portfolio projects by name (LitterVision, QuakeIntel, or VinoMetrix) and explain why it's relevant to this role.
           - End with a clear, low-friction call to action (e.g., a 15-min coffee chat, a referral ask).
           - Keep it under 200 words.

        3. subject_line: Write a compelling email subject line (under 60 characters) for the follow-up message.
           - Make it specific and curiosity-inducing — not generic.
        """

        response = await self.genai_client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=OutreachResponse,
                temperature=0.75,  # Higher temperature for creative, humanized writing
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
        Agent 5: The Career Compass Strategist
        Analyzes raw resume text extracted from a PDF and uses Gemini structured
        outputs to recommend exactly 3 career role pathways, each with:
        - An alignment score (0–100) based on the candidate's existing skills.
        - Core strengths pulled directly from the resume.
        - An ordered missing-skills learning roadmap to unlock the role.
        Also generates a 2-3 sentence executive resume summary.
        """
        logger.info("Running Agent 5: Career Compass Strategist...")

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
           a. role_title: Use a concise, industry-standard job title (e.g., "Machine Learning Engineer",
              "Full-Stack Software Engineer", "Data Scientist", "DevOps Engineer").
           b. current_alignment_score: Score 0-100 reflecting how well the resume maps to this role RIGHT NOW.
              Be honest — a score of 80+ should require demonstrated, specific experience, not just vague potential.
           c. core_strengths: List 3-5 specific technologies, projects, or experiences from the resume
              that directly demonstrate readiness for this role. Be concrete (name real projects/tools).
           d. missing_skills_roadmap: List 3-5 specific technologies, frameworks, or concepts the candidate
              should learn NEXT to fully qualify for this role. Order them from most foundational to most advanced.
              Do NOT list things already demonstrated in the resume.
        3. resume_summary: Write a 2-3 sentence executive summary of this candidate as a professional,
           highlighting their strongest unique selling points across all three pathways.

        Be precise, honest, and actionable. Avoid vague filler phrases.
        """

        response = await self.genai_client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=CareerCompassResponse,
                temperature=0.3,  # Low-mid for analytical accuracy with some creative role variety
            )
        )

        result = CareerCompassResponse.model_validate_json(response.text)
        logger.info(
            f"Agent 5 generated {len(result.suggested_roles)} career pathways. "
            f"Top: '{result.suggested_roles[0].role_title}' @ {result.suggested_roles[0].current_alignment_score}%"
        )
        return result

    async def run_salary_agent(self, request: SalaryRequest) -> SalaryIntelligenceResponse:
        """
        Agent 7: Salary Intelligence Agent
        Synthesises real-world compensation data patterns using Gemini to produce
        structured salary bands (P25/median/P75), equity ranges, signing bonus norms,
        a negotiation floor/ceiling, a ready-to-use negotiation script, and market insights
        for the specified role / location / seniority level.
        """
        logger.info(f"Running Agent 7: Salary Intelligence ({request.role_title} | {request.location} | {request.experience_level})")

        experience_context = (
            f"{request.experience_years} year{'s' if request.experience_years != 1 else ''} of experience"
        )

        prompt = f"""
        You are a senior compensation analyst at a top-tier technology recruiting firm with access to
        the latest industry compensation benchmarks (Levels.fyi, Glassdoor, Blind, LinkedIn Salary,
        Radford, and Mercer surveys for the current year 2026).

        A candidate is researching compensation for the following role:
        - Job Title: {request.role_title}
        - Location / Market: {request.location}
        - Seniority Level: {request.experience_level.capitalize()}
        - Years of Experience: {experience_context}

        Provide a precise, data-grounded salary analysis. Use your knowledge of 2025-2026 tech
        compensation trends. Consider the specific location's cost of living and talent market.
        For FAANG/top-tier companies, skew slightly higher on the P75.

        INSTRUCTIONS:
        1. base_salary_band: P25 / median / P75 for BASE salary ONLY (no bonus, no equity). USD per year.
        2. total_comp_band: P25 / median / P75 for TOTAL annual compensation (base + avg annual bonus + annualized RSU vesting). USD per year.
        3. equity_range: Typical initial RSU grant range and vesting schedule (e.g., "$80K–$200K over 4 years, 1-year cliff").
        4. signing_bonus_range: Typical one-time signing bonus (e.g., "$10K–$30K, often negotiable").
        5. negotiation_floor: The minimum base salary this candidate should accept given their profile. Going below this is suboptimal.
        6. negotiation_ceiling: The aspirational maximum base to anchor with — aggressive but achievable at strong companies.
        7. negotiation_script: Write a 3-4 sentence script they can say VERBATIM to a recruiter when asked "what are your salary expectations?"
           It should be confident, non-apologetic, cite market data, and anchor at the ceiling.
           Example tone: "Based on Levels.fyi benchmarks for {request.experience_level} {request.role_title}s in {request.location}, the market median for total comp is..."
        8. market_insights: 3-5 concrete, actionable insights about this compensation market
           (e.g., equity trends, company tiers that pay more, negotiation leverage points, timing advice).

        Be specific. Give actual numbers. Do not hedge with "it depends" without giving a range.
        """

        response = await self.genai_client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=SalaryIntelligenceResponse,
                temperature=0.2,
            )
        )

        result = SalaryIntelligenceResponse.model_validate_json(response.text)
        logger.info(
            f"Agent 7 complete. Base median: ${result.base_salary_band.median:,} | "
            f"TC median: ${result.total_comp_band.median:,}"
        )
        return result

    async def run_cover_letter_agent(self, request: CoverLetterRequest) -> CoverLetterResponse:
        """
        Agent 8: Cover Letter Forge
        Generates a tailored, non-generic cover letter by cross-referencing the JD
        with the candidate's strongest resume bullets from Agent 3. Supports three
        distinct writing styles: professional, story-driven, and data-first.
        Uses Gemini structured outputs to return a complete letter + metadata.
        """
        logger.info(f"Running Agent 8: Cover Letter Forge (style='{request.style}', target='{request.target_company}')")

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

        prompt = f"""
        You are an elite career writer who has helped candidates land offers at Google, Stripe,
        Anthropic, and top Series B startups. Write a cover letter for the following candidate.

        CANDIDATE: {request.candidate_name}
        TARGET COMPANY: {request.target_company}
        ALIGNMENT SCORE WITH ROLE: {request.alignment_score}/100

        TARGET JOB DESCRIPTION:
        {request.job_description[:1200]}

        CANDIDATE'S STRONGEST RESUME BULLETS (from AI portfolio analysis — these are real, use them):
        {bullets_text}

        PORTFOLIO PROJECTS (reference these by name when relevant):
        - LitterVision (YOLOv8, DCGAN, PyTorch — computer vision & generative AI)
        - QuakeIntel (React 19, Three.js, GIS — real-time geospatial visualization)
        - VinoMetrix (FastAPI, XGBoost — production ML API)

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

        response = await self.genai_client.aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=CoverLetterResponse,
                temperature=0.65,  # Higher temp for creative voice
            )
        )

        result = CoverLetterResponse.model_validate_json(response.text)
        # Re-compute word count as a safety net
        actual_words = len(result.cover_letter.split())
        result.word_count = actual_words
        logger.info(f"Agent 8 cover letter generated. Words: {actual_words} | Hooks: {len(result.key_hooks)}")
        return result


# Global orchestrator singleton instance
orchestrator = JDAnalysisOrchestrator()
