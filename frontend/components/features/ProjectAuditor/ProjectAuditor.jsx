/**
 * ProjectAuditor.jsx
 * -----------------
 * Project Auditor & Explainer — Code Analysis, Interview Defense & Resume Ingest
 *
 * Flow:
 *   1. User chooses input mode: Paste Code Snippets or Enter Local Folder Path.
 *   2. Component POSTs payload to POST /api/project/audit.
 *   3. Backend parses directory/code, feeds to Agent 6, returns ProjectAuditResponse:
 *        { project_title, project_description, technologies, metrics, architecture_overview,
 *          mermaid_diagram, interview_prep_questions: [ { question, answer }, ... ],
 *          resume_bullets: [...], code_quality_suggestions: [...],
 *          performance_suggestions: [...], security_suggestions: [...] }
 *   4. Component shows tabbed result panel (Overview, Q&A Prep, Resume Bullets, Code Review).
 *   5. Mermaid is dynamically rendered via script tag CDN.
 *   6. User can click "Add to Portfolio" to save directly into ChromaDB.
 */

import React, { useState, useEffect, useRef } from 'react';
import './ProjectAuditor.css';

const BACKEND_URL = `http://${window.location.hostname}:8000`;

export default function ProjectAuditor() {
  // Input Modes: 'paste' or 'path'
  const [inputMode, setInputMode] = useState('paste');

  // Input States
  const [localPath, setLocalPath] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [snippets, setSnippets] = useState([{ filename: 'main.py', content: '' }]);
  const [manualProject, setManualProject] = useState({
    title: '',
    description: '',
    technologies: '',
    metrics: ''
  });

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedQA, setExpandedQA] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mermaid CDN Loading State
  const [mermaidLoaded, setMermaidLoaded] = useState(false);

  // Load Mermaid CDN dynamically
  useEffect(() => {
    if (window.mermaid) {
      setMermaidLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js';
    script.async = true;
    script.onload = () => {
      try {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          flowchart: { useMaxWidth: true, htmlLabels: true }
        });
        setMermaidLoaded(true);
      } catch (err) {
        console.error("Failed to initialize Mermaid:", err);
      }
    };
    document.body.appendChild(script);
  }, []);

  // Snippet Operations
  const handleSnippetChange = (index, field, value) => {
    const updated = [...snippets];
    updated[index][field] = value;
    setSnippets(updated);
  };

  const addSnippet = () => {
    setSnippets([...snippets, { filename: `file_${snippets.length + 1}.py`, content: '' }]);
  };

  const removeSnippet = (index) => {
    if (snippets.length === 1) return;
    setSnippets(snippets.filter((_, i) => i !== index));
  };

  // Toggle Q&A collapse
  const toggleQA = (index) => {
    setExpandedQA(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Submit for audit
  const handleAudit = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setSaveSuccess(false);
    setExpandedQA({});

    let payload = {};
    if (inputMode === 'path') {
      if (!localPath.trim()) {
        setError('Please enter a valid local directory path.');
        setIsLoading(false);
        return;
      }
      payload = { local_directory_path: localPath.trim() };
    } else if (inputMode === 'github') {
      if (!githubUrl.trim()) {
        setError('Please enter a valid GitHub repository URL.');
        setIsLoading(false);
        return;
      }
      payload = { github_repo_url: githubUrl.trim() };
    } else {
      const validSnippets = snippets.filter(s => s.content.trim());
      if (validSnippets.length === 0) {
        setError('Please paste some code in at least one file before auditing.');
        setIsLoading(false);
        return;
      }
      payload = { code_snippets: validSnippets };
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/project/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server error (${response.status})`);
      }

      const data = await response.json();
      setResult(data);
      setActiveTab('overview');
    } catch (err) {
      console.error('[ProjectAuditor] fetch error:', err);
      setError(err.message || 'Failed to complete project audit. Is the FastAPI server running on port 8000?');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit manual entry directly to Portfolio
  const handleManualSave = async () => {
    if (!manualProject.title.trim() || !manualProject.description.trim()) {
      setError('Project Title and Description are required.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const payload = {
        title: manualProject.title.trim(),
        description: manualProject.description.trim(),
        technologies: manualProject.technologies.split(',').map(s => s.trim()).filter(Boolean),
        metrics: manualProject.metrics.trim() || undefined
      };

      const response = await fetch(`${BACKEND_URL}/api/portfolio/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save to database.');
      }

      setSaveSuccess(true);
      document.dispatchEvent(new CustomEvent('pos:portfolio-updated'));
      setManualProject({ title: '', description: '', technologies: '', metrics: '' });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('[ProjectAuditor] manual save error:', err);
      setError(err.message || 'Failed to ingest project into portfolio vector store.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save to Portfolio (ChromaDB)
  const handleSaveToPortfolio = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const payload = {
        title: result.project_title,
        description: `${result.project_description}\n\n### Architecture Overview\n${result.architecture_overview}`,
        technologies: result.technologies,
        metrics: result.metrics || undefined
      };

      const response = await fetch(`${BACKEND_URL}/api/portfolio/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save to database.');
      }

      setSaveSuccess(true);
      // Trigger global portfolio update notification if listener is configured
      document.dispatchEvent(new CustomEvent('pos:portfolio-updated'));
    } catch (err) {
      console.error('[ProjectAuditor] save error:', err);
      setError(err.message || 'Failed to ingest project into portfolio vector store.');
    } finally {
      setIsSaving(false);
    }
  };

  // Clipboard copy helper
  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    // Alert the user briefly (micro-feedback)
    const alertEl = document.createElement('div');
    alertEl.className = 'copy-toast';
    alertEl.innerText = 'Copied to clipboard!';
    document.body.appendChild(alertEl);
    setTimeout(() => alertEl.remove(), 2000);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setLocalPath('');
    setGithubUrl('');
    setSnippets([{ filename: 'main.py', content: '' }]);
    setSaveSuccess(false);
  };

  // Interactive Mermaid Component inside ProjectAuditor
  const MermaidRenderer = ({ chart }) => {
    const containerRef = useRef(null);
    const [svg, setSvg] = useState('');
    const [renderError, setRenderError] = useState(false);

    useEffect(() => {
      if (!mermaidLoaded || !chart || !containerRef.current) return;
      setRenderError(false);
      const uniqueId = `mermaid-audit-${Math.floor(Math.random() * 100000)}`;
      
      try {
        // Clean up markdown syntax if Gemini wrapper leaked
        let cleanedChart = chart.replace(/```mermaid/gi, '').replace(/```/g, '').trim();
        
        window.mermaid.render(uniqueId, cleanedChart)
          .then(({ svg }) => {
            setSvg(svg);
          })
          .catch((err) => {
            console.error("Mermaid render promise catch:", err);
            const errEl = document.getElementById(uniqueId);
            if (errEl) errEl.remove();
            setRenderError(true);
          });
      } catch (err) {
        console.error("Mermaid sync render error:", err);
        setRenderError(true);
      }
    }, [chart]);

    if (renderError) {
      return (
        <div className="mermaid-error">
          <span className="material-symbols-outlined">warning</span>
          <span>Could not render flowchart. Showing raw diagram script:</span>
          <pre className="mermaid-raw">{chart}</pre>
        </div>
      );
    }

    return (
      <div ref={containerRef} className="mermaid-chart-wrapper">
        {svg ? (
          <div className="rendered-svg-container" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <div className="mermaid-loading-state">
            <span className="material-symbols-outlined spinner">sync</span>
            Rendering Architecture Diagram...
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pa-wrapper">
      {/* Header */}
      <div className="pa-header">
        <h2 className="text-hero-title">Project Auditor</h2>
        <p className="text-hero-desc">
          Upload your local project codebase or paste file snippets for Agent 6 to perform a deep static audit. 
          You can also manually enter project details to add them directly to your portfolio.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="pa-error-banner">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Ingest Input Cards */}
      {!result && !isLoading && (
        <div className="pa-input-card">
          <div className="pa-mode-toggles">
            <button
              className={`pa-mode-btn ${inputMode === 'paste' ? 'active' : ''}`}
              onClick={() => setInputMode('paste')}
            >
              <span className="material-symbols-outlined">history_edu</span>
              Paste Source Snippets
            </button>
            <button
              className={`pa-mode-btn ${inputMode === 'path' ? 'active' : ''}`}
              onClick={() => setInputMode('path')}
            >
              <span className="material-symbols-outlined">folder_open</span>
              Scan Local Directory
            </button>
            <button
              className={`pa-mode-btn ${inputMode === 'github' ? 'active' : ''}`}
              onClick={() => setInputMode('github')}
            >
              <span className="material-symbols-outlined">link</span>
              Scan GitHub Repo
            </button>
            <button
              className={`pa-mode-btn ${inputMode === 'manual' ? 'active' : ''}`}
              onClick={() => setInputMode('manual')}
            >
              <span className="material-symbols-outlined">edit_square</span>
              Manual Entry
            </button>
          </div>

          <div className="pa-input-body">
            {inputMode === 'github' ? (
              <div className="pa-path-section">
                <label className="pa-input-label">Public GitHub Repository URL</label>
                <div className="pa-path-input-group">
                  <span className="material-symbols-outlined pa-path-icon">link</span>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="e.g. https://github.com/username/my-project"
                    className="pa-path-input"
                  />
                </div>
                <div className="pa-input-hint">
                  PlacementOS will fetch the default branch zipball directly from the GitHub API and scan the source files. <strong>Only public repositories are supported.</strong>
                </div>
              </div>
            ) : inputMode === 'path' ? (
              <div className="pa-path-section">
                <label className="pa-input-label">Absolute Directory Path</label>
                <div className="pa-path-input-group">
                  <span className="material-symbols-outlined pa-path-icon">terminal</span>
                  <input
                    type="text"
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    placeholder="e.g. E:\CODING\my-awesome-app"
                    className="pa-path-input"
                  />
                </div>
                <div className="pa-input-hint">
                  The backend server will recursively scan source files, skipping build bundles and dependency folders like <code>node_modules</code>.
                </div>
              </div>
            ) : inputMode === 'manual' ? (
              <div className="pa-manual-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="pa-path-section">
                  <label className="pa-input-label">Project Title *</label>
                  <input
                    type="text"
                    value={manualProject.title}
                    onChange={(e) => setManualProject({ ...manualProject, title: e.target.value })}
                    placeholder="e.g. E-Commerce Backend API"
                    className="pa-path-input"
                  />
                </div>
                <div className="pa-path-section">
                  <label className="pa-input-label">Project Description *</label>
                  <textarea
                    value={manualProject.description}
                    onChange={(e) => setManualProject({ ...manualProject, description: e.target.value })}
                    placeholder="Describe what the project does, its purpose, and key features..."
                    className="pa-textarea"
                    rows={4}
                  />
                </div>
                <div className="pa-path-section">
                  <label className="pa-input-label">Technologies Used (comma separated)</label>
                  <input
                    type="text"
                    value={manualProject.technologies}
                    onChange={(e) => setManualProject({ ...manualProject, technologies: e.target.value })}
                    placeholder="e.g. Node.js, Express, MongoDB, Docker"
                    className="pa-path-input"
                  />
                </div>
                <div className="pa-path-section">
                  <label className="pa-input-label">Key Metrics / Impact (optional)</label>
                  <input
                    type="text"
                    value={manualProject.metrics}
                    onChange={(e) => setManualProject({ ...manualProject, metrics: e.target.value })}
                    placeholder="e.g. Reduced API latency by 40%"
                    className="pa-path-input"
                  />
                </div>
              </div>
            ) : (
              <div className="pa-snippets-section">
                {snippets.map((snippet, idx) => (
                  <div key={idx} className="pa-snippet-box">
                    <div className="pa-snippet-header">
                      <div className="pa-filename-group">
                        <span className="material-symbols-outlined">description</span>
                        <input
                          type="text"
                          value={snippet.filename}
                          onChange={(e) => handleSnippetChange(idx, 'filename', e.target.value)}
                          placeholder="Filename (e.g. app.py)"
                          className="pa-filename-input"
                        />
                      </div>
                      {snippets.length > 1 && (
                        <button className="pa-remove-snippet-btn" onClick={() => removeSnippet(idx)}>
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      )}
                    </div>
                    <textarea
                      value={snippet.content}
                      onChange={(e) => handleSnippetChange(idx, 'content', e.target.value)}
                      placeholder="Paste your source file content here..."
                      className="pa-textarea"
                      rows={8}
                    />
                  </div>
                ))}
                <button className="pa-add-snippet-btn" onClick={addSnippet}>
                  <span className="material-symbols-outlined">add_circle</span>
                  Add Another File
                </button>
              </div>
            )}
          </div>

          <div className="pa-footer-actions">
            <span className="pa-secure-badge">
              <span className="material-symbols-outlined">verified_user</span>
              Local processing. No code is shared or sent outside your system.
            </span>
            {inputMode === 'manual' ? (
              <button 
                className="btn-pill btn-pill-primary" 
                onClick={handleManualSave}
                disabled={isSaving}
              >
                <span className="material-symbols-outlined">save_as</span>
                {isSaving ? 'Saving...' : 'Add to Portfolio'}
              </button>
            ) : (
              <button className="btn-pill btn-pill-primary" onClick={handleAudit}>
                <span className="material-symbols-outlined">insights</span>
                Audit Codebase
              </button>
            )}
          </div>
          {saveSuccess && inputMode === 'manual' && (
            <div className="pa-saved-badge animate-pop" style={{ marginTop: '1rem', alignSelf: 'flex-end' }}>
              <span className="material-symbols-outlined">check_circle</span>
              Saved to Portfolio
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="pa-loading-wrapper">
          <div className="pa-loading-brain">
            <span className="material-symbols-outlined spinner-brain">biotech</span>
          </div>
          <div>
            <div className="pa-loading-title">Auditing Code base...</div>
            <div className="pa-loading-sub">
              Agent 6 is mapping module relations, security flaws, and generating interview defenses.
            </div>
          </div>
          <div className="pa-skeleton-box">
            <div className="pa-skeleton-bar" style={{ width: '40%', height: '2rem' }} />
            <div className="pa-skeleton-bar" style={{ width: '90%', height: '1.2rem' }} />
            <div className="pa-skeleton-bar" style={{ width: '75%', height: '1.2rem' }} />
            <div className="pa-skeleton-bar" style={{ width: '85%', height: '150px' }} />
          </div>
        </div>
      )}

      {/* Results View */}
      {result && !isLoading && (
        <div className="pa-results-container">
          {/* Bento Header */}
          <div className="pa-results-header-card">
            <div className="pa-title-layout">
              <div className="pa-title-meta">
                <span className="pa-project-tag">Audited Project</span>
                <h3 className="pa-project-title">{result.project_title}</h3>
                <p className="pa-project-desc">{result.project_description}</p>
              </div>
              <div className="pa-actions-side">
                {saveSuccess ? (
                  <div className="pa-saved-badge animate-pop">
                    <span className="material-symbols-outlined">check_circle</span>
                    Saved to Portfolio
                  </div>
                ) : (
                  <button 
                    className="btn-pill btn-pill-primary pa-save-btn" 
                    onClick={handleSaveToPortfolio}
                    disabled={isSaving}
                  >
                    <span className="material-symbols-outlined">save_as</span>
                    {isSaving ? 'Saving...' : 'Add to Portfolio'}
                  </button>
                )}
                <button className="btn-pill btn-pill-secondary" onClick={handleReset}>
                  <span className="material-symbols-outlined">restart_alt</span>
                  Reset
                </button>
              </div>
            </div>

            <div className="pa-tech-stack-row">
              {result.technologies.map((tech, idx) => (
                <span key={idx} className="pa-tech-pill">{tech}</span>
              ))}
              {result.metrics && (
                <span className="pa-metrics-pill">
                  <span className="material-symbols-outlined">bar_chart</span>
                  {result.metrics}
                </span>
              )}
            </div>
          </div>

          {/* Results Navigation Tabs */}
          <div className="pa-tabs-container">
            <button
              className={`pa-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="material-symbols-outlined">architecture</span>
              Architecture & Flow
            </button>
            <button
              className={`pa-tab ${activeTab === 'prep' ? 'active' : ''}`}
              onClick={() => setActiveTab('prep')}
            >
              <span className="material-symbols-outlined">question_answer</span>
              Interview Q&A Defense
            </button>
            <button
              className={`pa-tab ${activeTab === 'bullets' ? 'active' : ''}`}
              onClick={() => setActiveTab('bullets')}
            >
              <span className="material-symbols-outlined">format_list_bulleted</span>
              Google X-Y-Z Bullets
            </button>
            <button
              className={`pa-tab ${activeTab === 'suggestions' ? 'active' : ''}`}
              onClick={() => setActiveTab('suggestions')}
            >
              <span className="material-symbols-outlined">fact_check</span>
              Code Audit Suggestions
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="pa-tab-content">
            
            {/* Overview & Architecture Flow */}
            {activeTab === 'overview' && (
              <div className="pa-panel animate-fade">
                <div className="pa-panel-title">
                  <span className="material-symbols-outlined">schema</span>
                  System Design & Architectural Flow
                </div>
                <p className="pa-arch-text">{result.architecture_overview}</p>
                <div className="pa-divider" />
                <div className="pa-diagram-section">
                  <div className="pa-diagram-header">
                    <span>Component Interaction Flowchart</span>
                    <button 
                      className="pa-raw-copy-btn" 
                      onClick={() => handleCopyText(result.mermaid_diagram)}
                      title="Copy raw Mermaid code"
                    >
                      <span className="material-symbols-outlined">code</span>
                      Copy Diagram Script
                    </button>
                  </div>
                  <MermaidRenderer chart={result.mermaid_diagram} />
                </div>
              </div>
            )}

            {/* Project Defense Q&A */}
            {activeTab === 'prep' && (
              <div className="pa-panel animate-fade">
                <div className="pa-panel-title">
                  <span className="material-symbols-outlined">psychology_alt</span>
                  Project Defense Checklist
                </div>
                <p className="pa-panel-desc">
                  Hiring engineers will probe your architectural decisions. Practice defending your codebase with these tailored questions:
                </p>
                <div className="pa-qa-list">
                  {result.interview_prep_questions.map((qa, idx) => {
                    const isExpanded = !!expandedQA[idx];
                    return (
                      <div key={idx} className={`pa-qa-card ${isExpanded ? 'expanded' : ''}`}>
                        <div className="pa-qa-header" onClick={() => toggleQA(idx)}>
                          <span className="pa-qa-num">Q{idx + 1}</span>
                          <span className="pa-qa-question">{qa.question}</span>
                          <span className="material-symbols-outlined pa-qa-chevron">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </div>
                        {isExpanded && (
                          <div className="pa-qa-answer-body">
                            <div className="pa-qa-answer-header">
                              <span>Recommended Ideal Defense Response</span>
                              <button 
                                className="pa-inline-copy-btn"
                                onClick={(e) => { e.stopPropagation(); handleCopyText(qa.answer); }}
                              >
                                <span className="material-symbols-outlined">content_copy</span>
                                Copy Answer
                              </button>
                            </div>
                            <p className="pa-qa-answer-content">{qa.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tailored Google X-Y-Z Resume Bullets */}
            {activeTab === 'bullets' && (
              <div className="pa-panel animate-fade">
                <div className="pa-panel-title">
                  <span className="material-symbols-outlined">rate_review</span>
                  Tailored Google X-Y-Z Resume Bullets
                </div>
                <p className="pa-panel-desc">
                  Add these high-impact accomplishments directly into your resume to showcase metrics and action-oriented results:
                </p>
                <div className="pa-bullets-list">
                  {result.resume_bullets.map((bullet, idx) => (
                    <div key={idx} className="pa-bullet-card">
                      <div className="pa-bullet-text">
                        <span className="pa-bullet-formula-label">Formula: Accomplished X, measured by Y, by doing Z</span>
                        <p>{bullet}</p>
                      </div>
                      <button 
                        className="pa-bullet-copy-btn" 
                        onClick={() => handleCopyText(bullet)}
                        title="Copy bullet point"
                      >
                        <span className="material-symbols-outlined">content_copy</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Code Suggestions (Quality, Performance, Security) */}
            {activeTab === 'suggestions' && (
              <div className="pa-panel animate-fade">
                <div className="pa-panel-title">
                  <span className="material-symbols-outlined">security</span>
                  Static Audit Suggestions
                </div>
                <p className="pa-panel-desc">
                  Address these suggestions to level-up your codebase and showcase advanced software engineering practices during review:
                </p>

                <div className="pa-suggestions-grid">
                  {/* Quality */}
                  <div className="pa-suggestion-card quality">
                    <div className="pa-suggestion-card-header">
                      <span className="material-symbols-outlined text-purple">palette</span>
                      Code Quality & Readability
                    </div>
                    <ul>
                      {result.code_quality_suggestions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Performance */}
                  <div className="pa-suggestion-card performance">
                    <div className="pa-suggestion-card-header">
                      <span className="material-symbols-outlined text-blue">speed</span>
                      Execution & Scaling
                    </div>
                    <ul>
                      {result.performance_suggestions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Security */}
                  <div className="pa-suggestion-card security">
                    <div className="pa-suggestion-card-header">
                      <span className="material-symbols-outlined text-red">gpp_maybe</span>
                      Security & Best Practices
                    </div>
                    <ul>
                      {result.security_suggestions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Results Footer */}
          <div className="pa-results-footer">
            <span className="material-symbols-outlined text-purple">auto_awesome</span>
            <span>Audited by Gemini Agent 6 · Local-First Vector Storage enabled</span>
          </div>
        </div>
      )}
    </div>
  );
}
