# 🌌 PlacementOS

**PlacementOS** is a comprehensive, local-first web-based dashboard designed to streamline, track, and optimize software engineering placement preparation. Built with a sleek, glassmorphic dark theme, it acts as a unified command center for students and job seekers managing their career search.

---

## 🚀 Key Features

PlacementOS is organized into five specialized hubs:

### 1. 📊 Career Dashboard
* **Visual Diagnostics**: Quick-glance metrics covering Total Applications, active Interviews, Offers Received, and solved DSA questions.
* **Interactive SVG Donut Chart**: Dynamic application status breakdown (Applied, Interviewing, Offered, Rejected) with hover tooltips and relative ratios.
* **Weekly Target Gauges**: Real-time progress trackers against custom application and coding goals.
* **Modal Targets Configurer**: Adjust weekly expectations instantly with immediate dashboard updates.

### 2. 💼 Job Tracker
* **Unified Pipeline Board**: Detail-rich logging of job roles, company names, location types (Remote, Hybrid, In-person), date applied, and salary brackets.
* **Status Lifecycles**: Update application statuses dynamically with visual badge styling.
* **Rich Annotation & Notes**: Log HR contacts, interview questions, technical stages, and follow-ups.

### 3. 📝 DSA & Prep Tracker
* **Syllabus Mastery Checklist**: Built-in interactive checksheets covering major interview topics (Arrays, Strings, Linked Lists, Trees, Graphs, DP, and System Design) with visual completion progress.
* **Question Log**: Record solved problems, specify platform (LeetCode, HackerRank, Codeforces), classify difficulty (Easy, Medium, Hard), and add time complexity notes or key takeaways.
* **Filter & Search Engine**: Instantly search logged queries or filter by difficulty and revision status.

### 4. 📄 My Resumes (Resume Manager)
* **ATS Diagnostics Dashboard**: Built-in score calculation engine (ATS score out of 100) that evaluates:
  - **Keyword Richness**: Matches technical tags against industry-relevant standards.
  - **Action Verbs & Impact**: Scans bullet points for active metrics (e.g., "built", "implemented", "reduced latency", percentage metrics).
  - **Structure Check**: Warns about missing sections, contact info, or link structures.
* **Dynamic Role Alignment Matrix**: Interactive neon gauges showing candidate compatibility for different paths:
  - **Frontend Development** (React, CSS, HTML5, TypeScript)
  - **Backend Systems** (Node.js, Express, SQL, MongoDB, REST APIs)
  - **DevOps & Infrastructure** (AWS, Docker, Kubernetes, Git)
  - **Data Science & ML** (Python, Pandas, NumPy, Scikit-Learn, TensorFlow)
* **Console Fallback Upload**: Paste plain text of PDF/Word resumes to achieve precise client-side skill indexing.

### 5. 🔍 JD Analyzer
* **Skill Gap Analyzer**: Paste any Job Description (JD) to extract keywords, check alignment, and display Matched vs. Missing skills with a percentage compatibility score.
* **Tailored Study Playlists**: Automatically generates custom study roadmaps and key bullet points to cover before interviews based on missing skills.
* **Internet Job Scout**: Simulates scanning active job boards, indexing positions (e.g., Stripe, Airbnb, Epic Systems), calculating matching scores against your profile, and offering a one-click **"Apply & Track"** button to load the job directly into your Tracker.

---

## 🛠️ Technology Stack

* **Frontend Library**: React 19 (Hooks, Context, Dynamic Rendering)
* **Build System & HMR**: Vite 8
* **Styling & Theme**: Vanilla CSS 3
  - Dark-mode, glassmorphic card elements using backdrop-filters.
  - Smooth animation transitions (scale, spin, pulse, and custom progress circles).
  - CSS custom properties (variables) for consistent neon glow aesthetics.
* **Data Persistence**: Automatic local storage synchronization for persistent progress tracking.

---

## 📦 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/vansh070605/PlacementOS.git
   cd PlacementOS
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
To launch the Vite development server locally:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production
To build static production assets under the `dist/` directory:
```bash
npm run build
```
To preview the production build locally:
```bash
npm run preview
```

---

## 📁 Project Structure

```
PlacementOS/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx      # Analytics charts & targets
│   │   ├── JobTracker.jsx     # Job pipeline application sheet
│   │   ├── DSATracker.jsx     # Syllabus checklist & solved logs
│   │   ├── ResumeManager.jsx  # ATS Scorecard, role metrics, & resume inputs
│   │   └── JDAnalyzer.jsx     # Skill gap roadmap & Job Scout
│   ├── App.jsx                # Main tabs navigation & local storage sync
│   ├── App.css                # Base App container styles
│   ├── index.css              # Custom design system tokens & glassmorphic utility rules
│   └── main.jsx               # Entrypoint
├── index.html                 # App wrapper & Google Fonts imports
├── vite.config.js             # Vite configuration
└── package.json               # Package manifests
```

---

## 📄 License
This project is licensed under the MIT License.
