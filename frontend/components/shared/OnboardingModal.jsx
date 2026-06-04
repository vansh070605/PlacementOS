/**
 * OnboardingModal.jsx
 * -------------------
 * Animated 4-step onboarding overlay for PlacementOS.
 * Shown once per user (persisted in localStorage).
 */

import React, { useState, useEffect } from 'react';
import './OnboardingModal.css';

export default function OnboardingModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [isClosing, setIsClosing] = useState(false);
  
  // Reset step when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsClosing(false);
    }
  }, [isOpen]);

  // If modal is not open, don't render anything.
  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    localStorage.setItem('pos_onboarding_v1', 'true');
    setTimeout(() => {
      onClose();
    }, 350); // wait for fade out
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="onboard-step" key="step1">
            <div className="onboard-step-tag">Step 1 of 4 • Welcome</div>
            <h2 className="onboard-title">Meet <span>PlacementOS</span></h2>
            <p className="onboard-desc">
              Your privacy-respecting, AI-powered career command center. We've built specialized multi-agent architectures that analyze your codebase, optimize application materials, and sync preparation targets—all in one place.
            </p>
            
            <div className="welcome-hero-graphic">
              <div className="graphic-pillar">
                <span className="material-symbols-outlined graphic-icon">shield</span>
                <span className="graphic-label">Privacy First</span>
                <span className="graphic-sub">Local vector store & embeddings</span>
              </div>
              <div className="graphic-pillar">
                <span className="material-symbols-outlined graphic-icon">hub</span>
                <span className="graphic-label">Multi-Agent</span>
                <span className="graphic-sub">10 targeted AI engines</span>
              </div>
              <div className="graphic-pillar">
                <span className="material-symbols-outlined graphic-icon">sync_alt</span>
                <span className="graphic-label">Auto Integration</span>
                <span className="graphic-sub">Connected LeetCode progress</span>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="onboard-step" key="step2">
            <div className="onboard-step-tag">Step 2 of 4 • Platform Capabilities</div>
            <h2 className="onboard-title">Explore the <span>Feature Suite</span></h2>
            <p className="onboard-desc">
              PlacementOS includes 10 integrated tools to automate and supercharge your hiring preparation lifecycle.
            </p>
            
            <div className="onboard-feature-grid">
              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#3b82f6' }}>
                  <span className="material-symbols-outlined">dashboard</span>
                </div>
                <div>
                  <div className="onboard-feature-name">Dashboard</div>
                  <div className="onboard-feature-desc">Active application pipeline metrics & milestone goals.</div>
                </div>
              </div>

              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#10b981' }}>
                  <span className="material-symbols-outlined">work</span>
                </div>
                <div>
                  <div className="onboard-feature-name">Job Tracker</div>
                  <div className="onboard-feature-desc">Organize applications, salaries, status, and custom logs.</div>
                </div>
              </div>

              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#FFA116' }}>
                  <span className="material-symbols-outlined">code</span>
                </div>
                <div>
                  <div className="onboard-feature-name">DSA Prep & LeetCode</div>
                  <div className="onboard-feature-desc">Roadmap syllabus + automated LeetCode progress syncing.</div>
                </div>
              </div>

              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#8b5cf6' }}>
                  <span className="material-symbols-outlined">terminal</span>
                </div>
                <div>
                  <div className="onboard-feature-name">Project Auditor</div>
                  <div className="onboard-feature-desc">Extract system diagrams & prep Q&As from local codebases.</div>
                </div>
              </div>

              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#2563eb' }}>
                  <span className="material-symbols-outlined">manage_search</span>
                </div>
                <div>
                  <div className="onboard-feature-name">JD Analyzer</div>
                  <div className="onboard-feature-desc">Matches job description keywords to your indexed portfolio.</div>
                </div>
              </div>

              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#06b6d4' }}>
                  <span className="material-symbols-outlined">explore</span>
                </div>
                <div>
                  <div className="onboard-feature-name">Career Compass</div>
                  <div className="onboard-feature-desc">Upload PDF resume to map pathways & missing skill roadmaps.</div>
                </div>
              </div>

              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#f97316' }}>
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                  <div className="onboard-feature-name">Salary Intel</div>
                  <div className="onboard-feature-desc">Compensation calculations & verbatim negotiation scripts.</div>
                </div>
              </div>

              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#14b8a6' }}>
                  <span className="material-symbols-outlined">draw</span>
                </div>
                <div>
                  <div className="onboard-feature-name">Cover Letter Forge</div>
                  <div className="onboard-feature-desc">Generate tailored, style-based cover letters for target JDs.</div>
                </div>
              </div>

              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#ef4444' }}>
                  <span className="material-symbols-outlined">radar</span>
                </div>
                <div>
                  <div className="onboard-feature-name">ATS Scorer</div>
                  <div className="onboard-feature-desc">Verify keyword compliance & structural suggestions.</div>
                </div>
              </div>

              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#ec4899' }}>
                  <span className="material-symbols-outlined">record_voice_over</span>
                </div>
                <div>
                  <div className="onboard-feature-name">Mock Interview</div>
                  <div className="onboard-feature-desc">Interactive, voice-capable interview simulator by job context.</div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="onboard-step" key="step3">
            <div className="onboard-step-tag">Step 3 of 4 • How It Works</div>
            <h2 className="onboard-title">Your <span>AI Workforce</span></h2>
            <p className="onboard-desc">
              PlacementOS maps your background and automates preparation. It orchestrates 10 specialized agents under the hood.
            </p>

            <div className="onboard-checklist">
              <div className="onboard-check-item">
                <div className="onboard-check-circle done">
                  <span className="material-symbols-outlined">check</span>
                </div>
                <div className="onboard-check-body">
                  <div className="onboard-check-title">1. Build Your Global profile</div>
                  <div className="onboard-check-sub">Add resume details, social handles, and link your public LeetCode username.</div>
                </div>
              </div>
              <div className="onboard-check-item">
                <div className="onboard-check-circle done">
                  <span className="material-symbols-outlined">check</span>
                </div>
                <div className="onboard-check-body">
                  <div className="onboard-check-title">2. Index Your Projects & Prep DSA</div>
                  <div className="onboard-check-sub">Auditor scans your code into ChromaDB locally. Sync LeetCode to check off DSA targets automatically.</div>
                </div>
              </div>
              <div className="onboard-check-item">
                <div className="onboard-check-circle done">
                  <span className="material-symbols-outlined">check</span>
                </div>
                <div className="onboard-check-body">
                  <div className="onboard-check-title">3. Target Specific Jobs</div>
                  <div className="onboard-check-sub">Analyze JDs for fit, compute market salary bands, score ATS compliance, and run practice mock interviews.</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="onboard-step" key="step4">
            <div className="onboard-step-tag">Step 4 of 4 • Ready</div>
            <h2 className="onboard-title">Choose Your <span>First Move</span></h2>
            <p className="onboard-desc">
              You are ready to launch! Choose an action below to start indexing your achievements or exploring careers.
            </p>

            <div className="onboard-cta-grid">
              <button 
                className="onboard-cta-btn"
                onClick={() => {
                   document.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'profile' }));
                   handleClose();
                }}
              >
                <span className="material-symbols-outlined onboard-cta-icon" style={{ color: '#ec4899' }}>account_circle</span>
                <span className="onboard-cta-label">Set Up Profile</span>
                <span className="onboard-cta-sub">Link your LeetCode and contact links</span>
              </button>
              
              <button 
                className="onboard-cta-btn"
                onClick={() => {
                   document.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'prep' }));
                   handleClose();
                }}
              >
                <span className="material-symbols-outlined onboard-cta-icon" style={{ color: '#FFA116' }}>code</span>
                <span className="onboard-cta-label">DSA Prep Hub</span>
                <span className="onboard-cta-sub">Track syllabus & sync submissions</span>
              </button>

              <button 
                className="onboard-cta-btn"
                onClick={() => {
                   document.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'auditor' }));
                   handleClose();
                }}
              >
                <span className="material-symbols-outlined onboard-cta-icon" style={{ color: '#8b5cf6' }}>terminal</span>
                <span className="onboard-cta-label">Audit a Codebase</span>
                <span className="onboard-cta-sub">Reverse-engineer a repository</span>
              </button>

              <button 
                className="onboard-cta-btn"
                onClick={() => {
                   document.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'analyzer' }));
                   handleClose();
                }}
              >
                <span className="material-symbols-outlined onboard-cta-icon" style={{ color: '#2563eb' }}>manage_search</span>
                <span className="onboard-cta-label">Analyze a JD</span>
                <span className="onboard-cta-sub">Find match scoring and keywords</span>
              </button>
            </div>
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <div className="onboard-backdrop" style={{ opacity: isClosing ? 0 : 1, transition: 'opacity 0.3s ease' }}>
      <div className="onboard-modal" style={{ transform: isClosing ? 'scale(0.96) translateY(10px)' : 'scale(1) translateY(0)', transition: 'all 0.3s ease' }}>
        
        {/* Progress Bar Top */}
        <div className="onboard-progress-bar">
          <div className="onboard-progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        {/* Content area */}
        <div className="onboard-content">
          {renderStepContent()}
        </div>

        {/* Footer Navigation */}
        <div className="onboard-footer">
          <div className="onboard-dots">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className={`onboard-dot ${step === i ? 'active' : ''} ${step > i ? 'done' : ''}`} 
              />
            ))}
          </div>

          <div className="onboard-nav-group">
            {step < 4 && (
              <button className="onboard-skip-btn" onClick={handleClose}>
                Skip intro
              </button>
            )}
            
            {step > 1 && (
              <button className="btn-pill btn-pill-secondary" onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            
            {step < 4 ? (
              <button className="btn-pill btn-pill-primary" onClick={() => setStep(step + 1)}>
                Next <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginLeft: '4px' }}>arrow_forward</span>
              </button>
            ) : (
              <button 
                className="btn-pill btn-pill-primary" 
                onClick={() => {
                  document.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'dashboard' }));
                  handleClose();
                }}
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
