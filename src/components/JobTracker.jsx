import React, { useState } from 'react';
import TopBar from './TopBar';

export default function JobTracker({ applications, setApplications }) {
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'list'

  const columns = [
    { id: 'applied', label: 'Applied', color: 'bg-blue-400', shadow: 'rgba(96,165,250,0.8)', icon: 'cloud', gradient: 'from-blue-500 to-indigo-600' },
    { id: 'interviewing', label: 'Interviewing', color: 'bg-indigo-400', shadow: 'rgba(129,140,248,0.8)', icon: 'rocket_launch', gradient: 'from-indigo-500 to-purple-600' },
    { id: 'offered', label: 'Offered', color: 'bg-emerald-400', shadow: 'rgba(52,211,153,0.8)', icon: 'stars', gradient: 'from-amber-400 to-orange-500' },
    { id: 'rejected', label: 'Rejected', color: 'bg-red-500', shadow: 'rgba(239,68,68,0.8)', icon: 'block', gradient: 'from-slate-400 to-slate-500' }
  ];

  // Helper to change status (mock functionality)
  const handleMove = (appId, newStatus) => {
    setApplications(applications.map(app => 
      app.id === appId ? { ...app, status: newStatus } : app
    ));
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <TopBar />

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-x-auto p-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="font-sora text-3xl font-bold text-white mb-2">Job Tracker</h2>
            <p className="font-inter text-lg text-slate-400">Manage your career pipeline with precision.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-md p-1 rounded-lg flex shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
              <button 
                onClick={() => setViewMode('board')}
                className={`px-4 py-2 rounded-md font-bold transition-all ${viewMode === 'board' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                Board
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md font-bold transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                List
              </button>
            </div>
          </div>
        </div>

        {/* Columns */}
        <div className="flex gap-8 h-[calc(100vh-280px)] min-w-max pb-4">
          {columns.map(col => {
            const colApps = applications.filter(a => a.status === col.id);
            return (
              <div key={col.id} className="w-80 flex flex-col gap-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${col.color}`} style={{ boxShadow: `0 0 8px ${col.shadow}` }}></span>
                    <h3 className="font-sora text-[20px] font-bold text-white">{col.label}</h3>
                    <span className="text-xs font-mono font-bold bg-white/10 px-2 py-0.5 rounded-full text-slate-300">{colApps.length}</span>
                  </div>
                  <button className="material-symbols-outlined text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer">add</button>
                </div>
                
                <div className={`flex-1 space-y-4 overflow-y-auto pr-2 ${col.id === 'rejected' ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}>
                  {colApps.map(app => (
                    <div key={app.id} className={`bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-6 rounded-xl cursor-pointer hover:border-white/30 transition-all ${col.id === 'rejected' ? 'grayscale hover:grayscale-0' : ''}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${col.gradient} flex items-center justify-center text-white shadow-lg`}>
                          <span className="material-symbols-outlined text-[28px]">{col.icon}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-white/10 text-white px-2 py-1 rounded">
                          {app.date === new Date().toISOString().split('T')[0] ? 'TODAY' : app.date}
                        </span>
                      </div>
                      <h4 className="font-sora text-lg font-bold text-white mb-1">{app.title}</h4>
                      <p className="text-sm text-slate-400 mb-4">{app.company} • Remote</p>
                      
                      <div className="flex gap-2">
                        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Engineering</span>
                        {col.id === 'offered' && (
                          <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Offer</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {colApps.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/10 rounded-xl">
                      <span className="text-sm text-slate-500 font-medium">Empty</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
