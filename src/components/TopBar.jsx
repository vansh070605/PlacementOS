import React from 'react';

export default function TopBar() {
  return (
    <header className="w-full sticky top-0 z-40 flex justify-between items-center px-8 py-4 bg-[#ffffff08] border-b border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-full max-w-md focus-within:ring-2 focus-within:ring-indigo-500 rounded-full transition-all">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input className="w-full bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-full pl-12 pr-4 py-2 focus:ring-0 placeholder:text-slate-400/50 text-white outline-none" placeholder="Search roles, talent, or insights..." type="text"/>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex gap-4">
          <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-indigo-300 transition-colors">notifications</span>
          <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-indigo-300 transition-colors">dark_mode</span>
        </div>
        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="text-right">
            <p className="font-bold text-sm text-white">Vansh Agrawal</p>
            <p className="text-xs text-slate-400">Career Prep Active</p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[14px] shrink-0 font-sora border border-[#6366f1]/30"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            VA
          </div>
          <button className="text-sm font-bold text-slate-400 hover:text-indigo-300 transition-colors ml-2">Sign Out</button>
        </div>
      </div>
    </header>
  );
}
