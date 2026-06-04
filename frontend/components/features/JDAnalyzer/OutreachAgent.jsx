/**
 * OutreachAgent.jsx
 * ------------------
 * Autonomous Outreach & Networking Agent Component
 * Renders inside the JD Analyzer bento grid after an analysis completes.
 *
 * Lifecycle:
 *   1. Receives `analysisResult` + `jdText` from JDAnalyzer (props).
 *   2. Auto-triggers POST /api/outreach on mount (and on tone change via Regenerate).
 *   3. Renders AI-drafted messages in clean bubbles with copy and regenerate controls.
 *
 * Design: Premium, airy bento-box — off-white, 24px radius, soft shadows, pill buttons.
 */

import React, { useState, useEffect, useCallback } from 'react';
import './OutreachAgent.css';

const BACKEND_URL = `http://${window.location.hostname}:8000`;

const TONE_OPTIONS = [
  { id: 'professional', label: 'Professional', icon: 'work' },
  { id: 'casual',       label: 'Casual',       icon: 'local_cafe' },
  { id: 'confident',    label: 'Confident',     icon: 'bolt' },
];

export default function OutreachAgent({ analysisResult, jdText }) {
  const [tone, setTone]                   = useState('professional');
  const [isLoading, setIsLoading]         = useState(false);
  const [outreachData, setOutreachData]   = useState(null);
  const [error, setError]                 = useState(null);
  // Track which copy button was last clicked: 'request' | 'followup' | 'subject'
  const [copiedKey, setCopiedKey]         = useState(null);

  // ── Fetch Helper ────────────────────────────────────────────────────────────
  const fetchOutreach = useCallback(async (selectedTone) => {
    if (!analysisResult || !jdText) return;

    setIsLoading(true);
    setError(null);
    setOutreachData(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description:   jdText,
          alignment_score:   analysisResult.alignment_score,
          tailored_bullets:  analysisResult.tailored_resume_bullets,
          tone:              selectedTone,
          candidate_name:    'Vansh Agrawal',
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server error (${response.status})`);
      }

      const data = await response.json();
      setOutreachData(data);
    } catch (err) {
      console.error('[OutreachAgent] fetch error:', err);
      setError(err.message || 'Failed to generate outreach drafts. Is the backend running on port 8000?');
    } finally {
      setIsLoading(false);
    }
  }, [analysisResult, jdText]);

  // ── Auto-trigger on mount when analysis data arrives ────────────────────────
  useEffect(() => {
    if (analysisResult) {
      fetchOutreach(tone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisResult]);

  // ── Tone Change → Regenerate ─────────────────────────────────────────────────
  const handleToneChange = (newTone) => {
    setTone(newTone);
    fetchOutreach(newTone);
  };

  // ── Clipboard Copy Helper ────────────────────────────────────────────────────
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2200);
      })
      .catch(console.error);
  };

  // ── Character count helper for LinkedIn request ──────────────────────────────
  const charCount = outreachData?.linkedin_request?.length ?? 0;

  // ── Skeleton Loading Placeholder ─────────────────────────────────────────────
  const renderSkeleton = () => (
    <div className="outreach-skeleton">
      {/* Row 1: short bar (connection request) */}
      <div className="outreach-skeleton-row">
        <div className="skeleton-bar" style={{ width: '35%', height: '0.9rem' }} />
        <div className="skeleton-bar" style={{ width: '100%', height: '4.5rem', borderRadius: '16px' }} />
      </div>
      {/* Row 2: subject line */}
      <div className="outreach-skeleton-row">
        <div className="skeleton-bar" style={{ width: '28%', height: '0.9rem' }} />
        <div className="skeleton-bar" style={{ width: '70%', height: '2.5rem', borderRadius: '12px' }} />
      </div>
      {/* Row 3: follow-up (taller) */}
      <div className="outreach-skeleton-row">
        <div className="skeleton-bar" style={{ width: '30%', height: '0.9rem' }} />
        <div className="skeleton-bar" style={{ width: '100%', height: '9rem', borderRadius: '16px' }} />
      </div>
    </div>
  );

  return (
    <div className={`bento-card span-12 animate-slide-up delay-500 ${isLoading ? 'outreach-loading-card' : ''}`}>

      {/* ── Header ── */}
      <div className="outreach-section-label">
        <span className="material-symbols-outlined">send</span>
        <span>Autonomous Outreach Agent</span>
      </div>

      {/* ── Tone Selector ── */}
      <div className="tone-selector">
        <span className="tone-label">Message Tone:</span>
        {TONE_OPTIONS.map(({ id, label, icon }) => (
          <button
            key={id}
            className={`tone-btn ${tone === id ? 'active' : ''}`}
            onClick={() => handleToneChange(id)}
            disabled={isLoading}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '0.3rem' }}>
              {icon}
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* ── Error State ── */}
      {error && (
        <div className="jda-error-banner" style={{ marginBottom: '1.5rem' }}>
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Loading State ── */}
      {isLoading && renderSkeleton()}

      {/* ── Results State ── */}
      {!isLoading && outreachData && (
        <>
          {/* 1. LinkedIn Connection Request */}
          <div className="message-block">
            <div className="message-block-header">
              <div className="message-block-label">
                <span className="material-symbols-outlined">person_add</span>
                LinkedIn Connection Request
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className={`char-badge ${charCount > 300 ? 'over-limit' : ''}`}>
                  {charCount} / 300 chars
                </span>
                <button
                  className={`copy-btn ${copiedKey === 'request' ? 'copied' : ''}`}
                  onClick={() => handleCopy(outreachData.linkedin_request, 'request')}
                >
                  <span className="material-symbols-outlined">
                    {copiedKey === 'request' ? 'check' : 'content_copy'}
                  </span>
                  {copiedKey === 'request' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="message-bubble">
              {outreachData.linkedin_request}
            </div>
          </div>

          {/* 2. Email Subject Line */}
          <div className="message-block">
            <div className="message-block-header">
              <div className="message-block-label">
                <span className="material-symbols-outlined">subject</span>
                Email Subject Line
              </div>
              <button
                className={`copy-btn ${copiedKey === 'subject' ? 'copied' : ''}`}
                onClick={() => handleCopy(outreachData.subject_line, 'subject')}
              >
                <span className="material-symbols-outlined">
                  {copiedKey === 'subject' ? 'check' : 'content_copy'}
                </span>
                {copiedKey === 'subject' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="subject-bubble">
              {outreachData.subject_line}
            </div>
          </div>

          {/* 3. Follow-up Message */}
          <div className="message-block">
            <div className="message-block-header">
              <div className="message-block-label">
                <span className="material-symbols-outlined">forum</span>
                Follow-up Message (Coffee Chat / Referral)
              </div>
              <button
                className={`copy-btn ${copiedKey === 'followup' ? 'copied' : ''}`}
                onClick={() => handleCopy(outreachData.follow_up_message, 'followup')}
              >
                <span className="material-symbols-outlined">
                  {copiedKey === 'followup' ? 'check' : 'content_copy'}
                </span>
                {copiedKey === 'followup' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="message-bubble">
              {outreachData.follow_up_message}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="outreach-footer">
            <div className="outreach-footer-note">
              <span className="material-symbols-outlined">auto_awesome</span>
              Drafted by Gemini · References your indexed portfolio projects
            </div>
            <button
              className="btn-pill btn-pill-secondary"
              onClick={() => fetchOutreach(tone)}
              disabled={isLoading}
            >
              <span className="material-symbols-outlined">refresh</span>
              Regenerate Drafts
            </button>
          </div>
        </>
      )}
    </div>
  );
}
