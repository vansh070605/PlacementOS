import React from 'react';
import './Sidebar.css';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard',    label: 'Dashboard',      icon: 'grid_view'       },
    { id: 'applications', label: 'Job Tracker',     icon: 'business_center' },
    { id: 'prep',         label: 'DSA Prep',        icon: 'code'            },
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
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="user-avatar">VA</div>
            <div className="user-info">
              <span className="user-name">Vansh Agrawal</span>
              <span className="user-role">Candidate Profile</span>
            </div>
          </div>
          <button 
            onClick={() => document.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'show-onboarding' }))}
            style={{ 
              background: 'transparent', border: 'none', cursor: 'pointer', 
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center' 
            }}
            title="Help / Tour"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>help</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
