import React from 'react';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children, activeTab, setActiveTab, user, setShowAuthModal }) {
  return (
    <div className="app-container">
      {/* Persistent Left Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        setShowAuthModal={setShowAuthModal} 
      />
      
      {/* Main Content Pane */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
