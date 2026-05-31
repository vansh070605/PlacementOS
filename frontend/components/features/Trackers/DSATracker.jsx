import React, { useState } from 'react';
import './DSATracker.css';

export default function DSATracker({ dsaProgress, setDsaProgress }) {
  const [topicSearch, setTopicSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    platform: 'LeetCode',
    difficulty: 'Easy',
    status: 'Solved',
    notes: '',
  });

  const topicsList = Object.keys(dsaProgress.topics);

  // Toggle Topic Status
  const toggleTopic = (topicName) => {
    const updatedTopics = {
      ...dsaProgress.topics,
      [topicName]: !dsaProgress.topics[topicName],
    };
    setDsaProgress({
      ...dsaProgress,
      topics: updatedTopics,
    });
  };

  // Add Question Solver Handler
  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQuestion.title) return;

    const added = {
      id: `q_${Date.now()}`,
      ...newQuestion,
    };

    setDsaProgress({
      ...dsaProgress,
      questions: [added, ...dsaProgress.questions],
    });

    setShowAddForm(false);
    setNewQuestion({
      title: '',
      platform: 'LeetCode',
      difficulty: 'Easy',
      status: 'Solved',
      notes: '',
    });
  };

  // Delete question
  const handleDeleteQuestion = (qid) => {
    if (window.confirm('Delete this solved question record?')) {
      setDsaProgress({
        ...dsaProgress,
        questions: dsaProgress.questions.filter((q) => q.id !== qid),
      });
    }
  };

  // Get difficulty badge class
  const getDifficultyClass = (diff) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return 'difficulty-easy';
      case 'medium':
        return 'difficulty-medium';
      case 'hard':
      default:
        return 'difficulty-hard';
    }
  };

  // Filtered questions
  const filteredQuestions = dsaProgress.questions.filter((q) => {
    if (!topicSearch) return true;
    return (
      q.title.toLowerCase().includes(topicSearch.toLowerCase()) ||
      q.platform.toLowerCase().includes(topicSearch.toLowerCase())
    );
  });

  return (
    <div className="dsatracker-wrapper">
      <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="text-hero-title">DSA Mastery Roadmap</h2>
          <p className="text-hero-desc">Track syllabus completion and log daily problem-solving achievements.</p>
        </div>
        <button className="btn-pill btn-pill-primary mobile-padded-btn" onClick={() => setShowAddForm(!showAddForm)}>
          <span className="material-symbols-outlined">{showAddForm ? 'close' : 'add'}</span>
          {showAddForm ? 'Cancel Form' : 'Log Solved Problem'}
        </button>
      </div>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* Card 1: Add Solved Problem (Conditional) */}
        {showAddForm && (
          <div className="bento-card span-12 animate-slide-up delay-100">
            <div className="card-title">
              <span className="material-symbols-outlined">playlist_add</span>
              <span>Log Problem Achievement</span>
            </div>

            <form onSubmit={handleAddQuestion}>
              <div className="form-row">
                <div className="form-group">
                  <label>Problem Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Reverse a Binary Tree"
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Platform</label>
                  <select
                    value={newQuestion.platform}
                    onChange={(e) => setNewQuestion({ ...newQuestion, platform: e.target.value })}
                  >
                    <option value="LeetCode">LeetCode</option>
                    <option value="HackerRank">HackerRank</option>
                    <option value="Codeforces">Codeforces</option>
                    <option value="GeeksforGeeks">GeeksforGeeks</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Difficulty</label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={newQuestion.status}
                    onChange={(e) => setNewQuestion({ ...newQuestion, status: e.target.value })}
                  >
                    <option value="Solved">Solved</option>
                    <option value="Revision Needed">Revision Needed</option>
                    <option value="Todo">Todo</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Key Takeaway / Optimal Complexity</label>
                <input
                  type="text"
                  placeholder="e.g. Time complexity O(N) using double pointers, space O(1)"
                  value={newQuestion.notes}
                  onChange={(e) => setNewQuestion({ ...newQuestion, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justify: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-pill btn-pill-primary">
                  Log Solved
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Card 2: Syllabus Topics Checklist */}
        <div className="bento-card span-12 animate-slide-up delay-200">
          <div className="card-title">
            <span className="material-symbols-outlined">menu_book</span>
            <span>Core Interview Syllabus Checklist</span>
          </div>
          <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Click on topics below to mark them completed and monitor your conceptual readiness.
          </p>

          <div className="dsa-topic-grid">
            {topicsList.map((topicName) => {
              const isCompleted = dsaProgress.topics[topicName];
              return (
                <div
                  key={topicName}
                  className={`dsa-topic-card ${isCompleted ? 'completed' : ''}`}
                  onClick={() => toggleTopic(topicName)}
                >
                  <div className="dsa-topic-checkbox">
                    <span className="material-symbols-outlined">check</span>
                  </div>
                  <span className="dsa-topic-name">{topicName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Solved Log details */}
        <div className="bento-card span-12 animate-slide-up delay-300">
          <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              <span className="material-symbols-outlined">receipt_long</span>
              <span>Solved Problem Log</span>
            </div>
            
            {/* Search filter input */}
            <input
              type="text"
              placeholder="Search problem title..."
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border-strong)',
                borderRadius: '9999px',
                outline: 'none',
                fontSize: '0.85rem',
                width: '100%',
                maxW: '240px',
                background: 'var(--bg-primary)'
              }}
            />
          </div>

          {filteredQuestions.length === 0 ? (
            <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No logged questions found matching your filter.</p>
          ) : (
            <div className="question-table-container">
              <table className="question-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Platform</th>
                    <th>Difficulty</th>
                    <th>Key Takeaway / Notes</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((q) => (
                    <tr key={q.id || q.title}>
                      <td style={{ fontWeight: '700' }}>{q.title}</td>
                      <td>{q.platform}</td>
                      <td>
                        <span className={`difficulty-badge ${getDifficultyClass(q.difficulty)}`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {q.notes || 'No takeaways added.'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleDeleteQuestion(q.id)}
                          title="Delete record"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
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
    </div>
  );
}
