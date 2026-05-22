import React, { useState } from 'react';

const KEYWORDS_LIST = [
  'React', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 'SQL', 'HTML5', 'CSS3', 'Git',
  'REST APIs', 'TypeScript', 'Next.js', 'Redux', 'GraphQL', 'Tailwind', 'Python', 'Pandas',
  'NumPy', 'Scikit-Learn', 'TensorFlow', 'Java', 'C++', 'AWS', 'Docker', 'Kubernetes',
  'PostgreSQL', 'NoSQL', 'System Design', 'Algorithms', 'Data Structures'
];

// Helper to analyze a resume dynamically and return detailed insights
export function analyzeResume(resume) {
  if (!resume) return null;

  const skills = resume.skills || [];
  const experience = resume.experience || '';
  const projects = resume.projects || '';
  const coverLetter = resume.coverLetter || '';

  const fullText = `${experience} ${projects}`.toLowerCase();

  // 1. Section Completeness (Max 25 pts)
  let sectionScore = 0;
  const sectionsFound = {
    experience: experience.trim().length > 30,
    projects: projects.trim().length > 30,
    skills: skills.length > 0,
    coverLetter: coverLetter.trim().length > 40
  };
  if (sectionsFound.experience) sectionScore += 8;
  if (sectionsFound.projects) sectionScore += 8;
  if (sectionsFound.skills) sectionScore += 5;
  if (sectionsFound.coverLetter) sectionScore += 4;

  // 2. Quantifiable Impact (Max 25 pts)
  // Search for percentages, ratios, metrics, money amounts, or scale
  const metricRegexes = [
    /\b\d+%\b/g, // 20%
    /\b\d+\s*x\b/g, // 2x, 5x
    /\b\d+-x\b/g,
    /\$\s*\d+/g, // $1000, $5k
    /\b\d+\s*k\b/gi, // 10k, 100k
    /\b\d+\s*(?:\+)?\s*(?:users|clients|customers|visitors|requests|queries|seconds|ms|hours|months|years|percent|reduction|increase|improvement|load|scale)\b/gi
  ];
  
  let metricMatches = [];
  metricRegexes.forEach(regex => {
    const matches = fullText.match(regex);
    if (matches) {
      metricMatches = [...metricMatches, ...matches];
    }
  });
  
  const uniqueMetrics = [...new Set(metricMatches)];
  const metricCount = uniqueMetrics.length;
  let impactScore = Math.min(25, metricCount * 5); // 5 points per metric, up to 25

  // 3. Skill Density (Max 25 pts)
  let skillScore = 0;
  if (skills.length >= 10) skillScore = 25;
  else if (skills.length >= 7) skillScore = 20;
  else if (skills.length >= 4) skillScore = 15;
  else if (skills.length >= 1) skillScore = 10;

  // 4. Systems, Cloud & DevOps (Max 25 pts)
  let systemsScore = 0;
  const systemsKeywords = ['git', 'github', 'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'ci/cd', 'pipelines', 'jenkins', 'terraform', 'vercel', 'heroku', 'linux'];
  let matchedSystems = [];
  systemsKeywords.forEach(kw => {
    if (fullText.includes(kw) || skills.some(s => s.toLowerCase() === kw)) {
      matchedSystems.push(kw);
    }
  });
  
  const uniqueSystems = [...new Set(matchedSystems)];
  if (uniqueSystems.length >= 4) systemsScore = 25;
  else if (uniqueSystems.length === 3) systemsScore = 20;
  else if (uniqueSystems.length === 2) systemsScore = 15;
  else if (uniqueSystems.length === 1) systemsScore = 10;
  else systemsScore = 0;

  const totalScore = sectionScore + impactScore + skillScore + systemsScore;

  // Compile Strengths
  const strengths = [];
  if (sectionsFound.experience && sectionsFound.projects) {
    strengths.push("Good layout structure with dedicated Experience and Projects sections.");
  }
  if (skills.length >= 8) {
    strengths.push(`Diverse skill coverage with ${skills.length} technical competencies.`);
  }
  if (metricCount >= 3) {
    strengths.push(`Strong quantifiable focus. Identified ${metricCount} impact metrics demonstrating results.`);
  }
  if (skills.some(s => ['React', 'Next.js', 'TypeScript', 'JavaScript'].includes(s))) {
    strengths.push("Solid modern frontend foundations (React/TypeScript ecosystem).");
  }
  if (skills.some(s => ['Node.js', 'Express', 'SQL', 'MongoDB', 'PostgreSQL'].includes(s))) {
    strengths.push("Good backend and database architecture awareness.");
  }
  if (uniqueSystems.includes('git')) {
    strengths.push("Active project version control habits indicated via Git.");
  }
  if (uniqueSystems.some(s => ['aws', 'docker', 'kubernetes'].includes(s))) {
    strengths.push("Systems & Cloud engineering exposure (Docker/AWS/K8s).");
  }
  if (strengths.length === 0) {
    strengths.push("Standard profile layout created.");
  }

  // Compile Critiques
  const critiques = [];
  if (metricCount < 3) {
    critiques.push("Lacks quantifiable impact metrics. Add numbers, percentages, or savings (e.g., 'improved performance by 25%', 'managed 100k+ records') to prove your value.");
  }
  if (!uniqueSystems.some(s => ['aws', 'gcp', 'azure'].includes(s))) {
    critiques.push("No cloud deployment experience listed (AWS/GCP/Azure). Adding cloud deployment skills increases full-stack engineering appeal.");
  }
  if (!uniqueSystems.some(s => ['docker', 'kubernetes'].includes(s))) {
    critiques.push("Missing containerization exposure. Consider adding Docker or Kubernetes experience for backend and cloud systems compatibility.");
  }
  if (skills.length < 6) {
    critiques.push("Low skill count. Expand your technical tag directory to cover secondary libraries, protocols, or utility utilities.");
  }
  if (experience.length < 120) {
    critiques.push("Experience details are too brief. Elaborate on your specific engineering contributions, team workflows, and technical challenges.");
  }
  if (coverLetter.length < 120) {
    critiques.push("Cover letter draft is minimal. Expand on why you are a good fit and tie it explicitly to your technical achievements.");
  }

  // Role Match Calculations (0-100%)
  const calculateRoleMatch = (weights) => {
    let score = 15; // baseline
    weights.forEach(w => {
      const isSkillMatch = skills.some(s => s.toLowerCase() === w.key.toLowerCase());
      const isTextMatch = fullText.includes(w.key.toLowerCase());
      if (isSkillMatch) {
        score += w.val;
      } else if (isTextMatch) {
        score += w.val * 0.6; // partial weight if in text but not skill list
      }
    });
    return Math.min(100, Math.round(score));
  };

  const roles = {
    "Frontend Developer": calculateRoleMatch([
      { key: 'React', val: 20 },
      { key: 'JavaScript', val: 15 },
      { key: 'TypeScript', val: 15 },
      { key: 'Next.js', val: 15 },
      { key: 'HTML5', val: 10 },
      { key: 'CSS3', val: 10 },
      { key: 'Redux', val: 10 },
      { key: 'Tailwind', val: 10 }
    ]),
    "Backend Developer": calculateRoleMatch([
      { key: 'Node.js', val: 20 },
      { key: 'Express', val: 15 },
      { key: 'SQL', val: 15 },
      { key: 'MongoDB', val: 10 },
      { key: 'PostgreSQL', val: 15 },
      { key: 'REST APIs', val: 15 },
      { key: 'GraphQL', val: 10 },
      { key: 'Java', val: 10 },
      { key: 'C++', val: 5 }
    ]),
    "DevOps & Systems Engineer": calculateRoleMatch([
      { key: 'Docker', val: 25 },
      { key: 'Kubernetes', val: 25 },
      { key: 'AWS', val: 20 },
      { key: 'Git', val: 10 },
      { key: 'System Design', val: 10 },
      { key: 'Linux', val: 10 }
    ]),
    "Data Scientist / AI Engineer": calculateRoleMatch([
      { key: 'Python', val: 25 },
      { key: 'Pandas', val: 20 },
      { key: 'NumPy', val: 15 },
      { key: 'Scikit-Learn', val: 15 },
      { key: 'TensorFlow', val: 20 },
      { key: 'SQL', val: 10 }
    ])
  };

  return {
    scoreDetails: {
      sectionScore,
      impactScore,
      skillScore,
      systemsScore,
      metricCount
    },
    atsScore: Math.min(100, totalScore),
    strengths,
    critiques,
    roles
  };
}

export default function ResumeManager({ resumes, setResumes }) {
  const [selectedId, setSelectedId] = useState(resumes[0]?.id || null);
  const [newSkill, setNewSkill] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('edit'); // 'edit' or 'insights'

  // Resume Parsing States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [parsingStep, setParsingStep] = useState(-1); // -1: Configure, 0: Read, 1: Decode, 2: Tag, 3: Layout, 4: Done Review
  const [pastedText, setPastedText] = useState('');
  const [parsedData, setParsedData] = useState(null);

  const activeResume = resumes.find((r) => r.id === selectedId);
  const activeInsights = activeResume ? analyzeResume(activeResume) : null;

  const updateActiveResumeField = (field, value) => {
    setResumes((prev) =>
      prev.map((res) => (res.id === selectedId ? { ...res, [field]: value } : res))
    );
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim() || !activeResume) return;
    if (activeResume.skills.includes(newSkill.trim())) {
      setNewSkill('');
      return;
    }
    const updatedSkills = [...activeResume.skills, newSkill.trim()];
    updateActiveResumeField('skills', updatedSkills);
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    if (!activeResume) return;
    const updatedSkills = activeResume.skills.filter((s) => s !== skillToRemove);
    updateActiveResumeField('skills', updatedSkills);
  };

  const handleCreateProfile = () => {
    const newProfile = {
      id: 'res_' + Date.now(),
      name: 'New Custom Profile',
      skills: ['React', 'JavaScript'],
      experience: 'Describe your professional work history here...',
      projects: 'Describe your key coding projects here...',
      coverLetter: 'Write a basic cover letter template here...'
    };
    setResumes((prev) => [...prev, newProfile]);
    setSelectedId(newProfile.id);
    setActiveSubTab('edit');
  };

  const handleDeleteProfile = (id) => {
    if (resumes.length <= 1) {
      alert("You must keep at least one resume profile.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this resume profile? This cannot be undone.")) {
      const remaining = resumes.filter((r) => r.id !== id);
      setResumes(remaining);
      setSelectedId(remaining[0].id);
      setActiveSubTab('edit');
    }
  };

  // Reusable parser helper functions
  const parseResumeText = (fileName, text) => {
    const extractedSkills = [];
    KEYWORDS_LIST.forEach((skill) => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        extractedSkills.push(skill);
      }
    });

    let experience = '';
    let projects = '';
    let coverLetter = '';
    let currentSection = 'summary';

    const lines = text.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();
      if ((lower.includes('experience') || lower.includes('work') || lower.includes('history') || lower.includes('employment') || lower.includes('professional')) && trimmed.length < 35) {
        currentSection = 'experience';
      } else if ((lower.includes('project') || lower.includes('portfolio') || lower.includes('academic')) && trimmed.length < 35) {
        currentSection = 'projects';
      } else if ((lower.includes('cover') || lower.includes('letter') || lower.includes('introduction') || lower.includes('dear hiring')) && trimmed.length < 40) {
        currentSection = 'coverLetter';
      } else if ((lower.includes('education') || lower.includes('school') || lower.includes('university') || lower.includes('degree')) && trimmed.length < 35) {
        currentSection = 'education';
      } else if ((lower.includes('skills') || lower.includes('expertise') || lower.includes('technologies')) && trimmed.length < 35) {
        currentSection = 'skills';
      } else {
        if (currentSection === 'experience') {
          experience += line + '\n';
        } else if (currentSection === 'projects') {
          projects += line + '\n';
        } else if (currentSection === 'coverLetter') {
          coverLetter += line + '\n';
        }
      }
    });

    const cleanedName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') + ' Profile';

    return {
      name: cleanedName,
      skills: extractedSkills.length > 0 ? extractedSkills : ['React', 'JavaScript', 'Node.js', 'Git'],
      experience: experience.trim() || 'Software Engineer Intern\n- Built interactive UI dashboards with React.\n- Refactored backend API endpoints resulting in 20% faster load times.',
      projects: projects.trim() || 'E-Commerce App (React + Node)\n- Created a fully responsive cart and payment system.\n- Implemented JWT auth.',
      coverLetter: coverLetter.trim() || 'Dear Hiring Team,\n\nI am writing to express my interest in the Software Engineer position. Based on my uploaded profile, my background aligns with your core requirements...'
    };
  };

  const parseByHeuristics = (fileName) => {
    const nameLower = fileName.toLowerCase();
    const cleanedName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') + ' Profile';
    
    if (nameLower.includes('frontend') || nameLower.includes('react') || nameLower.includes('ui') || nameLower.includes('web')) {
      return {
        name: cleanedName,
        skills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'Git', 'TypeScript', 'Tailwind', 'Next.js'],
        experience: 'Frontend Engineer Intern (4 months)\n- Developed modern interactive user interfaces using React and Redux state management.\n- Optimized application layouts resulting in a 25% mobile loading speedup.\n- Implemented responsive elements with CSS flexbox and grid structures.',
        projects: 'Developer Portfolio Dashboard\n- Designed and implemented a responsive showcase website with clean animations.\n- Configured automated deployment pipelines using GitHub Actions.',
        coverLetter: 'Dear Hiring Team,\n\nI am excited to apply for the Frontend Developer position. My experience building responsive, interactive user interfaces with React, CSS, and modern JavaScript tools matches the details of your role.'
      };
    } else if (nameLower.includes('data') || nameLower.includes('python') || nameLower.includes('analyst') || nameLower.includes('ml') || nameLower.includes('science')) {
      return {
        name: cleanedName,
        skills: ['Python', 'Pandas', 'NumPy', 'Scikit-Learn', 'SQL', 'Git', 'Data Visualization', 'TensorFlow'],
        experience: 'Data Analyst Project Lead (3 months)\n- Cleaned and prepared large datasets of 100k+ records using Python and SQL.\n- Developed internal visualization dashboards for tracking daily active metrics.\n- Built predictive models achieving a 92% classification accuracy rate.',
        projects: 'Housing Price Analytics Platform\n- Scraped real estate transaction records and created a regression forecasting model.\n- Built data processing pipelines with Pandas and NumPy.',
        coverLetter: 'Dear Hiring Team,\n\nI am writing to express my interest in the Data Scientist/Analyst role. My background in Python, statistical modeling, and data engineering aligns perfectly with your requirements.'
      };
    } else if (nameLower.includes('devops') || nameLower.includes('cloud') || nameLower.includes('system') || nameLower.includes('aws') || nameLower.includes('docker') || nameLower.includes('kubernetes')) {
      return {
        name: cleanedName,
        skills: ['Docker', 'Kubernetes', 'AWS', 'Git', 'Linux', 'SQL', 'System Design'],
        experience: 'DevOps Engineering Assistant (3 months)\n- Maintained CI/CD pipelines and orchestrated automated container deployments.\n- Monitored server logs and optimized AWS EC2 resource configurations to save 15% costs.\n- Implemented secure virtual networks and access policies.',
        projects: 'High-Availability Cluster Deployment\n- Built an automated container scheduling group with Kubernetes.\n- Scaled application configurations and set up Prometheus alert monitors.',
        coverLetter: 'Dear Hiring Team,\n\nI am pleased to submit my application for the DevOps Engineer role. My experience managing deployments, configuring cloud resources on AWS, and scaling containers makes me a strong fit.'
      };
    } else {
      return {
        name: cleanedName,
        skills: ['React', 'JavaScript', 'Node.js', 'SQL', 'Git', 'Express', 'HTML5', 'REST APIs'],
        experience: 'Software Engineering Associate (6 months)\n- Collaborated with engineering teams to develop responsive client features.\n- Documented APIs and conducted unit test verifications.\n- Enhanced database query performance by 20% by indexing tables.',
        projects: 'Campus Recruitment Portal\n- Developed student scheduling flow and secure JWT authorization mechanisms.\n- Designed visual progress boards for applicant tracking.',
        coverLetter: 'Dear Hiring Team,\n\nI am writing to express my interest in the Software Engineer position. Based on my experience building full-stack applications with React, Node.js, and SQL, I am confident I can add value.'
      };
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(file);
    setPastedText('');
    setParsingStep(-1); // Go to paste details/confirm screen first
    setShowUploadModal(true);
    setParsedData(null);

    // If it's a plain text or markdown file, read it immediately to make life easier
    if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPastedText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const startAnalysisScan = () => {
    setParsingStep(0);

    // Run progressive checkmarks simulation before rendering parsed review panel
    setTimeout(() => setParsingStep(1), 500);
    setTimeout(() => setParsingStep(2), 1000);
    setTimeout(() => setParsingStep(3), 1500);
    setTimeout(() => {
      let finalData;
      if (pastedText.trim().length > 30) {
        finalData = parseResumeText(uploadingFile.name, pastedText);
      } else {
        finalData = parseByHeuristics(uploadingFile.name);
      }
      setParsedData(finalData);
      setParsingStep(4);
    }, 2000);
  };

  const handleSaveParsed = () => {
    if (!parsedData) return;
    const newProfile = {
      id: 'res_' + Date.now(),
      name: parsedData.name,
      skills: parsedData.skills,
      experience: parsedData.experience,
      projects: parsedData.projects,
      coverLetter: parsedData.coverLetter
    };
    setResumes((prev) => [...prev, newProfile]);
    setSelectedId(newProfile.id);
    setShowUploadModal(false);
    setUploadingFile(null);
    setParsedData(null);
    setPastedText('');
    setActiveSubTab('insights'); // Switch straight to insights so they see their ATS card!
  };

  // Helper for rendering score colors
  const getScoreColorClass = (score) => {
    if (score >= 75) return 'score-badge-emerald';
    if (score >= 50) return 'score-badge-amber';
    return 'score-badge-red';
  };

  const getScoreColorHex = (score) => {
    if (score >= 75) return '#10b981'; // emerald
    if (score >= 50) return '#f59e0b'; // amber
    return '#f43f5e'; // rose
  };

  const getScoreGradeText = (score) => {
    if (score >= 85) return 'Excellent Profile Match';
    if (score >= 75) return 'Optimized Candidate Profile';
    if (score >= 50) return 'Needs Moderate Enhancement';
    return 'Critical Structural Revisions Required';
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Resume & Profile Hub</h1>
          <p className="page-subtitle">Manage multiple resume variants tailored to different job categories.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
            📁 Upload & Parse Resume
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
          <button className="btn btn-primary" onClick={handleCreateProfile}>
            ➕ Create New Variant
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Profile Selector List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span className="form-label" style={{ fontSize: '0.7rem' }}>Select Variant</span>
          {resumes.map((res) => {
            const tempInsights = analyzeResume(res);
            const score = tempInsights ? tempInsights.atsScore : 0;
            return (
              <button
                key={res.id}
                className="btn"
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  textAlign: 'left',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  background: selectedId === res.id ? 'var(--bg-card)' : 'transparent',
                  color: selectedId === res.id ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${selectedId === res.id ? 'var(--border-color-hover)' : 'var(--border-color)'}`,
                }}
                onClick={() => {
                  setSelectedId(res.id);
                  // Preserve subtab
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📄 {res.name}
                </span>
                <span className={`score-badge ${getScoreColorClass(score)}`} style={{ minWidth: '32px', textAlign: 'center' }}>
                  {score}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Active Profile Content Panel */}
        {activeResume ? (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Header / Name Edit */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ flexGrow: 1 }}>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed var(--border-color)',
                    borderRadius: '0',
                    padding: '0.2rem 0',
                    width: '100%',
                    maxWidth: '400px',
                    color: 'white'
                  }}
                  value={activeResume.name}
                  onChange={(e) => updateActiveResumeField('name', e.target.value)}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Click name above to edit profile title.</p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowPreview(true)}>
                  👁️ Preview Resume
                </button>
                <button className="btn btn-danger" style={{ padding: '0.7rem' }} onClick={() => handleDeleteProfile(activeResume.id)}>
                  🗑️ Delete
                </button>
              </div>
            </div>

            {/* Sub Tabs Navigation */}
            <div className="resume-tabs">
              <button 
                className={`resume-tab-btn ${activeSubTab === 'edit' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('edit')}
              >
                ✏️ Edit Resume Content
              </button>
              <button 
                className={`resume-tab-btn ${activeSubTab === 'insights' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('insights')}
              >
                🧠 AI Insights & ATS Diagnostics
                <span className={`score-badge ${getScoreColorClass(activeInsights?.atsScore || 0)}`}>
                  ATS: {activeInsights?.atsScore || 0}%
                </span>
              </button>
            </div>

            {/* TAB VIEW: EDIT CONTENT */}
            {activeSubTab === 'edit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Interactive Skills Compiler */}
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Key Skills & Tags</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {activeResume.skills.map((skill, index) => (
                      <span
                        key={index}
                        style={{
                          background: 'rgba(157, 78, 221, 0.1)',
                          color: 'var(--accent-purple)',
                          border: '1px solid rgba(157, 78, 221, 0.3)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {skill}
                        <button
                          type="button"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent-purple)',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '0.75rem'
                          }}
                          onClick={() => handleRemoveSkill(skill)}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '0.5rem', maxWidth: '350px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Add skill (e.g. Docker)..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      style={{ flexGrow: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                    />
                    <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      Add
                    </button>
                  </form>
                </div>

                {/* Experience */}
                <div className="form-group">
                  <label className="form-label">Work Experience</label>
                  <textarea
                    className="form-textarea"
                    rows="6"
                    value={activeResume.experience}
                    onChange={(e) => updateActiveResumeField('experience', e.target.value)}
                    placeholder="List your job titles, company names, start/end dates, and bulleted achievements..."
                    style={{ fontSize: '0.9rem' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    💡 Pro tip: Mention cloud services (AWS, Docker) and add quantifiable numbers (e.g., "sped up queries by 30%") to boost your ATS score.
                  </span>
                </div>

                {/* Projects */}
                <div className="form-group">
                  <label className="form-label">Projects</label>
                  <textarea
                    className="form-textarea"
                    rows="6"
                    value={activeResume.projects}
                    onChange={(e) => updateActiveResumeField('projects', e.target.value)}
                    placeholder="List programming projects, tools utilized, and specific accomplishments..."
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>

                {/* Cover Letter */}
                <div className="form-group">
                  <label className="form-label">Cover Letter Template</label>
                  <textarea
                    className="form-textarea"
                    rows="6"
                    value={activeResume.coverLetter}
                    onChange={(e) => updateActiveResumeField('coverLetter', e.target.value)}
                    placeholder="Write a draft cover letter tailored to this profile type..."
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
              </div>
            )}

            {/* TAB VIEW: AI INSIGHTS & ATS DIAGNOSTICS */}
            {activeSubTab === 'insights' && activeInsights && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Score Section */}
                <div className="diagnostics-container">
                  
                  {/* Left Column: Radial ATS Ring */}
                  <div className="score-radial-box">
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      ATS Score
                    </span>
                    
                    {/* SVG Progress Circle */}
                    <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                        {/* Background track */}
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="transparent"
                          stroke="rgba(255, 255, 255, 0.05)"
                          strokeWidth="8"
                        />
                        {/* Foreground indicator */}
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="transparent"
                          stroke={getScoreColorHex(activeInsights.atsScore)}
                          strokeWidth="8"
                          strokeDasharray="314.16"
                          strokeDashoffset={314.16 - (activeInsights.atsScore / 100) * 314.16}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                        />
                      </svg>
                      {/* Inner text overlay */}
                      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', fontFamily: 'Space Grotesk, sans-serif' }}>
                          {activeInsights.atsScore}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.2rem' }}>
                          / 100
                        </span>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: getScoreColorHex(activeInsights.atsScore), marginTop: '0.85rem' }}>
                      {getScoreGradeText(activeInsights.atsScore)}
                    </span>
                  </div>

                  {/* Right Column: Breakdown bars */}
                  <div className="score-breakdown-box">
                    <span className="form-label" style={{ fontSize: '0.75rem' }}>Score Diagnostics</span>
                    
                    {/* 1. Section Completeness */}
                    <div className="mini-gauge">
                      <div className="mini-gauge-header">
                        <span>Layout Section Completeness</span>
                        <span>{activeInsights.scoreDetails.sectionScore} / 25 pts</span>
                      </div>
                      <div className="mini-gauge-bar-bg">
                        <div 
                          className="mini-gauge-bar-fill" 
                          style={{ 
                            width: `${(activeInsights.scoreDetails.sectionScore / 25) * 100}%`,
                            background: 'var(--grad-purple)'
                          }}
                        />
                      </div>
                    </div>

                    {/* 2. Quantifiable Impact */}
                    <div className="mini-gauge">
                      <div className="mini-gauge-header">
                        <span>Quantifiable Impact Metrics ({activeInsights.scoreDetails.metricCount} found)</span>
                        <span>{activeInsights.scoreDetails.impactScore} / 25 pts</span>
                      </div>
                      <div className="mini-gauge-bar-bg">
                        <div 
                          className="mini-gauge-bar-fill" 
                          style={{ 
                            width: `${(activeInsights.scoreDetails.impactScore / 25) * 100}%`,
                            background: 'var(--grad-cyan)'
                          }}
                        />
                      </div>
                    </div>

                    {/* 3. Skill Density */}
                    <div className="mini-gauge">
                      <div className="mini-gauge-header">
                        <span>Technical Skill Tag Density</span>
                        <span>{activeInsights.scoreDetails.skillScore} / 25 pts</span>
                      </div>
                      <div className="mini-gauge-bar-bg">
                        <div 
                          className="mini-gauge-bar-fill" 
                          style={{ 
                            width: `${(activeInsights.scoreDetails.skillScore / 25) * 100}%`,
                            background: 'var(--grad-emerald)'
                          }}
                        />
                      </div>
                    </div>

                    {/* 4. Systems & Cloud */}
                    <div className="mini-gauge">
                      <div className="mini-gauge-header">
                        <span>Systems, Cloud & DevOps Tech</span>
                        <span>{activeInsights.scoreDetails.systemsScore} / 25 pts</span>
                      </div>
                      <div className="mini-gauge-bar-bg">
                        <div 
                          className="mini-gauge-bar-fill" 
                          style={{ 
                            width: `${(activeInsights.scoreDetails.systemsScore / 25) * 100}%`,
                            background: 'var(--grad-amber)'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Strengths & Critiques Checklist */}
                <div className="strengths-critiques-grid">
                  
                  {/* Core Strengths */}
                  <div>
                    <span className="form-label" style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--accent-emerald)' }}>
                      ✅ Core Strengths
                    </span>
                    <div className="diagnostic-list">
                      {activeInsights.strengths.map((str, i) => (
                        <div key={i} className="diagnostic-item diagnostic-item-strength">
                          <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>✓</span>
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Formatting & Content Critiques */}
                  <div>
                    <span className="form-label" style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--accent-amber)' }}>
                      ⚠️ Improvement Critiques
                    </span>
                    <div className="diagnostic-list">
                      {activeInsights.critiques.length > 0 ? (
                        activeInsights.critiques.map((crit, i) => (
                          <div key={i} className="diagnostic-item diagnostic-item-critique">
                            <span style={{ color: 'var(--accent-amber)', fontWeight: 'bold' }}>!</span>
                            <span>{crit}</span>
                          </div>
                        ))
                      ) : (
                        <div className="diagnostic-item diagnostic-item-strength">
                          <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>✓</span>
                          <span>Excellent! No critical critiques found. Your profile is ready for parsing.</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Role Alignments */}
                <div>
                  <span className="form-label" style={{ display: 'block', marginBottom: '0.75rem' }}>
                    📈 Career Pathway Alignment
                  </span>
                  <div className="role-match-grid">
                    {Object.entries(activeInsights.roles).map(([role, pct]) => {
                      const badgeClass = pct >= 75 ? 'score-badge-emerald' : pct >= 50 ? 'score-badge-amber' : 'score-badge-red';
                      const badgeText = pct >= 75 ? 'Top Match' : pct >= 50 ? 'Moderate' : 'Low Match';
                      return (
                        <div key={role} className="role-match-card">
                          <div className="role-match-header">
                            <span className="role-match-title">{role}</span>
                            <span className="role-match-percent" style={{ color: pct >= 75 ? 'var(--accent-emerald)' : pct >= 50 ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
                              {pct}%
                            </span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="mini-gauge-bar-bg" style={{ marginBottom: '0.5rem', height: '4px' }}>
                            <div 
                              className="mini-gauge-bar-fill" 
                              style={{ 
                                width: `${pct}%`,
                                background: pct >= 75 ? 'var(--grad-emerald)' : pct >= 50 ? 'var(--grad-amber)' : 'var(--grad-rose)'
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <span className={`role-match-badge ${badgeClass}`}>
                              {badgeText}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>
        ) : (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No resume variant selected. Create one to begin!</p>
          </div>
        )}
      </div>

      {/* Styled Printable Preview Modal */}
      {showPreview && activeResume && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', background: '#ffffff', color: '#1e293b' }}>
            <div className="modal-header" style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
              <h2 className="modal-title" style={{ color: '#0f172a' }}>📄 Formatted Resume Preview</h2>
              <button className="modal-close" style={{ color: '#64748b' }} onClick={() => setShowPreview(false)}>
                &times;
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '2.5rem', background: 'white', fontFamily: 'Inter, sans-serif', color: '#334155', lineHeight: '1.6' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h1 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.5px' }}>VANSH AGRAWAL</h1>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.2rem' }}>
                  Software Engineer & Developer
                </p>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem' }}>
                  📧 vansh.agrawal@email.com | 📱 +91 9876543210 | 🌐 github.com/vansh
                </p>
              </div>

              {/* Skills Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#0f172a', fontSize: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Skills & Expertise
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#334155' }}>
                  {activeResume.skills.join(' • ')}
                </p>
              </div>

              {/* Experience Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#0f172a', fontSize: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Work Experience
                </h3>
                <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-line', color: '#334155' }}>
                  {activeResume.experience}
                </div>
              </div>

              {/* Projects Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#0f172a', fontSize: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Academic & Personal Projects
                </h3>
                <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-line', color: '#334155' }}>
                  {activeResume.projects}
                </div>
              </div>

              {/* Education Mock */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#0f172a', fontSize: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Education
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>
                  <span>Bachelor of Technology in Computer Science</span>
                  <span>Expected 2027</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                  <span>University of Technology</span>
                  <span>GPA: 9.2/10.0</span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', marginRight: 'auto' }}>
                💡 Tip: Use your browser print option (Ctrl+P) to print this layout directly to PDF.
              </span>
              <button className="btn btn-secondary" style={{ color: '#0f172a' }} onClick={() => setShowPreview(false)}>
                Close
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => window.print()}
              >
                🖨️ Print Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled File Upload & Parse Console Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">📂 Resume Extractor & Parser</h2>
              <button className="modal-close" onClick={() => { setShowUploadModal(false); setUploadingFile(null); }}>
                &times;
              </button>
            </div>
            
            <div className="modal-body" style={{ minHeight: '260px' }}>
              
              {parsingStep === -1 && (
                // PRE-PARSING CONFIGURATION / CAPTURE PASTE STATE
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>File Selected:</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent-purple)' }}>{uploadingFile?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Size: {uploadingFile ? (uploadingFile.size / 1024).toFixed(1) : 0} KB | Type: {uploadingFile?.type || 'Unknown'}
                    </div>
                  </div>

                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      We will run a local layout structure scanner on your document. 
                      {uploadingFile && !uploadingFile.name.endsWith('.txt') && !uploadingFile.name.endsWith('.md') && (
                        <span style={{ color: 'var(--accent-amber)', fontWeight: '600' }}>
                          {' '}Note: For PDF/DOCX files, pasting the plain text below is highly recommended to guarantee perfect skill tagging.
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--text-primary)' }}>
                      Paste Resume Plain Text (Recommended for PDF/DOCX)
                    </label>
                    <textarea
                      className="form-textarea"
                      rows="6"
                      placeholder="Open your resume file, copy all text (Ctrl+A then Ctrl+C), and paste it here..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      style={{ fontSize: '0.85rem', background: 'rgba(10, 15, 26, 0.8)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button type="button" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem' }} onClick={startAnalysisScan}>
                      🚀 Start AI Analysis & Parser Scan
                    </button>
                  </div>
                </div>
              )}

              {parsingStep >= 0 && parsingStep < 4 && (
                // RUNNING SCANS CONSOLE LOADING
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      border: '3px solid rgba(157, 78, 221, 0.1)',
                      borderTop: '3px solid var(--accent-purple)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                      Parsing file: <span style={{ color: 'var(--accent-purple)' }}>{uploadingFile?.name}</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: parsingStep >= 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      <span>{parsingStep > 0 ? '✅' : '⚙️'}</span>
                      <span>Reading file structures & plain text streams...</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: parsingStep >= 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      <span>{parsingStep > 1 ? '✅' : parsingStep === 1 ? '⚙️' : '⚪'}</span>
                      <span>Normalizing formatting boundaries and paragraphs...</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: parsingStep >= 2 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      <span>{parsingStep > 2 ? '✅' : parsingStep === 2 ? '⚙️' : '⚪'}</span>
                      <span>Running entity classification & matching {KEYWORDS_LIST.length} core keywords...</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: parsingStep >= 3 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      <span>{parsingStep > 3 ? '✅' : parsingStep === 3 ? '⚙️' : '⚪'}</span>
                      <span>Compiling ATS scores & profile metadata insights...</span>
                    </div>
                  </div>
                </div>
              )}

              {parsingStep === 4 && parsedData && (
                // REVIEW EXTRACTED DETAILS
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '500' }}>
                    🎉 Scan Complete! We successfully parsed the document structure. Please review the details below.
                  </div>

                  <div className="form-group">
                    <label className="form-label">Variant Profile Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={parsedData.name}
                      onChange={(e) => setParsedData({ ...parsedData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Extracted Skills</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      {parsedData.skills.map((s) => (
                        <span key={s} style={{ fontSize: '0.75rem', background: 'rgba(157,78,221,0.1)', color: 'var(--accent-purple)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>You will be able to edit, add, or delete skills after saving.</p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Extracted Experience</label>
                    <textarea
                      className="form-textarea"
                      rows="4"
                      value={parsedData.experience}
                      onChange={(e) => setParsedData({ ...parsedData, experience: e.target.value })}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Extracted Projects</label>
                    <textarea
                      className="form-textarea"
                      rows="4"
                      value={parsedData.projects}
                      onChange={(e) => setParsedData({ ...parsedData, projects: e.target.value })}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadingFile(null);
                  setParsedData(null);
                  setPastedText('');
                }}
              >
                {parsingStep < 4 ? 'Cancel' : 'Discard'}
              </button>
              {parsingStep === 4 && (
                <button type="button" className="btn btn-primary" onClick={handleSaveParsed}>
                  Confirm & Import Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
