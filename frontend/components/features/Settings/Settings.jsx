import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import './Settings.css';

export default function Settings() {
  const { settings, updateSettings, THEMES, MODES, RADII, FONTS, ANIMATIONS } = useTheme();

  return (
    <div className="settings-container animate-fade-in">
      <div className="settings-header">
        <h2 className="text-hero-title">Site Settings & Aesthetics</h2>
        <p className="text-hero-desc">
          Customize your experience. Choose your preferred colors, layout modes, typography, and animation speeds. Changes are saved locally and applied instantly across the entire dashboard.
        </p>
      </div>

      <div className="settings-grid bento-grid">
        
        {/* App Mode (Light / Dark) */}
        <div className="settings-card bento-card span-6">
          <div className="settings-card-header">
            <span className="material-symbols-outlined">light_mode</span>
            <h3>Appearance Mode</h3>
          </div>
          <div className="settings-options-row">
            {Object.keys(MODES).map((modeKey) => (
              <button
                key={modeKey}
                className={`setting-btn ${settings.mode === modeKey ? 'active' : ''}`}
                onClick={() => updateSettings({ mode: modeKey })}
              >
                <span className="material-symbols-outlined">
                  {modeKey === 'light' ? 'light_mode' : 'dark_mode'}
                </span>
                {modeKey.charAt(0).toUpperCase() + modeKey.slice(1)} Mode
              </button>
            ))}
          </div>
        </div>

        {/* Primary Color Theme */}
        <div className="settings-card bento-card span-6">
          <div className="settings-card-header">
            <span className="material-symbols-outlined">palette</span>
            <h3>Primary Theme Color</h3>
          </div>
          <div className="settings-options-row">
            {Object.keys(THEMES).map((colorKey) => {
              const theme = THEMES[colorKey];
              return (
                <button
                  key={colorKey}
                  className={`setting-color-btn ${settings.color === colorKey ? 'active' : ''}`}
                  style={{ '--btn-color': theme.primary }}
                  onClick={() => updateSettings({ color: colorKey })}
                  title={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                >
                  <div className="color-swatch" style={{ background: theme.primary }}></div>
                  <span>{colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Aesthetics (Border Radius) */}
        <div className="settings-card bento-card span-4">
          <div className="settings-card-header">
            <span className="material-symbols-outlined">rounded_corner</span>
            <h3>Border Radius</h3>
          </div>
          <div className="settings-options-column">
            {Object.keys(RADII).map((radiusKey) => (
              <button
                key={radiusKey}
                className={`setting-btn layout-vertical ${settings.radius === radiusKey ? 'active' : ''}`}
                onClick={() => updateSettings({ radius: radiusKey })}
                style={{ borderRadius: RADII[radiusKey].sm }}
              >
                <span style={{ fontWeight: 600 }}>{radiusKey.charAt(0).toUpperCase() + radiusKey.slice(1)}</span>
                <span className="setting-subtext">Base: {RADII[radiusKey].md}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Typography (Font Family) */}
        <div className="settings-card bento-card span-4">
          <div className="settings-card-header">
            <span className="material-symbols-outlined">match_case</span>
            <h3>Typography</h3>
          </div>
          <div className="settings-options-column">
            {Object.keys(FONTS).map((fontKey) => (
              <button
                key={fontKey}
                className={`setting-btn layout-vertical ${settings.font === fontKey ? 'active' : ''}`}
                onClick={() => updateSettings({ font: fontKey })}
                style={{ fontFamily: FONTS[fontKey] }}
              >
                <span style={{ fontWeight: 600, fontSize: '1rem' }}>{fontKey.charAt(0).toUpperCase() + fontKey.slice(1)}</span>
                <span className="setting-subtext">The quick brown fox</span>
              </button>
            ))}
          </div>
        </div>

        {/* Animations & Transitions */}
        <div className="settings-card bento-card span-4">
          <div className="settings-card-header">
            <span className="material-symbols-outlined">animation</span>
            <h3>Animations & Speed</h3>
          </div>
          <div className="settings-options-column">
            {Object.keys(ANIMATIONS).map((animKey) => {
              const icons = { reduced: 'motion_photos_paused', smooth: 'slow_motion_video', playful: 'animation' };
              return (
                <button
                  key={animKey}
                  className={`setting-btn layout-vertical ${settings.animation === animKey ? 'active' : ''}`}
                  onClick={() => updateSettings({ animation: animKey })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined">{icons[animKey]}</span>
                    <span style={{ fontWeight: 600 }}>{animKey.charAt(0).toUpperCase() + animKey.slice(1)}</span>
                  </div>
                  <span className="setting-subtext">
                    {animKey === 'reduced' ? 'Instant interactions' : animKey === 'smooth' ? 'Balanced, standard UI' : 'Bouncy & elastic'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
