import React, { useState } from 'react';

const STAGES = [
  { id: 'applied', label: 'Applied', color: 'var(--accent-cyan)' },
  { id: 'interviewing', label: 'Interviewing', color: 'var(--accent-purple)' },
  { id: 'offered', label: 'Offered', color: 'var(--accent-emerald)' },
  { id: 'rejected', label: 'Rejected', color: 'var(--accent-rose)' },
];

export default function JobTracker({ applications, setApplications, resumes }) {
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // New Application Form State
  const [formState, setFormState] = useState({
    title: '',
    company: '',
    status: 'applied',
    date: new Date().toISOString().split('T')[0],
    salary: '',
    location: '',
    notes: '',
    contacts: '',
    resumeId: resumes[0]?.id || '',
    jd: ''
  });

  // Filter applications by search text
  const filteredApps = applications.filter(
    (app) =>
      app.title.toLowerCase().includes(search.toLowerCase()) ||
      app.company.toLowerCase().includes(search.toLowerCase()) ||
      app.location.toLowerCase().includes(search.toLowerCase())
  );

  // Drag and Drop handlers
  const handleDragStart = (e, appId) => {
    e.dataTransfer.setData('text/plain', appId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain');
    updateAppStatus(appId, targetStatus);
  };

  const updateAppStatus = (appId, newStatus) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    );
    // If the active viewed app is updated, update its status in state too
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp((prev) => ({ ...prev, status: newStatus }));
    }
  };

  // Add / Save application
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      setApplications((prev) =>
        prev.map((app) => (app.id === selectedApp.id ? { ...formState, id: selectedApp.id } : app))
      );
      setSelectedApp({ ...formState, id: selectedApp.id });
      setIsEditing(false);
    } else {
      const newApp = {
        ...formState,
        id: 'app_' + Date.now(),
      };
      setApplications((prev) => [newApp, ...prev]);
    }
    setShowAddModal(false);
    resetForm();
  };

  const handleDelete = (appId) => {
    if (window.confirm("Are you sure you want to delete this job application?")) {
      setApplications((prev) => prev.filter((app) => app.id !== appId));
      setSelectedApp(null);
      setIsEditing(false);
    }
  };

  const handleEditInit = () => {
    setFormState({ ...selectedApp });
    setIsEditing(true);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormState({
      title: '',
      company: '',
      status: 'applied',
      date: new Date().toISOString().split('T')[0],
      salary: '',
      location: '',
      notes: '',
      contacts: '',
      resumeId: resumes[0]?.id || '',
      jd: ''
    });
    setIsEditing(false);
  };

  return (
    <div>
      {/* Header Panel */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Job Application Tracker</h1>
          <p className="page-subtitle">Organize and monitor your job pipelines using the Kanban board.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search company, title, location..."
            className="form-input"
            style={{ width: '250px', background: 'var(--bg-card)' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            ➕ New Application
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {STAGES.map((stage) => {
          const stageApps = filteredApps.filter((a) => a.status === stage.id);
          return (
            <div
              key={stage.id}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="kanban-header" style={{ borderTop: `3px solid ${stage.color}` }}>
                <span>{stage.label}</span>
                <span className="kanban-count">{stageApps.length}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  minHeight: '400px',
                  paddingTop: '0.5rem',
                }}
              >
                {stageApps.length === 0 ? (
                  <div
                    style={{
                      height: '100px',
                      border: '2px dashed var(--border-color)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      padding: '0.5rem'
                    }}
                  >
                    Drag here
                  </div>
                ) : (
                  stageApps.map((app) => (
                    <div
                      key={app.id}
                      className="kanban-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onClick={() => setSelectedApp(app)}
                    >
                      <div className="kanban-card-title">{app.title}</div>
                      <div className="kanban-card-company">{app.company}</div>
                      <div className="kanban-card-footer">
                        <span>📍 {app.location || 'Remote'}</span>
                        <span style={{ fontSize: '0.7rem' }}>📅 {app.date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Application Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {isEditing ? '✏️ Edit Application' : '➕ Add New Job Application'}
              </h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Job Title*</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    required
                    placeholder="e.g. Frontend Engineer"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Company Name*</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formState.company}
                    onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                    required
                    placeholder="e.g. Microsoft"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                  >
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formState.location}
                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    placeholder="e.g. San Francisco, CA / Remote"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Compensation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formState.salary}
                    onChange={(e) => setFormState({ ...formState, salary: e.target.value })}
                    placeholder="e.g. $120,000/yr or $50/hr"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date Tracked</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formState.date}
                    onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Linked Resume Profile</label>
                  <select
                    className="form-select"
                    value={formState.resumeId}
                    onChange={(e) => setFormState({ ...formState, resumeId: e.target.value })}
                  >
                    <option value="">None linked</option>
                    {resumes.map((res) => (
                      <option key={res.id} value={res.id}>
                        {res.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Job Description (JD)</label>
                  <textarea
                    className="form-textarea"
                    value={formState.jd}
                    onChange={(e) => setFormState({ ...formState, jd: e.target.value })}
                    placeholder="Paste job description keywords here for analysis..."
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Notes & Tasks</label>
                  <textarea
                    className="form-textarea"
                    value={formState.notes}
                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                    placeholder="Interview loops, questions asked, prep tasks..."
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Contacts</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formState.contacts}
                    onChange={(e) => setFormState({ ...formState, contacts: e.target.value })}
                    placeholder="e.g. John Doe (Recruiter) - john.doe@email.com"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Save Changes' : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Application Details Modal */}
      {selectedApp && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                💼 Application Details
              </h2>
              <button className="modal-close" onClick={() => setSelectedApp(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '700' }}>{selectedApp.title}</h3>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '0.2rem 0' }}>
                    {selectedApp.company}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    📍 {selectedApp.location || 'Remote'} | 💰 {selectedApp.salary || 'Unspecified'}
                  </p>
                </div>
                <span className={`badge badge-${selectedApp.status}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                  {selectedApp.status}
                </span>
              </div>

              {/* Transition status row */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                <span className="form-label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.4rem' }}>
                  Quick Move Stage
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {STAGES.map((st) => (
                    <button
                      key={st.id}
                      className={`btn`}
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.75rem',
                        background: selectedApp.status === st.id ? st.color : 'transparent',
                        color: selectedApp.status === st.id ? 'white' : 'var(--text-secondary)',
                        border: `1px solid ${selectedApp.status === st.id ? 'transparent' : 'var(--border-color)'}`,
                      }}
                      onClick={() => updateAppStatus(selectedApp.id, st.id)}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Linked Resume */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span className="form-label" style={{ fontSize: '0.75rem' }}>Linked Resume Profile</span>
                <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  📁 {resumes.find(r => r.id === selectedApp.resumeId)?.name || 'No resume linked'}
                </p>
              </div>

              {/* Notes */}
              {selectedApp.notes && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <span className="form-label" style={{ fontSize: '0.75rem' }}>Notes & Reminders</span>
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      whiteSpace: 'pre-line',
                      marginTop: '0.25rem',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {selectedApp.notes}
                  </div>
                </div>
              )}

              {/* Contacts */}
              {selectedApp.contacts && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <span className="form-label" style={{ fontSize: '0.75rem' }}>Contacts</span>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>📞 {selectedApp.contacts}</p>
                </div>
              )}

              {/* Job Description (JD) */}
              {selectedApp.jd && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <span className="form-label" style={{ fontSize: '0.75rem' }}>Job Description Summary</span>
                  <div
                    style={{
                      maxHeight: '120px',
                      overflowY: 'auto',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      whiteSpace: 'pre-line',
                      marginTop: '0.25rem',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {selectedApp.jd}
                  </div>
                </div>
              )}

              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
                Tracked on: {selectedApp.date}
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-danger" onClick={() => handleDelete(selectedApp.id)}>
                🗑️ Delete
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedApp(null)}>
                  Close
                </button>
                <button className="btn btn-primary" onClick={handleEditInit}>
                  ✏️ Edit Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
