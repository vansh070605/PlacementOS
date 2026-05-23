import React from 'react';
import TopBar from './TopBar';

// Spacing System (Dashboard):
// Container Padding: px-8 py-8 (32px all around) for outer page constraints. max-w-7xl ensures a clean column.
// Major Section Gap: space-y-8 (32px) between Hero block and Bento Grid.
// Bento Grid Gap: gap-6 (24px) between cards.
// Card Inner Padding: p-8 (32px) for large cards (Hero, Weekly Targets, Upcoming, Market Insights) to ensure identical inner padding.
// Inner Element Gaps: gap-6 (24px) for major inner segments, gap-4 (16px) for tight groupings.

export default function Dashboard({ applications, dsaProgress, goals, setGoals, setActiveTab }) {
  const totalApps = applications.length;
  const interviewing = applications.filter(a => a.status === 'interviewing').length;
  const offered = applications.filter(a => a.status === 'offered').length;
  const activeLeads = interviewing + offered;
  const dsaSolved = dsaProgress.questions.filter(q => q.status === 'Solved').length;
  
  const funnelPct = totalApps > 0 ? Math.round((activeLeads / totalApps) * 100) : 0;
  
  const upcomingApps = [...applications]
    .filter(a => a.status === 'interviewing')
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  return (
    <main className="flex-1 flex flex-col h-screen overflow-y-auto">
      <TopBar />

      <div className="px-8 py-8 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* Career Pulse Hero */}
        <section className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 rounded-[24px] relative overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            
            <div className="space-y-8">
              <div className="space-y-3">
                <h2 className="font-sora text-3xl font-bold text-white tracking-tight">Career Pulse</h2>
                <p className="font-inter text-base text-slate-400 leading-relaxed max-w-md">
                  Your application ecosystem is vibrating with potential. <span className="text-white font-bold">{activeLeads}</span> active leads identified in your pipeline.
                </p>
              </div>
              
              <div className="flex gap-6">
                <div className="flex-1 bg-[#ffffff05] border border-[#ffffff10] backdrop-blur-md shadow-inner p-5 rounded-2xl flex items-center gap-5 transition-all hover:bg-[#ffffff0a]">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-indigo-400" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{totalApps}</p>
                    <p className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest font-bold mt-1">Total Apps</p>
                  </div>
                </div>
                
                <div className="flex-1 bg-[#ffffff05] border border-[#ffffff10] backdrop-blur-md shadow-inner p-5 rounded-2xl flex items-center gap-5 transition-all hover:bg-[#ffffff0a]">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-purple-400" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{activeLeads}</p>
                    <p className="text-[10px] font-mono text-purple-300 uppercase tracking-widest font-bold mt-1">Active Leads</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Funnel Chart */}
            <div className="relative flex justify-center items-center">
              <svg className="w-64 h-64 drop-shadow-2xl overflow-visible" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="transparent" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="10"></circle>
                <circle className="transition-all duration-1000" cx="50" cy="50" fill="transparent" r="45" stroke="#818cf8" strokeDasharray="282.7" strokeDashoffset={282.7 - (funnelPct/100)*282.7} strokeLinecap="round" strokeWidth="10" transform="rotate(-90 50 50)" style={{ filter: 'drop-shadow(0 0 12px rgba(129,140,248,0.5))' }}></circle>
                <circle className="transition-all duration-1000" cx="50" cy="50" fill="transparent" r="34" stroke="#c084fc" strokeDasharray="213.6" strokeDashoffset={213.6 - ((offered/Math.max(totalApps,1))*100/100)*213.6} strokeLinecap="round" strokeWidth="8" transform="rotate(-90 50 50)" style={{ filter: 'drop-shadow(0 0 8px rgba(192,132,252,0.5))' }}></circle>
              </svg>
              <div className="absolute text-center flex flex-col items-center">
                <span className="block font-sora text-4xl font-bold text-white leading-none">{funnelPct}%</span>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-2 font-bold">PIPELINE</span>
              </div>
              {/* Floating Labels */}
              <div className="absolute top-0 right-8 bg-[#ffffff0a] border border-[#ffffff15] backdrop-blur-xl shadow-lg px-4 py-2 rounded-full text-xs font-bold animate-float text-indigo-300">
                Active Funnel
              </div>
            </div>
            
          </div>
          {/* Background Accent */}
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        </section>

        {/* Bento Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Weekly Targets Card */}
          <div className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 rounded-[24px] flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
            <div>
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-sora text-xl text-white font-bold">Weekly Targets</h3>
                <span className="material-symbols-outlined text-indigo-400 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">target</span>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-sm font-bold text-slate-300">Applications</span>
                    <span className="text-sm text-indigo-300 font-mono font-bold">{totalApps} <span className="text-slate-500 text-xs">/ {goals.weeklyApplications}</span></span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700" style={{ width: `${Math.min((totalApps/Math.max(goals.weeklyApplications, 1))*100, 100)}%`, boxShadow: '0 0 10px rgba(99,102,241,0.5)' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-sm font-bold text-slate-300">DSA Questions</span>
                    <span className="text-sm text-purple-400 font-mono font-bold">{dsaSolved} <span className="text-slate-500 text-xs">/ {goals.weeklyDSAQuestions}</span></span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700" style={{ width: `${Math.min((dsaSolved/Math.max(goals.weeklyDSAQuestions, 1))*100, 100)}%`, boxShadow: '0 0 10px rgba(168,85,247,0.5)' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-[#ffffff10] text-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">RESET IN 3 DAYS</span>
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 rounded-[24px] flex flex-col hover:scale-[1.01] transition-transform duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-sora text-xl text-white font-bold">Upcoming</h3>
              <button 
                className="text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer uppercase tracking-widest bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors" 
                onClick={() => setActiveTab('applications')}
              >
                View All
              </button>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              {upcomingApps.map((app) => {
                const dateObj = new Date(app.date);
                const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
                const day = dateObj.getDate();
                return (
                  <div key={app.id} className="flex items-center gap-5 p-4 rounded-xl bg-[#ffffff05] border border-[#ffffff0a] hover:bg-[#ffffff0a] transition-colors cursor-pointer group">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center text-indigo-400 shrink-0">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest mt-1">{month}</span>
                      <span className="text-lg font-bold leading-none mt-0.5">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate">{app.title}</p>
                      <p className="text-xs text-slate-400 truncate mt-1">{app.company} • Pending</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-500 group-hover:text-indigo-400 transition-colors text-[20px]">arrow_forward_ios</span>
                  </div>
                );
              })}
              {upcomingApps.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
                  <span className="material-symbols-outlined text-4xl mb-3 opacity-30">event_busy</span>
                  <p className="text-sm font-medium">No upcoming interviews</p>
                </div>
              )}
            </div>
          </div>

          {/* Market Insights */}
          <div className="rounded-[24px] p-8 relative overflow-hidden flex flex-col justify-between group cursor-pointer shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:scale-[1.01] transition-transform duration-300"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)' }}>
            <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0 pointer-events-none"></div>
            <div className="relative z-10 border border-[#ffffff1a] absolute inset-0 rounded-[24px] pointer-events-none"></div>
            
            <div className="relative z-20">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-8 border border-white/20 shadow-inner">
                <span className="material-symbols-outlined text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
              </div>
              <h3 className="font-sora text-xl text-white mb-3 font-bold">Market Insights</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Tech salaries in your sector have surged by <span className="text-white font-bold">15%</span> this quarter. See how your applications compare.
              </p>
            </div>
            
            <button className="relative z-20 w-full bg-white text-indigo-900 font-bold py-3.5 rounded-xl hover:bg-slate-100 transition-colors mt-8 cursor-pointer shadow-[0_4px_15px_rgba(255,255,255,0.2)]">
              View Analysis
            </button>
          </div>
          
        </div>
      </div>
    </main>
  );
}
