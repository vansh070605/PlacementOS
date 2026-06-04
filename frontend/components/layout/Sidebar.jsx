import React, { useState, useRef, useEffect } from 'react';
import MobileViewButton from '../shared/MobileViewButton';
import './Sidebar.css';
import { authService, dbService } from '../../services/firebase';

export default function Sidebar({ activeTab, setActiveTab, user, setShowAuthModal, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const [showPopover, setShowPopover] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch up-to-date user profile name and avatar
  useEffect(() => {
    if (user?.uid) {
      dbService.getUserProfile(user.uid)
        .then((profile) => {
          setAvatarUrl(profile?.avatarUrl || '');
          if (profile?.fullName) {
            setDisplayName(profile.fullName);
          } else {
            setDisplayName(user.displayName || 'Candidate');
          }
        })
        .catch(() => {
          setDisplayName(user.displayName || 'Candidate');
          setAvatarUrl('');
        });
    } else {
      setDisplayName('');
      setAvatarUrl('');
    }
  }, [user]);

  // Listen to profile updates from the Profile screen
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      if (e.detail?.fullName) {
        setDisplayName(e.detail.fullName);
      }
      if (e.detail?.avatarUrl !== undefined) {
        setAvatarUrl(e.detail.avatarUrl || '');
      }
    };
    document.addEventListener('pos:profile-updated', handleProfileUpdate);
    return () => document.removeEventListener('pos:profile-updated', handleProfileUpdate);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setShowPopover(false);
    if (activeTab === 'profile') {
      setActiveTab('dashboard');
    }
  };

  const navItems = [
    { id: 'dashboard',    label: 'Dashboard',      icon: 'grid_view'       },
    { id: 'applications', label: 'Job Tracker',     icon: 'business_center' },
    { id: 'prep',         label: 'DSA Prep',        icon: 'code'            },
    { id: 'auditor',      label: 'Project Auditor', icon: 'terminal'        },
    { id: 'analyzer',     label: 'JD Analyzer',     icon: 'manage_search'   },
    { id: 'compass',      label: 'Career Compass',  icon: 'explore'         },
    { id: 'salary',       label: 'Salary Intel',    icon: 'payments'        },
    { id: 'cover-letter', label: 'Cover Letter',    icon: 'draw'            },
    { id: 'ats-scorer',   label: 'ATS Scorer',      icon: 'radar'           },
    { id: 'mock-interview', label: 'Mock Interview', icon: 'record_voice_over' },
    { id: 'settings',     label: 'Settings',        icon: 'settings'        },
  ];

  return (
    <>
      {/* Overlay to dim background when mobile menu is open */}
      <div 
        className={`mobile-sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/favicon.png" alt="PlacementOS" className="logo-icon" style={{ background: 'transparent', padding: 0, objectFit: 'contain' }} />
            <span className="logo-text">PlacementOS</span>
          </div>
          
          <button 
            className="mobile-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close Menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav>
        <ul className="nav-links">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <MobileViewButton />
        <div className="sidebar-footer-actions">
          {user ? (
            <div className="user-profile-container" ref={popoverRef}>
              <button 
                className="user-profile-trigger" 
                onClick={() => setShowPopover(!showPopover)}
                aria-expanded={showPopover}
              >
                <div className="user-avatar" style={{ overflow: 'hidden' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    displayName ? displayName.substring(0, 2).toUpperCase() : 'U'
                  )}
                </div>
                <div className="user-info">
                  <span className="user-name">{displayName || 'Candidate'}</span>
                  <span className="user-role">View Profile</span>
                </div>
              </button>
              
              {showPopover && (
                <div className="user-popover">
                  <button className="popover-item" onClick={() => { setActiveTab('profile'); setShowPopover(false); }}>
                    <span className="material-symbols-outlined">person</span> My Profile
                  </button>
                  <button className="popover-item logout-btn" onClick={handleLogout}>
                    <span className="material-symbols-outlined">logout</span> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
             <button className="login-sidebar-btn" onClick={() => setShowAuthModal(true)}>
               <span className="material-symbols-outlined">login</span>
               Sign In
             </button>
          )}

          <button 
            onClick={() => {
              document.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'show-onboarding' }));
              if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
            }}
            className="help-btn"
            title="Help / Tour"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>help</span>
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
