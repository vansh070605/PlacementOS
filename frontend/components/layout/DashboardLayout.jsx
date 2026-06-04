import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children, activeTab, setActiveTab, user, setShowAuthModal }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Persistent Left Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false); // Auto-close on mobile after selecting
        }} 
        user={user} 
        setShowAuthModal={setShowAuthModal}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      {/* Main Content Pane */}
      <div className="main-content">
        <header className="dashboard-header-mobile">
          <div className="mobile-header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open Menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            
            <div className="mobile-logo-container">
              <img src="/favicon.png" alt="PlacementOS" className="logo-icon" />
              <span className="logo-text">PlacementOS</span>
            </div>
          </div>
        </header>

        <div key={activeTab} className="animate-fade-in" style={{ height: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>

    </div>
  );
}
