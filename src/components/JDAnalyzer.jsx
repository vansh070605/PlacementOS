import React, { useState } from 'react';

// Common tech keywords to extract from job descriptions
const KEYWORDS_LIST = [
  'React', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 'SQL', 'HTML5', 'CSS3', 'Git',
  'REST APIs', 'TypeScript', 'Next.js', 'Redux', 'GraphQL', 'Tailwind', 'Python', 'Pandas',
  'NumPy', 'Scikit-Learn', 'TensorFlow', 'Java', 'C++', 'AWS', 'Docker', 'Kubernetes',
  'PostgreSQL', 'NoSQL', 'System Design', 'Algorithms', 'Data Structures'
];

// Study recommendations mapper for missing skills
const PREP_ROADMAPS = {
  'React': ['Review React lifecycle/hooks (useEffect, custom hooks)', 'Practice state management with Context API', 'Optimize components with React.memo/useMemo'],
  'JavaScript': ['Master ES6+ concepts (Promises, Async/Await, Destructuring)', 'Understand JavaScript closures and event loop', 'Deep dive into DOM manipulation and API fetching'],
  'Node.js': ['Study Event-Driven Architecture and asynchronous operations', 'Build RESTful routers using Node native APIs', 'Learn npm scripting and package management'],
  'Express': ['Build Express middleware pipelines', 'Implement central error-handling controllers', 'Practice JWT auth middleware integration'],
  'MongoDB': ['Master Mongoose schemas and model validations', 'Understand Aggregation pipelines for complex queries', 'Learn indexing for DB optimization'],
  'SQL': ['Practice complex INNER/LEFT joins and aggregate queries', 'Learn database normalization principles (1NF, 2NF, 3NF)', 'Understand indexing and explain plan performance'],
  'HTML5': ['Learn semantic tags (main, section, header, article)', 'Study web accessibility standards (WAI-ARIA)', 'Understand storage limits (localStorage vs sessionStorage)'],
  'CSS3': ['Master CSS Grid and Flexbox centering operations', 'Understand CSS variables and media query responsive setups', 'Learn keyframe animations and transition behaviors'],
  'Git': ['Review merge conflict resolution steps', 'Practice Git rebasing and interactive squash methods', 'Understand branching models (GitFlow, Trunk-based)'],
  'REST APIs': ['Study REST principles (HTTP verbs, status codes, query strings)', 'Build secure endpoints with rate limiting', 'Design standard response schemas'],
  'TypeScript': ['Understand interfaces, type aliases, and union types', 'Master Generics and utilities (Partial, Omit, Pick)', 'Learn config setups (tsconfig compiler options)'],
  'Next.js': ['Understand Server-Side Rendering (SSR) vs static gen (SSG)', 'Build App Router layouts and API routers', 'Optimize page loading with next/image and fonts'],
  'Redux': ['Learn Redux Toolkit configurations and store setup', 'Master useDispatch and useSelector hooks', 'Study asynchronous slice thunks'],
  'GraphQL': ['Write GraphQL schemas and type queries/mutations', 'Understand Apollo Client integration in React', 'Resolve query N+1 performance problems'],
  'Tailwind': ['Understand utility-first styling patterns', 'Learn configuration (tailwind.config custom extensions)', 'Master hover, active, and responsive variant prefixes'],
  'Python': ['Master file parsing, lambda expressions, and decorators', 'Understand pip virtualenv environments', 'Learn list comprehensions and generators'],
  'Pandas': ['Master DataFrame filtration, grouping, and aggregations', 'Study merging/joining multi-sheet dataset configurations', 'Practice cleaning NaN values and formatting dates'],
  'NumPy': ['Understand vector operations and multidimensional matrices', 'Learn mathematical array methods (dot product, transpose)', 'Perform slicing and indexing on arrays'],
  'Scikit-Learn': ['Implement linear/logistic regression models', 'Understand training/test data splitting methods', 'Evaluate models using Confusion Matrix, F1-Score'],
  'TensorFlow': ['Design neural network layers and compile models', 'Understand gradient descent and activation functions (ReLU, Sigmoid)', 'Build image classifications or NLP parsers'],
  'Java': ['Understand Object-Oriented Principles (Inheritance, Polymorphism)', 'Learn Java Collections Framework (ArrayList, HashMap)', 'Study JVM architecture, garbage collections'],
  'C++': ['Understand memory models and manual pointer allocations', 'Learn Standard Template Library (STL) vectors/maps', 'Practice templates and operator overloading'],
  'AWS': ['Set up EC2 server instances and S3 assets storage buckets', 'Configure IAM security roles and policies', 'Build serverless pipelines using AWS Lambda'],
  'Docker': ['Write multi-stage build Dockerfiles', 'Manage containers virtualization and port mappings', 'Understand Docker Compose configuration sheets'],
  'Kubernetes': ['Learn pod orchestrations and deployments definitions', 'Understand Services, Ingress, and ConfigMaps systems', 'Practice kubectl commands for container debugging'],
  'PostgreSQL': ['Practice transactional safety (ACID) and locks', 'Study database schemas and relational table keys', 'Optimize queries using database views and indexing'],
  'NoSQL': ['Study document vs key-value store architectures', 'Understand eventual consistency vs strong consistency models', 'Design denormalized databases for heavy reads'],
  'System Design': ['Learn horizontal vs vertical scaling strategies', 'Understand load balancers and reverse proxies', 'Study caching strategies (Write-Through vs Write-Back)'],
  'Algorithms': ['Review QuickSort, MergeSort, and Binary Searches', 'Master Breadth-First and Depth-First search patterns', 'Practice Dynamic Programming memoization algorithms'],
  'Data Structures': ['Understand Linked Lists, Trees, and Graph layouts', 'Implement Hash Maps, Queues, Stacks from scratch', 'Review Heap/Priority Queue sorting metrics']
};

const MOCK_JOBS_DB = [
  {
    title: 'React developer',
    company: 'Stripe',
    location: 'San Francisco, CA (Hybrid)',
    salary: '$130,000',
    skills: ['React', 'JavaScript', 'TypeScript', 'REST APIs', 'Git', 'CSS3'],
    jd: 'Looking for a product-focused frontend engineer to join our checkout team. Help us build high-performance web forms, payment UI widgets, and dashboard features. Required skills: React, TypeScript, APIs integration, Git, and CSS styling.'
  },
  {
    title: 'Full Stack Engineer',
    company: 'Airbnb',
    location: 'Remote (US)',
    salary: '$150,000',
    skills: ['React', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'Git'],
    jd: 'Join the listings experience team! Create responsive web client interfaces and scale APIs. We use React on the client, Express/Node.js on the backend, and MongoDB documents. Experience with Git workflows, CSS layouts, and REST APIs is critical.'
  },
  {
    title: 'Junior Python Analyst',
    company: 'DataCorp',
    location: 'Boston, MA',
    salary: '$85,000',
    skills: ['Python', 'Pandas', 'NumPy', 'SQL', 'Git'],
    jd: 'We are seeking an analyst to parse and organize raw financial client data sheets. Clean databases using Python scripts, Pandas DataFrames, and NumPy aggregations. Knowledge of SQL databases, relational schemas, and Git version control is essential.'
  },
  {
    title: 'Software Developer',
    company: 'Epic Systems',
    location: 'Madison, WI',
    salary: '$110,000',
    skills: ['Java', 'C++', 'SQL', 'Data Structures', 'Algorithms'],
    jd: 'Build database pipelines and performance core APIs for medical charts applications. Required core language: Java or C++. Must have excellent knowledge of database query optimization, SQL joins, core Data Structures, and efficient Algorithms.'
  },
  {
    title: 'Cloud Engineer',
    company: 'HashiCorp',
    location: 'Remote',
    salary: '$145,000',
    skills: ['TypeScript', 'AWS', 'Docker', 'Kubernetes', 'System Design'],
    jd: 'Help deploy and scale core infrastructure tools. Must be proficient with AWS configurations, Docker containment, and Kubernetes orchestration pods. Experience writing infrastructure-as-code in TypeScript and designing scalable distributed architectures.'
  }
];

export default function JDAnalyzer({ resumes, applications, setApplications }) {
  const [activeMode, setActiveMode] = useState('analyze'); // 'analyze' or 'scout'
  const [jdText, setJdText] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id || '');
  
  // Analysis States
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Scouting States
  const [scoutSearch, setScoutSearch] = useState('');
  const [scouting, setScouting] = useState(false);
  const [scoutedJobs, setScoutedJobs] = useState([]);
  const [selectedScoutResumeId, setSelectedScoutResumeId] = useState(resumes[0]?.id || '');

  // Perform JD Skill Fit Analysis
  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!jdText.trim()) return;

    setAnalyzing(true);
    setAnalysisResult(null);

    // Simulate analysis loading state (1.5 seconds)
    setTimeout(() => {
      const activeRes = resumes.find(r => r.id === selectedResumeId);
      if (!activeRes) {
        setAnalyzing(false);
        alert("Selected resume profile not found.");
        return;
      }

      const resumeSkills = activeRes.skills.map(s => s.toLowerCase());

      // Extract skills found in the JD
      const extractedJDSkills = [];
      KEYWORDS_LIST.forEach(skill => {
        // Regex search for skill boundary
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(jdText)) {
          extractedJDSkills.push(skill);
        }
      });

      if (extractedJDSkills.length === 0) {
        // Fallback: extract a few common terms if nothing matched
        extractedJDSkills.push('React', 'JavaScript', 'Git');
      }

      // Calculate matches vs misses
      const matched = [];
      const missing = [];
      extractedJDSkills.forEach(skill => {
        if (resumeSkills.includes(skill.toLowerCase())) {
          matched.push(skill);
        } else {
          missing.push(skill);
        }
      });

      const totalSkillsCount = extractedJDSkills.length;
      const matchScore = Math.round((matched.length / totalSkillsCount) * 100);

      // Generate learning checklist paths
      const studyRoadmap = [];
      missing.forEach(skill => {
        const topics = PREP_ROADMAPS[skill] || [`Study standard syntax and documentation for ${skill}`, `Build a mini-project applying ${skill}`];
        studyRoadmap.push({
          skill,
          tasks: topics
        });
      });

      setAnalysisResult({
        matchScore,
        matched,
        missing,
        studyRoadmap
      });
      setAnalyzing(false);
    }, 1500);
  };

  // Perform Job Scouting Search
  const handleScout = (e) => {
    e.preventDefault();
    setScouting(true);
    setScoutedJobs([]);

    setTimeout(() => {
      const activeRes = resumes.find(r => r.id === selectedScoutResumeId);
      const userSkills = activeRes ? activeRes.skills.map(s => s.toLowerCase()) : [];

      // Filter jobs based on keyword search
      const searched = MOCK_JOBS_DB.filter(job => {
        const titleMatch = job.title.toLowerCase().includes(scoutSearch.toLowerCase());
        const companyMatch = job.company.toLowerCase().includes(scoutSearch.toLowerCase());
        const descMatch = job.jd.toLowerCase().includes(scoutSearch.toLowerCase());
        const skillMatch = job.skills.some(s => s.toLowerCase().includes(scoutSearch.toLowerCase()));
        return !scoutSearch || titleMatch || companyMatch || descMatch || skillMatch;
      });

      // Calculate score for each job in results based on user skills
      const results = searched.map(job => {
        const jobSkillsLower = job.skills.map(s => s.toLowerCase());
        const matchCount = jobSkillsLower.filter(s => userSkills.includes(s)).length;
        const totalJobSkills = job.skills.length;
        const matchScore = Math.round((matchCount / totalJobSkills) * 100);

        return {
          ...job,
          id: 'scout_' + Math.random().toString(36).substr(2, 9),
          matchScore
        };
      });

      // Sort by highest match score
      results.sort((a, b) => b.matchScore - a.a);

      setScoutedJobs(results);
      setScouting(false);
    }, 1500);
  };

  // Import mock job into Applications list
  const handleTrackJob = (job) => {
    const isAlreadyTracked = applications.some(app => app.company.toLowerCase() === job.company.toLowerCase() && app.title.toLowerCase() === job.title.toLowerCase());
    if (isAlreadyTracked) {
      alert(`You are already tracking "${job.title}" at ${job.company}!`);
      return;
    }

    const newApp = {
      id: 'app_' + Date.now(),
      title: job.title,
      company: job.company,
      status: 'applied',
      date: new Date().toISOString().split('T')[0],
      salary: job.salary,
      location: job.location,
      notes: `Imported via Job Scout. Calculated match score: ${job.matchScore}%.`,
      contacts: '',
      resumeId: selectedScoutResumeId,
      jd: job.jd
    };

    setApplications(prev => [newApp, ...prev]);
    alert(`Successfully loaded "${job.title}" at ${job.company} into your Job Tracker as "Applied"!`);
  };

  return (
    <div>
      {/* Selection Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <button
          className={`btn ${activeMode === 'analyze' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveMode('analyze')}
        >
          🔍 Skill Gap Analyzer
        </button>
        <button
          className={`btn ${activeMode === 'scout' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveMode('scout')}
        >
          📡 Internet Job Scout
        </button>
      </div>

      {/* MODE 1: SKILL GAP ANALYZER */}
      {activeMode === 'analyze' && (
        <div style={{ display: 'grid', gridTemplateColumns: analysisResult ? '1.1fr 1fr' : '1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Paste Form */}
          <div className="glass-panel">
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.4rem', marginBottom: '0.5rem' }}>Skill Gap Analyzer</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Paste a Job Description from LinkedIn, Indeed, or a company site to extract required skills and compare them against your profile.
            </p>

            <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Compare Against Resume Profile</label>
                <select
                  className="form-select"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  style={{ background: 'var(--bg-primary)' }}
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Job Description (JD)</label>
                <textarea
                  className="form-textarea"
                  rows="10"
                  placeholder="Paste the full job responsibilities, duties, and requirements text..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={analyzing}>
                {analyzing ? '⚙️ Processing & Indexing Resume...' : 'Analyze Skill Match'}
              </button>
            </form>
          </div>

          {/* Loader Simulator */}
          {analyzing && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(157, 78, 221, 0.1)',
                borderTop: '4px solid var(--accent-purple)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', fontWeight: '500' }}>Evaluating Skill Matrix...</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Extracting semantic parameters & building study plans.</p>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {/* Results Zone */}
          {analysisResult && !analyzing && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: `5px solid ${analysisResult.matchScore > 70 ? 'var(--accent-emerald)' : 'var(--accent-amber)'}` }}>
              
              {/* Score Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.3rem' }}>Match Breakdown</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Parsed keywords found in JD.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: '800', color: analysisResult.matchScore > 70 ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontFamily: 'Space Grotesk' }}>
                    {analysisResult.matchScore}%
                  </div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>Match Score</span>
                </div>
              </div>

              {/* Skills Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Matched */}
                <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '700', marginBottom: '0.5rem' }}>
                    ✅ Matched Skills ({analysisResult.matched.length})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {analysisResult.matched.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None matched</span>
                    ) : (
                      analysisResult.matched.map(skill => (
                        <span key={skill} style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Missing */}
                <div style={{ background: 'rgba(244, 63, 94, 0.03)', border: '1px solid rgba(244, 63, 94, 0.15)', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '700', marginBottom: '0.5rem' }}>
                    ❌ Missing Skills ({analysisResult.missing.length})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {analysisResult.missing.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>Perfect match!</span>
                    ) : (
                      analysisResult.missing.map(skill => (
                        <span key={skill} style={{ fontSize: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Study Plan */}
              {analysisResult.studyRoadmap.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                    📚 Tailored Preparation Plan
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Study these target topics before interviewing to close your resume's experience gaps.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {analysisResult.studyRoadmap.map((roadmap) => (
                      <div key={roadmap.skill} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--accent-purple)' }}>
                          {roadmap.skill} Study Guide:
                        </span>
                        <ul style={{ listStyle: 'circle', paddingLeft: '1.25rem', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {roadmap.tasks.map((task, i) => (
                            <li key={i} style={{ marginBottom: '0.25rem' }}>{task}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* MODE 2: INTERNET JOB SCOUT */}
      {activeMode === 'scout' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Search bar card */}
          <div className="glass-panel">
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.4rem', marginBottom: '0.5rem' }}>📡 Internet Job Scout</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Select a resume profile to scout for matching open vacancies across the web based on your active skills.
            </p>

            <form onSubmit={handleScout} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flexGrow: 1, minWidth: '220px' }}>
                <label className="form-label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>Select Target Profile</label>
                <select
                  className="form-select"
                  value={selectedScoutResumeId}
                  onChange={(e) => setSelectedScoutResumeId(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-primary)' }}
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ flexGrow: 2, minWidth: '280px' }}>
                <label className="form-label" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>Search Keywords</label>
                <input
                  type="text"
                  placeholder="e.g. React, Python, Remote, Engineer..."
                  className="form-input"
                  style={{ width: '100%', background: 'var(--bg-primary)' }}
                  value={scoutSearch}
                  onChange={(e) => setScoutSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }} disabled={scouting}>
                  {scouting ? 'Scanning...' : 'Scout vacancies'}
                </button>
              </div>
            </form>
          </div>

          {/* Radar Scanning animation */}
          {scouting && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              <div className="radar-circle"></div>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', fontWeight: '500', zIndex: 10 }}>Scanning Web Boards...</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', zIndex: 10 }}>Scraping mock API indexes and matching skill vectors.</p>
              
              <style>{`
                .radar-circle {
                  width: 100px;
                  height: 100px;
                  border-radius: 50%;
                  background: radial-gradient(circle, rgba(157,78,221,0.2) 0%, rgba(0,0,0,0) 70%);
                  border: 2px solid rgba(157, 78, 221, 0.4);
                  animation: pulse 1.5s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
                }
                @keyframes pulse {
                  0% { transform: scale(0.5); opacity: 1; }
                  100% { transform: scale(2.2); opacity: 0; }
                }
              `}</style>
            </div>
          )}

          {/* Scout Results */}
          {!scouting && scoutedJobs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.25rem' }}>📡 Vacancies Found ({scoutedJobs.length})</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {scoutedJobs.map(job => (
                  <div key={job.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', borderLeft: `4px solid ${job.matchScore > 60 ? 'var(--accent-emerald)' : 'var(--accent-amber)'}` }}>
                    
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'white' }}>{job.title}</h4>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                          {job.company}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        📍 {job.location} | 💰 {job.salary}
                      </p>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'pre-line', marginBottom: '0.75rem' }}>
                        {job.jd}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginRight: '0.25rem' }}>Skills Required:</span>
                        {job.skills.map(s => (
                          <span key={s} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.1rem 0.35rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', minWidth: '130px', textAlign: 'right' }}>
                      <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: job.matchScore > 60 ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontFamily: 'Space Grotesk' }}>
                          {job.matchScore}%
                        </div>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Match Score</span>
                      </div>

                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', width: '100%', marginTop: '1rem' }}
                        onClick={() => handleTrackJob(job)}
                      >
                        ⚡ Apply & Track
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {!scouting && scoutedJobs.length === 0 && (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Enter search keywords or select your variant, then click "Scout vacancies" to fetch matching positions.
            </div>
          )}

        </div>
      )}
    </div>
  );
}
