import React from 'react';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children, activeTab, setActiveTab }) {
  return (
    <div className="app-container">
      {/* Persistent Left Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Pane */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
