import React, { useState, useRef, useEffect } from 'react';
import './AIChat.css';
import { getBackendUrl } from '../../utils/config';
import { useProfile } from '../../contexts/ProfileContext';

const SUGGESTED_PROMPTS = [
  "How do I improve my ATS score?",
  "Tips for cracking a system design interview",
  "What's a good STAR answer structure?",
  "How do I negotiate a job offer?",
];

// High-end client-side Markdown Parser for rich response styling
const parseMarkdown = (text) => {
  if (!text) return '';
  
  // 1. Escape HTML special characters to prevent breaks and XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // 2. Extract code blocks so they are not parsed by other rules
  const codeBlocks = [];
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const placeholder = `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length}__`;
    codeBlocks.push(`<pre class="markdown-code-block"><code>${code.trim()}</code></pre>`);
    return placeholder;
  });

  // 3. Extract inline code
  const inlineCodes = [];
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    const placeholder = `__INLINE_CODE_PLACEHOLDER_${inlineCodes.length}__`;
    inlineCodes.push(`<code class="markdown-inline-code">${code}</code>`);
    return placeholder;
  });

  // 4. Process line-by-line for block level elements
  const lines = html.split('\n');
  const result = [];
  let inTable = false;
  let inList = false;
  let listType = null; // 'ul' or 'ol'
  
  const closeList = () => {
    if (inList) {
      result.push(listType === 'ol' ? '</ol>' : '</ul>');
      inList = false;
      listType = null;
    }
  };
  
  const closeTable = () => {
    if (inTable) {
      result.push('</tbody></table></div>');
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Table Rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeList();
      const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
      
      // Divider Row: |---|---|
      if (cells.every(cell => /^:-*-:|^:-*|^-*:|^-+$/.test(cell))) {
        continue;
      }
      
      if (!inTable) {
        inTable = true;
        result.push('<div class="markdown-table-wrapper"><table class="markdown-table"><thead><tr>');
        cells.forEach(cell => {
          result.push(`<th>${cell}</th>`);
        });
        result.push('</tr></thead><tbody>');
      } else {
        result.push('<tr>');
        cells.forEach(cell => {
          result.push(`<td>${cell}</td>`);
        });
        result.push('</tr>');
      }
      continue;
    } else {
      closeTable();
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      closeList();
      result.push(`<h5 class="markdown-h5">${trimmed.substring(4)}</h5>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      closeList();
      result.push(`<h4 class="markdown-h4">${trimmed.substring(3)}</h4>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      closeList();
      result.push(`<h3 class="markdown-h3">${trimmed.substring(2)}</h3>`);
      continue;
    }
    
    // Blockquotes
    if (trimmed.startsWith('&gt; ') || trimmed.startsWith('> ')) {
      closeList();
      const quoteText = trimmed.startsWith('&gt; ') ? trimmed.substring(5) : trimmed.substring(2);
      result.push(`<blockquote class="markdown-blockquote">${quoteText}</blockquote>`);
      continue;
    }

    // Unordered Lists
    const ulMatch = line.match(/^(\s*)(?:-|\*)\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        closeList();
        inList = true;
        listType = 'ul';
        result.push('<ul class="markdown-ul">');
      }
      result.push(`<li class="markdown-list-item">${ulMatch[2]}</li>`);
      continue;
    }

    // Ordered Lists
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        closeList();
        inList = true;
        listType = 'ol';
        result.push('<ol class="markdown-ol">');
      }
      result.push(`<li class="markdown-list-item-ordered">${olMatch[2]}</li>`);
      continue;
    }

    // Blank line
    if (trimmed === '') {
      closeList();
      result.push('<div class="markdown-spacing"></div>');
      continue;
    }

    // Normal paragraph
    closeList();
    result.push(`<p class="markdown-p">${trimmed}</p>`);
  }
  
  closeList();
  closeTable();
  
  html = result.join('\n');

  // 5. Restore code placeholders
  inlineCodes.forEach((codeHtml, idx) => {
    html = html.replace(`__INLINE_CODE_PLACEHOLDER_${idx}__`, codeHtml);
  });
  codeBlocks.forEach((codeHtml, idx) => {
    html = html.replace(`__CODE_BLOCK_PLACEHOLDER_${idx}__`, codeHtml);
  });

  // 6. Bold/Italics
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  return html;
};

export default function AIChat({ applications = [], dsaProgress = null, goals = null }) {
  const backendUrl = getBackendUrl();
  const { profile } = useProfile();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hey! I'm your PlacementOS AI Career Coach 👋\n\nAsk me anything about interview prep, DSA algorithms, resume keyword matching, salary negotiation, or job applications. I have access to your profile and application tracker to give tailored career feedback!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  
  // Drag and drop image state
  const [isDragging, setIsDragging] = useState(false);

  // Multimodal State
  const [attachedImage, setAttachedImage] = useState(null);
  const [imageMimeType, setImageMimeType] = useState(null);
  const imageInputRef = useRef(null);

  // Audio & Speech State
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const recognitionRef = useRef(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize Speech Recognition on Mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      
      rec.onstart = () => {
        setIsListening(true);
      };
      
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      };
      
      rec.onerror = (err) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      };
      
      rec.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = rec;
    }
  }, []);

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 1024 * 1024 * 3) {
        alert("Please upload an image smaller than 3MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle Voice Input
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Speak bot response using speech synthesis
  const handleSpeak = (text, idx, e) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (speakingMessageId === idx) {
        setSpeakingMessageId(null);
        return;
      }
    }

    // Strip markdown formatting characters for cleaner reading
    const cleanText = text.replace(/[*#`_-]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    
    setSpeakingMessageId(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Image Attachment Upload handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024 * 3) { // 3MB limit
        alert("Please upload an image smaller than 3MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null; // Reset file input
  };

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setHasUnread(false);
    }
    // Stop speaking when closed
    if (!isOpen && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    const currentImage = attachedImage;
    const currentMimeType = imageMimeType;

    // Check if we have at least text or an image
    if (!userText && !currentImage) return;
    if (isLoading) return;

    // Clear state inputs
    setInput('');
    setAttachedImage(null);
    setImageMimeType(null);
    
    setMessages((prev) => [
      ...prev, 
      { 
        role: 'user', 
        text: userText || "Shared an image", 
        image: currentImage 
      }
    ]);
    setIsLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
          profile: profile || null,
          applications: applications || [],
          dsaProgress: dsaProgress || null,
          goals: goals || null,
          image: currentImage || null,
          mime_type: currentMimeType || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get a response.');
      }

      const data = await response.json();
      const reply = data.reply || "Sorry, I couldn't generate a response.";

      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);

      if (!isOpen) setHasUnread(true);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "⚠️ Could not connect to PlacementOS AI service. Ensure your API Keys are configured in `backend/.env` and your local server is running.",
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
      <div 
        className={`aichat-panel ${isOpen ? 'aichat-panel--open' : ''} ${isDragging ? 'dragging-active' : ''}`}
        onDragOver={handleDragOver}
      >
        {/* Header */}
        <div className="aichat-header">
          <div className="aichat-header-info">
            <div className="aichat-avatar-sm">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div>
              <span className="aichat-header-name">PlacementOS AI Coach</span>
              <span className="aichat-header-status">
                <span className="aichat-dot" />
                Active RAG Brain
              </span>
            </div>
          </div>
          <button className="aichat-close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drag Over Overlay */}
        {isDragging && (
          <div 
            className="aichat-drag-overlay" 
            onDragOver={handleDragOver} 
            onDragLeave={handleDragLeave} 
            onDrop={handleDrop}
          >
            <div className="aichat-drag-message">
              <span className="material-symbols-outlined drag-icon animate-bounce">cloud_upload</span>
              <p>Drop your image here to analyze</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="aichat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`aichat-bubble-row ${msg.role === 'user' ? 'aichat-bubble-row--user' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="aichat-bot-icon">
                  <span className="material-symbols-outlined">support_agent</span>
                </div>
              )}
              <div className="aichat-bubble-wrapper">
                <div className={`aichat-bubble ${msg.role === 'user' ? 'aichat-bubble--user' : 'aichat-bubble--bot'}`}>
                  {msg.image && (
                    <div className="chat-bubble-image-wrapper">
                      <img src={msg.image} alt="User upload" className="chat-bubble-image" />
                    </div>
                  )}
                  {msg.role === 'assistant' ? (
                    <div 
                      className="markdown-content" 
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }} 
                    />
                  ) : (
                    <span className="chat-plain-text">{msg.text}</span>
                  )}
                </div>
                
                {/* Assistant Controls: Text to Speech */}
                {msg.role === 'assistant' && (
                  <div className="bubble-actions">
                    <button 
                      className={`bubble-action-btn ${speakingMessageId === i ? 'speaking' : ''}`}
                      onClick={(e) => handleSpeak(msg.text, i, e)}
                      title={speakingMessageId === i ? "Stop speaking" : "Speak response"}
                    >
                      <span className="material-symbols-outlined">
                        {speakingMessageId === i ? 'volume_off' : 'volume_up'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="aichat-bubble-row">
              <div className="aichat-bot-icon">
                <span className="material-symbols-outlined">support_agent</span>
              </div>
              <div className="aichat-bubble aichat-bubble--bot aichat-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts (only on initial load) */}
        {messages.length === 1 && (
          <div className="aichat-suggestions">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button key={i} className="aichat-suggestion-chip" onClick={() => sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Attachment Image Preview bar */}
        {attachedImage && (
          <div className="attached-image-preview-container">
            <div className="attached-image-preview-card">
              <img src={attachedImage} alt="Attachment thumbnail" />
              <button className="remove-attachment-btn" onClick={() => setAttachedImage(null)} title="Remove attachment">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className={`aichat-input-row ${isListening ? 'listening-active' : ''}`}>
          {/* File attachment button */}
          <button 
            className="aichat-attach-btn" 
            onClick={() => imageInputRef.current?.click()} 
            title="Upload image for analysis"
            disabled={isLoading}
          >
            <span className="material-symbols-outlined">image</span>
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              ref={imageInputRef} 
              onChange={handleImageChange} 
            />
          </button>

          {/* Text Input / Voice Equalizer Wave */}
          {isListening ? (
            <div className="voice-wave-container" onClick={toggleListening} title="Click to stop and capture text">
              <div className="voice-wave-bars">
                <span className="voice-bar voice-bar-1"></span>
                <span className="voice-bar voice-bar-2"></span>
                <span className="voice-bar voice-bar-3"></span>
                <span className="voice-bar voice-bar-4"></span>
                <span className="voice-bar voice-bar-5"></span>
                <span className="voice-bar voice-bar-6"></span>
                <span className="voice-bar voice-bar-7"></span>
              </div>
              <span className="voice-wave-status">Dictating... Click to finish</span>
            </div>
          ) : (
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
          )}

          {/* Voice Speech Recognition Trigger */}
          <button 
            className={`aichat-voice-btn ${isListening ? 'active-pulse' : ''}`}
            onClick={toggleListening}
            title={isListening ? "Stop voice input" : "Voice message"}
            disabled={isLoading}
          >
            <span className="material-symbols-outlined">
              {isListening ? 'mic_off' : 'mic'}
            </span>
          </button>

          {/* Send Button */}
          <button
            className={`aichat-send-btn ${isLoading || (!input.trim() && !attachedImage) ? 'aichat-send-btn--disabled' : ''}`}
            onClick={() => sendMessage()}
            disabled={isLoading || (!input.trim() && !attachedImage)}
            aria-label="Send"
          >
            <span className="material-symbols-outlined">
              {isLoading ? 'hourglass_top' : 'arrow_upward'}
            </span>
          </button>
        </div>
      </div>

      {/* Floating Trigger FAB Button */}
      <button
        className={`aichat-fab ${isOpen ? 'aichat-fab--open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open AI Chat"
      >
        <span className="material-symbols-outlined aichat-fab-icon">
          {isOpen ? 'close' : 'chat'}
        </span>
        {hasUnread && !isOpen && <span className="aichat-unread-dot" />}
      </button>
    </>
  );
}
