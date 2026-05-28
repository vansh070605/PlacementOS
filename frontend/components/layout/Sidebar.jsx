import React, { useState, useRef, useEffect } from 'react';
import './Sidebar.css';
import { authService } from '../../services/firebase';

export default function Sidebar({ activeTab, setActiveTab, user, setShowAuthModal }) {
  const [showPopover, setShowPopover] = useState(false);
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
  ];

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon">P</div>
        <span className="logo-text">PlacementOS</span>
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
        <div className="sidebar-footer-actions">
          {user ? (
            <div className="user-profile-container" ref={popoverRef}>
              <button 
                className="user-profile-trigger" 
                onClick={() => setShowPopover(!showPopover)}
                aria-expanded={showPopover}
              >
                <div className="user-avatar">{user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U'}</div>
                <div className="user-info">
                  <span className="user-name">{user.displayName || 'Candidate'}</span>
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
            onClick={() => document.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'show-onboarding' }))}
            className="help-btn"
            title="Help / Tour"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>help</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
