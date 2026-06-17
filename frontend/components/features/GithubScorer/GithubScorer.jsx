import React, { useState, useRef, useEffect } from 'react';
import { analyzeGithubRepo, chatGithubRepo } from '../../../services/analyzerService';
import './GithubScorer.css';

const LOADING_STEPS = [
  { icon: 'radar', label: 'Initializing repository scanner...' },
  { icon: 'downloading', label: 'Cloning remote Git repository (depth=1)...' },
  { icon: 'folder_open', label: 'Analyzing folder structure & reading source code...' },
  { icon: 'grain', label: 'Chunking files and generating semantic embeddings...' },
  { icon: 'storage', label: 'Ingesting code vectors into local ChromaDB...' },
  { icon: 'architecture', label: 'Auditing architecture, quality & documentation...' },
  { icon: 'auto_awesome', label: 'Finalizing insights and generating scores...' },
];

// Helper: parse **bold** and ```code``` blocks in chat messages
function formatMessageContent(content) {
  if (!content) return '';
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const lang = match ? match[1] : '';
      const code = match ? match[2] : part.replace(/```/g, '');
      return (
        <pre key={index} className="gs-code-block">
          {lang && <div className="gs-code-lang">{lang}</div>}
          <code>{code}</code>
        </pre>
      );
    }
    const boldParts = part.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={index} className="gs-text-span">
        {boldParts.map((bp, i) =>
          bp.startsWith('**') && bp.endsWith('**')
            ? <strong key={i}>{bp.slice(2, -2)}</strong>
            : bp
        )}
      </span>
    );
  });
}

export default function GithubScorer() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 4000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setChatHistory([]);
    try {
      const data = await analyzeGithubRepo(repoUrl.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze the repository. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || chatLoading || !result) return;
    const currentQuestion = question.trim();
    setQuestion('');
    setChatHistory(prev => [...prev, { role: 'user', content: currentQuestion }]);
    setChatLoading(true);
    try {
      const historyPayload = chatHistory.map(({ role, content }) => ({ role, content }));
      const res = await chatGithubRepo(repoUrl.trim(), currentQuestion, historyPayload);
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: res.answer, outOfContext: res.out_of_context },
      ]);
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message || 'Failed to retrieve answer.'}`, isError: true },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getScoreTier = (score) => {
    if (score >= 80) return { label: 'Excellent', cls: 'tier-excellent' };
    if (score >= 60) return { label: 'Good', cls: 'tier-good' };
    if (score >= 40) return { label: 'Fair', cls: 'tier-fair' };
    return { label: 'Needs Work', cls: 'tier-poor' };
  };

  return (
    <div className="gs-container animate-fade-in">
      {/* ── Header + inline input ── */}
      <div className="gs-header">
        <div className="gs-header-top">
          <div>
            <h2 className="text-hero-title">GitHub Repo Scorer</h2>
            <p className="text-hero-desc">
              Run a principal-engineer-level audit on any public repo — scores architecture, code quality, docs, and lets you chat with the codebase.
            </p>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="gs-form gs-form-hero animate-slide-up delay-100">
          <div className="gs-input-group">
            <span className="material-symbols-outlined gs-input-icon">link</span>
            <input
              type="url"
              className="gs-url-input"
              placeholder="https://github.com/owner/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-pill btn-pill-primary gs-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined gs-spin">sync</span>
                Analyzing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">analytics</span>
                Analyze Repository
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Initial Features Onboarding & Presets ── */}
      {!result && !loading && !error && (
        <div className="gs-onboarding animate-slide-up delay-200">
          
          {/* Preset Repos Quick Links */}
          <div className="gs-presets-section">
            <h3 className="gs-presets-title">Or choose a benchmark open-source repository</h3>
            <p className="gs-presets-subtitle">Pre-populate the audit scanner with active repositories to test capability metrics.</p>
            <div className="gs-preset-chips">
              {[
                { name: 'FastAPI', url: 'https://github.com/fastapi/fastapi', lang: 'Python', icon: 'integration_instructions', color: '#009688' },
                { name: 'Express.js', url: 'https://github.com/expressjs/express', lang: 'JavaScript', icon: 'javascript', color: '#f7df1e' },
                { name: 'React', url: 'https://github.com/facebook/react', lang: 'TypeScript', icon: 'html', color: '#61dafb' },
                { name: 'Lodash', url: 'https://github.com/lodash/lodash', lang: 'JavaScript', icon: 'terminal', color: '#3f85a2' },
              ].map((repo) => (
                <button
                  key={repo.name}
                  type="button"
                  className="gs-preset-chip"
                  onClick={() => setRepoUrl(repo.url)}
                  style={{ '--accent-color': repo.color }}
                >
                  <span className="material-symbols-outlined gs-preset-icon">{repo.icon}</span>
                  <div className="gs-preset-text">
                    <span className="gs-preset-name">{repo.name}</span>
                    <span className="gs-preset-lang">{repo.lang}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Feature Bento Grid */}
          <div className="gs-feature-cards-grid">
            <div className="gs-feature-bento-card">
              <div className="gs-feature-icon-wrapper blue">
                <span className="material-symbols-outlined">architecture</span>
              </div>
              <h4>Structural Design Auditing</h4>
              <p>Checks overall layout architecture, MVC/MVVM patterns, folder routing setups, and code modularity clean metrics.</p>
            </div>

            <div className="gs-feature-bento-card">
              <div className="gs-feature-icon-wrapper purple">
                <span className="material-symbols-outlined">grain</span>
              </div>
              <h4>Semantic Vector Coding RAG</h4>
              <p>Performs intelligent code chunks parsing and ingests metadata embeddings into ChromaDB database layers.</p>
            </div>

            <div className="gs-feature-bento-card">
              <div className="gs-feature-icon-wrapper emerald">
                <span className="material-symbols-outlined">rule</span>
              </div>
              <h4>Quality Rating Standards</h4>
              <p>Scores code maintainability, docstring completeness, cyclomatic complexity patterns, and identifies severe bugs.</p>
            </div>

            <div className="gs-feature-bento-card">
              <div className="gs-feature-icon-wrapper orange">
                <span className="material-symbols-outlined">chat</span>
              </div>
              <h4>Interactive Sandbox Q&A</h4>
              <p>Engage in a secured chat session bound directly to file vectors. Code references, logic queries, and flow analyses supported.</p>
            </div>
          </div>

          {/* Stepper / Timeline */}
          <div className="gs-timeline-section">
            <h3 className="gs-timeline-title">Audit Processing Pipeline</h3>
            <div className="gs-timeline-steps">
              <div className="gs-timeline-step">
                <div className="gs-step-circle">1</div>
                <div className="gs-step-content">
                  <h5>Repo Scanner</h5>
                  <p>Clones shallow code versions down into memory.</p>
                </div>
              </div>
              <div className="gs-timeline-connector" />
              <div className="gs-timeline-step">
                <div className="gs-step-circle">2</div>
                <div className="gs-step-content">
                  <h5>Vector Index</h5>
                  <p>Generates high-dimensional vector embeddings.</p>
                </div>
              </div>
              <div className="gs-timeline-connector" />
              <div className="gs-timeline-step">
                <div className="gs-step-circle">3</div>
                <div className="gs-step-content">
                  <h5>Multi-Agent Review</h5>
                  <p>FastAPI LLM agents evaluate modular code metrics.</p>
                </div>
              </div>
              <div className="gs-timeline-connector" />
              <div className="gs-timeline-step">
                <div className="gs-step-circle">4</div>
                <div className="gs-step-content">
                  <h5>Interactive Chat</h5>
                  <p>Opens a secure contextual codebase QA window.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading State ── */}
      {loading && (
        <div className="bento-grid animate-fade-in">
          <div className="bento-card span-12 gs-loading-card">
            <div className="gs-loading-layout">
              {/* Scanner Graphic */}
              <div className="gs-scanner-wrap">
                <div className="gs-scanner-ring">
                  <div className="gs-scanner-sweep" />
                  <div className="gs-scanner-center" />
                </div>
                <span className="gs-scanner-label">Scanning Repo</span>
              </div>

              {/* Step Log */}
              <div className="gs-step-log">
                <div className="gs-step-log-title">
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>memory</span>
                  <span>Repository Audit Engine Active</span>
                </div>
                {LOADING_STEPS.map((step, idx) => {
                  const status = idx < loadingStep ? 'done' : idx === loadingStep ? 'active' : 'pending';
                  return (
                    <div key={idx} className={`gs-step-item gs-step-${status}`}>
                      <div className="gs-step-indicator">
                        {status === 'done' ? (
                          <span className="material-symbols-outlined gs-step-check">check_circle</span>
                        ) : status === 'active' ? (
                          <span className="gs-step-spinner" />
                        ) : (
                          <span className="gs-step-dot" />
                        )}
                      </div>
                      <span className="gs-step-label">{step.label}</span>
                    </div>
                  );
                })}
                <div className="gs-progress-track">
                  <div
                    className="gs-progress-fill"
                    style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Error State ── */}
      {error && !loading && (
        <div className="bento-grid animate-fade-in">
          <div className="bento-card span-12 gs-error-card">
            <span className="material-symbols-outlined gs-error-icon">error</span>
            <div>
              <h3>Analysis Failed</h3>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Results Dashboard ── */}
      {result && !loading && (
        <div className="bento-grid gs-results animate-fade-in">

          {/* Score Hero Card */}
          <div className="bento-card span-4 gs-score-card animate-slide-up delay-100">
            <div className="card-title">
              <span className="material-symbols-outlined">military_tech</span>
              <span>Quality Score</span>
            </div>

            <div className="gs-score-hero">
              <svg className="gs-score-ring" viewBox="0 0 160 160">
                <defs>
                  <linearGradient id="gsScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--purple)" />
                  </linearGradient>
                </defs>
                <circle className="gs-ring-bg" cx="80" cy="80" r="68" />
                <circle
                  className="gs-ring-progress"
                  cx="80"
                  cy="80"
                  r="68"
                  strokeDasharray={2 * Math.PI * 68}
                  strokeDashoffset={2 * Math.PI * 68 * (1 - result.overall_score / 100)}
                  stroke="url(#gsScoreGrad)"
                />
              </svg>
              <div className="gs-score-overlay">
                <span className="gs-score-number">{result.overall_score}</span>
                <span className="gs-score-denom">/100</span>
              </div>
            </div>

            <div className={`gs-score-tier ${getScoreTier(result.overall_score).cls}`}>
              {getScoreTier(result.overall_score).label}
            </div>
            <p className="gs-project-title">{result.project_title}</p>
            <p className="gs-project-desc gs-clamp">{result.project_description}</p>

            <button
              className="btn-pill btn-pill-secondary gs-reset-btn"
              onClick={() => { setResult(null); setError(null); setRepoUrl(''); setChatHistory([]); }}
            >
              <span className="material-symbols-outlined">restart_alt</span>
              Analyze Another
            </button>
          </div>

          {/* Metrics Card */}
          <div className="bento-card span-8 animate-slide-up delay-200">
            <div className="card-title">
              <span className="material-symbols-outlined">bar_chart</span>
              <span>Quality Metrics</span>
            </div>
            <div className="gs-metrics-list">
              {result.metrics.map((m, idx) => (
                <div key={idx} className="gs-metric-item">
                  <div className="gs-metric-header">
                    <span className="gs-metric-name">{m.name}</span>
                    <span className="gs-metric-badge" style={{ color: getScoreColor(m.score) }}>
                      {m.score}/100
                    </span>
                  </div>
                  <div className="gs-metric-track">
                    <div
                      className="gs-metric-fill"
                      style={{
                        width: `${m.score}%`,
                        background: `linear-gradient(90deg, var(--primary) 0%, var(--purple) 100%)`
                      }}
                    />
                  </div>
                  <p className="gs-metric-explanation">{m.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Insights Card */}
          <div className="bento-card span-4 animate-slide-up delay-300">
            <div className="card-title">
              <span className="material-symbols-outlined">construction</span>
              <span>Technical Insights</span>
            </div>
            <ul className="gs-insights-list">
              {result.insights.map((insight, idx) => (
                <li key={idx} className="gs-insight-item">
                  <span className="material-symbols-outlined gs-insight-bullet">chevron_right</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Chat Card */}
          <div className="bento-card span-8 gs-chat-card animate-slide-up delay-400">
            <div className="gs-chat-header">
              <div className="card-title" style={{ marginBottom: 0 }}>
                <span className="material-symbols-outlined">forum</span>
                <span>Chat with Codebase</span>
              </div>
              <span className="gs-chat-badge">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
                Context-Restricted
              </span>
            </div>

            <div className="gs-chat-banner">
              <span className="material-symbols-outlined">info</span>
              <p>This chatbot is strictly restricted to the ingested repository context. It will refuse out-of-context questions.</p>
            </div>

            <div className="gs-chat-messages">
              {chatHistory.length === 0 ? (
                <div className="gs-chat-empty">
                  <span className="material-symbols-outlined gs-chat-empty-icon">chat_bubble_outline</span>
                  <p>Ask a question about the repository!</p>
                  <div className="gs-suggested-queries">
                    {[
                      'What is the main architecture/design pattern used?',
                      'Show me how database or API routing is configured.',
                      'What are the external dependencies of this project?',
                    ].map((q, i) => (
                      <button key={i} className="gs-query-chip btn-pill btn-pill-secondary" onClick={() => setQuestion(q)}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`gs-bubble gs-bubble-${msg.role} ${msg.isError ? 'gs-bubble-error' : ''}`}>
                    <div className="gs-bubble-avatar">
                      <span className="material-symbols-outlined">
                        {msg.role === 'user' ? 'person' : 'smart_toy'}
                      </span>
                    </div>
                    <div className="gs-bubble-content">
                      {formatMessageContent(msg.content)}
                      {msg.outOfContext && (
                        <div className="gs-out-of-context">
                          <span className="material-symbols-outlined">warning</span>
                          <span>Rejected: Out of Context Question</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="gs-bubble gs-bubble-assistant">
                  <div className="gs-bubble-avatar">
                    <span className="material-symbols-outlined">smart_toy</span>
                  </div>
                  <div className="gs-bubble-content gs-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendQuestion} className="gs-chat-form">
              <input
                type="text"
                className="gs-chat-input"
                placeholder="Ask a question about the repository..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={chatLoading}
              />
              <button
                type="submit"
                className="btn-pill btn-pill-primary gs-chat-send"
                disabled={chatLoading || !question.trim()}
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
