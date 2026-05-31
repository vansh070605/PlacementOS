import React, { useState, useEffect } from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './components/features/Dashboard/Dashboard';
import JobTracker from './components/features/Trackers/JobTracker';
import DSATracker from './components/features/Trackers/DSATracker';
import JDAnalyzer from './components/features/JDAnalyzer/JDAnalyzer';
import CareerCompass from './components/features/CareerCompass/CareerCompass';
import SalaryIntelligence from './components/features/SalaryIntelligence/SalaryIntelligence';
import CoverLetterForge from './components/features/CoverLetterForge/CoverLetterForge';
import ProjectAuditor from './components/features/ProjectAuditor/ProjectAuditor';
import Settings from './components/features/Settings/Settings';
import ATSScorer from './components/features/ATSScorer/ATSScorer';
import OnboardingModal from './components/shared/OnboardingModal';
import { ProfileProvider } from './contexts/ProfileContext';
import AuthOverlay from './components/shared/AuthOverlay';
import ProfileScreen from './components/features/Profile/ProfileScreen';
import { authService } from './services/firebase';

// Helper to safely load data from localStorage
const loadLocalStorageData = (key, defaultValue) => {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(`Failed to parse localStorage key "${key}":`, e);
    }
  }
  return defaultValue;
};

// ── Default Seed Data (Light & Clean Theme) ───────────────────────────────────
const DEFAULT_APPLICATIONS = [
  {
    id: 'app_1',
    title: 'Frontend Engineer Intern',
    company: 'Google',
    status: 'interviewing',
    date: '2026-05-20',
    salary: '$45/hr',
    location: 'Hybrid',
    notes: 'First technical interview scheduled. Main focus: Tree algorithms and Three.js canvas optimizations.',
  },
  {
    id: 'app_2',
    title: 'Software Engineer',
    company: 'Stripe',
    status: 'applied',
    date: '2026-05-24',
    salary: '$135,000/yr',
    location: 'Remote',
    notes: 'Applied with custom resume bullet points generated via JD Analyzer.',
  },
  {
    id: 'app_3',
    title: 'Machine Learning Engineer',
    company: 'Airbnb',
    status: 'offered',
    date: '2026-05-10',
    salary: '$165,000/yr',
    location: 'San Francisco',
    notes: 'Received written offer! Base base base: 165k. Equity details attached in HR portal.',
  }
];

const DEFAULT_DSA_PROGRESS = {
  topics: {
    'Arrays': true,
    'Strings': true,
    'Linked Lists': true,
    'Trees': false,
    'Graphs': false,
    'Dynamic Programming': false,
    'System Design': false,
  },
  questions: [
    { id: 1, title: 'Two Sum', platform: 'LeetCode', difficulty: 'Easy', status: 'Solved', notes: 'Hash map lookups in O(1) space.' },
    { id: 2, title: 'Merge K Sorted Lists', platform: 'LeetCode', difficulty: 'Hard', status: 'Todo', notes: 'Use priority queues or divide & conquer.' },
    { id: 3, title: 'Longest Palindromic Substring', platform: 'LeetCode', difficulty: 'Medium', status: 'Solved', notes: 'Expand around center method.' },
  ],
};

const DEFAULT_GOALS = {
  weeklyApplications: 5,
  weeklyDSAQuestions: 8,
  targetOffers: 2,
};

export default function App() {
  // Navigation & Screen Tabs State
  const [activeTab, setActiveTab] = useState(() => loadLocalStorageData('pos_active_tab', 'dashboard'));
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);

  // Check auth state
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // Check if onboarding was already shown
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('pos_onboarding_v1');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Listen for custom navigation events
  useEffect(() => {
    const handleNavEvent = (e) => {
      if (e.detail === 'show-onboarding') {
        setShowOnboarding(true);
      } else if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    document.addEventListener('pos:navigate', handleNavEvent);
    return () => document.removeEventListener('pos:navigate', handleNavEvent);
  }, []);
  
  // Application Data States
  const [applications, setApplications] = useState(() => loadLocalStorageData('pos_applications', DEFAULT_APPLICATIONS));
  const [dsaProgress, setDsaProgress] = useState(() => loadLocalStorageData('pos_dsa_progress', DEFAULT_DSA_PROGRESS));
  const [goals, setGoals] = useState(() => loadLocalStorageData('pos_goals', DEFAULT_GOALS));

  // Sync to LocalStorage on modifications
  useEffect(() => {
    localStorage.setItem('pos_active_tab', JSON.stringify(activeTab));
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('pos_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('pos_dsa_progress', JSON.stringify(dsaProgress));
  }, [dsaProgress]);

  useEffect(() => {
    localStorage.setItem('pos_goals', JSON.stringify(goals));
  }, [goals]);

  // Screen Router Selection
  const renderActiveScreen = () => {
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
          />
        );
      case 'prep':
        return (
          <DSATracker
            dsaProgress={dsaProgress}
            setDsaProgress={setDsaProgress}
          />
        );
      case 'auditor':
        return <ProjectAuditor />;
      case 'analyzer':
        return <JDAnalyzer />;
      case 'compass':
        return <CareerCompass />;
      case 'salary':
        return <SalaryIntelligence />;
      case 'cover-letter':
        return <CoverLetterForge />;
      case 'profile':
        return <ProfileScreen user={user} />;
      case 'settings':
        return <Settings />;
      case 'ats-scorer':
        return <ATSScorer />;
      default:
        return (
          <Dashboard
            applications={applications}
            dsaProgress={dsaProgress}
            goals={goals}
            setGoals={setGoals}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  return (
    <ProfileProvider user={user}>
      <div className="app-container">
        <OnboardingModal 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)} 
        />
        <AuthOverlay 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          onLoginSuccess={(u) => setUser(u)} 
        />
        <DashboardLayout 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          user={user}
          setShowAuthModal={setShowAuthModal}
        >
          {renderActiveScreen()}
        </DashboardLayout>
      </div>
    </ProfileProvider>
  );
}
