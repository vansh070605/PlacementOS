import React, { useState } from 'react';

export default function Dashboard({ applications, dsaProgress, goals, setGoals, setActiveTab }) {
  const [editingGoals, setEditingGoals] = useState(false);
  const [tempGoals, setTempGoals] = useState({ ...goals });

  // Counts
  const totalApps = applications.length;
  const interviewingCount = applications.filter(a => a.status === 'interviewing').length;
  const offersCount = applications.filter(a => a.status === 'offered').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;
  const appliedCount = applications.filter(a => a.status === 'applied').length;
  
  const dsaSolvedCount = dsaProgress.questions.filter(q => q.status === 'Solved').length;

  // Goals calculations
  // Count applications submitted in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const appsThisWeek = applications.filter(a => new Date(a.date) >= sevenDaysAgo).length;

  const appGoalProgress = Math.min(Math.round((appsThisWeek / goals.weeklyApplications) * 100), 100);
  const dsaGoalProgress = Math.min(Math.round((dsaSolvedCount / goals.weeklyDSAQuestions) * 100), 100);

  // SVG Donut Chart calculations
  const totalChart = appliedCount + interviewingCount + offersCount + rejectedCount;
  const data = [
    { value: appliedCount, color: 'var(--accent-cyan)', label: 'Applied' },
    { value: interviewingCount, color: 'var(--accent-purple)', label: 'Interviewing' },
    { value: offersCount, color: 'var(--accent-emerald)', label: 'Offered' },
    { value: rejectedCount, color: 'var(--accent-rose)', label: 'Rejected' },
  ];

  let cumulativePercent = 0;
  const donutSegments = data.map((d, index) => {
    if (totalChart === 0) return null;
    const percent = d.value / totalChart;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;

    // Radius = 40, circumference = 2 * PI * 40 ≈ 251.2
    const strokeDash = 251.2;
    const dashOffset = strokeDash * (1 - percent);
    const rotation = startPercent * 360;

    return {
      ...d,
      dashOffset,
      rotation,
      percentStr: `${Math.round(percent * 100)}%`
    };
  }).filter(Boolean);

  const handleGoalSave = (e) => {
    e.preventDefault();
    setGoals(tempGoals);
    setEditingGoals(false);
  };

  return (
    <div>
      {/* Welcome & Stats Row */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Career Dashboard</h1>
          <p className="page-subtitle">Welcome back, Vansh. Here is your application overview.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditingGoals(true)}>
          ⚙️ Adjust Goals
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="glass-panel metric-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <div>
            <span className="form-label" style={{ fontSize: '0.75rem' }}>Total Applications</span>
            <div className="metric-value">{totalApps}</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)' }}>
            💼
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div>
            <span className="form-label" style={{ fontSize: '0.75rem' }}>Interviewing</span>
            <div className="metric-value">{interviewingCount}</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(157, 78, 221, 0.1)', color: 'var(--accent-purple)' }}>
            🎙️
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <div>
            <span className="form-label" style={{ fontSize: '0.75rem' }}>Offers Received</span>
            <div className="metric-value">{offersCount}</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)' }}>
            🏆
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
          <div>
            <span className="form-label" style={{ fontSize: '0.75rem' }}>DSA Solved</span>
            <div className="metric-value">{dsaSolvedCount}</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)' }}>
            🧩
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="dashboard-sections">
        {/* Left Side: Goal Progress & Recent Apps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Goals Tracker */}
          <div className="glass-panel">
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎯 Weekly Targets
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: '500' }}>Applications Submitted (This Week)</span>
                  <span style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>{appsThisWeek} / {goals.weeklyApplications} ({appGoalProgress}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${appGoalProgress}%`, height: '100%', background: 'var(--grad-purple)', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: '500' }}>DSA Coding Targets (Total Solved)</span>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>{dsaSolvedCount} / {goals.weeklyDSAQuestions} ({dsaGoalProgress}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${dsaGoalProgress}%`, height: '100%', background: 'var(--grad-emerald)', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Applications Table */}
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif' }}>💼 Recent Applications</h3>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => setActiveTab('applications')}
              >
                View All
              </button>
            </div>
            
            {applications.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem' }}>No job applications added yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Company</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.slice(0, 4).map((app) => (
                      <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>{app.company}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{app.title}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{app.date}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span className={`badge badge-${app.status}`}>{app.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Charts & Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Applications Breakdown Chart */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', width: '100%', textAlign: 'left', marginBottom: '1.5rem' }}>
              📊 Application Breakdown
            </h3>
            
            {totalApps === 0 ? (
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No applications to chart
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                {/* SVG Donut */}
                <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                    {donutSegments.map((seg, i) => (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="12"
                        strokeDasharray="251.2"
                        strokeDashoffset={seg.dashOffset}
                        transform={`rotate(${seg.rotation - 90} 50 50)`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    ))}
                  </svg>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    fontFamily: 'Space Grotesk',
                    fontWeight: '700',
                    fontSize: '1.2rem'
                  }}>
                    {totalApps}
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '400', textTransform: 'uppercase' }}>
                      Total
                    </div>
                  </div>
                </div>

                {/* Donut Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '100px' }}>
                  {data.map((d, index) => {
                    const count = d.value;
                    const percent = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0;
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }}></span>
                        <span style={{ color: 'var(--text-secondary)', flexGrow: 1 }}>{d.label}</span>
                        <span style={{ fontWeight: '600' }}>{count} ({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick AI Scouting Panel */}
          <div className="glass-panel" style={{ background: 'var(--grad-dark)', border: '1px solid rgba(157, 78, 221, 0.3)' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'white', marginBottom: '0.5rem' }}>
              🔍 Match Job Profiles
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#c084fc', marginBottom: '1.25rem' }}>
              Paste a job description or scan job boards to identify skills gaps and customize your preparation.
            </p>
            <button className="btn btn-primary" style={{ width: '100%', background: '#fff', color: '#1e1b4b' }} onClick={() => setActiveTab('analyzer')}>
              Open JD Analyzer
            </button>
          </div>
        </div>
      </div>

      {/* Adjust Goals Modal */}
      {editingGoals && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">⚙️ Adjust Weekly Targets</h2>
              <button className="modal-close" onClick={() => setEditingGoals(false)}>&times;</button>
            </div>
            <form onSubmit={handleGoalSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Weekly Application Target</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={tempGoals.weeklyApplications}
                    onChange={(e) => setTempGoals({ ...tempGoals, weeklyApplications: parseInt(e.target.value) || 0 })}
                    min="1" 
                    required 
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>How many job applications do you plan to submit each week?</p>
                </div>
                
                <div className="form-group">
                  <label className="form-label">DSA Target (Solved Coding Questions)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={tempGoals.weeklyDSAQuestions}
                    onChange={(e) => setTempGoals({ ...tempGoals, weeklyDSAQuestions: parseInt(e.target.value) || 0 })}
                    min="1" 
                    required 
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target number of coding exercises solved to date.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingGoals(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Targets</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
