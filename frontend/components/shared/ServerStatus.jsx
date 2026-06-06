import React, { useState, useEffect, useCallback } from 'react';
import { getBackendUrl } from '../../utils/config';
import './ServerStatus.css';

export default function ServerStatus({ compact = false }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'online' | 'offline'

  const checkStatus = useCallback(async () => {
    // Keep checking state visible if it was already offline or checking
    if (status !== 'online') {
      setStatus('checking');
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout for rapid offline detection

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/health`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'healthy') {
          setStatus('online');
          return;
        }
      }
      setStatus('offline');
    } catch (error) {
      clearTimeout(timeoutId);
      setStatus('offline');
    }
  }, [status]);

  useEffect(() => {
    // Initial check
    checkStatus();

    // Check periodically every 15 seconds
    const interval = setInterval(checkStatus, 15000);

    return () => clearInterval(interval);
  }, [checkStatus]);

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Server Online';
      case 'offline':
        return 'Server Offline';
      case 'checking':
      default:
        return 'Connecting...';
    }
  };

  const getTooltipText = () => {
    switch (status) {
      case 'online':
        return 'Backend is running and connected. Click to refresh.';
      case 'offline':
        return 'Cannot connect to backend server. Click to retry.';
      case 'checking':
      default:
        return 'Verifying connection to backend...';
    }
  };

  if (compact) {
    return (
      <button 
        className={`server-status-compact ${status}`}
        onClick={checkStatus}
        title={getTooltipText()}
        aria-label={`Server Status: ${getStatusText()}`}
      >
        <span className="status-dot animate-pulse-soft"></span>
      </button>
    );
  }

  return (
    <button 
      className={`server-status-container ${status}`}
      onClick={checkStatus}
      title={getTooltipText()}
    >
      <span className="status-dot"></span>
      <span className="status-text">{getStatusText()}</span>
      <span className="material-symbols-outlined refresh-icon">sync</span>
    </button>
  );
}
