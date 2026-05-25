import React, { useState } from 'react';
import './Dashboard.css';

export default function Dashboard({ applications, dsaProgress, goals, setGoals, setActiveTab }) {
  const [configOpen, setConfigOpen] = useState(false);
  const [tempGoals, setTempGoals] = useState({ ...goals });

  // Calculate Metrics
  const totalApps = applications.length;
  const activeInterviews = applications.filter((a) => a.status === 'interviewing').length;
  const offersReceived = applications.filter((a) => a.status === 'offered').length;
  const solvedDSA = dsaProgress.questions.filter((q) => q.status === 'Solved').length;

  // Calculate weekly applications count (in the last 7 days)
  const getWeeklyAppsCount = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return applications.filter((app) => {
      if (!app.date) return false;
      const appDate = new Date(app.date);
      return appDate >= sevenDaysAgo;
    }).length;
  };

  const weeklyAppsCount = getWeeklyAppsCount();
  const weeklyAppsPercent = Math.min(100, Math.round((weeklyAppsCount / goals.weeklyApplications) * 100)) || 0;
  const weeklyDSAPercent = Math.min(100, Math.round((solvedDSA / goals.weeklyDSAQuestions) * 100)) || 0;
  const offersPercent = Math.min(100, Math.round((offersReceived / goals.targetOffers) * 100)) || 0;

  const handleSaveGoals = (e) => {
    e.preventDefault();
    setGoals({
      weeklyApplications: parseInt(tempGoals.weeklyApplications, 10) || 5,
      weeklyDSAQuestions: parseInt(tempGoals.weeklyDSAQuestions, 10) || 10,
      targetOffers: parseInt(tempGoals.targetOffers, 10) || 2
    });
    setConfigOpen(false);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'offered':
        return 'badge-offered';
      case 'interviewing':
        return 'badge-interviewing';
      case 'applied':
        return 'badge-applied';
      case 'rejected':
      default:
        return 'badge-rejected';
    }
  };

  return (
    <div className="dashboard-wrapper">
      {/* Title block */}
      <div className="text-hero-title">Command Center</div>
      <p className="text-hero-desc">
        Welcome back, Vansh. Here is an overview of your active applications, DSA achievements, and milestone targets.
      </p>

      {/* Bento Row 1: Metrics */}
      <div className="dashboard-metrics" style={{ marginTop: '2.5rem' }}>
        <div className="metric-card">
          <div className="metric-icon-wrapper blue">
            <span className="material-symbols-outlined">folder_open</span>
          </div>
          <div className="metric-info">
            <span className="metric-value">{totalApps}</span>
            <span className="metric-label">Applications</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper purple">
            <span className="material-symbols-outlined">forum</span>
          </div>
          <div className="metric-info">
            <span className="metric-value">{activeInterviews}</span>
            <span className="metric-label">Interviews</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper emerald">
            <span className="material-symbols-outlined">emoji_events</span>
          </div>
          <div className="metric-info">
            <span className="metric-value">{offersReceived}</span>
            <span className="metric-label">Offers</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrapper orange">
            <span className="material-symbols-outlined">task_alt</span>
          </div>
          <div className="metric-info">
            <span className="metric-value">{solvedDSA}</span>
            <span className="metric-label">Solved DSA</span>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* Card 1: Target Gauges */}
        <div className="bento-card span-6">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined">ads_click</span>
            <span>Weekly Progress & Targets</span>
          </div>

          <div className="target-list">
            {/* Apps Target */}
            <div className="target-item">
              <div className="target-header">
                <span className="target-name">Weekly Applications</span>
                <span className="target-ratio">{weeklyAppsCount} / {goals.weeklyApplications}</span>
                <span className="target-percent">{weeklyAppsPercent}%</span>
              </div>
              <div className="target-progress-bg">
                <div className="target-progress-fill" style={{ width: `${weeklyAppsPercent}%`, background: 'var(--primary)' }}></div>
              </div>
            </div>

            {/* DSA Target */}
            <div className="target-item">
              <div className="target-header">
                <span className="target-name">DSA Questions Mastered</span>
                <span className="target-ratio">{solvedDSA} / {goals.weeklyDSAQuestions}</span>
                <span className="target-percent">{weeklyDSAPercent}%</span>
              </div>
              <div className="target-progress-bg">
                <div className="target-progress-fill" style={{ width: `${weeklyDSAPercent}%`, background: 'var(--warning)' }}></div>
              </div>
            </div>

            {/* Offers Target */}
            <div className="target-item">
              <div className="target-header">
                <span className="target-name">Career Offers Milestone</span>
                <span className="target-ratio">{offersReceived} / {goals.targetOffers}</span>
                <span className="target-percent">{offersPercent}%</span>
              </div>
              <div className="target-progress-bg">
                <div className="target-progress-fill" style={{ width: `${offersPercent}%`, background: 'var(--success)' }}></div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button className="btn-pill btn-pill-secondary" onClick={() => setConfigOpen(!configOpen)}>
              <span className="material-symbols-outlined">settings</span>
              Configure Targets
            </button>
          </div>
        </div>

        {/* Card 2: Configure Targets Panel (Conditional inline) */}
        {configOpen ? (
          <div className="bento-card span-6">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">tune</span>
              <span>Edit Weekly Goals</span>
            </div>

            <form onSubmit={handleSaveGoals}>
              <div className="config-inputs-row">
                <div className="config-input-field">
                  <label>Applications Goal</label>
                  <input
                    type="number"
                    min="1"
                    value={tempGoals.weeklyApplications}
                    onChange={(e) => setTempGoals({ ...tempGoals, weeklyApplications: e.target.value })}
                  />
                </div>
                <div className="config-input-field">
                  <label>DSA Target</label>
                  <input
                    type="number"
                    min="1"
                    value={tempGoals.weeklyDSAQuestions}
                    onChange={(e) => setTempGoals({ ...tempGoals, weeklyDSAQuestions: e.target.value })}
                  />
                </div>
                <div className="config-input-field">
                  <label>Offers Milestone</label>
                  <input
                    type="number"
                    min="1"
                    value={tempGoals.targetOffers}
                    onChange={(e) => setTempGoals({ ...tempGoals, targetOffers: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn-pill btn-pill-primary">
                  Save Changes
                </button>
                <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setConfigOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Card 3: Recent Activity / Live Pipeline */
          <div className="bento-card span-6">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">update</span>
              <span>Recent Applications</span>
            </div>

            {applications.length === 0 ? (
              <p className="text-muted" style={{ padding: '1rem 0' }}>No active applications found. Open the Job Tracker to add one.</p>
            ) : (
              <div className="recent-app-list">
                {applications.slice(0, 3).map((app) => (
                  <div key={app.id} className="recent-app-item">
                    <div className="recent-app-meta">
                      <span className="recent-app-role">{app.title}</span>
                      <span className="recent-app-company">{app.company} • {app.date}</span>
                    </div>
                    
                    {/* Simplified styling mapping */}
                    <span className="recent-app-status" style={{
                      background: app.status === 'offered' ? 'var(--success-light)' : app.status === 'interviewing' ? 'var(--primary-light)' : app.status === 'applied' ? 'var(--bg-secondary)' : 'var(--danger-light)',
                      color: app.status === 'offered' ? 'var(--success)' : app.status === 'interviewing' ? 'var(--primary)' : app.status === 'applied' ? 'var(--text-muted)' : 'var(--danger)',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '2rem' }}>
              <button className="btn-pill btn-pill-secondary" onClick={() => setActiveTab('applications')}>
                View Job Pipeline
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
