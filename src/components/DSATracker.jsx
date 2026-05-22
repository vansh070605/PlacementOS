import React, { useState } from 'react';

export default function DSATracker({ dsaProgress, setDsaProgress }) {
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formState, setFormState] = useState({
    title: '',
    platform: 'LeetCode',
    difficulty: 'Medium',
    status: 'Solved',
    notes: ''
  });

  // Calculate stats
  const totalTopics = Object.keys(dsaProgress.topics).length;
  const completedTopics = Object.values(dsaProgress.topics).filter(Boolean).length;
  const topicPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Toggle Topic checkbox
  const handleToggleTopic = (topicName) => {
    setDsaProgress((prev) => ({
      ...prev,
      topics: {
        ...prev.topics,
        [topicName]: !prev.topics[topicName]
      }
    }));
  };

  // Log Question submit
  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    if (!formState.title.trim()) return;

    const newQuestion = {
      ...formState,
      id: Date.now(),
    };

    setDsaProgress((prev) => ({
      ...prev,
      questions: [newQuestion, ...prev.questions]
    }));

    setShowAddModal(false);
    setFormState({
      title: '',
      platform: 'LeetCode',
      difficulty: 'Medium',
      status: 'Solved',
      notes: ''
    });
  };

  const handleDeleteQuestion = (id) => {
    if (window.confirm("Delete this coding question from log?")) {
      setDsaProgress((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== id)
      }));
    }
  };

  const handleUpdateStatus = (id, newStatus) => {
    setDsaProgress((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
    }));
  };

  // Filters
  const filteredQuestions = dsaProgress.questions.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase()) || 
                          q.notes.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'All' || q.difficulty === filterDifficulty;
    const matchesStatus = filterStatus === 'All' || q.status === filterStatus;
    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#f43f5e';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusBadgeClass = (stat) => {
    switch (stat) {
      case 'Solved': return 'badge-offered'; // Greenish
      case 'Revision Needed': return 'badge-interviewing'; // Purpleish
      case 'Todo': return 'badge-applied'; // Cyanish
      default: return '';
    }
  };

  return (
    <div>
      {/* Page Title */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">DSA & Prep Tracker</h1>
          <p className="page-subtitle">Track your data structures & algorithm knowledge, log solved problems, and review code checklists.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          ➕ Log Solved Question
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Topic Checklists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Completion summary */}
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Topic Mastery</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '500' }}>
              <span>{completedTopics} of {totalTopics} Completed</span>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>{topicPercent}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${topicPercent}%`, height: '100%', background: 'var(--grad-emerald)', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
            </div>
          </div>

          {/* Checklist Panel */}
          <div className="glass-panel">
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.2rem', marginBottom: '1rem' }}>💡 Syllabus Checklist</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {Object.keys(dsaProgress.topics).map((topic) => (
                <label 
                  key={topic} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    fontSize: '0.95rem', 
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: dsaProgress.topics[topic] ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={dsaProgress.topics[topic]}
                    onChange={() => handleToggleTopic(topic)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--accent-emerald)',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ textDecoration: dsaProgress.topics[topic] ? 'line-through' : 'none' }}>
                    {topic}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Logged Questions */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, sans-serif' }}>🧩 Solved Questions Log</h3>
            
            {/* Filters Row */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select 
                className="form-select" 
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: 'var(--bg-primary)' }}
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <select 
                className="form-select" 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: 'var(--bg-primary)' }}
              >
                <option value="All">All Statuses</option>
                <option value="Solved">Solved</option>
                <option value="Revision Needed">Revision Needed</option>
                <option value="Todo">Todo</option>
              </select>
            </div>
          </div>

          <input 
            type="text" 
            className="form-input" 
            placeholder="Search logged questions or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: '0.85rem', width: '100%', background: 'rgba(0,0,0,0.15)' }}
          />

          {/* Questions Table */}
          {filteredQuestions.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No logged questions match filters.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Title</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Platform</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Difficulty</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((q) => (
                    <tr key={q.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ fontWeight: '600' }}>{q.title}</div>
                        {q.notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.1rem' }}>
                            📝 {q.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{q.platform}</td>
                      <td style={{ padding: '0.75rem 0.5rem', color: getDifficultyColor(q.difficulty), fontWeight: '700' }}>
                        {q.difficulty}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <select
                          className={`badge ${getStatusBadgeClass(q.status)}`}
                          value={q.status}
                          onChange={(e) => handleUpdateStatus(q.id, e.target.value)}
                          style={{
                            border: 'none',
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                            padding: '0.1rem 0.4rem',
                            outline: 'none'
                          }}
                        >
                          <option value="Solved">Solved</option>
                          <option value="Revision Needed">Revision Needed</option>
                          <option value="Todo">Todo</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <button 
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0.2rem' }}
                          onClick={() => handleDeleteQuestion(q.id)}
                          title="Delete from log"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Log Question Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">➕ Log Solved Question</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleQuestionSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Question Title*</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Reverse a Binary Tree"
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Platform</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. LeetCode / HackerRank"
                      value={formState.platform}
                      onChange={(e) => setFormState({ ...formState, platform: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Difficulty</label>
                    <select 
                      className="form-select" 
                      value={formState.difficulty}
                      onChange={(e) => setFormState({ ...formState, difficulty: e.target.value })}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-select" 
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                  >
                    <option value="Solved">Solved</option>
                    <option value="Revision Needed">Revision Needed</option>
                    <option value="Todo">Todo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Key Takeaways & Revision Notes</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="Briefly state logic optimization, time complexity, or traps..."
                    value={formState.notes}
                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Problem</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
