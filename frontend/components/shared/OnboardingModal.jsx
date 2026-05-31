/**
 * OnboardingModal.jsx
 * -------------------
 * Animated 3-step onboarding overlay for PlacementOS.
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
            <div className="onboard-step-tag">Welcome</div>
            <h2 className="onboard-title">Meet <span>PlacementOS</span></h2>
            <p className="onboard-desc">
              Your local-first, AI-powered career command center. We've replaced generic advice with
              multi-agent architectures that analyze your actual code and experience.
            </p>
            
            <div className="onboard-feature-grid">
              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#3b82f6' }}>
                  <span className="material-symbols-outlined">dashboard</span>
                </div>
                <div>
                  <div className="onboard-feature-name">Dashboard</div>
                  <div className="onboard-feature-desc">Command center overview</div>
                </div>
              </div>
              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#10b981' }}>
                  <span className="material-symbols-outlined">work</span>
                </div>
                <div>
                  <div className="onboard-feature-name">Job Tracker</div>
                  <div className="onboard-feature-desc">Manage applications</div>
                </div>
              </div>
              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#f59e0b' }}>
                  <span className="material-symbols-outlined">code</span>
                </div>
                <div>
                  <div className="onboard-feature-name">DSA Prep</div>
                  <div className="onboard-feature-desc">Track algorithm progress</div>
                </div>
              </div>
              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#8b5cf6' }}>
                  <span className="material-symbols-outlined">terminal</span>
                </div>
                <div>
                  <div className="onboard-feature-name">Project Auditor</div>
                  <div className="onboard-feature-desc">Audit your codebase</div>
                </div>
              </div>
              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#2563eb' }}>
                  <span className="material-symbols-outlined">manage_search</span>
                </div>
                <div>
                  <div className="onboard-feature-name">JD Analyzer</div>
                  <div className="onboard-feature-desc">Match jobs to your repo</div>
                </div>
              </div>
              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#06b6d4' }}>
                  <span className="material-symbols-outlined">explore</span>
                </div>
                <div>
                  <div className="onboard-feature-name">Career Compass</div>
                  <div className="onboard-feature-desc">AI maps your PDF resume</div>
                </div>
              </div>
              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#f97316' }}>
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                  <div className="onboard-feature-name">Salary Intel</div>
                  <div className="onboard-feature-desc">Negotiation scripts & data</div>
                </div>
              </div>
              <div className="onboard-feature-card">
                <div className="onboard-feature-icon-wrap" style={{ background: '#14b8a6' }}>
                  <span className="material-symbols-outlined">draw</span>
                </div>
                <div>
                  <div className="onboard-feature-name">Letter Forge</div>
                  <div className="onboard-feature-desc">Style-driven cover letters</div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="onboard-step" key="step2">
            <div className="onboard-step-tag">How It Works</div>
            <h2 className="onboard-title">Your AI Workflow</h2>
            <p className="onboard-desc">
              PlacementOS uses Gemini GenAI and ChromaDB locally. Your data stays private while 
              specialized agents help you land the offer.
            </p>

            <div className="onboard-checklist">
              <div className="onboard-check-item">
                <div className="onboard-check-circle done">
                  <span className="material-symbols-outlined">check</span>
                </div>
                <div className="onboard-check-body">
                  <div className="onboard-check-title">1. Upload Resume & Portfolio</div>
                  <div className="onboard-check-sub">Agent 5 finds your ideal pathways in Career Compass.</div>
                </div>
              </div>
              <div className="onboard-check-item">
                <div className="onboard-check-circle done">
                  <span className="material-symbols-outlined">check</span>
                </div>
                <div className="onboard-check-body">
                  <div className="onboard-check-title">2. Analyze Job Descriptions</div>
                  <div className="onboard-check-sub">Agent 3 extracts skills and Agent 4 drafts networking emails.</div>
                </div>
              </div>
              <div className="onboard-check-item">
                <div className="onboard-check-circle done">
                  <span className="material-symbols-outlined">check</span>
                </div>
                <div className="onboard-check-body">
                  <div className="onboard-check-title">3. Negotiate & Close</div>
                  <div className="onboard-check-sub">Use Salary Intel for market bands and verbatim negotiation scripts.</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="onboard-step" key="step3">
            <div className="onboard-step-tag">Ready</div>
            <h2 className="onboard-title">Let's Get Started</h2>
            <p className="onboard-desc">
              You're all set up. Choose your first action below to test the AI engines.
            </p>

            <div className="onboard-cta-grid">
              <button 
                className="onboard-cta-btn"
                onClick={() => {
                   document.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'analyzer' }));
                   handleClose();
                }}
              >
                <span className="material-symbols-outlined onboard-cta-icon">analytics</span>
                <span className="onboard-cta-label">Analyze a JD</span>
                <span className="onboard-cta-sub">Find out if you're a match</span>
              </button>
              
              <button 
                className="onboard-cta-btn"
                onClick={() => {
                   document.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'compass' }));
                   handleClose();
                }}
              >
                <span className="material-symbols-outlined onboard-cta-icon">explore</span>
                <span className="onboard-cta-label">Career Compass</span>
                <span className="onboard-cta-sub">Upload your PDF resume</span>
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
          <div className="onboard-progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* Content area */}
        <div className="onboard-content">
          {renderStepContent()}
        </div>

        {/* Footer Navigation */}
        <div className="onboard-footer">
          <div className="onboard-dots">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`onboard-dot ${step === i ? 'active' : ''} ${step > i ? 'done' : ''}`} 
              />
            ))}
          </div>

          <div className="onboard-nav-group">
            {step < 3 && (
              <button className="onboard-skip-btn" onClick={handleClose}>
                Skip intro
              </button>
            )}
            
            {step > 1 && (
              <button className="btn-pill btn-pill-secondary" onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button className="btn-pill btn-pill-primary" onClick={() => setStep(step + 1)}>
                Next <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginLeft: '4px' }}>arrow_forward</span>
              </button>
            ) : (
              <button className="btn-pill btn-pill-primary" onClick={handleClose}>
                Go to Dashboard
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
