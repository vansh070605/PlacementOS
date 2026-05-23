import React from 'react';
import TopBar from './TopBar';

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
    <main className="flex-1 flex flex-col">
      <TopBar />

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Career Pulse Hero */}
        <section className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 rounded-xl relative overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 z-10">
              <h2 className="font-sora text-3xl font-bold text-white">Career Pulse</h2>
              <p className="font-inter text-lg text-slate-400">
                Your application ecosystem is vibrating with potential. {activeLeads} active leads identified in your pipeline.
              </p>
              <div className="flex gap-4">
                <div className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-4 rounded-lg flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-indigo-400" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-300">{totalApps}</p>
                    <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Applications</p>
                  </div>
                </div>
                <div className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-4 rounded-lg flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-400" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">{activeLeads}</p>
                    <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Active Leads</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Funnel Chart */}
            <div className="relative flex justify-center items-center">
              <svg className="w-72 h-72 drop-shadow-2xl" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="transparent" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="10"></circle>
                <circle className="transition-all duration-1000" cx="50" cy="50" fill="transparent" r="45" stroke="#818cf8" strokeDasharray="282.7" strokeDashoffset={282.7 - (funnelPct/100)*282.7} strokeLinecap="round" strokeWidth="10" transform="rotate(-90 50 50)" style={{ filter: 'drop-shadow(0 0 12px rgba(129,140,248,0.5))' }}></circle>
                <circle className="transition-all duration-1000" cx="50" cy="50" fill="transparent" r="34" stroke="#c084fc" strokeDasharray="213.6" strokeDashoffset={213.6 - ((offered/Math.max(totalApps,1))*100/100)*213.6} strokeLinecap="round" strokeWidth="8" transform="rotate(-90 50 50)" style={{ filter: 'drop-shadow(0 0 8px rgba(192,132,252,0.5))' }}></circle>
              </svg>
              <div className="absolute text-center flex flex-col items-center">
                <span className="block font-sora text-4xl font-bold text-white leading-none">{funnelPct}%</span>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-2 font-semibold">PIPELINE</span>
              </div>
              {/* Floating Labels */}
              <div className="absolute -top-4 -right-4 bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] px-4 py-2 rounded-full text-xs font-bold animate-bounce text-indigo-300">
                Active Funnel
              </div>
            </div>
          </div>
          {/* Background Accent */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        </section>

        {/* Bento Grid Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Weekly Targets Card */}
          <div className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 rounded-xl flex flex-col justify-between hover:scale-[1.02] transition-all duration-300">
            <div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-sora text-xl text-white font-bold">Weekly Targets</h3>
                <span className="material-symbols-outlined text-indigo-400">target</span>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-white">Applications</span>
                    <span className="text-sm text-indigo-300 font-mono">{totalApps}/{goals.weeklyApplications}</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700" style={{ width: `${Math.min((totalApps/Math.max(goals.weeklyApplications, 1))*100, 100)}%`, boxShadow: '0 0 10px rgba(99,102,241,0.5)' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-white">DSA Questions</span>
                    <span className="text-sm text-purple-400 font-mono">{dsaSolved}/{goals.weeklyDSAQuestions}</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700" style={{ width: `${Math.min((dsaSolved/Math.max(goals.weeklyDSAQuestions, 1))*100, 100)}%`, boxShadow: '0 0 10px rgba(168,85,247,0.5)' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">RESET IN 3 DAYS</span>
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 rounded-xl lg:col-span-1 hover:scale-[1.02] transition-all duration-300 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-sora text-xl text-white font-bold">Upcoming</h3>
              <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer" onClick={() => setActiveTab('applications')}>VIEW ALL</button>
            </div>
            <div className="space-y-4 flex-1">
              {upcomingApps.map((app) => {
                const dateObj = new Date(app.date);
                const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
                const day = dateObj.getDate();
                return (
                  <div key={app.id} className="flex items-center gap-4 py-3 border-b border-white/10 last:border-none">
                    <div className="w-12 h-12 rounded-xl bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col items-center justify-center text-indigo-400 shrink-0">
                      <span className="text-[10px] font-bold leading-none mt-1">{month}</span>
                      <span className="text-lg font-bold leading-none mt-1">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate">{app.title}</p>
                      <p className="text-xs text-slate-400 truncate">{app.company} • Pending Time</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-400/40 text-[18px]">arrow_forward_ios</span>
                  </div>
                );
              })}
              {upcomingApps.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
                  <p className="text-sm font-medium">No upcoming interviews</p>
                </div>
              )}
            </div>
          </div>

          {/* Market Insights */}
          <div className="rounded-xl p-8 relative overflow-hidden flex flex-col justify-between group cursor-pointer lg:col-span-1 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)' }}>
            <div className="absolute inset-0 bg-black/20 transition-opacity group-hover:opacity-0 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
              </div>
              <h3 className="font-sora text-xl text-white mb-2 font-bold">Market Insights</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Tech salaries in your sector have surged by 15% this quarter. See how your applications compare.
              </p>
            </div>
            <button className="relative z-10 w-full bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-white/90 transition-colors mt-8 cursor-pointer shadow-lg shadow-white/10">
              View Analysis
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
