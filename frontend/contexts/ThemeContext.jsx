import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const THEMES = {
  blue: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#eff6ff',
    darkPrimaryLight: 'rgba(37, 99, 235, 0.15)',
  },
  emerald: {
    primary: '#10b981',
    primaryHover: '#059669',
    primaryLight: '#ecfdf5',
    darkPrimaryLight: 'rgba(16, 185, 129, 0.15)',
  },
  purple: {
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryLight: '#f5f3ff',
    darkPrimaryLight: 'rgba(124, 58, 237, 0.15)',
  },
  orange: {
    primary: '#f97316',
    primaryHover: '#ea580c',
    primaryLight: '#fff7ed',
    darkPrimaryLight: 'rgba(249, 115, 22, 0.15)',
  }
};

const MODES = {
  light: {
    bgPrimary: '#f8fafc',
    bgSecondary: '#f1f5f9',
    surface: '#ffffff',
    textMain: '#0f172a',
    textMuted: '#64748b',
    border: '#f1f5f9',
    borderStrong: '#cbd5e1',
    cardBg: '#ffffff',
    successLight: '#ecfdf5',
    warningLight: '#fff7ed',
    dangerLight: '#fef2f2',
  },
  dark: {
    bgPrimary: '#0f172a',
    bgSecondary: '#1e293b',
    surface: '#1e293b',
    textMain: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#334155',
    borderStrong: '#475569',
    cardBg: '#1e293b',
    successLight: 'rgba(16, 185, 129, 0.15)',
    warningLight: 'rgba(249, 115, 22, 0.15)',
    dangerLight: 'rgba(239, 68, 68, 0.15)',
  }
};

const RADII = {
  sharp: { lg: '0px', md: '0px', sm: '0px', pill: '0px' },
  rounded: { lg: '24px', md: '16px', sm: '10px', pill: '9999px' },
  pill: { lg: '32px', md: '24px', sm: '16px', pill: '9999px' },
};

const FONTS = {
  inter: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  sora: "'Sora', sans-serif",
  jetbrains: "'JetBrains Mono', monospace",
};

const ANIMATIONS = {
  reduced: { fast: '0s', normal: '0s', slow: '0s', bounce: 'ease' },
  smooth: { fast: '0.15s', normal: '0.2s', slow: '0.3s', bounce: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  playful: { fast: '0.2s', normal: '0.4s', slow: '0.6s', bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
};

export const ThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('placementos_settings');
    const defaults = {
      color: 'blue',
      mode: 'light',
      radius: 'rounded',
      font: 'inter',
      animation: 'smooth',
      currency: 'INR',
      backendUrl: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
      aiTone: 'professional',
      aiTemperature: 0.7,
      showAnalytics: true,
      showJobPipeline: true,
      showDsaRoadmap: true,
      showVectorIndex: true
    };
    const isLocalHost = () => {
      const hostname = window.location.hostname;
      return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      );
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const resolved = { ...defaults, ...parsed };
        if (resolved.backendUrl && !isLocalHost()) {
          const url = resolved.backendUrl;
          const isUrlLocal = (
            url.includes('localhost') ||
            url.includes('127.0.0.1') ||
            url.includes('192.168.') ||
            url.includes('10.') ||
            url.includes('172.')
          );
          if (isUrlLocal) {
            resolved.backendUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
          }
        }
        return resolved;
      } catch (e) {
        console.error(e);
      }
    }
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem('placementos_settings', JSON.stringify(settings));
    
    const root = document.documentElement;
    
    // Apply Color
    const color = THEMES[settings.color];
    if (color) {
      root.style.setProperty('--primary', color.primary);
      root.style.setProperty('--primary-hover', color.primaryHover);
      
      const primaryLight = settings.mode === 'dark' ? color.darkPrimaryLight : color.primaryLight;
      root.style.setProperty('--primary-light', primaryLight);
    }
    
    // Apply Mode
    const mode = MODES[settings.mode];
    if (mode) {
      root.style.setProperty('--bg-primary', mode.bgPrimary);
      root.style.setProperty('--bg-secondary', mode.bgSecondary);
      root.style.setProperty('--surface', mode.surface);
      root.style.setProperty('--text-main', mode.textMain);
      root.style.setProperty('--text-muted', mode.textMuted);
      root.style.setProperty('--border', mode.border);
      root.style.setProperty('--border-strong', mode.borderStrong);
      root.style.setProperty('--card-bg', mode.cardBg);
      
      if (mode.successLight) {
        root.style.setProperty('--success-light', mode.successLight);
      }
      if (mode.warningLight) {
        root.style.setProperty('--warning-light', mode.warningLight);
      }
      if (mode.dangerLight) {
        root.style.setProperty('--danger-light', mode.dangerLight);
      }
      
      // Toggle a class on body for specific dark-mode overrides if needed
      if (settings.mode === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
    
    // Apply Radius
    const radius = RADII[settings.radius];
    if (radius) {
      root.style.setProperty('--radius-lg', radius.lg);
      root.style.setProperty('--radius-md', radius.md);
      root.style.setProperty('--radius-sm', radius.sm);
      root.style.setProperty('--radius-pill', radius.pill);
    }
    
    // Apply Font
    const font = FONTS[settings.font];
    if (font) {
      root.style.setProperty('--font-main', font);
      document.body.style.fontFamily = font;
    }
    
    // Apply Animations
    const anim = ANIMATIONS[settings.animation];
    if (anim) {
      root.style.setProperty('--transition-fast', anim.fast);
      root.style.setProperty('--transition-normal', anim.normal);
      root.style.setProperty('--transition-slow', anim.slow);
      root.style.setProperty('--bounce-easing', anim.bounce);
    }
    
  }, [settings]);

  const updateSettings = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, THEMES, MODES, RADII, FONTS, ANIMATIONS }}>
      {children}
    </ThemeContext.Provider>
  );
};
