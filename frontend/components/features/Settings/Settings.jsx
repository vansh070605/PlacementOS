import React, { useRef } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import './Settings.css';

export default function Settings() {
  const { settings, updateSettings, THEMES, MODES, RADII, FONTS, ANIMATIONS } = useTheme();
  const fileInputRef = useRef(null);

  // Export JSON backup of all workspace local storage state
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        pos_applications: localStorage.getItem('pos_applications'),
        pos_dsa_progress: localStorage.getItem('pos_dsa_progress'),
        pos_goals: localStorage.getItem('pos_goals'),
        placementos_settings: localStorage.getItem('placementos_settings'),
        pos_onboarding_v1: localStorage.getItem('pos_onboarding_v1'),
        pos_has_loaded_before: localStorage.getItem('pos_has_loaded_before'),
        pos_fallback_users: localStorage.getItem('pos_fallback_users')
      };

      // Include mock local users and current session profile if present
      const currentUser = localStorage.getItem('pos_fallback_current_user');
      if (currentUser) {
        backupData.pos_fallback_current_user = currentUser;
        try {
          const userObj = JSON.parse(currentUser);
          if (userObj && userObj.uid) {
            const profileKey = `pos_profile_${userObj.uid}`;
            backupData[profileKey] = localStorage.getItem(profileKey);
          }
        } catch (e) {
          console.error('Error bundling profile for backup:', e);
        }
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `placementos_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Failed to generate backup: ' + error.message);
    }
  };

  // Import JSON backup and write to local storage
  const handleImportBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Verify it contains required settings key
        if (!importedData.placementos_settings) {
          alert('Error: Invalid backup file. It must contain PlacementOS settings.');
          return;
        }

        // Restore all valid keys to localStorage
        Object.keys(importedData).forEach(key => {
          if (importedData[key] !== null && key !== 'version' && key !== 'timestamp') {
            localStorage.setItem(key, importedData[key]);
          }
        });

        alert('Workspace successfully restored! The page will now reload.');
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('Error: Failed to parse backup file. Please make sure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Wipe local storage clean to reset
  const handleFactoryReset = () => {
    if (window.confirm('WARNING: You are about to clear all your saved data, including job tracker columns, DSA checkpoints, resume history, and custom themes.\n\nAre you absolutely sure you want to perform a factory reset?')) {
      if (window.confirm('LAST WARNING: This will permanently wipe your local workspace. Press OK to clear all data.')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const triggerImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="settings-container animate-fade-in">
      <div className="settings-header">
        <h2 className="text-hero-title">Site Settings & Dashboard Controls</h2>
        <p className="text-hero-desc">
          Configure and fine-tune your platform experience. Customize aesthetics, toggle dashboard sections, set custom AI tones, check local backend endpoints, and handle workspace backups.
        </p>
      </div>

      <div className="settings-grid bento-grid">
        
        {/* App Mode (Light / Dark) */}
        <div className="settings-card bento-card span-6 animate-slide-up delay-100">
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
        <div className="settings-card bento-card span-6 animate-slide-up delay-200">
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
        <div className="settings-card bento-card span-4 animate-slide-up delay-300">
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
        <div className="settings-card bento-card span-4 animate-slide-up delay-400">
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
        <div className="settings-card bento-card span-4 animate-slide-up delay-500">
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

        {/* Preferred Currency */}
        <div className="settings-card bento-card span-6 animate-slide-up delay-600">
          <div className="settings-card-header">
            <span className="material-symbols-outlined">payments</span>
            <h3>Preferred Currency</h3>
          </div>
          <p className="setting-subtext" style={{ marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Choose the default currency denomination used for salary insights, job applications, and target ranges across the entire site.
          </p>
          <div className="settings-options-row">
            <button
              className={`setting-btn ${settings.currency === 'INR' ? 'active' : ''}`}
              onClick={() => updateSettings({ currency: 'INR' })}
              style={{ flex: 1 }}
            >
              <span className="material-symbols-outlined">currency_rupee</span>
              Indian Rupee (INR - ₹)
            </button>
            <button
              className={`setting-btn ${settings.currency === 'USD' ? 'active' : ''}`}
              onClick={() => updateSettings({ currency: 'USD' })}
              style={{ flex: 1 }}
            >
              <span className="material-symbols-outlined">attach_money</span>
              US Dollar (USD - $)
            </button>
          </div>
        </div>

        {/* AI & Backend Engine Configurations */}
        <div className="settings-card bento-card span-6 animate-slide-up delay-600">
          <div className="settings-card-header">
            <span className="material-symbols-outlined">settings_input_component</span>
            <h3>AI &amp; Backend Engine</h3>
          </div>

          <div className="setting-controls-group">

            {/* Backend URL */}
            <div className="ai-field-group">
              <div className="ai-field-label">
                <span className="material-symbols-outlined">dns</span>
                <span>Backend Server URL</span>
              </div>
              <input
                className="ai-url-input"
                type="text"
                value={settings.backendUrl || ''}
                onChange={(e) => updateSettings({ backendUrl: e.target.value })}
                placeholder="e.g. http://localhost:8000"
                spellCheck={false}
              />
            </div>

            {/* AI Tone - three clickable cards */}
            <div className="ai-field-group">
              <div className="ai-field-label">
                <span className="material-symbols-outlined">psychology</span>
                <span>AI Interviewer Tone</span>
              </div>
              <div className="ai-tone-grid">
                {[
                  { value: 'professional', icon: 'work',     title: 'Professional', sub: 'Analytical & precise'  },
                  { value: 'harsh',        icon: 'whatshot', title: 'Critical',     sub: 'Code reviewer roast'   },
                  { value: 'encouraging',  icon: 'favorite', title: 'Mentor',       sub: 'Constructive & kind'   },
                ].map(({ value, icon, title, sub }) => (
                  <button
                    key={value}
                    className={`ai-tone-card ${(settings.aiTone || 'professional') === value ? 'active' : ''}`}
                    onClick={() => updateSettings({ aiTone: value })}
                  >
                    <span className="material-symbols-outlined">{icon}</span>
                    <span className="ai-tone-title">{title}</span>
                    <span className="ai-tone-sub">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="ai-field-group">
              <div className="ai-field-label">
                <span className="material-symbols-outlined">thermostat</span>
                <span>Model Temperature</span>
                <span className="ai-temp-badge">{settings.aiTemperature ?? 0.7}</span>
              </div>
              <input
                type="range"
                min="0" max="1" step="0.1"
                value={settings.aiTemperature ?? 0.7}
                onChange={(e) => updateSettings({ aiTemperature: parseFloat(e.target.value) })}
                className="setting-slider-range"
              />
              <div className="ai-temp-labels">
                <span>Structured</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>

          </div>
        </div>

        {/* Dashboard Bento Widget Visibility Toggles */}
        <div className="settings-card bento-card span-6 animate-slide-up delay-700">
          <div className="settings-card-header">
            <span className="material-symbols-outlined">dashboard_customize</span>
            <h3>Dashboard Widgets</h3>
          </div>
          <p className="setting-subtext" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
            Choose which bento modules appear on your home Dashboard cockpit. Hidden modules will not clear their local databases.
          </p>
          <div className="toggles-grid">
            <button 
              className={`toggle-option-btn ${settings.showAnalytics ? 'active' : ''}`}
              onClick={() => updateSettings({ showAnalytics: !settings.showAnalytics })}
            >
              <span className="material-symbols-outlined">{settings.showAnalytics ? 'visibility' : 'visibility_off'}</span>
              <div className="toggle-btn-labels">
                <span className="toggle-btn-title">Resume Analytics</span>
                <span className="setting-subtext">Tech stack & resume match cockpit</span>
              </div>
            </button>
            
            <button 
              className={`toggle-option-btn ${settings.showJobPipeline ? 'active' : ''}`}
              onClick={() => updateSettings({ showJobPipeline: !settings.showJobPipeline })}
            >
              <span className="material-symbols-outlined">{settings.showJobPipeline ? 'visibility' : 'visibility_off'}</span>
              <div className="toggle-btn-labels">
                <span className="toggle-btn-title">Job Pipeline Funnel</span>
                <span className="setting-subtext">Kanban board metrics and conversions</span>
              </div>
            </button>

            <button 
              className={`toggle-option-btn ${settings.showDsaRoadmap ? 'active' : ''}`}
              onClick={() => updateSettings({ showDsaRoadmap: !settings.showDsaRoadmap })}
            >
              <span className="material-symbols-outlined">{settings.showDsaRoadmap ? 'visibility' : 'visibility_off'}</span>
              <div className="toggle-btn-labels">
                <span className="toggle-btn-title">LeetCode & DSA Hub</span>
                <span className="setting-subtext">DSA roadmap syllabus checklist progress</span>
              </div>
            </button>

            <button 
              className={`toggle-option-btn ${settings.showVectorIndex ? 'active' : ''}`}
              onClick={() => updateSettings({ showVectorIndex: !settings.showVectorIndex })}
            >
              <span className="material-symbols-outlined">{settings.showVectorIndex ? 'visibility' : 'visibility_off'}</span>
              <div className="toggle-btn-labels">
                <span className="toggle-btn-title">Vector Portfolio Index</span>
                <span className="setting-subtext">ChromaDB embedding index sync status</span>
              </div>
            </button>
          </div>
        </div>

        {/* Workspace Backups & Safety */}
        <div className="settings-card bento-card span-6 animate-slide-up delay-700">
          <div className="settings-card-header">
            <span className="material-symbols-outlined">shield</span>
            <h3>Workspace Backups & Reset</h3>
          </div>
          <p className="setting-subtext" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            Export your entire state (job pipeline, DSA progress, themes, and profile) to a backup JSON file, or restore a previous session.
          </p>
          
          <div className="backup-actions-grid">
            <button className="setting-action-btn primary" onClick={handleExportBackup}>
              <span className="material-symbols-outlined">download</span>
              Export Backup File
            </button>
            
            <button className="setting-action-btn secondary" onClick={triggerImportClick}>
              <span className="material-symbols-outlined">upload_file</span>
              Import Backup File
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportBackup} 
              style={{ display: 'none' }} 
              accept=".json"
            />
          </div>

          <div className="danger-zone-box">
            <div className="danger-text-group">
              <span className="danger-title">Danger Zone</span>
              <span className="setting-subtext">Irreversibly delete all local storage caches to restart fresh.</span>
            </div>
            <button className="setting-action-btn danger" onClick={handleFactoryReset}>
              <span className="material-symbols-outlined">delete_forever</span>
              Reset Workspace
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

