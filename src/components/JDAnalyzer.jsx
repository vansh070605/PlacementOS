import React, { useState } from 'react';
import TopBar from './TopBar';

export default function JDAnalyzer() {
  const [jdText, setJdText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const analyzeJd = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalysisResult({
        matched: ['React.js', 'Figma', 'WebGL'],
        missing: ['Spatial Design', 'Unity 3D', 'XR Prototyping'],
        match: 68
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  
  return (
    <main className="flex-1 flex flex-col min-w-0">
      <TopBar />

      <div className="flex-1 p-8 lg:p-10 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <section className="mb-12">
          <h2 className="font-sora text-4xl font-bold text-indigo-400 mb-2">JD Analyzer</h2>
          <p className="text-lg text-slate-400 max-w-2xl">
            Paste a job description to instantly decompose requirements, identify skill gaps against your talent pool, and scout the web for candidates.
          </p>
        </section>

        {/* Analyzer Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Left: Paste Area */}
          <div className="xl:col-span-7 space-y-6">
            <div className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 rounded-xl relative overflow-hidden group">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-indigo-400" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                  <h3 className="font-sora text-xl font-bold text-white">Job Description</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setJdText('')}
                    className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-all text-sm font-bold text-slate-300 cursor-pointer">
                    Clear
                  </button>
                  <button 
                    onClick={analyzeJd}
                    disabled={isAnalyzing || !jdText}
                    className="px-6 py-2 rounded-full bg-indigo-500 text-white text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
                  </button>
                </div>
              </div>
              <textarea 
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full h-[500px] bg-transparent border-none focus:ring-0 text-lg text-white placeholder:text-slate-500 outline-none resize-none" 
                placeholder="Paste the job description text here... (e.g. We are looking for a Senior Product Designer with expertise in React, Figma, and Spatial Computing...)"
              />
              {/* Decorative blur pulse */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none group-focus-within:bg-indigo-500/30 transition-all duration-700"></div>
            </div>
          </div>

          {/* Right: Skill Gap & Comparison */}
          <div className="xl:col-span-5 space-y-8">
            {/* Skill Gap Panel */}
            <div className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 rounded-xl">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-purple-400" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                <h3 className="font-sora text-xl font-bold text-white">Skill Gap Analysis</h3>
              </div>
              
              {!analysisResult ? (
                <div className="text-center py-12 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-4 opacity-50">data_exploration</span>
                  <p>Paste a JD and click Analyze to view skill gaps</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Matched Talent Strengths</p>
                    <div className="flex flex-wrap gap-3">
                      {analysisResult.matched.map(skill => (
                        <div key={skill} className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold text-sm flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span> {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs font-bold text-rose-400 mb-3 uppercase tracking-wider">Critical Gaps in Pipeline</p>
                    <div className="flex flex-wrap gap-3">
                      {analysisResult.missing.map(skill => (
                        <div key={skill} className="px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-sm flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">warning</span> {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-8 p-6 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-white">Overall Alignment Score</span>
                      <span className="text-3xl font-black text-indigo-400">{analysisResult.match}%</span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${analysisResult.match}%`, boxShadow: '0 0 10px rgba(99,102,241,0.5)' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Internet Job Scout */}
            <div className="bg-[#ffffff08] border border-[#ffffff15] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 rounded-xl relative overflow-hidden h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
                  <h3 className="font-sora text-xl font-bold text-white">Internet Scout</h3>
                </div>
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">Live Engine</span>
              </div>
              
              {!analysisResult ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-4 opacity-50">travel_explore</span>
                  <p>Awaiting JD analysis to scout candidates</p>
                </div>
              ) : isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-white animate-pulse">Scouring LinkedIn, GitHub...</p>
                    <p className="text-xs text-slate-400 mt-2 italic">Indexing matching portfolios</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  {/* Results State */}
                  {[
                    { name: 'Jordan Chen', role: 'Spatial Designer @ TechFlow', match: '94%' },
                    { name: 'Sarah Vossen', role: 'AR/VR Lead • 8+ years exp', match: '89%' },
                    { name: 'Marcus Thorne', role: 'Unity Dev • WebGL Expert', match: '82%' }
                  ].map((candidate, i) => (
                    <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-pointer hover:bg-white/10">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center font-bold text-lg text-white">
                        {candidate.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-white">{candidate.name}</p>
                        <p className="text-xs text-slate-400">{candidate.role}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-emerald-400">{candidate.match} Match</span>
                        <span className="material-symbols-outlined text-slate-500 text-sm mt-1">open_in_new</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
