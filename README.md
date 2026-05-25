# PlacementOS

PlacementOS is a local-first, AI-powered career command center. It replaces generic job application advice with multi-agent architectures that analyze your actual code, experience, and the real-world job market to help you land offers faster and negotiate higher compensation.

## 🚀 Key Features (The 5 AI Agents)

PlacementOS is powered by a suite of specialized AI agents running on a local FastAPI backend using Google's GenAI SDK (Gemini) and ChromaDB.

*   **The Ingestor (Agent 1 & 2)**: Automatically parses your `portfolio.json` into a local ChromaDB vector database, embedding your projects and tech stack for semantic search.
*   **JD Analyzer (Agent 3)**: Paste a Job Description. This agent breaks down the requirements, queries your local ChromaDB for the most relevant projects, and generates tailored, ATS-friendly resume bullets using the Google X-Y-Z formula.
*   **The Networker (Agent 4)**: Found within the JD Analyzer, this agent automatically drafts highly personalized, humanized LinkedIn outreach sequences (connection requests + follow-ups) for the specific role.
*   **Career Compass (Agent 5)**: Upload your PDF resume. This agent identifies your core strengths, highlights missing skills, and suggests your top 3 ideal pathways in the current job market.
*   **Salary Intelligence (Agent 7)**: Stop guessing your worth. Input your role and location to get real-time compensation bands (P25 to P75), your walk-away floor, aspirational ceiling, and a verbatim negotiation script.
*   **Cover Letter Forge (Agent 8)**: Automatically imports your tailored resume bullets from the JD Analyzer to craft compelling, non-generic cover letters. Choose from Professional, Story-Driven, or Data-First writing styles.

## 🛠️ Tech Stack

### Frontend (Modern & Airy UI)
*   **React 19 & Vite 8**: Blazing fast modern component framework.
*   **Vanilla CSS 3**: Custom, utility-free bento-box grid design system featuring soft drop shadows, generous whitespace, and premium typography.
*   **html2canvas & jsPDF**: For generating clean, A4-formatted PDF exports of your JD Analysis reports.

### Backend (Local-First AI)
*   **FastAPI**: High-performance async Python backend.
*   **Google GenAI SDK**: Utilizing `gemini-2.5-flash` for agent reasoning and `gemini-embedding-2` for semantic search.
*   **ChromaDB**: Local vector database for semantic indexing of your career portfolio.
*   **pdfplumber**: For robust, offline PDF resume parsing.

## 📁 Repository Structure

The codebase is cleanly separated into backend and frontend directories, with the React frontend organized into feature-driven modules.

```
PlacementOS/
├── backend/                  # FastAPI & AI Agent Logic
│   ├── app/
│   │   ├── agents.py         # The 5 Gemini AI Agents
│   │   ├── config.py         # Environment configurations
│   │   ├── main.py           # FastAPI endpoints
│   │   ├── schemas.py        # Pydantic data models
│   │   └── vector_store.py   # ChromaDB management
│   ├── .env                  # API keys and model config
│   ├── portfolio.json        # Your seed project data
│   └── requirements.txt      # Python dependencies
│
└── src/                      # React 19 Frontend
    ├── components/
    │   ├── features/         # Feature-specific components
    │   │   ├── CareerCompass/
    │   │   ├── CoverLetterForge/
    │   │   ├── Dashboard/
    │   │   ├── JDAnalyzer/
    │   │   ├── SalaryIntelligence/
    │   │   └── Trackers/
    │   ├── layout/           # Global layouts (Sidebar, DashboardLayout)
    │   └── shared/           # Reusable components (OnboardingModal)
    ├── App.jsx               # Main application router
    └── index.css             # Design system tokens and globals
```

## 💻 Local Setup Guide

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/PlacementOS.git
cd PlacementOS
```

### 2. Backend Setup
```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure your API key
# Open backend/.env and add your Google Gemini API key:
# GEMINI_API_KEY=your_api_key_here

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```
*Note: On startup, the backend will automatically read `portfolio.json`, embed your projects using `gemini-embedding-2`, and save them to a local `data/chroma` folder.*

### 3. Frontend Setup
Open a new terminal window:
```bash
# From the root PlacementOS directory
npm install

# Start the Vite development server
npm run dev
```

### 4. Open the App
Navigate to `http://localhost:5173` in your browser. You will be greeted by the interactive Onboarding sequence.

---
*Built as a personal command center to conquer the modern job market.*
