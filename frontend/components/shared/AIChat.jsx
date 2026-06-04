import React, { useState, useRef, useEffect } from 'react';
import './AIChat.css';

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SUGGESTED_PROMPTS = [
  "How do I improve my ATS score?",
  "Tips for cracking a system design interview",
  "What's a good STAR answer structure?",
  "How do I negotiate a job offer?",
];

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hey! I'm your PlacementOS AI assistant 👋\nAsk me anything about job hunting, DSA, interviews, resumes, or salary negotiations.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setHasUnread(false);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get a response.');
      }

      const data = await response.json();
      const reply = data.reply || "Sorry, I couldn't generate a response.";

      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);

      // Show unread badge if chat is closed
      if (!isOpen) setHasUnread(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "⚠️ Could not reach the backend. Make sure the server is running at " + backendUrl,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      <div className={`aichat-panel ${isOpen ? 'aichat-panel--open' : ''}`}>
        {/* Header */}
        <div className="aichat-header">
          <div className="aichat-header-info">
            <div className="aichat-avatar-sm">
              <span className="material-symbols-outlined">smart_toy</span>
            </div>
            <div>
              <span className="aichat-header-name">PlacementOS AI</span>
              <span className="aichat-header-status">
                <span className="aichat-dot" />
                Online
              </span>
            </div>
          </div>
          <button className="aichat-close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">
            <span className="material-symbols-outlined">keyboard_arrow_down</span>
          </button>
        </div>

        {/* Messages */}
        <div className="aichat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`aichat-bubble-row ${msg.role === 'user' ? 'aichat-bubble-row--user' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="aichat-bot-icon">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
              )}
              <div className={`aichat-bubble ${msg.role === 'user' ? 'aichat-bubble--user' : 'aichat-bubble--bot'}`}>
                {msg.text.split('\n').map((line, j) => (
                  <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br />}</span>
                ))}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="aichat-bubble-row">
              <div className="aichat-bot-icon">
                <span className="material-symbols-outlined">smart_toy</span>
              </div>
              <div className="aichat-bubble aichat-bubble--bot aichat-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts (only when first open) */}
        {messages.length === 1 && (
          <div className="aichat-suggestions">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button key={i} className="aichat-suggestion-chip" onClick={() => sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="aichat-input-row">
          <textarea
            ref={inputRef}
            className="aichat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            disabled={isLoading}
          />
          <button
            className={`aichat-send-btn ${isLoading || !input.trim() ? 'aichat-send-btn--disabled' : ''}`}
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            aria-label="Send"
          >
            <span className="material-symbols-outlined">{isLoading ? 'hourglass_top' : 'send'}</span>
          </button>
        </div>
      </div>

      {/* Floating Trigger Button */}
      <button
        className={`aichat-fab ${isOpen ? 'aichat-fab--open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open AI Chat"
      >
        <span className="material-symbols-outlined aichat-fab-icon">
          {isOpen ? 'close' : 'smart_toy'}
        </span>
        {hasUnread && !isOpen && <span className="aichat-unread-dot" />}
      </button>
    </>
  );
}
