import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import JobTracker from './components/JobTracker';
import ResumeManager from './components/ResumeManager';
import DSATracker from './components/DSATracker';
import JDAnalyzer from './components/JDAnalyzer';

// ── Default Data ──────────────────────────────────────────────────────────────

const loadInitialData = (key, defaultValue) => {
  const saved = localStorage.getItem(key);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* ignore */ }
  }
  return defaultValue;
};

const DEFAULT_RESUMES = [
  {
    id: 'r1',
    name: 'Full Stack Engineer Profile',
    skills: ['React', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 'SQL', 'HTML5', 'CSS3', 'Git', 'REST APIs'],
    experience: 'Software Engineer Intern at TechCorp (3 months)\n- Built interactive UI dashboards with React.\n- Refactored backend API endpoints resulting in 20% faster load times.',
    projects: 'E-Commerce App (React + Node)\n- Created a fully responsive cart and payment system.\n- Implemented JWT auth.',
    coverLetter: 'Dear Hiring Team,\n\nI am excited to apply for the software engineering position. With my experience in Full Stack development, especially React and Node.js, I am confident in my ability to add value to your team from day one.',
  },
  {
    id: 'r2',
    name: 'Data Scientist / Python Profile',
    skills: ['Python', 'Pandas', 'NumPy', 'Scikit-Learn', 'SQL', 'Data Visualization', 'TensorFlow', 'Git'],
    experience: 'Data Analyst Project Lead at University\n- Cleaned and processed datasets of 100k+ records.\n- Developed predictive model with 92% accuracy.',
    projects: 'Housing Price Predictor\n- Scraped real estate data.\n- Built regression models using Scikit-Learn.',
    coverLetter: 'Dear Recruiting Team,\n\nI am writing to express my interest in the Data Scientist role. My background in Python, statistical modeling, and data engineering aligns perfectly with the qualifications you are looking for.',
  },
];

const DEFAULT_APPLICATIONS = [
  { id: 'app1', title: 'Software Engineer Intern', company: 'Google', status: 'interviewing', date: '2026-05-18', salary: '$45/hr', location: 'Mountain View, CA (Hybrid)', notes: 'Completed online assessment. First technical round scheduled on May 25th. Focus on Graphs and DP.', contacts: 'Sarah Jenkins (Recruiter) - sjenkins@google.com', resumeId: 'r1', jd: 'Looking for an intern who is passionate about coding, algorithms, and web applications. Required: JavaScript, React, data structures.' },
  { id: 'app2', title: 'Frontend Developer', company: 'Vercel', status: 'offered', date: '2026-05-10', salary: '$90,000', location: 'Remote (US/Global)', notes: 'Offer received! Base: 90k, plus equity. Negotiating start date.', contacts: 'Alex Rivera - alex@vercel.com', resumeId: 'r1', jd: 'Join the framework team! Must be an expert in Next.js, React, CSS, and modern web APIs.' },
  { id: 'app3', title: 'Data Scientist', company: 'Netflix', status: 'applied', date: '2026-05-20', salary: '$140,000', location: 'Los Gatos, CA', notes: 'Applied via referral. Resume matched, waiting for recruiter call.', contacts: '', resumeId: 'r2', jd: 'Requirement: Python, SQL, large-scale data modeling, data pipelines. Experience with A/B testing is a plus.' },
  { id: 'app4', title: 'Associate Developer', company: 'Amazon', status: 'rejected', date: '2026-05-01', salary: '$110,000', location: 'Seattle, WA', notes: 'Passed OA but missed recursion optimization in the final technical round. Review Tree traversal strategies.', contacts: '', resumeId: 'r1', jd: 'Core requirement: Java or C++, Object Oriented Design, Cloud services.' },
];

const DEFAULT_DSA = {
  topics: {
    'Arrays': true, 'Strings': true, 'Linked Lists': true,
    'Trees': false, 'Graphs': false, 'Dynamic Programming': false, 'System Design': false,
  },
  questions: [
    { id: 1, title: 'Two Sum', platform: 'LeetCode', difficulty: 'Easy', status: 'Solved', notes: 'Use hash map for O(n) solution.' },
    { id: 2, title: 'Reverse Linked List', platform: 'LeetCode', difficulty: 'Easy', status: 'Solved', notes: 'Classic iterative swap of pointers.' },
    { id: 3, title: 'Longest Substring Without Repeating Characters', platform: 'LeetCode', difficulty: 'Medium', status: 'Revision Needed', notes: 'Sliding window technique. Keep hash of last seen index.' },
    { id: 4, title: 'Edit Distance', platform: 'LeetCode', difficulty: 'Hard', status: 'Todo', notes: 'Standard 2D DP matrix problem.' },
    { id: 5, title: 'Valid Parentheses', platform: 'LeetCode', difficulty: 'Easy', status: 'Solved', notes: 'Stack-based solution. Classic interview problem.' },
    { id: 6, title: 'Merge K Sorted Lists', platform: 'LeetCode', difficulty: 'Hard', status: 'Todo', notes: 'Priority queue / divide and conquer.' },
  ],
};

const DEFAULT_GOALS = { weeklyApplications: 5, weeklyDSAQuestions: 10, targetOffers: 2 };

// ── Mobile Nav ──────────────────────────────────────────────────────────────

const MOBILE_NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: 'home' },
  { id: 'applications', label: 'Jobs', icon: 'business_center' },
  { id: 'prep', label: 'DSA', icon: 'code' },
  { id: 'resumes', label: 'Resume', icon: 'description' },
  { id: 'analyzer', label: 'Analyze', icon: 'manage_search' },
];

function MobileNav({ activeTab, setActiveTab }) {
  return (
    <nav className="fixed bottom-0 left-3 right-3 z-50 flex justify-around items-center px-3 py-2.5 rounded-xl lg:hidden mb-3 bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
      {MOBILE_NAV_ITEMS.map(({ id, label, icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            id={`mobile-nav-${id}`}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/30'
                : 'text-[#334155] border border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
            <span className="text-[9px] font-mono uppercase tracking-wide">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab] = useState(() => loadInitialData('p_active_tab', 'dashboard'));
  const [applications, setApplications] = useState(() => loadInitialData('p_applications', DEFAULT_APPLICATIONS));
  const [resumes, setResumes] = useState(() => loadInitialData('p_resumes', DEFAULT_RESUMES));
  const [dsaProgress, setDsaProgress] = useState(() => loadInitialData('p_dsa_progress', DEFAULT_DSA));
  const [goals, setGoals] = useState(() => loadInitialData('p_goals', DEFAULT_GOALS));

  useEffect(() => { localStorage.setItem('p_active_tab', JSON.stringify(activeTab)); }, [activeTab]);
  useEffect(() => { localStorage.setItem('p_applications', JSON.stringify(applications)); }, [applications]);
  useEffect(() => { localStorage.setItem('p_resumes', JSON.stringify(resumes)); }, [resumes]);
  useEffect(() => { localStorage.setItem('p_dsa_progress', JSON.stringify(dsaProgress)); }, [dsaProgress]);
  useEffect(() => { localStorage.setItem('p_goals', JSON.stringify(goals)); }, [goals]);

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard applications={applications} dsaProgress={dsaProgress} goals={goals} setGoals={setGoals} setActiveTab={setActiveTab} />;
      case 'applications':
        return <JobTracker applications={applications} setApplications={setApplications} resumes={resumes} />;
      case 'resumes':
        return <ResumeManager resumes={resumes} setResumes={setResumes} />;
      case 'prep':
        return <DSATracker dsaProgress={dsaProgress} setDsaProgress={setDsaProgress} />;
      case 'analyzer':
        return <JDAnalyzer resumes={resumes} applications={applications} setApplications={setApplications} />;
      default:
        return <Dashboard applications={applications} dsaProgress={dsaProgress} goals={goals} setGoals={setGoals} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Ambient Glows Layer */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Top Left Purple Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/40 blur-[120px]"></div>
        
        {/* Bottom Right Blue Glow */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/40 blur-[120px]"></div>
        
        {/* Center Accent */}
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-indigo-500/30 blur-[100px]"></div>
      </div>

      <div className="flex min-h-screen relative z-10">
        {/* Sidebar (Desktop) */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0">
          {renderScreen()}
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
