import React from 'react';

// Spacing System (TopBar):
// px-8 py-5: 32px horizontal, 20px vertical for a balanced, airy header.
// gap-6 (24px): For separating distinct groups (Search/Actions vs Profile).
// gap-4 (16px): For spacing within a closely related group.

export default function TopBar() {
  return (
    <header className="w-full sticky top-0 z-40 flex justify-between items-center px-8 py-5 bg-[#ffffff08] border-b border-[#ffffff15] backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      
      {/* Group 1: Search + Notifications + Dark Mode */}
      <div className="flex items-center gap-6 flex-1">
        
        {/* Search */}
        <div className="relative w-full max-w-md group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors text-[20px]">search</span>
          <input 
            className="w-full bg-[#ffffff05] border border-[#ffffff15] hover:border-[#ffffff25] backdrop-blur-md rounded-xl pl-12 pr-4 py-2.5 focus:border-indigo-500/50 focus:bg-[#ffffff0a] focus:ring-0 placeholder:text-slate-500 text-sm text-white outline-none transition-all shadow-inner" 
            placeholder="Search roles, talent, or insights..." 
            type="text"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 border-l border-[#ffffff15] pl-6">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-[#ffffff08] transition-all">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-[#ffffff08] transition-all">
            <span className="material-symbols-outlined text-[22px]">dark_mode</span>
          </button>
        </div>
      </div>

      {/* Group 2: Profile Info & Sign Out */}
      <div className="flex items-center gap-4 pl-6">
        <div className="text-right hidden md:block">
          <p className="font-sora font-bold text-sm text-white leading-tight">Vansh Agrawal</p>
          <p className="text-[10px] font-mono text-indigo-400/80 uppercase tracking-widest mt-1 font-semibold">Career Prep Active</p>
        </div>
        
        <div className="relative cursor-pointer hover:scale-105 transition-transform">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)' }}>
            VA
          </div>
          {/* Status Indicator */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-teal-400 border-2 border-[#050508] rounded-full"></div>
        </div>

        <button className="ml-2 w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Sign Out">
          <span className="material-symbols-outlined text-[22px]">logout</span>
        </button>
      </div>

    </header>
  );
}
