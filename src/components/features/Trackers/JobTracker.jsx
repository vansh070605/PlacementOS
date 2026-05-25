import React, { useState } from 'react';
import './JobTracker.css';

export default function JobTracker({ applications, setApplications }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({
    title: '',
    company: '',
    status: 'applied',
    date: new Date().toISOString().split('T')[0],
    salary: '',
    location: '',
    notes: '',
  });

  const columns = ['applied', 'interviewing', 'offered', 'rejected'];

  // Add application handler
  const handleAddApplication = (e) => {
    e.preventDefault();
    if (!newApp.title || !newApp.company) return;

    const added = {
      id: `app_${Date.now()}`,
      ...newApp,
    };

    setApplications([added, ...applications]);
    setModalOpen(false);
    setNewApp({
      title: '',
      company: '',
      status: 'applied',
      date: new Date().toISOString().split('T')[0],
      salary: '',
      location: '',
      notes: '',
    });
  };

  // Status transitions
  const moveAppStatus = (appId, nextStatus) => {
    const updated = applications.map((app) => {
      if (app.id === appId) {
        return { ...app, status: nextStatus };
      }
      return app;
    });
    setApplications(updated);
  };

  // Delete handler
  const handleDeleteApp = (appId) => {
    if (window.confirm('Are you sure you want to delete this job application?')) {
      setApplications(applications.filter((app) => app.id !== appId));
    }
  };

  return (
    <div className="jobtracker-wrapper">
      <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="text-hero-title">Job Pipeline</h2>
          <p className="text-hero-desc">Track and move your applications throughout their stages with responsive, airy boards.</p>
        </div>
        <button className="btn-pill btn-pill-primary" onClick={() => setModalOpen(true)}>
          <span className="material-symbols-outlined">add</span>
          Add Application
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="pipeline-container">
        {columns.map((colName) => {
          const colApps = applications.filter((app) => app.status === colName);
          return (
            <div key={colName} className="pipeline-column">
              <div className="column-header">
                <span className="column-title">{colName}</span>
                <span className="column-count">{colApps.length}</span>
              </div>

              {colApps.map((app) => (
                <div key={app.id} className="job-card">
                  <div className="job-card-header">
                    <div className="company-logo">
                      {app.company ? app.company.charAt(0).toUpperCase() : 'J'}
                    </div>
                    <div className="job-card-title-group">
                      <span className="job-role">{app.title}</span>
                      <span className="job-company">{app.company}</span>
                    </div>
                  </div>

                  <div className="job-details-row">
                    {app.location && <span className="job-tag">{app.location}</span>}
                    {app.salary && <span className="job-salary">{app.salary}</span>}
                  </div>

                  <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                    <span className="job-date">{app.date}</span>
                  </div>

                  {app.notes && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderLeft: '2px solid var(--border-strong)', paddingLeft: '0.5rem', margin: '2px 0' }}>
                      {app.notes.substring(0, 75)}{app.notes.length > 75 ? '...' : ''}
                    </p>
                  )}

                  <div className="job-card-actions">
                    {/* Status movement options */}
                    {colName !== 'applied' && (
                      <button 
                        className="btn-icon" 
                        title="Move left"
                        onClick={() => {
                          const prevIdx = columns.indexOf(colName) - 1;
                          moveAppStatus(app.id, columns[prevIdx]);
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                      </button>
                    )}
                    
                    {colName !== 'rejected' && colName !== 'offered' && (
                      <button 
                        className="btn-icon" 
                        title="Move right"
                        onClick={() => {
                          const nextIdx = columns.indexOf(colName) + 1;
                          moveAppStatus(app.id, columns[nextIdx]);
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                      </button>
                    )}

                    {colName !== 'offered' && colName !== 'rejected' && (
                      <button
                        className="btn-icon"
                        title="Mark as Offered"
                        onClick={() => moveAppStatus(app.id, 'offered')}
                        style={{ color: 'var(--success)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>emoji_events</span>
                      </button>
                    )}

                    <button 
                      className="btn-icon" 
                      title="Delete application"
                      onClick={() => handleDeleteApp(app.id)}
                      style={{ color: 'var(--danger)', marginLeft: 'auto' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </div>
                </div>
              ))}

              {colApps.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border-strong)', borderRadius: '12px' }}>
                  No items
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Popup Form */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-section-title" style={{ marginBottom: '2rem' }}>
              <span className="material-symbols-outlined">add_box</span>
              <span>New Job Application</span>
            </div>

            <form onSubmit={handleAddApplication}>
              <div className="form-row">
                <div className="form-group">
                  <label>Job Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frontend Engineer"
                    value={newApp.title}
                    onChange={(e) => setNewApp({ ...newApp, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe"
                    value={newApp.company}
                    onChange={(e) => setNewApp({ ...newApp, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote (US) or Seattle, WA"
                    value={newApp.location}
                    onChange={(e) => setNewApp({ ...newApp, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Salary Bracket</label>
                  <input
                    type="text"
                    placeholder="e.g. $120,000/yr"
                    value={newApp.salary}
                    onChange={(e) => setNewApp({ ...newApp, salary: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Initial Status</label>
                  <select
                    value={newApp.status}
                    onChange={(e) => setNewApp({ ...newApp, status: e.target.value })}
                  >
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date Applied</label>
                  <input
                    type="date"
                    value={newApp.date}
                    onChange={(e) => setNewApp({ ...newApp, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes & Contact Info</label>
                <textarea
                  rows="3"
                  placeholder="HR email, specific technical stack details, next step checklists..."
                  value={newApp.notes}
                  onChange={(e) => setNewApp({ ...newApp, notes: e.target.value })}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justify: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-pill btn-pill-primary">
                  Ingest Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
