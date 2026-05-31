import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { analyzeJobDescription } from '../../../services/analyzerService';
import OutreachAgent from './OutreachAgent';
import './JDAnalyzer.css';

export default function JDAnalyzer() {
  const [jdText, setJdText]                 = useState('');
  const [isAnalyzing, setIsAnalyzing]       = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError]                   = useState(null);
  const [completedStudyTopics, setCompletedStudyTopics] = useState(new Set());
  const [copiedIndex, setCopiedIndex]       = useState(null);
  const [isExporting, setIsExporting]       = useState(false);
  
  // Ref for PDF export
  const resultsRef = useRef(null);

  // Preserve the JD text even after results arrive so OutreachAgent can use it
  const lastAnalyzedJD = useRef('');

  // Sample JDs to simplify testing and show RAG functionality in action
  const sampleJDs = [
    {
      title: 'Frontend 3D Visualizer',
      text: 'We are seeking a Frontend Engineer with React 19, Vite, and Three.js expertise to build high-performance 3D globes and geospatial visualizations. Familiarity with GIS APIs is highly appreciated. FastAPI knowledge is a plus.'
    },
    {
      title: 'Computer Vision Engineer',
      text: 'Looking for a Computer Vision Engineer to train object detection models. Must be proficient in PyTorch and YOLOv8 architectures. Experience with generative modeling, specifically GANs (DCGAN), is highly preferred for data augmentation.'
    }
  ];

  const handleAnalyze = async () => {
    if (!jdText.trim()) return;

    lastAnalyzedJD.current = jdText;  // snapshot before clearing
    setIsAnalyzing(true);
    setError(null);
    setCopiedIndex(null);
    setCompletedStudyTopics(new Set());

    try {
      const data = await analyzeJobDescription(jdText);
      setAnalysisResult(data);
      // Save result to local storage for Cover Letter Forge
      localStorage.setItem('pos_analyzer_result', JSON.stringify(data));
    } catch (err) {
      console.error('JD Analysis error:', err);
      setError(err.message || 'Failed to analyze the job description. Please check if the FastAPI server is running on port 8000.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!resultsRef.current) return;
    setIsExporting(true);
    try {
      // Capture the grid container as canvas, html2canvas will ignore data-html2canvas-ignore elements
      const canvas = await html2canvas(resultsRef.current, {
        scale: 2, // better resolution
        useCORS: true,
        backgroundColor: '#f8fafc',
      });
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions (A4 portrait)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate scaled image dimensions
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;
      
      // Center the image horizontally and top-align
      const x = (pdfWidth - scaledWidth) / 2;
      const y = 20; // 20px top margin
      
      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
      pdf.save('JD_Analysis_Report.pdf');
    } catch (err) {
      console.error("PDF Export failed:", err);
      setError("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClear = () => {
    setJdText('');
    setAnalysisResult(null);
    setError(null);
    setCompletedStudyTopics(new Set());
    lastAnalyzedJD.current = '';
  };

  const handleCopyBullet = (text, index) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };

  const toggleStudyTopic = (topic) => {
    const nextSet = new Set(completedStudyTopics);
    if (nextSet.has(topic)) {
      nextSet.delete(topic);
    } else {
      nextSet.add(topic);
    }
    setCompletedStudyTopics(nextSet);
  };

  // Renders the elegant skeleton loading cards matching the bento layout
  const renderLoadingState = () => (
    <div className="bento-grid">
      <div className="bento-card span-4 animate-slide-up delay-100">
        <div className="jda-score-container">
          <div className="jda-skeleton-circle"></div>
          <div className="skeleton-bar" style={{ width: '60%', marginTop: '1.5rem' }}></div>
          <div className="skeleton-bar" style={{ width: '40%', marginTop: '0.75rem' }}></div>
        </div>
      </div>
      
      <div className="bento-card span-12 animate-slide-up delay-200">
        <div className="skeleton-bar" style={{ width: '30%', marginBottom: '1.5rem', height: '1.5rem' }}></div>
        <div className="gap-y-4">
          <div className="skeleton-bar" style={{ width: '90%' }}></div>
          <div className="skeleton-bar" style={{ width: '85%' }}></div>
          <div className="skeleton-bar" style={{ width: '95%' }}></div>
          <div className="skeleton-bar" style={{ width: '70%' }}></div>
        </div>
      </div>

      <div className="bento-card span-12 animate-slide-up delay-300">
        <div className="skeleton-bar" style={{ width: '40%', marginBottom: '1.5rem', height: '1.5rem' }}></div>
        <div className="gap-y-4">
          <div className="skeleton-bar" style={{ width: '95%', height: '3rem' }}></div>
          <div className="skeleton-bar" style={{ width: '90%', height: '3rem' }}></div>
          <div className="skeleton-bar" style={{ width: '95%', height: '3rem' }}></div>
        </div>
      </div>

      <div className="bento-card span-4 animate-slide-up delay-400">
        <div className="skeleton-bar" style={{ width: '50%', marginBottom: '1.5rem', height: '1.5rem' }}></div>
        <div className="gap-y-4">
          <div className="skeleton-bar" style={{ width: '80%', height: '2.5rem' }}></div>
          <div className="skeleton-bar" style={{ width: '85%', height: '2.5rem' }}></div>
          <div className="skeleton-bar" style={{ width: '75%', height: '2.5rem' }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="jda-wrapper animate-fade-in">
      <div className="jda-header">
        <h2 className="text-hero-title">JD Analyzer</h2>
        <p className="text-hero-desc">
          Decompose job requirements, identify skill gaps from your indexed portfolio, and generate tailored, ATS-friendly resume bullets.
        </p>
      </div>

      {error && (
        <div className="jda-error-banner">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {isAnalyzing ? (
        renderLoadingState()
      ) : !analysisResult ? (
        // Input Form State
        <div className="bento-grid">
          <div className="bento-card span-12 animate-slide-up delay-500">
            <div className="card-title">
              <span className="material-symbols-outlined">edit_note</span>
              <span>Paste Job Description</span>
            </div>
            
            <textarea
              className="jda-textarea"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the job description text here... (e.g. We are seeking a React Developer experienced with PyTorch, FastAPI...)"
            />

            <div className="jda-action-bar">
              {/* Sample Pasting Buttons for Demo ease */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                  Load Sample:
                </span>
                {sampleJDs.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => setJdText(sample.text)}
                    className="btn-pill btn-pill-secondary"
                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '12px' }}
                  >
                    {sample.title}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-pill btn-pill-secondary" onClick={handleClear} disabled={!jdText}>
                  Clear
                </button>
                <button
                  className="btn-pill btn-pill-primary"
                  onClick={handleAnalyze}
                  disabled={!jdText.trim()}
                >
                  <span className="material-symbols-outlined">analytics</span>
                  Analyze Alignment
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Results State
        <div className="bento-grid" ref={resultsRef}>
          
          {/* Action Bar for Results */}
          <div className="span-12" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1rem' }} data-html2canvas-ignore="true">
            <button className="btn-pill btn-pill-secondary" onClick={handleClear}>
              <span className="material-symbols-outlined">refresh</span>
              Analyze Another JD
            </button>
            <button className="btn-pill btn-pill-primary" onClick={handleExportPDF} disabled={isExporting}>
              <span className="material-symbols-outlined">download</span>
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>

          {/* Card 1: Score Display */}
          <div className="bento-card span-4 animate-slide-up delay-100">
            <div className="jda-score-container">
              <div className="jda-score-number">{analysisResult.alignment_score}%</div>
              <div className="jda-score-label">Compatibility Score</div>
              
              <div className="jda-progress-container">
                <div 
                  className="jda-progress-bar" 
                  style={{ width: `${analysisResult.alignment_score}%` }}
                ></div>
              </div>
              
              <button 
                className="btn-pill btn-pill-secondary" 
                onClick={handleClear} 
                style={{ marginTop: '2.5rem', width: '100%' }}
              >
                <span className="material-symbols-outlined">restart_alt</span>
                Reset Analyzer
              </button>
            </div>
          </div>

          {/* Card 2: Skills Alignment Matrix */}
          <div className="bento-card span-12 animate-slide-up delay-200">
            <div className="card-title">
              <span className="material-symbols-outlined">checklist</span>
              <span>Skills Alignment Matrix</span>
            </div>
            
            <div className="jda-skills-matrix">
              {analysisResult.skills_alignment.map((item, i) => (
                <div key={i} className="jda-skill-card">
                  <div className="jda-skill-header">
                    <span className="jda-skill-name">{item.skill}</span>
                    <span className={`jda-skill-badge jda-badge-${item.status}`}>
                      {item.status}
                    </span>
                  </div>
                  {item.matching_project && (
                    <div className="jda-skill-evidence">
                      <span className="material-symbols-outlined">folder</span>
                      <span>Verified: <strong>{item.matching_project}</strong></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Tailored Resume Bullets */}
          <div className="bento-card span-12 animate-slide-up delay-300">
            <div className="card-title">
              <span className="material-symbols-outlined">history_edu</span>
              <span>Tailored Resume Bullets (Google X-Y-Z)</span>
            </div>
            
            <div className="jda-bullets-list">
              {analysisResult.tailored_resume_bullets.map((bullet, i) => (
                <div key={i} className="jda-bullet-item">
                  <span className="material-symbols-outlined jda-bullet-icon">verified</span>
                  <span className="jda-bullet-text">{bullet}</span>
                  <button 
                    className="jda-btn-copy"
                    onClick={() => handleCopyBullet(bullet, i)}
                    title="Copy bullet point"
                    data-html2canvas-ignore="true"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                      {copiedIndex === i ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Recommended Study Plan */}
          <div className="bento-card span-4 animate-slide-up delay-400">
            <div className="card-title">
              <span className="material-symbols-outlined">menu_book</span>
              <span>Interview Prep Checklist</span>
            </div>
            
            <div className="jda-study-list">
              {analysisResult.recommended_study_plan.map((topic, i) => {
                const isCompleted = completedStudyTopics.has(topic);
                return (
                  <div 
                    key={i} 
                    className={`jda-study-item ${isCompleted ? 'completed' : ''}`}
                    onClick={() => toggleStudyTopic(topic)}
                  >
                    <div className={`jda-study-checkbox ${isCompleted ? 'checked' : ''}`}>
                      <span className="material-symbols-outlined">check</span>
                    </div>
                    <span className="jda-study-text">{topic}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 5: Autonomous Outreach Agent — full-width bento row */}
          <div className="span-12" data-html2canvas-ignore="true" style={{ marginTop: '0', gridColumn: 'span 12' }}>
            <OutreachAgent
              analysisResult={analysisResult}
              jdText={lastAnalyzedJD.current}
            />
          </div>

        </div>
      )}
    </div>
  );
}
