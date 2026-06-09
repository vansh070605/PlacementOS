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
import MockInterview from './components/features/MockInterview/MockInterview';
import OnboardingModal from './components/shared/OnboardingModal';
import AIChat from './components/shared/AIChat';
import { ProfileProvider } from './contexts/ProfileContext';
import AuthOverlay from './components/shared/AuthOverlay';
import ProfileScreen from './components/features/Profile/ProfileScreen';
import { authService, dbService } from './services/firebase';

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

// ── One-time migration: clear stale "vansh_default" auto-login sessions ────────
// This removes any leftover hardcoded session from older app versions so
// returning visitors are not auto-logged in as Vansh Agrawal.
const STORAGE_MIGRATION_KEY = 'pos_migration_v2';
if (!localStorage.getItem(STORAGE_MIGRATION_KEY)) {
  const staleSession = localStorage.getItem('pos_fallback_current_user');
  if (staleSession) {
    try {
      const parsed = JSON.parse(staleSession);
      if (parsed?.uid === 'vansh_default') {
        localStorage.removeItem('pos_fallback_current_user');
        localStorage.removeItem('pos_has_loaded_before');
        localStorage.removeItem('pos_profile_vansh_default');
        localStorage.removeItem('pos_userdata_vansh_default');
        // Clear stale application data seeded from the old default
        localStorage.removeItem('pos_applications');
        localStorage.removeItem('pos_dsa_progress');
        localStorage.removeItem('pos_goals');
      }
    } catch (_) { /* ignore parse errors */ }
  }
  localStorage.setItem(STORAGE_MIGRATION_KEY, 'true');
}

// ── Default Seed Data (Empty for new users) ───────────────────────────────────
const DEFAULT_APPLICATIONS = [];

const DEFAULT_DSA_PROGRESS = {
  topics: {},
  questions: [],
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
  const [loadingUserData, setLoadingUserData] = useState(false);

  // Application Data States
  const [applications, setApplications] = useState(() => loadLocalStorageData('pos_applications', DEFAULT_APPLICATIONS));
  const [dsaProgress, setDsaProgress] = useState(() => loadLocalStorageData('pos_dsa_progress', DEFAULT_DSA_PROGRESS));
  const [goals, setGoals] = useState(() => loadLocalStorageData('pos_goals', DEFAULT_GOALS));

  // Check auth state and load user data from cloud database
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (currentUser) => {
      setUser(currentUser);
      if (currentUser?.uid) {
        setLoadingUserData(true);
        try {
          const data = await dbService.getUserData(currentUser.uid);
          if (data) {
            if (data.applications) setApplications(data.applications);
            if (data.dsaProgress) setDsaProgress(data.dsaProgress);
            if (data.goals) setGoals(data.goals);
          }
        } catch (e) {
          console.error('Failed to load user workspace data from cloud:', e);
        } finally {
          setLoadingUserData(false);
        }
      } else {
        // Reset states back to local defaults on logout
        setApplications(loadLocalStorageData('pos_applications', DEFAULT_APPLICATIONS));
        setDsaProgress(loadLocalStorageData('pos_dsa_progress', DEFAULT_DSA_PROGRESS));
        setGoals(loadLocalStorageData('pos_goals', DEFAULT_GOALS));
      }
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

  // Sync to LocalStorage and cloud db on modifications
  useEffect(() => {
    localStorage.setItem('pos_active_tab', JSON.stringify(activeTab));
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('pos_applications', JSON.stringify(applications));
    if (user?.uid && !loadingUserData) {
      dbService.saveUserData(user.uid, { applications, dsaProgress, goals });
    }
  }, [applications, user, loadingUserData]);

  useEffect(() => {
    localStorage.setItem('pos_dsa_progress', JSON.stringify(dsaProgress));
    if (user?.uid && !loadingUserData) {
      dbService.saveUserData(user.uid, { applications, dsaProgress, goals });
    }
  }, [dsaProgress, user, loadingUserData]);

  useEffect(() => {
    localStorage.setItem('pos_goals', JSON.stringify(goals));
    if (user?.uid && !loadingUserData) {
      dbService.saveUserData(user.uid, { applications, dsaProgress, goals });
    }
  }, [goals, user, loadingUserData]);

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
      case 'mock-interview':
        return <MockInterview />;
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
        <AIChat />
      </div>
    </ProfileProvider>
  );
}
