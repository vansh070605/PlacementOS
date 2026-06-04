import React, { useState } from 'react';
import './AuthOverlay.css';
import { authService } from '../../services/firebase';

export default function AuthOverlay({ isOpen, onClose, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (isSignUp) {
      if (!fullName) {
        setError('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const user = await authService.signup(email, password, fullName);
        setSuccessMsg('Account created successfully!');
        setTimeout(() => {
          onLoginSuccess(user);
          onClose();
        }, 1000);
      } else {
        const user = await authService.login(email, password);
        setSuccessMsg('Signed in successfully!');
        setTimeout(() => {
          onLoginSuccess(user);
          onClose();
        }, 800);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-backdrop" onClick={onClose}></div>
      <div className="auth-modal-card">
        <button className="auth-close-btn" onClick={onClose} aria-label="Close auth modal">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="auth-header">
          <div className="auth-logo-icon">P</div>
          <h2>{isSignUp ? 'Create your Profile' : 'Welcome to PlacementOS'}</h2>
          <p className="auth-subtitle">
            {isSignUp 
              ? 'Join PlacementOS to track and audit your projects' 
              : 'Sign in to access your placement dashboard'}
          </p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error">
            <span className="material-symbols-outlined alert-icon">error</span>
            <div className="alert-content">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert auth-alert-success">
            <span className="material-symbols-outlined alert-icon">check_circle</span>
            <div className="alert-content">{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon">person</span>
                <input
                  type="text"
                  id="fullName"
                  placeholder="e.g. Aarav Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <span className="material-symbols-outlined input-icon">mail</span>
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <span className="material-symbols-outlined input-icon">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon">lock_reset</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner"></span>
            ) : (
              <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button type="button" className="auth-switch-btn" onClick={handleToggleMode} disabled={loading}>
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </p>
          <div className="auth-divider">
            <span>Or</span>
          </div>
          <button type="button" className="auth-guest-btn" onClick={onClose} disabled={loading}>
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
