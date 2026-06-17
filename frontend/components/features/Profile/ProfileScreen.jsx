import React, { useState, useEffect } from 'react';
import './ProfileScreen.css';
import { dbService } from '../../../services/firebase';
import { useProfile } from '../../../contexts/ProfileContext';
import { getBackendUrl } from '../../../utils/config';

export default function ProfileScreen({ user }) {
  const { profile: globalProfile, refreshProfile } = useProfile();
  const backendUrl = getBackendUrl();

  const [profile, setProfile] = useState({
    fullName: '', title: '', email: '', phone: '', location: '',
    github: '', linkedin: '', website: '', leetcode: '', bio: '', skills: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [portfolioProjects, setPortfolioProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjectData, setEditProjectData] = useState({ title: '', description: '', technologies: '', metrics: '' });
  const [savingProject, setSavingProject] = useState(false);

  useEffect(() => {
    if (globalProfile) {
      setProfile(globalProfile);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [globalProfile]);

  const loadPortfolioProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch(`${backendUrl}/api/portfolio/list`);
      if (response.ok) {
        const data = await response.json();
        setPortfolioProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to load portfolio projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    loadPortfolioProjects();
    
    // Listen for portfolio updates (from Project Auditor)
    const handlePortfolioUpdate = () => loadPortfolioProjects();
    document.addEventListener('pos:portfolio-updated', handlePortfolioUpdate);
    return () => document.removeEventListener('pos:portfolio-updated', handlePortfolioUpdate);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Please upload an image smaller than 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await dbService.updateUserProfile(user.uid, profile);
    await refreshProfile();
    document.dispatchEvent(new CustomEvent('pos:profile-updated', { detail: profile }));
    setSaving(false);
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleEditProjectClick = (project) => {
    setEditingProjectId(project.id);
    setEditProjectData({
      title: project.title,
      description: project.description || '',
      technologies: project.technologies ? project.technologies.join(', ') : '',
      metrics: project.metrics || ''
    });
  };

  const handleCancelEditProject = () => {
    setEditingProjectId(null);
    setEditProjectData({ title: '', description: '', technologies: '', metrics: '' });
  };

  const handleSaveProject = async (projectId) => {
    if (!editProjectData.title.trim() || !editProjectData.description.trim()) {
      alert("Title and description are required.");
      return;
    }
    
    setSavingProject(true);
    try {
      const payload = {
        id: projectId,
        title: editProjectData.title.trim(),
        description: editProjectData.description.trim(),
        technologies: editProjectData.technologies.split(',').map(s => s.trim()).filter(Boolean),
        metrics: editProjectData.metrics.trim() || undefined
      };

      const response = await fetch(`${backendUrl}/api/portfolio/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setEditingProjectId(null);
        loadPortfolioProjects();
        document.dispatchEvent(new CustomEvent('pos:portfolio-updated'));
      } else {
        alert("Failed to save project.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving project.");
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    
    try {
      const response = await fetch(`${backendUrl}/api/portfolio/${projectId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        loadPortfolioProjects();
        document.dispatchEvent(new CustomEvent('pos:portfolio-updated'));
      } else {
        alert("Failed to delete project.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting project.");
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading profile...</div>;

  const calculateCompletion = () => {
    const fields = ['fullName', 'title', 'email', 'phone', 'location', 'github', 'linkedin', 'leetcode', 'bio'];
    const filled = fields.filter(f => profile[f] && profile[f].trim() !== '').length;
    const skillsFilled = profile.skills.length > 0 ? 1 : 0;
    return Math.round(((filled + skillsFilled) / (fields.length + 1)) * 100);
  };

  return (
    <div className={`profile-screen animate-fade-in ${isEditing ? 'editing' : ''}`}>
      {/* Modern profile banner area */}
      <div className="profile-banner-container">
        <div className="profile-cover-banner"></div>
        <div className="profile-banner-content">
          <div className="profile-avatar-container">
            <div className="profile-avatar-wrapper">
              <div className="completion-avatar">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  profile.fullName ? profile.fullName.substring(0, 2).toUpperCase() : 'VA'
                )}
                {isEditing && (
                  <label className="avatar-upload-overlay" style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    zIndex: 2
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.6rem', color: '#ffffff' }}>photo_camera</span>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
              {isEditing && (
                <label className="avatar-edit-badge" style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  border: '2px solid var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  zIndex: 3,
                  transition: 'all 0.2s ease'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#ffffff' }}>edit</span>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </label>
              )}
            </div>
            <div className="avatar-status-badge">
              <span className="status-dot"></span>
              Active Profile
            </div>
          </div>
          
          <div className="profile-main-meta">
            <div className="profile-meta-left">
              <h1 className="profile-name">{profile.fullName || 'Complete your profile'}</h1>
              <p className="profile-title">{profile.title || 'Add your professional title'}</p>
              {profile.location && (
                <p className="profile-location">
                  <span className="material-symbols-outlined">location_on</span>
                  {profile.location}
                </p>
              )}
            </div>
            <div className="profile-meta-actions">
               {!isEditing ? (
                 <button className="btn-pill btn-pill-primary" onClick={() => setIsEditing(true)} aria-label="Edit Profile">
                   <span className="material-symbols-outlined">edit</span>
                   <span className="btn-text">Edit Profile</span>
                 </button>
               ) : (
                 <div className="edit-actions-group" style={{ display: 'flex', gap: '0.75rem' }}>
                   <button className="btn-pill btn-pill-secondary" onClick={() => { setIsEditing(false); refreshProfile(); }} aria-label="Cancel Editing">
                     <span className="btn-text">Cancel</span>
                   </button>
                   <button className="btn-pill btn-pill-primary" onClick={handleSave} disabled={saving} aria-label="Save Changes">
                     <span className={`material-symbols-outlined ${saving ? 'icon-spin' : ''}`}>{saving ? 'sync' : 'save'}</span>
                     <span className="btn-text">{saving ? 'Saving...' : 'Save Changes'}</span>
                   </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-grid bento-grid">
        {/* Left Column (Overview & Profile Strength) */}
        <div className="profile-sidebar span-4">
          {/* Profile Strength Card */}
          <div className="bento-card profile-strength-card">
            <h4 className="card-subtitle-premium">Profile Strength</h4>
            <div className="circular-progress-container">
              <svg className="progress-ring" width="120" height="120">
                <circle className="progress-ring-bg" stroke="var(--bg-secondary)" strokeWidth="8" fill="transparent" r="50" cx="60" cy="60" />
                <circle 
                  className="progress-ring-fill" 
                  stroke="url(#progress-gradient)" 
                  strokeWidth="8" 
                  fill="transparent" 
                  r="50" 
                  cx="60" 
                  cy="60"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - calculateCompletion() / 100)}`}
                />
                <defs>
                  <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="progress-percentage-label">
                <span className="progress-val">{calculateCompletion()}%</span>
                <span className="progress-lbl">Complete</span>
              </div>
            </div>
            
            <div className="strength-feedback">
              {calculateCompletion() < 100 ? (
                <>
                  <p className="strength-tip-header">Next steps to level up:</p>
                  <ul className="strength-tips">
                    {!profile.fullName && <li><span className="bullet"></span> Add your Full Name</li>}
                    {!profile.title && <li><span className="bullet"></span> Add your Title</li>}
                    {!profile.phone && <li><span className="bullet"></span> Add your Phone number</li>}
                    {!profile.location && <li><span className="bullet"></span> Add your Location</li>}
                    {!profile.linkedin && <li><span className="bullet"></span> Link LinkedIn Profile</li>}
                    {!profile.github && <li><span className="bullet"></span> Link GitHub Profile</li>}
                    {!profile.leetcode && <li><span className="bullet"></span> Add LeetCode Username</li>}
                    {!profile.bio && <li><span className="bullet"></span> Write your Bio</li>}
                    {profile.skills.length === 0 && <li><span className="bullet"></span> Add Technical Skills</li>}
                  </ul>
                </>
              ) : (
                <p className="strength-success-msg">
                  <span className="material-symbols-outlined">verified</span>
                  All set! Your profile is 100% complete.
                </p>
              )}
            </div>
          </div>

          {/* Social / Professional Platforms Card */}
          <div className="bento-card social-platforms-card">
            <h4 className="card-subtitle-premium"><span className="material-symbols-outlined">share</span> Professional Links</h4>
            <div className="social-links-list">
              {/* GitHub link */}
              <div className="social-link-item github">
                <span className="social-icon-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </span>
                <div className="social-link-details">
                  <span className="social-link-name">GitHub</span>
                  {isEditing ? (
                    <input type="text" name="github" className="profile-edit-input compact" placeholder="https://github.com/username" value={profile.github} onChange={handleChange} />
                  ) : profile.github ? (
                    <a href={profile.github} target="_blank" rel="noreferrer" className="social-link-val">{profile.github.replace(/https?:\/\/(www\.)?github\.com\//, '')}</a>
                  ) : (
                    <button className="add-field-btn" onClick={() => setIsEditing(true)}>+ Add Github link</button>
                  )}
                </div>
              </div>

              {/* LinkedIn link */}
              <div className="social-link-item linkedin">
                <span className="social-icon-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </span>
                <div className="social-link-details">
                  <span className="social-link-name">LinkedIn</span>
                  {isEditing ? (
                    <input type="text" name="linkedin" className="profile-edit-input compact" placeholder="https://linkedin.com/in/username" value={profile.linkedin} onChange={handleChange} />
                  ) : profile.linkedin ? (
                    <a href={profile.linkedin} target="_blank" rel="noreferrer" className="social-link-val">{profile.linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</a>
                  ) : (
                    <button className="add-field-btn" onClick={() => setIsEditing(true)}>+ Add LinkedIn link</button>
                  )}
                </div>
              </div>

              {/* LeetCode link */}
              <div className="social-link-item leetcode">
                <span className="social-icon-wrapper">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ffffff' }}>code_blocks</span>
                </span>
                <div className="social-link-details">
                  <span className="social-link-name">LeetCode</span>
                  {isEditing ? (
                    <input type="text" name="leetcode" className="profile-edit-input compact" placeholder="username" value={profile.leetcode || ''} onChange={handleChange} />
                  ) : profile.leetcode ? (
                    <a href={`https://leetcode.com/${profile.leetcode}`} target="_blank" rel="noreferrer" className="social-link-val">{profile.leetcode}</a>
                  ) : (
                    <button className="add-field-btn" onClick={() => setIsEditing(true)}>+ Add LeetCode user</button>
                  )}
                </div>
              </div>

              {/* Website link */}
              <div className="social-link-item website">
                <span className="social-icon-wrapper">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ffffff' }}>language</span>
                </span>
                <div className="social-link-details">
                  <span className="social-link-name">Portfolio Website</span>
                  {isEditing ? (
                    <input type="text" name="website" className="profile-edit-input compact" placeholder="https://portfolio.com" value={profile.website} onChange={handleChange} />
                  ) : profile.website ? (
                    <a href={profile.website} target="_blank" rel="noreferrer" className="social-link-val">{profile.website.replace(/https?:\/\/(www\.)?/, '')}</a>
                  ) : (
                    <button className="add-field-btn" onClick={() => setIsEditing(true)}>+ Add website URL</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Technical Skills Card */}
          <div className="bento-card skills-card">
            <div className="section-header">
              <h3 className="section-title"><span className="material-symbols-outlined">psychology</span> Technical Expertise</h3>
            </div>
            <div className="skills-area">
              {profile.skills.length > 0 ? (
                <div className="skills-list-grid">
                  {profile.skills.map(skill => (
                    <div key={skill} className="skill-badge-premium">
                      <span className="skill-text">{skill}</span>
                      {isEditing && (
                        <button className="skill-remove-btn-icon" onClick={() => handleRemoveSkill(skill)} aria-label={`Remove ${skill}`}>
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                !isEditing && (
                  <div className="empty-state-clickable" onClick={() => setIsEditing(true)}>
                    <span className="material-symbols-outlined empty-icon">psychology</span>
                    <p>No technical skills listed. Add your core languages, frameworks, or tools.</p>
                    <button className="btn-pill btn-pill-secondary btn-sm" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>+ Add Skills</button>
                  </div>
                )
              )}
              
              {isEditing && (
                <div className="skills-adder-control">
                  <input 
                    type="text" 
                    className="skill-add-input-premium" 
                    placeholder="Add a skill (e.g. React) and press Enter" 
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <button className="skill-add-btn-premium" onClick={handleAddSkill}>
                    <span className="material-symbols-outlined">add</span>
                    <span>Add</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Bio, Details, Skills, Projects) */}
        <div className="profile-main span-8">
          {/* Bio Card */}
          <div className="bento-card bio-card">
            <div className="section-header">
              <h3 className="section-title"><span className="material-symbols-outlined">description</span> Professional Summary</h3>
            </div>
            <div className="bio-content">
              {isEditing ? (
                <textarea name="bio" className="profile-edit-textarea" placeholder="Write a short, compelling professional summary. Highlight your core background, tech stack, and what you aim to build or achieve..." value={profile.bio} onChange={handleChange} />
              ) : profile.bio ? (
                <p className="profile-bio-text">{profile.bio}</p>
              ) : (
                <div className="empty-state-clickable" onClick={() => setIsEditing(true)}>
                  <span className="material-symbols-outlined empty-icon">edit_note</span>
                  <p>Describe your background and goals so employers get to know you.</p>
                  <button className="btn-pill btn-pill-secondary btn-sm" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>+ Write Summary</button>
                </div>
              )}
            </div>
          </div>

          {/* Personal Details Card */}
          <div className="bento-card details-card">
            <div className="section-header">
              <h3 className="section-title"><span className="material-symbols-outlined">contact_page</span> Personal & Contact Details</h3>
            </div>
            <div className="profile-details-grid">
              <div className="detail-item">
                <div className="detail-icon-box">
                  <span className="material-symbols-outlined">badge</span>
                </div>
                <div className="detail-info">
                  <span className="detail-label">Full Name</span>
                  {isEditing ? (
                    <input type="text" name="fullName" className="profile-edit-input" value={profile.fullName} onChange={handleChange} />
                  ) : (
                    <span className="detail-value">{profile.fullName || <span className="empty">Not provided</span>}</span>
                  )}
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-box">
                  <span className="material-symbols-outlined">work</span>
                </div>
                <div className="detail-info">
                  <span className="detail-label">Target Title / Current Role</span>
                  {isEditing ? (
                    <input type="text" name="title" className="profile-edit-input" value={profile.title} onChange={handleChange} />
                  ) : (
                    <span className="detail-value">{profile.title || <span className="empty">Not provided</span>}</span>
                  )}
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-box">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div className="detail-info">
                  <span className="detail-label">Email Address</span>
                  {isEditing ? (
                    <input type="email" name="email" className="profile-edit-input" value={profile.email} onChange={handleChange} disabled title="Email is managed by Auth" />
                  ) : (
                    <span className="detail-value">{profile.email}</span>
                  )}
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-box">
                  <span className="material-symbols-outlined">phone</span>
                </div>
                <div className="detail-info">
                  <span className="detail-label">Phone Number</span>
                  {isEditing ? (
                    <input type="text" name="phone" className="profile-edit-input" value={profile.phone} onChange={handleChange} />
                  ) : (
                    <span className="detail-value">{profile.phone || <button className="add-field-btn" onClick={() => setIsEditing(true)}>+ Add phone</button>}</span>
                  )}
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-box">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div className="detail-info">
                  <span className="detail-label">Location</span>
                  {isEditing ? (
                    <input type="text" name="location" className="profile-edit-input" value={profile.location} onChange={handleChange} />
                  ) : (
                    <span className="detail-value">{profile.location || <button className="add-field-btn" onClick={() => setIsEditing(true)}>+ Add location</button>}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Projects Card */}
          <div className="bento-card portfolio-card-list">
            <div className="section-header project-header-flex">
              <div className="project-header-left">
                <h3 className="section-title"><span className="material-symbols-outlined">folder_special</span> Indexed Portfolio Projects</h3>
                <p className="project-header-desc">These projects are automatically audited and used by the AI Agent to evaluate your job description fit.</p>
              </div>
              <span className="info-badge-premium">
                <span className="material-symbols-outlined">auto_awesome</span>
                Used for JD matching
              </span>
            </div>

            <div className="projects-container-list">
              {loadingProjects ? (
                <div className="projects-loading-state">
                  <div className="spinner-bubble"></div>
                  Loading portfolio database...
                </div>
              ) : portfolioProjects.length > 0 ? (
                <div className="projects-list-items">
                  {portfolioProjects.map(project => (
                    <div key={project.id} className="project-card-premium">
                      {editingProjectId === project.id ? (
                        <div className="project-inline-editor">
                          <h4 className="editor-section-title">Edit Project Details</h4>
                          <div className="editor-grid">
                            <div className="editor-field" style={{ gridColumn: 'span 12' }}>
                              <label>Project Title *</label>
                              <input 
                                type="text" 
                                className="profile-edit-input"
                                value={editProjectData.title} 
                                onChange={(e) => setEditProjectData({...editProjectData, title: e.target.value})}
                              />
                            </div>
                            <div className="editor-field" style={{ gridColumn: 'span 12' }}>
                              <label>Description *</label>
                              <textarea 
                                className="profile-edit-textarea"
                                value={editProjectData.description} 
                                onChange={(e) => setEditProjectData({...editProjectData, description: e.target.value})}
                                rows={3}
                              />
                            </div>
                            <div className="editor-field" style={{ gridColumn: 'span 6' }}>
                              <label>Technologies (comma separated)</label>
                              <input 
                                type="text" 
                                className="profile-edit-input"
                                value={editProjectData.technologies} 
                                placeholder="React, Node.js, Express"
                                onChange={(e) => setEditProjectData({...editProjectData, technologies: e.target.value})}
                              />
                            </div>
                            <div className="editor-field" style={{ gridColumn: 'span 6' }}>
                              <label>Metrics / Achievements (optional)</label>
                              <input 
                                type="text" 
                                className="profile-edit-input"
                                value={editProjectData.metrics} 
                                placeholder="Boosted performance by 25%"
                                onChange={(e) => setEditProjectData({...editProjectData, metrics: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="editor-actions-row">
                            <button className="btn-pill btn-pill-secondary btn-sm" onClick={handleCancelEditProject} disabled={savingProject}>Cancel</button>
                            <button className="btn-pill btn-pill-primary btn-sm" onClick={() => handleSaveProject(project.id)} disabled={savingProject}>
                              {savingProject ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="project-card-content">
                          <div className="project-card-header">
                            <h4 className="project-card-title">{project.title}</h4>
                            <div className="project-card-actions">
                              <button className="project-action-btn edit" onClick={() => handleEditProjectClick(project)} title="Edit Project">
                                <span className="material-symbols-outlined">edit</span>
                              </button>
                              <button className="project-action-btn delete" onClick={() => handleDeleteProject(project.id)} title="Delete Project">
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </div>
                          </div>
                          
                          {project.description && (
                            <p className="project-card-desc">{project.description}</p>
                          )}
                          
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="project-tech-pills">
                              {project.technologies.map((tech, idx) => (
                                <span key={idx} className="tech-pill-tag">{tech}</span>
                              ))}
                            </div>
                          )}
                          
                          {project.metrics && (
                            <div className="project-card-metrics">
                              <span className="material-symbols-outlined metrics-icon">trending_up</span>
                              <span className="metrics-value-text">{project.metrics}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-project-state">
                  <span className="material-symbols-outlined empty-projects-icon">folder_open</span>
                  <p>No projects indexed in your portfolio yet.</p>
                  <span className="subtext">Use the <strong>Project Auditor</strong> to automatically audit, grade, and ingest your repositories.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}
