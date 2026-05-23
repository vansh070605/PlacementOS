import React from 'react';
import TopBar from './TopBar';

export default function ResumeManager() {
  return (
    <main className="flex-1 min-h-screen relative pb-24 lg:pb-8 flex flex-col min-w-0">
      <TopBar />

      <div className="flex-1 p-8 lg:p-10 space-y-12 max-w-7xl mx-auto w-full">
        {/* Hero: Resume Scanner */}
        <section className="space-y-6">
          <h2 className="font-sora text-4xl font-bold tracking-tight text-white mb-8">
            Resume <span className="text-indigo-400">Scanner</span>
          </h2>
          
          <div className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-xl p-8 relative overflow-hidden group cursor-pointer border-dashed border-2 hover:border-indigo-500/50 transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 flex flex-col items-center justify-center text-center py-12 space-y-6">
              <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all duration-500">
                <span className="material-symbols-outlined text-[48px] text-indigo-400" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
              </div>
              <div>
                <p className="font-sora text-2xl font-bold text-white mb-2">Drop your resume here</p>
                <p className="text-slate-400 text-lg max-w-md mx-auto">
                  Our AI engine will parse your data and match it against 5,000+ open roles in the PlacementOS network.
                </p>
              </div>
              <div className="flex gap-4">
                <span className="px-6 py-2 bg-[#ffffff08] border border-[#ffffff15] shadow-sm rounded-full text-sm font-bold text-indigo-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">attachment</span> PDF, DOCX
                </span>
                <span className="px-6 py-2 bg-[#ffffff08] border border-[#ffffff15] shadow-sm rounded-full text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">bolt</span> Instant Scan
                </span>
              </div>
              
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.doc,.docx" />
            </div>
          </div>
        </section>

        {/* Role Alignment Section: Neon Gauges */}
        <section className="space-y-6">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-sora text-2xl font-bold text-white mb-2">Role Alignment</h2>
              <p className="text-slate-400">Probability of placement based on current market trends</p>
            </div>
            <button className="text-indigo-400 font-bold flex items-center gap-2 hover:text-indigo-300 transition-colors cursor-pointer text-sm">
              View details <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Frontend Eng.', score: 92, color: 'text-indigo-400', hex: '#818cf8', strokeDasharray: '254', strokeDashoffset: `${254 - (92/100)*254}` },
              { label: 'Backend Eng.', score: 78, color: 'text-purple-400', hex: '#c084fc', strokeDasharray: '254', strokeDashoffset: `${254 - (78/100)*254}` },
              { label: 'UI/UX Designer', score: 88, color: 'text-pink-400', hex: '#f472b6', strokeDasharray: '254', strokeDashoffset: `${254 - (88/100)*254}` },
              { label: 'DevOps Specialist', score: 45, color: 'text-emerald-400', hex: '#34d399', strokeDasharray: '254', strokeDashoffset: `${254 - (45/100)*254}` }
            ].map((gauge, i) => (
              <div key={i} className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 rounded-xl flex flex-col items-center justify-center space-y-4 hover:scale-[1.02] hover:border-white/20 transition-all cursor-pointer">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle className="text-white/5" cx="50" cy="50" fill="none" r="40" stroke="currentColor" strokeWidth="8"></circle>
                    <circle className="transition-all duration-1000" cx="50" cy="50" fill="none" r="40" stroke={gauge.hex} strokeDasharray={gauge.strokeDasharray} strokeDashoffset={gauge.strokeDashoffset} strokeLinecap="round" strokeWidth="8" style={{ filter: `drop-shadow(0 0 8px ${gauge.hex}80)` }}></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-sora text-2xl font-black text-white">{gauge.score}%</span>
                  </div>
                </div>
                <p className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-widest">{gauge.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scoring History: Bento Grid */}
        <section className="space-y-6">
          <h2 className="font-sora text-2xl font-bold text-white mb-8">Scoring History</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* History Card 1 */}
            <div className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-6 rounded-xl border-l-4 border-l-indigo-500 relative group overflow-hidden cursor-pointer hover:bg-white/5 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400">
                  <span className="material-symbols-outlined text-[20px]">history</span>
                </div>
                <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">+12pts</span>
              </div>
              <h3 className="font-bold text-lg text-white mb-1 truncate">Resume_v2_Final.pdf</h3>
              <p className="text-sm text-slate-400 mb-6">Analyzed Oct 24, 2023</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[88%] shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                </div>
                <span className="font-black text-sm text-white">88</span>
              </div>
            </div>

            {/* History Card 2 */}
            <div className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-6 rounded-xl border-l-4 border-l-purple-500 relative group overflow-hidden cursor-pointer hover:bg-white/5 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400">
                  <span className="material-symbols-outlined text-[20px]">history</span>
                </div>
                <span className="text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded">-4pts</span>
              </div>
              <h3 className="font-bold text-lg text-white mb-1 truncate">Portfolio_Draft.docx</h3>
              <p className="text-sm text-slate-400 mb-6">Analyzed Oct 20, 2023</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[76%] shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                </div>
                <span className="font-black text-sm text-white">76</span>
              </div>
            </div>

            {/* History Card 3 */}
            <div className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-6 rounded-xl border-l-4 border-l-pink-500 relative group overflow-hidden cursor-pointer hover:bg-white/5 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-pink-500/10 p-2 rounded-lg text-pink-400">
                  <span className="material-symbols-outlined text-[20px]">history</span>
                </div>
                <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">New</span>
              </div>
              <h3 className="font-bold text-lg text-white mb-1 truncate">Resume_Core_V1.pdf</h3>
              <p className="text-sm text-slate-400 mb-6">Analyzed Oct 15, 2023</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 w-[94%] shadow-[0_0_8px_rgba(236,72,153,0.8)]"></div>
                </div>
                <span className="font-black text-sm text-white">94</span>
              </div>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}
