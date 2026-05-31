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
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open Menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        {children}
      </div>

    </div>
  );
}
