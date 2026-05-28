/**
 * CareerCompass.jsx
 * -----------------
 * Career Compass — Resume Analysis & Role Pathway Feature
 *
 * Flow:
 *   1. User drags/drops or browses for a PDF resume.
 *   2. Component POSTs it to POST /api/compass/upload as multipart/form-data.
 *   3. Backend (Agent 5) returns CareerCompassResponse:
 *        { resume_summary, suggested_roles: [ { role_title, current_alignment_score,
 *          core_strengths, missing_skills_roadmap }, ... ] }
 *   4. Component renders the summary banner + 3 animated pathway cards, each with a
 *      circular SVG progress ring, strengths list, and ordered learning roadmap.
 *
 * Design: Premium, airy bento-box — off-white, 24px radius, soft shadows, pill buttons.
 */

import React, { useState, useCallback, useRef } from 'react';
import './CareerCompass.css';

const BACKEND_URL = 'http://localhost:8000';

// ── Score ring colour thresholds ──────────────────────────────────────────────
const scoreColor = (score) => {
  if (score >= 75) return '#22c55e'; // green  – strong fit
  if (score >= 50) return '#3b82f6'; // blue   – moderate fit
  if (score >= 30) return '#f59e0b'; // amber  – developing
  return '#ef4444';                  // red    – early stage
};

// ── Circular SVG Score Ring Component ─────────────────────────────────────────
function ScoreRing({ score, size = 80 }) {
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="cc-score-ring-wrapper">
      <svg
        className="cc-score-ring-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track */}
        <circle
          className="cc-score-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        {/* Progress arc */}
        <circle
          className="cc-score-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        {/* Centre text — rotated back since the SVG is rotated -90deg */}
        <g className="cc-score-text-group" style={{ transform: `rotate(90deg) translate(0, 0)` }}>
          <text
            className="cc-score-number-svg"
            x={size / 2}
            y={size / 2 - 5}
          >
            {score}%
          </text>
          <text
            className="cc-score-label-svg"
            x={size / 2}
            y={size / 2 + 10}
          >
            Fit
          </text>
        </g>
      </svg>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="cc-loading-wrapper">
      <div className="cc-loading-ring">
        <span className="material-symbols-outlined cc-loading-ring-icon">psychology</span>
      </div>
      <div>
        <div className="cc-loading-title">Analyzing your resume…</div>
        <div className="cc-loading-sub">
          Agent 5 is mapping your skills to career pathways. This takes 10–20 seconds.
        </div>
      </div>
      <div className="cc-skeleton-grid">
        {[0, 1, 2].map((i) => (
          <div key={i} className="cc-skeleton-card">
            <div className="skeleton-bar" style={{ width: '60%', height: '1.2rem' }} />
            <div className="skeleton-bar" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="skeleton-bar" style={{ width: '85%' }} />
              <div className="skeleton-bar" style={{ width: '70%' }} />
              <div className="skeleton-bar" style={{ width: '78%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pathway Card ───────────────────────────────────────────────────────────────
function PathwayCard({ pathway, rank }) {
  return (
    <div className={`cc-pathway-card ${rank === 1 ? 'top-card' : ''}`}>

      {/* Header: title + rank */}
      <div className="cc-card-header">
        <div className="cc-card-title-group">
          <div className="cc-card-rank">
            {rank === 1 ? '⭐ Top Match' : rank === 2 ? 'Strong Fit' : 'Emerging Path'}
          </div>
          <div className="cc-card-title">{pathway.role_title}</div>
        </div>
        <ScoreRing score={pathway.current_alignment_score} />
      </div>

      <div className="cc-card-divider" />

      {/* Core Strengths */}
      <div>
        <div className="cc-section-label strengths-label">
          <span className="material-symbols-outlined">verified</span>
          Core Strengths
        </div>
        <ul className="cc-item-list">
          {pathway.core_strengths.map((s, i) => (
            <li key={i} className="cc-item">
              <span className="cc-item-dot strength-dot" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="cc-card-divider" />

      {/* Missing Skills Roadmap */}
      <div>
        <div className="cc-section-label roadmap-label">
          <span className="material-symbols-outlined">route</span>
          Learning Roadmap
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {pathway.missing_skills_roadmap.map((skill, i) => (
            <div key={i} className="cc-roadmap-item">
              <span className="cc-roadmap-number">{i + 1}</span>
              {skill}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CareerCompass() {
  const [isDragOver, setIsDragOver]     = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [result, setResult]             = useState(null);
  const [error, setError]               = useState(null);
  const fileInputRef                    = useRef(null);

  // ── File acceptance helper ─────────────────────────────────────────────────
  const acceptFile = useCallback((file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Only PDF files are supported. Please select a .pdf resume.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10 MB soft limit
      setError('File size exceeds 10 MB. Please upload a lighter PDF.');
      return;
    }
    setError(null);
    setSelectedFile(file);
    setResult(null);
  }, []);

  // ── Drag-and-drop handlers ─────────────────────────────────────────────────
  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    acceptFile(file);
  };
  const handleFileInputChange = (e) => {
    acceptFile(e.target.files?.[0]);
    // Reset input so the same file can be re-uploaded
    e.target.value = '';
  };

  // ── Submit to backend ──────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${BACKEND_URL}/api/compass/upload`, {
        method: 'POST',
        body: formData,
        // NOTE: Do NOT set Content-Type — browser sets it with boundary automatically
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server error (${response.status})`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('[CareerCompass] fetch error:', err);
      setError(err.message || 'Failed to analyze the resume. Is the FastAPI backend running on port 8000?');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="cc-wrapper">

      {/* Page header */}
      <div className="cc-header">
        <h2 className="text-hero-title">Career Compass</h2>
        <p className="text-hero-desc">
          Upload your PDF resume and let AI map your profile to the 3 most aligned career pathways
          — complete with a fit score, your core strengths, and a prioritized learning roadmap.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="jda-error-banner" style={{ marginBottom: '1.5rem' }}>
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Upload card (always visible when no result or loading) ── */}
      {!result && !isLoading && (
        <div className="cc-upload-card">
          {/* Drop zone */}
          <div
            className={`cc-drop-zone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload PDF resume"
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileInputChange}
              aria-hidden="true"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()} // prevent double-trigger
            />

            <span className="material-symbols-outlined cc-upload-icon">
              {selectedFile ? 'description' : 'cloud_upload'}
            </span>

            {selectedFile ? (
              <>
                <div className="cc-file-chip">
                  <span className="material-symbols-outlined">picture_as_pdf</span>
                  {selectedFile.name}
                </div>
                <div className="cc-upload-sub">
                  {(selectedFile.size / 1024).toFixed(0)} KB · Click to change file
                </div>
              </>
            ) : (
              <>
                <div className="cc-upload-title">
                  Drag & drop your resume here, or click to browse
                </div>
                <div className="cc-upload-sub">
                  Supports PDF files up to 10 MB · Text-based PDFs only (not scanned images)
                </div>
              </>
            )}
          </div>

          {/* Action bar */}
          <div className="cc-action-bar">
            <div className="cc-action-bar-note">
              <span className="material-symbols-outlined">lock</span>
              Your resume is processed locally and never stored.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {selectedFile && (
                <button className="btn-pill btn-pill-secondary" onClick={handleReset}>
                  <span className="material-symbols-outlined">close</span>
                  Clear
                </button>
              )}
              <button
                className="btn-pill btn-pill-primary"
                onClick={handleAnalyze}
                disabled={!selectedFile}
              >
                <span className="material-symbols-outlined">explore</span>
                Analyze Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading state ── */}
      {isLoading && <LoadingSkeleton />}

      {/* ── Results ── */}
      {result && !isLoading && (
        <>
          {/* Resume summary banner */}
          <div className="cc-summary-banner">
            <span className="material-symbols-outlined cc-summary-banner-icon">auto_awesome</span>
            <div className="cc-summary-banner-content">
              <div className="cc-summary-banner-label">AI Profile Summary</div>
              <div className="cc-summary-banner-text">{result.resume_summary}</div>
            </div>
          </div>

          {/* Pathway cards */}
          <div className="cc-pathways-grid">
            {result.suggested_roles.map((role, i) => (
              <PathwayCard key={i} pathway={role} rank={i + 1} />
            ))}
          </div>

          {/* Results footer */}
          <div className="cc-results-footer">
            <div className="cc-results-footer-note">
              <span className="material-symbols-outlined">auto_awesome</span>
              Powered by Gemini · Agent 5 (Career Compass Strategist)
            </div>
            <button className="btn-pill btn-pill-secondary" onClick={handleReset}>
              <span className="material-symbols-outlined">upload_file</span>
              Upload Another Resume
            </button>
          </div>
        </>
      )}
    </div>
  );
}
