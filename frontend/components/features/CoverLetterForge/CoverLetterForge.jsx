/**
 * CoverLetterForge.jsx
 * ----------------------
 * Cover Letter Forge (Agent 8) — Frontend Component
 *
 * Flow:
 *   1. User pastes Job Description, tailored bullets (or imports from Analyzer),
 *      and selects a writing style.
 *   2. Component POSTs to POST /api/cover-letter/generate.
 *   3. Renders: The generated cover letter, word count, style badge, and key hooks.
 */

import React, { useState, useEffect } from 'react';
import './CoverLetterForge.css';
import { useProfile } from '../../../contexts/ProfileContext';
import { formatProfileToText } from '../../../utils/profileFormatter';
import { getBackendUrl } from '../../../utils/config';

const STYLES = ['professional', 'story_driven', 'data_first'];

export default function CoverLetterForge() {
  const BACKEND_URL = getBackendUrl();
  const { profile } = useProfile();
  const [jobDescription, setJobDescription] = useState('');
  const [targetCompany, setTargetCompany]   = useState('');
  const [style, setStyle]                   = useState('professional');
  const [isLoading, setIsLoading]           = useState(false);
  const [result, setResult]                 = useState(null);
  const [error, setError]                   = useState(null);
  const [copied, setCopied]                 = useState(false);
  const [copiedHookIdx, setCopiedHookIdx]   = useState(null);

  // State to hold data imported from JD Analyzer
  const [importedData, setImportedData] = useState(null);

  // Try to load data from JD Analyzer on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pos_analyzer_result');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.tailored_resume_bullets && parsed.alignment_score) {
          setImportedData({
            bullets: parsed.tailored_resume_bullets,
            score: parsed.alignment_score
          });
        }
      }
    } catch (e) {
      console.warn("Failed to parse analyzer result from local storage", e);
    }
  }, []);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a Job Description.");
      return;
    }
    if (!importedData) {
      setError("No resume bullets found. Please run the JD Analyzer first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/cover-letter/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: jobDescription,
          target_company: targetCompany || "the company",
          style: style,
          candidate_profile: formatProfileToText(profile),
          tailored_bullets: importedData.bullets,
          alignment_score: importedData.score,
        }),
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error (${res.status})`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message || 'Failed to generate cover letter. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.cover_letter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleCopyHook = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedHookIdx(idx);
      setTimeout(() => setCopiedHookIdx(null), 2000);
    });
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([result.cover_letter], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Cover_Letter_${targetCompany || 'Application'}.txt`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const formatStyleLabel = (s) => {
    return s.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="clf-wrapper animate-fade-in">
      <div className="clf-header">
        <h2 className="text-hero-title">Cover Letter Forge</h2>
        <p className="text-hero-desc">
          Generate highly-tailored, non-generic cover letters that cross-reference the Job Description
          with your strongest portfolio projects and resume bullets.
        </p>
      </div>

      {error && (
        <div className="jda-error-banner" style={{ marginBottom: '1.5rem' }}>
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form Card (always visible until result) */}
      {!result && (
        <div className="bento-grid">
          <div className="clf-form-card span-5 animate-slide-up delay-100" style={{ margin: 0 }}>
            <div className="card-title">
              <span className="material-symbols-outlined">draw</span>
              <span>Draft Settings</span>
            </div>

            {!importedData && (
               <div className="jda-error-banner" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--warning-light)', color: 'var(--warning)', borderColor: 'var(--warning)' }}>
                 <span className="material-symbols-outlined">warning</span>
                 <span>No resume bullets found in local storage. Please run the JD Analyzer first to extract your strongest bullets.</span>
               </div>
            )}

            <div className="clf-input-row">
               <div className="clf-field">
                 <label className="clf-label">Target Company</label>
                 <input
                   className="clf-input"
                   value={targetCompany}
                   onChange={(e) => setTargetCompany(e.target.value)}
                   placeholder="e.g. Razorpay"
                 />
               </div>
            </div>

            <div className="clf-field">
              <label className="clf-label">Job Description</label>
              <textarea
                className="clf-textarea"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
              />
            </div>

            <div className="clf-field">
              <label className="clf-label">Writing Style</label>
              <div className="clf-style-group">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    className={`clf-style-btn ${style === s ? 'active' : ''}`}
                    onClick={() => setStyle(s)}
                  >
                    {style === s && <span className="material-symbols-outlined">check</span>}
                    {formatStyleLabel(s)}
                  </button>
                ))}
              </div>
              <p className="text-hero-desc" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {style === 'professional' && "Formal, polished, and concise. Focuses on technical alignment."}
                {style === 'story_driven' && "Narrative and humanized. Focuses on your journey and growth."}
                {style === 'data_first' && "Metrics-led and high-impact. Focuses on quantifiable achievements."}
              </p>
            </div>

            <div className="clf-action-bar">
              <button
                className="btn-pill btn-pill-primary"
                onClick={handleGenerate}
                disabled={!jobDescription.trim() || isLoading || !importedData}
              >
                <span className="material-symbols-outlined">magic_button</span>
                {isLoading ? 'Forging Letter...' : 'Generate Cover Letter'}
              </button>
            </div>
          </div>

          <div className="bento-card span-7 animate-slide-up delay-200" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', borderStyle: 'dashed', backgroundColor: 'transparent' }}>
             <span className="material-symbols-outlined" style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.4 }}>document_scanner</span>
             <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.25rem' }}>Ready to Forge</h3>
             <p style={{ maxWidth: '400px', fontSize: '0.95rem' }}>Fill out the draft settings and generate your highly-tailored, ATS-friendly cover letter to land your next interview.</p>
          </div>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {isLoading && (
         <div className="cc-loading-wrapper animate-fade-in">
           <div className="cc-loading-ring">
             <span className="material-symbols-outlined cc-loading-ring-icon">draw</span>
           </div>
           <div>
             <div className="cc-loading-title">Drafting your cover letter...</div>
             <div className="cc-loading-sub">
               Agent 8 is cross-referencing your portfolio with the JD in a {formatStyleLabel(style)} style.
             </div>
           </div>
         </div>
      )}

      {/* ── Results ── */}
      {result && !isLoading && (
        <div className="clf-results-layout animate-fade-in">
          {/* Main Letter Card */}
          <div className="clf-letter-card animate-slide-up delay-100">
             <div className="clf-letter-header">
                <div className="clf-letter-meta">
                   <div className="clf-word-badge">
                      <span className="material-symbols-outlined">segment</span>
                      {result.word_count} words
                   </div>
                   <div className="clf-style-badge">
                      Style: {formatStyleLabel(style)}
                   </div>
                </div>
                <div className="clf-letter-actions">
                   <button className="btn-pill btn-pill-secondary" onClick={handleDownloadTxt} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      <span className="material-symbols-outlined">download</span>
                      Download TXT
                   </button>
                   <button className="btn-pill btn-pill-primary" onClick={handleCopy} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      <span className="material-symbols-outlined">
                        {copied ? 'check' : 'content_copy'}
                      </span>
                      {copied ? 'Copied!' : 'Copy'}
                   </button>
                </div>
             </div>
             
             <div className="clf-letter-body">
               {result.cover_letter}
             </div>

             <div className="clf-reset-footer">
                <button className="btn-pill btn-pill-secondary" onClick={handleReset}>
                  <span className="material-symbols-outlined">refresh</span>
                  Draft Another
                </button>
             </div>
          </div>

          {/* Key Hooks Side Panel */}
          <div className="clf-hooks-card animate-slide-up delay-200">
            <div className="clf-hooks-header">
              <div className="card-title" style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                 <span className="material-symbols-outlined clf-lightbulb-icon">lightbulb</span>
                 <span>Key Hooks Used</span>
              </div>
              <p className="text-hero-desc" style={{ fontSize: '0.8rem', marginTop: '0', marginBottom: '1.25rem' }}>
                 Agent 8 embedded these power phrases to grab the recruiter's attention:
              </p>
            </div>
            <div className="clf-hooks-list">
               {result.key_hooks.map((hook, idx) => (
                  <div 
                    key={idx} 
                    className="clf-hook-item clf-hook-item-animate"
                    style={{ animationDelay: `${idx * 80 + 200}ms` }}
                  >
                     <button 
                       className="clf-hook-copy-btn" 
                       onClick={() => handleCopyHook(hook, idx)}
                       title="Copy key phrase"
                       aria-label="Copy key phrase"
                     >
                       <span className="material-symbols-outlined">
                         {copiedHookIdx === idx ? 'done' : 'content_copy'}
                       </span>
                       {copiedHookIdx === idx && <span className="clf-hook-copy-tooltip">Copied!</span>}
                     </button>
                     <div className="clf-hook-content">
                       {hook}
                     </div>
                  </div>
               ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
