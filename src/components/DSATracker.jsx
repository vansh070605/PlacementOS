import React from 'react';
import TopBar from './TopBar';

export default function DSATracker({ dsaProgress, setDsaProgress }) {
  const dsaSolved = dsaProgress.questions.filter(q => q.status === 'Solved').length;
  const dsaTotal = dsaProgress.questions.length;
  const solveRate = dsaTotal > 0 ? Math.round((dsaSolved / dsaTotal) * 100) : 0;
  
  const topicsCompleted = Object.values(dsaProgress.topics).filter(Boolean).length;
  const totalTopics = Object.keys(dsaProgress.topics).length;
  const topicProgress = totalTopics > 0 ? Math.round((topicsCompleted / totalTopics) * 100) : 0;

  const toggleTopic = (topic) => {
    setDsaProgress({
      ...dsaProgress,
      topics: {
        ...dsaProgress.topics,
        [topic]: !dsaProgress.topics[topic]
      }
    });
  };

  const getDifficultyBadge = (diff) => {
    if (diff === 'Easy') return <span className="px-3 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full text-[12px] font-bold">Easy</span>;
    if (diff === 'Medium') return <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[12px] font-bold">Medium</span>;
    return <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[12px] font-bold">Hard</span>;
  };

  return (
    <main className="flex-1 flex flex-col min-w-0">
      <TopBar />

      <div className="flex-1 p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Top Section: Stats & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Large Solve Rate Arc */}
          <section className="lg:col-span-4 bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[120px] text-white">analytics</span>
            </div>
            
            <h2 className="text-xs font-mono text-slate-400 mb-6 uppercase tracking-widest font-bold">Global Solve Rate</h2>
            
            <div className="relative flex items-center justify-center">
              <svg className="w-64 h-64 -rotate-90">
                <circle className="text-white/5" cx="128" cy="128" fill="transparent" r="120" stroke="currentColor" strokeWidth="12"></circle>
                <circle className="text-indigo-400 transition-all duration-1000" cx="128" cy="128" fill="transparent" r="120" stroke="currentColor" strokeLinecap="round" strokeWidth="12" strokeDasharray="753.9" strokeDashoffset={753.9 - (solveRate/100)*753.9} style={{ filter: 'drop-shadow(0 0 10px rgba(129,140,248,0.5))' }}></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-sora text-6xl font-bold text-white leading-none">{solveRate}<span className="text-3xl">%</span></span>
                <span className="font-mono text-[10px] text-slate-400 mt-3 font-semibold uppercase tracking-widest">{dsaSolved} / {dsaTotal} Solved</span>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-3 w-full gap-4">
              <div className="flex flex-col">
                <span className="font-inter text-lg font-bold text-teal-400">12</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Daily Avg</span>
              </div>
              <div className="flex flex-col border-x border-white/10">
                <span className="font-inter text-lg font-bold text-amber-400">24</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Streak</span>
              </div>
              <div className="flex flex-col">
                <span className="font-inter text-lg font-bold text-indigo-300">Top 5%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Ranking</span>
              </div>
            </div>
          </section>
          
          {/* Syllabus Checksheet (Bento Style) */}
          <section className="lg:col-span-8 bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-xl p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-sora text-2xl font-bold text-white">Syllabus Checksheet</h2>
              <button className="bg-indigo-600/20 border border-indigo-500/40 text-white px-5 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 hover:bg-indigo-600/40 transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">add</span>
                ADD TOPIC
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {Object.entries(dsaProgress.topics).map(([topic, done]) => (
                <div 
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={`bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-md p-5 rounded-xl flex items-center justify-between group cursor-pointer hover:border-indigo-500/40 transition-all duration-300 shadow-sm ${done ? 'bg-indigo-500/10 border-indigo-500/30' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 border-2 rounded-md transition-all flex items-center justify-center shrink-0 ${done ? 'border-indigo-400 bg-indigo-500/20' : 'border-white/20'}`}>
                      <span className={`material-symbols-outlined text-indigo-400 text-[18px] transition-opacity ${done ? 'opacity-100' : 'opacity-0'}`} style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                    <div>
                      <h3 className="font-inter font-bold text-white text-sm">{topic}</h3>
                      <p className="text-xs text-slate-400 mt-1">{done ? '100% Completed' : 'In Progress'}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward_ios</span>
                </div>
              ))}
            </div>
            
            <div className="pt-8 mt-auto">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">Overall Roadmap Progress</span>
                <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest">{topicProgress}% COMPLETE</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden border border-white/10">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${topicProgress}%`, boxShadow: '0 0 10px rgba(99,102,241,0.5)' }}></div>
              </div>
            </div>
          </section>
        </div>
        
        {/* Problem Log: Table Section */}
        <section className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-sora text-2xl font-bold text-white">Problem Log</h2>
            <div className="flex gap-3">
              <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm text-white flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                Filter
              </button>
              <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm text-white flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-8 py-4 font-mono text-indigo-400 uppercase tracking-widest text-[11px] font-bold">Status</th>
                  <th className="px-8 py-4 font-mono text-indigo-400 uppercase tracking-widest text-[11px] font-bold">Problem Name</th>
                  <th className="px-8 py-4 font-mono text-indigo-400 uppercase tracking-widest text-[11px] font-bold">Difficulty</th>
                  <th className="px-8 py-4 font-mono text-indigo-400 uppercase tracking-widest text-[11px] font-bold">Category</th>
                  <th className="px-8 py-4 font-mono text-indigo-400 uppercase tracking-widest text-[11px] font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dsaProgress.questions.map((q, idx) => {
                  const isSolved = q.status === 'Solved';
                  return (
                    <tr key={idx} className="hover:bg-white/5 transition-colors cursor-pointer group">
                      <td className="px-8 py-5 w-24">
                        <span className={`material-symbols-outlined ${isSolved ? 'text-teal-400' : 'text-slate-500'}`} style={{ fontVariationSettings: isSolved ? "'FILL' 1" : "'FILL' 0" }}>
                          {isSolved ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="font-inter font-bold text-white text-sm">{q.title}</span>
                      </td>
                      <td className="px-8 py-5">
                        {getDifficultyBadge(q.difficulty)}
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-400">{q.topic}</td>
                      <td className="px-8 py-5 text-right">
                        <span className="material-symbols-outlined text-indigo-400 opacity-0 group-hover:opacity-100 transition-all text-[20px]">open_in_new</span>
                      </td>
                    </tr>
                  );
                })}
                {dsaProgress.questions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-8 py-12 text-center text-slate-500 text-sm">No questions tracked yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-8 py-5 bg-white/5 flex justify-between items-center border-t border-white/10">
            <span className="text-xs text-slate-400 font-medium">Showing {dsaProgress.questions.length} problems</span>
            <div className="flex gap-2">
              <button className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 disabled:opacity-50 transition-colors" disabled>
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold text-sm">1</button>
              <button className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 transition-colors disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
        
      </div>
    </main>
  );
}
