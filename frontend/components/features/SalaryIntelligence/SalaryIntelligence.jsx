/**
 * SalaryIntelligence.jsx
 * ----------------------
 * Salary Intelligence Agent (Agent 7) — Frontend Component
 *
 * Flow:
 *   1. User fills: role title, location, experience level (pill toggle), years slider.
 *   2. Component POSTs to POST /api/salary/analyze.
 *   3. Renders: animated compensation band bars (P25/median/P75), negotiation
 *      floor/ceiling boxes, equity + signing bonus chips, verbatim negotiation
 *      script card, and market insights list.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import './SalaryIntelligence.css';
import { getBackendUrl } from '../../../utils/config';

const LEVELS = ['entry', 'mid', 'senior', 'staff', 'principal'];

const ROLES = [
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full-Stack Engineer',
  'Data Scientist',
  'ML Engineer',
  'DevOps Engineer',
  'Product Manager'
];

const US_LOCATIONS = [
  'San Francisco, CA',
  'New York, NY',
  'Seattle, WA',
  'Austin, TX',
  'Boston, MA',
  'Remote - USA'
];

const IN_LOCATIONS = [
  'Bengaluru, KA',
  'Delhi NCR',
  'Mumbai, MH',
  'Hyderabad, TS',
  'Pune, MH',
  'Chennai, TN'
];

// Animated horizontal salary band bar component
function BandBar({ band, color, label, icon, currency, className }) {
  const range = band.p75 - band.p25 || 1;
  const medianPct = ((band.median - band.p25) / range) * 100;

  const formatValue = (n) => {
    if (currency === 'INR') {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)} LPA`;
      if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
      return `₹${n}`;
    } else {
      if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
      return `$${n}`;
    }
  };

  return (
    <div className={`si-band-card ${className || ''}`}>
      <div className="si-band-title">
        <span className="material-symbols-outlined">{icon}</span>
        {label}
      </div>

      {/* Visual bar: full width = P25→P75 range */}
      <div className="si-band-bar-wrapper">
        <div
          className="si-band-bar-fill"
          style={{ width: '100%', background: `linear-gradient(90deg, ${color}33, ${color})` }}
        />
        {/* Median marker line */}
        <div
          style={{
            position: 'absolute',
            left: `${medianPct}%`,
            top: '-5px',
            bottom: '-5px',
            width: '3px',
            borderRadius: '9999px',
            background: color,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>

      <div className="si-band-markers">
        <div className="si-band-marker">
          <span className="si-band-marker-label">P25</span>
          <span className="si-band-marker-value">{formatValue(band.p25)}</span>
        </div>
        <div className="si-band-marker">
          <span className="si-band-marker-label">Median</span>
          <span className={`si-band-marker-value median`} style={{ color }}>
            {formatValue(band.median)}
          </span>
        </div>
        <div className="si-band-marker">
          <span className="si-band-marker-label">P75</span>
          <span className="si-band-marker-value">{formatValue(band.p75)}</span>
        </div>
      </div>
    </div>
  );
}

// Custom dropdown select component for a premium experience
function CustomSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="si-custom-select-container" ref={containerRef}>
      <button
        type="button"
        className="si-custom-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{value}</span>
        <span className={`material-symbols-outlined si-chevron ${isOpen ? 'open' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <ul className="si-custom-select-options" role="listbox">
          {options.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={value === opt}
              className={`si-custom-option ${value === opt ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              <span>{opt}</span>
              {value === opt && (
                <span className="material-symbols-outlined check-icon">check</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SalaryIntelligence() {
  const BACKEND_URL = getBackendUrl();
  const { settings } = useTheme();
  const isINR = settings.currency === 'INR';
  const LOCATIONS = isINR ? IN_LOCATIONS : US_LOCATIONS;

  const [roleTitle, setRoleTitle]       = useState(ROLES[0]);
  const [location, setLocation]         = useState(() => isINR ? IN_LOCATIONS[0] : US_LOCATIONS[0]);
  const [level, setLevel]               = useState('mid');
  const [years, setYears]               = useState(3);
  const [isLoading, setIsLoading]       = useState(false);
  const [result, setResult]             = useState(null);
  const [error, setError]               = useState(null);
  const [scriptCopied, setScriptCopied] = useState(false);

  // Sync selected location when switching currencies
  useEffect(() => {
    if (!LOCATIONS.includes(location)) {
      setLocation(LOCATIONS[0]);
    }
  }, [settings.currency, LOCATIONS, location]);

  const formatCurrency = (n) => {
    if (isINR) {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)} LPA`;
      if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
      return `₹${n}`;
    } else {
      if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
      return `$${n}`;
    }
  };

  const handleAnalyze = async () => {
    if (!roleTitle.trim() || !location.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/salary/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_title: roleTitle,
          location,
          experience_level: level,
          experience_years: years,
          currency: settings.currency,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error (${res.status})`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message || 'Failed to fetch salary data. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyScript = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.negotiation_script).then(() => {
      setScriptCopied(true);
      setTimeout(() => setScriptCopied(false), 2200);
    });
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  // Skeleton loading
  const renderSkeleton = () => (
    <div className="si-results-grid">
      {[1, 2].map((i) => (
        <div key={i} className="si-band-card">
          <div className="skeleton-bar" style={{ width: '55%', marginBottom: '1.25rem' }} />
          <div className="skeleton-bar" style={{ width: '100%', height: '8px', borderRadius: '9999px', marginBottom: '0.75rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {[1, 2, 3].map((j) => (
              <div key={j} className="skeleton-bar" style={{ width: '28%', height: '2.5rem', borderRadius: '10px' }} />
            ))}
          </div>
        </div>
      ))}
      {[1, 2, 3].map((i) => (
        <div key={i} className="si-band-card" style={{ gridColumn: 'span 2' }}>
          <div className="skeleton-bar" style={{ width: '40%', marginBottom: '1rem' }} />
          <div className="skeleton-bar" style={{ width: '100%', height: '5rem', borderRadius: '14px' }} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="si-wrapper animate-fade-in">
      <div className="si-header">
        <h2 className="text-hero-title">Salary Intelligence</h2>
        <p className="text-hero-desc">
          Get AI-powered compensation benchmarks, negotiation range, and a verbatim script
          tailored to your role, location, and seniority.
        </p>
      </div>

      {error && (
        <div className="jda-error-banner" style={{ marginBottom: '1.5rem' }}>
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Input Form (always visible) ── */}
      {!result && (
        <div className="bento-grid">
          <div className="bento-card span-5 animate-slide-up delay-100" style={{ marginBottom: '0' }}>
            <div className="card-title">
              <span className="material-symbols-outlined">manage_search</span>
              <span>Research Compensation</span>
            </div>

            <div className="si-form-grid">
              <div className="si-field">
                <label className="si-label">Job Title</label>
                <CustomSelect
                  value={roleTitle}
                  onChange={setRoleTitle}
                  options={ROLES}
                />
              </div>
              <div className="si-field">
                <label className="si-label">Location / Market</label>
                <CustomSelect
                  value={location}
                  onChange={setLocation}
                  options={LOCATIONS}
                />
              </div>
            </div>

            <div className="si-field" style={{ marginBottom: '1.5rem' }}>
              <label className="si-label">Seniority Level</label>
              <div className="si-level-group">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    className={`si-level-btn ${level === l ? 'active' : ''}`}
                    onClick={() => setLevel(l)}
                  >
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="si-field">
              <label className="si-label">Years of Experience</label>
              <div className="si-slider-row">
                <input
                  type="range"
                  className="si-slider"
                  min={0}
                  max={20}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                />
                <span className="si-slider-value">{years} yr{years !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <button
                className="btn-pill btn-pill-primary"
                onClick={handleAnalyze}
                disabled={!roleTitle.trim() || !location.trim() || isLoading}
              >
                <span className="material-symbols-outlined">payments</span>
                {isLoading ? 'Analyzing…' : 'Get Salary Insights'}
              </button>
            </div>
          </div>

          <div className="bento-card span-7 animate-slide-up delay-200" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', borderStyle: 'dashed', backgroundColor: 'transparent' }}>
             <span className="material-symbols-outlined" style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.4 }}>payments</span>
             <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.25rem' }}>Salary Insights</h3>
             <p style={{ maxWidth: '400px', fontSize: '0.95rem' }}>Enter your role and details to discover compensation benchmarks and get a personalized negotiation script.</p>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && renderSkeleton()}

      {/* ── Results ── */}
      {result && !isLoading && (
        <>
          <div className="si-results-grid">
            {/* Compensation Bands */}
            <BandBar band={result.base_salary_band} color="#2563eb" label="Base Salary Only" icon="account_balance_wallet" currency={settings.currency} className="animate-slide-up delay-100" />
            <BandBar band={result.total_comp_band}  color="#10b981" label="Total Compensation" icon="trending_up" currency={settings.currency} className="animate-slide-up delay-200" />

            {/* Negotiation Range */}
            <div className="si-negot-card animate-slide-up delay-300">
              <div className="card-title" style={{ marginBottom: '0' }}>
                <span className="material-symbols-outlined">gavel</span>
                <span>Negotiation Range</span>
              </div>
              <div className="si-negot-range">
                <div className="si-negot-box floor">
                  <div className="si-negot-box-label">Walk-Away Floor</div>
                  <div className="si-negot-box-value">{formatCurrency(result.negotiation_floor)}</div>
                </div>
                <span className="si-negot-arrow">→</span>
                <div className="si-negot-box ceiling">
                  <div className="si-negot-box-label">Aspirational Ceiling</div>
                  <div className="si-negot-box-value">{formatCurrency(result.negotiation_ceiling)}</div>
                </div>
              </div>
              <div className="si-extra-row">
                <div className="si-extra-chip">
                  <span className="material-symbols-outlined">corporate_fare</span>
                  <div>
                    <div className="si-extra-chip-label">Equity (RSUs)</div>
                    <div className="si-extra-chip-value">{result.equity_range}</div>
                  </div>
                </div>
                <div className="si-extra-chip">
                  <span className="material-symbols-outlined">redeem</span>
                  <div>
                    <div className="si-extra-chip-label">Signing Bonus</div>
                    <div className="si-extra-chip-value">{result.signing_bonus_range}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Negotiation Script */}
            <div className="si-script-card animate-slide-up delay-400">
              <div className="card-title" style={{ marginBottom: '0' }}>
                <span className="material-symbols-outlined">record_voice_over</span>
                <span>Verbatim Negotiation Script</span>
              </div>
              <div className="si-script-bubble">{result.negotiation_script}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  className={`copy-btn ${scriptCopied ? 'copied' : ''}`}
                  onClick={handleCopyScript}
                >
                  <span className="material-symbols-outlined">
                    {scriptCopied ? 'check' : 'content_copy'}
                  </span>
                  {scriptCopied ? 'Copied!' : 'Copy Script'}
                </button>
              </div>
            </div>

            {/* Market Insights */}
            <div className="si-insights-card animate-slide-up delay-500">
              <div className="card-title" style={{ marginBottom: '1.25rem' }}>
                <span className="material-symbols-outlined">insights</span>
                <span>Market Insights</span>
              </div>
              {result.market_insights.map((insight, i) => (
                <div key={i} className="si-insight-item">
                  <span className="si-insight-num">{i + 1}</span>
                  <span className="si-insight-text">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reset */}
          <div className="animate-slide-up delay-500" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn-pill btn-pill-secondary" onClick={handleReset}>
              <span className="material-symbols-outlined">refresh</span>
              New Search
            </button>
          </div>
        </>
      )}
    </div>
  );
}
