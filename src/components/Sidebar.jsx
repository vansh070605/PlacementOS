import React from 'react';

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
      <div className="mb-10 px-2">
        <h1 className="font-sora text-2xl font-bold text-white">PlacementOS</h1>
        <p className="text-slate-400 text-sm mt-1">Career Dashboard</p>
      </div>
      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <div 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 cursor-pointer active:scale-95 ${
                isActive 
                  ? 'text-indigo-300 bg-indigo-500/20 border-l-4 border-indigo-400' 
                  : 'text-slate-400 hover:text-white hover:bg-[#ffffff08] border-l-4 border-transparent'
              }`}
            >
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </div>
          );
        })}
      </nav>
      <div className="mt-auto space-y-2 border-t border-white/10 pt-6">
        <div className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-[#ffffff08] cursor-pointer transition-all">
          <span className="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-[#ffffff08] cursor-pointer transition-all">
          <span className="material-symbols-outlined">help</span>
          <span>Support</span>
        </div>
      </div>
    </aside>
  );
}
