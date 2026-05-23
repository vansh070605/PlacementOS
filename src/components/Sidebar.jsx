import React from 'react';

// Spacing System (Sidebar):
// px-6 py-8: 24px horizontal, 32px vertical for general padding.
// mb-10 (40px): Brand header separation from nav.
// space-y-3 (12px): Gap between navigation items.
// px-4 py-3: 16px horizontal, 12px vertical for interactive hitboxes.
// gap-4 (16px): Space between icon and label inside nav items.

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',     icon: 'dashboard' },
  { id: 'applications', label: 'Job Tracker',   icon: 'work' },
  { id: 'resumes',      label: 'Resume Mgr',    icon: 'description' },
  { id: 'prep',         label: 'DSA Tracker',   icon: 'code' },
  { id: 'analyzer',     label: 'JD Analyzer',   icon: 'manage_search' },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="h-screen w-72 sticky left-0 top-0 hidden lg:flex flex-col py-8 px-6 bg-[#ffffff08] border-r border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
      
      {/* Brand Header */}
      <div className="mb-10 px-2 flex flex-col gap-1">
        <h1 className="font-sora text-2xl font-bold text-white tracking-tight">PlacementOS</h1>
        <p className="text-indigo-400/80 font-mono text-[10px] uppercase tracking-widest font-bold">Career Dashboard</p>
      </div>
      
      {/* Primary Navigation */}
      <nav className="flex-1 space-y-3">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <div 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                isActive 
                  ? 'text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-[#ffffff08] border border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
            </div>
          );
        })}
      </nav>
      
      {/* Secondary Actions */}
      <div className="mt-auto pt-6 space-y-3 border-t border-white/10">
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-[#ffffff08] cursor-pointer transition-all border border-transparent hover:border-[#ffffff10]">
          <span className="material-symbols-outlined text-[22px]">settings</span>
          <span className="font-medium text-sm">Settings</span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-[#ffffff08] cursor-pointer transition-all border border-transparent hover:border-[#ffffff10]">
          <span className="material-symbols-outlined text-[22px]">help</span>
          <span className="font-medium text-sm">Support</span>
        </div>
      </div>
      
    </aside>
  );
}
