import React, { useState, useRef, useEffect } from 'react';
import { useProfile } from '../../../contexts/ProfileContext';
import { formatProfileToText } from '../../../utils/profileFormatter';
import './MockInterview.css';

export default function MockInterview() {
  const { profile } = useProfile();
  
  const [jobDescription, setJobDescription] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const startInterview = async () => {
    if (!jobDescription.trim()) {
      setError('Please provide a Job Description to start the interview.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setIsInterviewStarted(true);
    setChatHistory([]); // Clear any previous history

    try {
      const response = await fetch('http://localhost:8000/api/interview/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: jobDescription,
          candidate_profile: profile ? formatProfileToText(profile) : '',
          conversation_history: [],
          latest_answer: null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start interview');
      }

      const data = await response.json();
      
      setChatHistory([
        { role: 'interviewer', content: data.next_question, isTechnical: data.is_technical, feedback: null }
      ]);
    } catch (err) {
      setError(err.message);
      setIsInterviewStarted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentInput.trim() || isLoading) return;

    const userMessage = currentInput.trim();
    setCurrentInput('');
    setError(null);

    // Append user message to UI
    const updatedHistory = [...chatHistory, { role: 'candidate', content: userMessage }];
    setChatHistory(updatedHistory);
    setIsLoading(true);

    // Format history for backend
    const apiHistory = chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const response = await fetch('http://localhost:8000/api/interview/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: jobDescription,
          candidate_profile: profile ? formatProfileToText(profile) : '',
          conversation_history: apiHistory,
          latest_answer: userMessage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get next question');
      }

      const data = await response.json();
      
      setChatHistory(prev => [
        ...prev, 
        { 
          role: 'interviewer', 
          content: data.next_question, 
          isTechnical: data.is_technical,
          feedback: data.feedback 
        }
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetInterview = () => {
    setIsInterviewStarted(false);
    setChatHistory([]);
    setJobDescription('');
    setError(null);
  };

  return (
    <div className="mock-interview-container animate-fade-in">
      <div className="ats-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="text-hero-title">Mock Interview Agent</h2>
          <p className="text-hero-desc">Practice technical and behavioral interviews tailored to your target role.</p>
        </div>
        {isInterviewStarted && (
          <button className="btn-pill btn-secondary" onClick={resetInterview}>
            End Interview
          </button>
        )}
      </div>

      <div className="mock-interview-content">
        {!isInterviewStarted ? (
          <div className="ats-input-section bento-grid">
            <div className="ats-card bento-card span-12 animate-slide-up delay-100">
              <div className="ats-card-header">
                <span className="material-symbols-outlined">description</span>
                <h3>Target Job Description</h3>
              </div>
              
              {error && (
                <div className="ats-error" style={{ color: 'var(--danger)', marginBottom: '1rem', fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Paste the JD you are applying for. The agent will base its questions on these requirements.</p>
              
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="e.g. Seeking a Senior Frontend Engineer with React, Node.js..."
                className="jd-textarea"
                rows={8}
                style={{ marginTop: '1rem' }}
              />
              
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="btn-pill btn-primary" 
                  onClick={startInterview}
                  disabled={isLoading || !jobDescription.trim()}
                  style={{ padding: '0.75rem 2rem' }}
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined icon-spin">sync</span>
                      Preparing Interview...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">play_arrow</span>
                      Start Mock Interview
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="interview-interface bento-grid animate-slide-up delay-100" style={{ height: '600px' }}>
            <div className="ats-card bento-card span-12" style={{ height: '100%', padding: '0', display: 'flex', flexDirection: 'column' }}>
              <div className="chat-history">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`chat-message ${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === 'interviewer' ? (
                        <span className="material-symbols-outlined">smart_toy</span>
                      ) : (
                        <span className="material-symbols-outlined">person</span>
                      )}
                    </div>
                    <div className="message-content">
                      {msg.feedback && (
                        <div className="interviewer-feedback">
                          <strong>Feedback on previous answer:</strong>
                          <p>{msg.feedback}</p>
                        </div>
                      )}
                      <div className="message-text">
                        {msg.role === 'interviewer' && msg.isTechnical !== undefined && (
                          <span className={`question-badge ${msg.isTechnical ? 'technical' : 'behavioral'}`}>
                            {msg.isTechnical ? 'Technical' : 'Behavioral'}
                          </span>
                        )}
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="chat-message interviewer loading">
                    <div className="message-avatar">
                      <span className="material-symbols-outlined">smart_toy</span>
                    </div>
                    <div className="message-content typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                {error && (
                   <div className="chat-message error-message">
                      <p><span className="material-symbols-outlined">error</span> {error}</p>
                   </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form className="chat-input-area" onSubmit={handleSendMessage}>
                <textarea
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Type your answer here... (Use STAR method for behavioral questions)"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  className="jd-textarea"
                  style={{ minHeight: '60px', marginTop: '0', flex: 1 }}
                />
                <button 
                  type="submit" 
                  className="btn-pill btn-primary"
                  disabled={isLoading || !currentInput.trim()}
                  style={{ width: '60px', height: '60px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', marginBottom: '0.5rem' }}
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
