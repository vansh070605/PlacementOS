import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import JobTracker from './components/JobTracker';
import ResumeManager from './components/ResumeManager';
import DSATracker from './components/DSATracker';
import JDAnalyzer from './components/JDAnalyzer';

// Helper to load state from localStorage or default mock data
const loadInitialData = (key, defaultValue) => {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing localStorage key " + key, e);
    }
  }
  return defaultValue;
};

const DEFAULT_RESUMES = [
  {
    id: "r1",
    name: "Full Stack Engineer Profile",
    skills: ["React", "JavaScript", "Node.js", "Express", "MongoDB", "SQL", "HTML5", "CSS3", "Git", "REST APIs"],
    experience: "Software Engineer Intern at TechCorp (3 months)\n- Built interactive UI dashboards with React.\n- Refactored backend API endpoints resulting in 20% faster load times.",
    projects: "E-Commerce App (React + Node)\n- Created a fully responsive cart and payment system.\n- Implemented JWT auth.",
    coverLetter: "Dear Hiring Team,\n\nI am excited to apply for the software engineering position. With my experience in Full Stack development, especially React and Node.js, I am confident in my ability to add value to your team from day one."
  },
  {
    id: "r2",
    name: "Data Scientist / Python Profile",
    skills: ["Python", "Pandas", "NumPy", "Scikit-Learn", "SQL", "Data Visualization", "TensorFlow", "Git"],
    experience: "Data Analyst Project Lead at University\n- Cleaned and processed datasets of 100k+ records.\n- Developed predictive model with 92% accuracy.",
    projects: "Housing Price Predictor\n- Scraped real estate data.\n- Built regression models using Scikit-Learn.",
    coverLetter: "Dear Recruiting Team,\n\nI am writing to express my interest in the Data Scientist role. My background in Python, statistical modeling, and data engineering aligns perfectly with the qualifications you are looking for."
  }
];

const DEFAULT_APPLICATIONS = [
  {
    id: "app1",
    title: "Software Engineer Intern",
    company: "Google",
    status: "interviewing",
    date: "2026-05-18",
    salary: "$45/hr",
    location: "Mountain View, CA (Hybrid)",
    notes: "Completed online assessment. First technical round scheduled on May 25th. Focus on Graphs and DP.",
    contacts: "Sarah Jenkins (Recruiter) - sjenkins@google.com",
    resumeId: "r1",
    jd: "Looking for an intern who is passionate about coding, algorithms, and web applications. Required: JavaScript, React, data structures."
  },
  {
    id: "app2",
    title: "Frontend Developer",
    company: "Vercel",
    status: "offered",
    date: "2026-05-10",
    salary: "$90,000",
    location: "Remote (US/Global)",
    notes: "Offer received! Base: 90k, plus equity. Negotiating start date.",
    contacts: "Alex Rivera - alex@vercel.com",
    resumeId: "r1",
    jd: "Join the framework team! Must be an expert in Next.js, React, CSS, and modern web APIs."
  },
  {
    id: "app3",
    title: "Data Scientist",
    company: "Netflix",
    status: "applied",
    date: "2026-05-20",
    salary: "$140,000",
    location: "Los Gatos, CA",
    notes: "Applied via referral. Resume matched, waiting for recruiter call.",
    contacts: "",
    resumeId: "r2",
    jd: "Requirement: Python, SQL, large-scale data modeling, data pipelines. Experience with A/B testing is a plus."
  },
  {
    id: "app4",
    title: "Associate Developer",
    company: "Amazon",
    status: "rejected",
    date: "2026-05-01",
    salary: "$110,000",
    location: "Seattle, WA",
    notes: "Passed OA but missed recursion optimization in the final technical round. Review Tree traversal strategies.",
    contacts: "",
    resumeId: "r1",
    jd: "Core requirement: Java or C++, Object Oriented Design, Cloud services. Passion for operational excellence."
  }
];

const DEFAULT_DSA = {
  topics: {
    "Arrays": true,
    "Strings": true,
    "Linked Lists": true,
    "Trees": false,
    "Graphs": false,
    "Dynamic Programming": false,
    "System Design": false
  },
  questions: [
    { id: 1, title: "Two Sum", platform: "LeetCode", difficulty: "Easy", status: "Solved", notes: "Use hash map for O(n) solution." },
    { id: 2, title: "Reverse Linked List", platform: "LeetCode", difficulty: "Easy", status: "Solved", notes: "Classic iterative swap of pointers." },
    { id: 3, title: "Longest Substring Without Repeating Characters", platform: "LeetCode", difficulty: "Medium", status: "Revision Needed", notes: "Sliding window technique. Keep hash of last seen index." },
    { id: 4, title: "Edit Distance", platform: "LeetCode", difficulty: "Hard", status: "Todo", notes: "Standard 2D DP matrix problem." }
  ]
};

const DEFAULT_GOALS = {
  weeklyApplications: 5,
  weeklyDSAQuestions: 10,
  targetOffers: 2
};

function App() {
  const [activeTab, setActiveTab] = useState(() => loadInitialData("p_active_tab", "dashboard"));
  const [applications, setApplications] = useState(() => loadInitialData("p_applications", DEFAULT_APPLICATIONS));
  const [resumes, setResumes] = useState(() => loadInitialData("p_resumes", DEFAULT_RESUMES));
  const [dsaProgress, setDsaProgress] = useState(() => loadInitialData("p_dsa_progress", DEFAULT_DSA));
  const [goals, setGoals] = useState(() => loadInitialData("p_goals", DEFAULT_GOALS));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync to localStorage when state changes
  useEffect(() => {
    localStorage.setItem("p_active_tab", JSON.stringify(activeTab));
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("p_applications", JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem("p_resumes", JSON.stringify(resumes));
  }, [resumes]);

  useEffect(() => {
    localStorage.setItem("p_dsa_progress", JSON.stringify(dsaProgress));
  }, [dsaProgress]);

  useEffect(() => {
    localStorage.setItem("p_goals", JSON.stringify(goals));
  }, [goals]);

  // Helper selectors
  const totalApplied = applications.length;
  const interviewingCount = applications.filter(a => a.status === 'interviewing').length;
  const offersCount = applications.filter(a => a.status === 'offered').length;
  const dsaSolvedCount = dsaProgress.questions.filter(q => q.status === 'Solved').length;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            applications={applications} 
            dsaProgress={dsaProgress} 
            goals={goals} 
            setGoals={setGoals}
            setActiveTab={setActiveTab}
          />
        );
      case 'applications':
        return (
          <JobTracker 
            applications={applications} 
            setApplications={setApplications} 
            resumes={resumes}
          />
        );
      case 'resumes':
        return (
          <ResumeManager 
            resumes={resumes} 
            setResumes={setResumes} 
          />
        );
      case 'prep':
        return (
          <DSATracker 
            dsaProgress={dsaProgress} 
            setDsaProgress={setDsaProgress} 
          />
        );
      case 'analyzer':
        return (
          <JDAnalyzer 
            resumes={resumes} 
            applications={applications}
            setApplications={setApplications}
          />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">P</div>
          <span className="logo-text">PlacementOS</span>
          <button 
            className="mobile-nav-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>

        <nav className={`nav-links ${mobileMenuOpen ? 'mobile-visible' : ''}`}>
          <li className="nav-item">
            <button 
              className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            >
              <span className="nav-icon">📊</span>
              <span>Dashboard</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-button ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => { setActiveTab('applications'); setMobileMenuOpen(false); }}
            >
              <span className="nav-icon">💼</span>
              <span>Job Tracker</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-button ${activeTab === 'prep' ? 'active' : ''}`}
              onClick={() => { setActiveTab('prep'); setMobileMenuOpen(false); }}
            >
              <span className="nav-icon">📝</span>
              <span>DSA Prep</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-button ${activeTab === 'resumes' ? 'active' : ''}`}
              onClick={() => { setActiveTab('resumes'); setMobileMenuOpen(false); }}
            >
              <span className="nav-icon">📄</span>
              <span>My Resumes</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-button ${activeTab === 'analyzer' ? 'active' : ''}`}
              onClick={() => { setActiveTab('analyzer'); setMobileMenuOpen(false); }}
            >
              <span className="nav-icon">🔍</span>
              <span>JD Analyzer</span>
            </button>
          </li>
        </nav>

        <div className="sidebar-footer">
          <div className="profile-card">
            <div className="profile-avatar">VA</div>
            <div className="profile-info">
              <span className="profile-name">Vansh Agrawal</span>
              <span className="profile-role">Career Prep Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
