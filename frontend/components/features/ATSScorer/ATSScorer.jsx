import React, { useState, useRef } from 'react';
import './ATSScorer.css';
import { useProfile } from '../../../contexts/ProfileContext';
import { formatProfileToText } from '../../../utils/profileFormatter';

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ATSScorer() {
  const { profile } = useProfile();
  const [jobDescription, setJobDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !profile) {
      setError("Please upload a resume (PDF) or complete your Candidate Profile.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please paste the target job description.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    if (selectedFile) {
      formData.append('file', selectedFile);
    } else if (profile) {
      formData.append('resume_text', formatProfileToText(profile));
    }
    formData.append('job_description', jobDescription);

    try {
      const response = await fetch(`${backendUrl}/api/ats/score`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze resume. Please try again.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper for rendering the score circle
  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success, #10b981)';
    if (score >= 60) return 'var(--warning, #f59e0b)';
    return 'var(--danger, #ef4444)';
  };

  return (
    <div className="ats-scorer-container animate-fade-in">
      <div className="ats-header">
        <h2 className="text-hero-title">Resume ATS Scorer</h2>
        <p className="text-hero-desc">
          Upload your resume and paste a job description. Agent 9 will simulate a strict Applicant Tracking System (ATS), giving you a match score and actionable feedback on missing keywords.
        </p>
      </div>

      <div className="ats-input-section bento-grid">
        <div className="ats-card bento-card span-6 animate-slide-up delay-100">
          <div className="ats-card-header">
            <span className="material-symbols-outlined">upload_file</span>
            <h3>1. Upload Resume</h3>
          </div>
          <div 
            className="file-upload-zone" 
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: 'pointer', textAlign: 'center', padding: '3rem 1rem', border: '2px dashed var(--border-strong)', borderRadius: 'var(--radius-md)', marginTop: '1rem', background: 'var(--bg-secondary)' }}
          >
            <input 
              type="file" 
              accept="application/pdf" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileSelect}
            />
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--primary)' }}>picture_as_pdf</span>
            <p style={{ marginTop: '1rem', fontWeight: 600 }}>
              {selectedFile ? selectedFile.name : (profile ? 'Candidate Profile loaded. Click here to override with a PDF upload' : 'Click to upload your PDF resume')}
            </p>
          </div>
        </div>

        <div className="ats-card bento-card span-6 animate-slide-up delay-200">
          <div className="ats-card-header">
            <span className="material-symbols-outlined">description</span>
            <h3>2. Target Job Description</h3>
          </div>
          <textarea 
            className="jd-textarea"
            placeholder="Paste the raw job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          ></textarea>
        </div>

        <div className="ats-actions span-12">
          {error && (
            <div className="ats-error" style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', fontWeight: 600 }}>
              {error}
            </div>
          )}
          <button 
            className="btn-pill btn-primary" 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
          >
            {isAnalyzing ? (
              <>
                <span className="material-symbols-outlined icon-spin">sync</span>
                Simulating ATS Scanner...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">radar</span>
                Run ATS Scan
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="ats-results-section bento-grid animate-fade-in" style={{ marginTop: '2rem' }}>
          
          <div className="ats-card bento-card span-4 animate-slide-up delay-300" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Match Score</h3>
            <div className="score-circle" style={{ borderColor: getScoreColor(result.match_score), color: getScoreColor(result.match_score) }}>
              {result.match_score}%
            </div>
            <p style={{ marginTop: '1.5rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              Target an 80%+ score before applying.
            </p>
          </div>

          <div className="ats-card bento-card span-8 animate-slide-up delay-400">
            <div className="ats-card-header">
              <span className="material-symbols-outlined">gavel</span>
              <h3>Overall Verdict</h3>
            </div>
            <p className="ats-verdict-text">{result.overall_verdict}</p>

            <div className="ats-card-header" style={{ marginTop: '1.5rem' }}>
              <span className="material-symbols-outlined">warning</span>
              <h3>Formatting & Parsing Issues</h3>
            </div>
            <ul className="ats-list">
              {result.formatting_feedback.map((item, i) => (
                <li key={i}><span className="material-symbols-outlined" style={{ color: 'var(--warning)', fontSize: '1.25rem' }}>error</span> {item}</li>
              ))}
            </ul>
          </div>

          <div className="ats-card bento-card span-6 animate-slide-up delay-500">
            <div className="ats-card-header">
              <span className="material-symbols-outlined" style={{ color: 'var(--success)' }}>check_circle</span>
              <h3>Matched Keywords</h3>
            </div>
            <div className="keyword-pills">
              {result.matched_keywords.map((kw, i) => (
                <span key={i} className="keyword-pill matched">{kw}</span>
              ))}
              {result.matched_keywords.length === 0 && <span className="keyword-pill">None found</span>}
            </div>
          </div>

          <div className="ats-card bento-card span-6 animate-slide-up delay-100">
            <div className="ats-card-header">
              <span className="material-symbols-outlined" style={{ color: 'var(--danger)' }}>cancel</span>
              <h3>Missing Keywords (Add These)</h3>
            </div>
            <div className="keyword-pills">
              {result.missing_keywords.map((kw, i) => (
                <span key={i} className="keyword-pill missing">{kw}</span>
              ))}
              {result.missing_keywords.length === 0 && <span className="keyword-pill">None missing!</span>}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
