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
    <div className="profile-screen bento-grid animate-fade-in">
      <div className="span-12 profile-header">
        <div className="profile-header-left">
          <h1>Candidate Profile</h1>
          <p>Manage your personal details and professional links.</p>
        </div>
        <div className="profile-header-actions">
           {!isEditing ? (
             <button className="btn-pill btn-pill-primary" onClick={() => setIsEditing(true)} aria-label="Edit Profile">
               <span className="material-symbols-outlined">edit</span>
               <span className="btn-text">Edit Profile</span>
             </button>
           ) : (
             <button className="btn-pill btn-pill-primary" onClick={handleSave} disabled={saving} aria-label="Save Changes">
               <span className={`material-symbols-outlined ${saving ? 'icon-spin' : ''}`}>{saving ? 'sync' : 'save'}</span>
               <span className="btn-text">{saving ? 'Saving...' : 'Save Changes'}</span>
             </button>
           )}
        </div>
      </div>

      <div className="bento-card profile-completion-card animate-slide-up delay-100">
         <div className="avatar-wrapper" style={{ position: 'relative' }}>
           <div className="completion-avatar" style={{ position: 'relative', overflow: 'hidden' }}>
             {profile.avatarUrl ? (
               <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
             ) : (
               profile.fullName ? profile.fullName.substring(0, 2).toUpperCase() : 'VA'
             )}
             {isEditing && (
               <label className="avatar-upload-overlay" style={{
                 position: 'absolute',
                 inset: 0,
                 background: 'rgba(15, 23, 42, 0.6)',
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
         <div className="completion-details">
           <h3 className="completion-name">{profile.fullName || 'Complete your profile'}</h3>
           <p className="completion-title">{profile.title || 'Add your current role'}</p>
           <div className="completion-bar-wrapper">
             <div className="completion-bar-track">
               <div className="completion-bar-fill" style={{ width: `${calculateCompletion()}%` }}></div>
             </div>
             <span className="completion-percent">{calculateCompletion()}%</span>
           </div>
         </div>
      </div>

      <div className="bento-card profile-section-card animate-slide-up delay-200">
        <div className="section-header">
          <h3 className="section-title"><span className="material-symbols-outlined">person</span> Personal Details</h3>
        </div>
        <div className="profile-field-grid">
          <div className="profile-field">
            <span className="profile-field-label">Full Name</span>
            {isEditing ? <input type="text" name="fullName" className="profile-edit-input" value={profile.fullName} onChange={handleChange} /> : <span className="profile-field-value">{profile.fullName}</span>}
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Professional Title</span>
            {isEditing ? <input type="text" name="title" className="profile-edit-input" value={profile.title} onChange={handleChange} /> : <span className="profile-field-value">{profile.title}</span>}
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Email</span>
            {isEditing ? <input type="email" name="email" className="profile-edit-input" value={profile.email} onChange={handleChange} disabled /> : <span className="profile-field-value">{profile.email}</span>}
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Phone</span>
            {isEditing ? <input type="text" name="phone" className="profile-edit-input" value={profile.phone} onChange={handleChange} /> : <span className="profile-field-value">{profile.phone || <span className="empty">Not provided</span>}</span>}
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Location</span>
            {isEditing ? <input type="text" name="location" className="profile-edit-input" value={profile.location} onChange={handleChange} /> : <span className="profile-field-value">{profile.location || <span className="empty">Not provided</span>}</span>}
          </div>
        </div>
      </div>

      <div className="bento-card profile-section-card animate-slide-up delay-300">
        <div className="section-header">
          <h3 className="section-title"><span className="material-symbols-outlined">link</span> Professional Links</h3>
        </div>
        <div className="profile-field-grid single-col">
          <div className="profile-field">
            <span className="profile-field-label">LinkedIn</span>
            {isEditing ? <input type="text" name="linkedin" className="profile-edit-input" value={profile.linkedin} onChange={handleChange} /> : <a href={profile.linkedin} target="_blank" rel="noreferrer" className="profile-field-value">{profile.linkedin || <span className="empty">Not provided</span>}</a>}
          </div>
          <div className="profile-field">
            <span className="profile-field-label">GitHub</span>
            {isEditing ? <input type="text" name="github" className="profile-edit-input" value={profile.github} onChange={handleChange} /> : <a href={profile.github} target="_blank" rel="noreferrer" className="profile-field-value">{profile.github || <span className="empty">Not provided</span>}</a>}
          </div>
          <div className="profile-field">
            <span className="profile-field-label">Personal Website</span>
            {isEditing ? <input type="text" name="website" className="profile-edit-input" value={profile.website} onChange={handleChange} /> : <a href={profile.website} target="_blank" rel="noreferrer" className="profile-field-value">{profile.website || <span className="empty">Not provided</span>}</a>}
          </div>
          <div className="profile-field">
            <span className="profile-field-label">LeetCode Username</span>
            {isEditing ? <input type="text" name="leetcode" className="profile-edit-input" value={profile.leetcode || ''} onChange={handleChange} /> : profile.leetcode ? <a href={`https://leetcode.com/${profile.leetcode}`} target="_blank" rel="noreferrer" className="profile-field-value">{profile.leetcode}</a> : <span className="profile-field-value empty">Not provided</span>}
          </div>
        </div>
      </div>

      <div className="bento-card profile-section-card full-width animate-slide-up delay-400">
        <div className="section-header">
          <h3 className="section-title"><span className="material-symbols-outlined">description</span> Professional Bio</h3>
        </div>
        <div className="profile-field-grid single-col">
           <div className="profile-field">
            {isEditing ? <textarea name="bio" className="profile-edit-textarea" value={profile.bio} onChange={handleChange} /> : <span className="profile-field-value">{profile.bio || <span className="empty">Write a short professional summary...</span>}</span>}
          </div>
        </div>
      </div>

      <div className="bento-card profile-section-card full-width animate-slide-up delay-500">
        <div className="section-header">
          <h3 className="section-title"><span className="material-symbols-outlined">psychology</span> Technical Skills</h3>
        </div>
        <div className="skills-list">
          {profile.skills.map(skill => (
            <span key={skill} className="skill-tag">
              {skill}
              {isEditing && (
                <button className="skill-tag-remove" onClick={() => handleRemoveSkill(skill)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </span>
          ))}
          {profile.skills.length === 0 && !isEditing && <span className="profile-field-value empty">No skills added yet</span>}
        </div>
        {isEditing && (
          <div className="skill-add-row" style={{ maxWidth: '300px' }}>
            <input 
              type="text" 
              className="skill-add-input" 
              placeholder="Add a skill..." 
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
            />
            <button className="skill-add-btn" onClick={handleAddSkill}>
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        )}
      </div>

      <div className="bento-card profile-section-card full-width animate-slide-up delay-600">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="section-title"><span className="material-symbols-outlined">folder_special</span> Indexed Portfolio Projects</h3>
          <span className="pa-project-tag" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            Used for JD Analysis
          </span>
        </div>
        <div className="projects-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {loadingProjects ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading indexed projects...</div>
          ) : portfolioProjects.length > 0 ? (
            portfolioProjects.map(project => (
              <div key={project.id} style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-primary)', position: 'relative' }}>
                {editingProjectId === project.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Title *</label>
                      <input 
                        type="text" 
                        value={editProjectData.title} 
                        onChange={(e) => setEditProjectData({...editProjectData, title: e.target.value})}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Description *</label>
                      <textarea 
                        value={editProjectData.description} 
                        onChange={(e) => setEditProjectData({...editProjectData, description: e.target.value})}
                        rows={3}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Technologies (comma separated)</label>
                      <input 
                        type="text" 
                        value={editProjectData.technologies} 
                        onChange={(e) => setEditProjectData({...editProjectData, technologies: e.target.value})}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Metrics (optional)</label>
                      <input 
                        type="text" 
                        value={editProjectData.metrics} 
                        onChange={(e) => setEditProjectData({...editProjectData, metrics: e.target.value})}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button className="btn-pill btn-pill-secondary" onClick={handleCancelEditProject} disabled={savingProject}>Cancel</button>
                      <button className="btn-pill btn-pill-primary" onClick={() => handleSaveProject(project.id)} disabled={savingProject}>{savingProject ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEditProjectClick(project)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>edit</span>
                      </button>
                      <button onClick={() => handleDeleteProject(project.id)} style={{ background: 'none', border: 'none', color: 'var(--error-color, #ef4444)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>delete</span>
                      </button>
                    </div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', paddingRight: '4rem' }}>{project.title}</h4>
                    {project.description && (
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>{project.description}</p>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                        {project.technologies.map((tech, idx) => (
                          <span key={idx} style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{tech}</span>
                        ))}
                      </div>
                    )}
                    {project.metrics && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>bar_chart</span>
                        {project.metrics}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="profile-field-value empty">
              No projects indexed yet. Use the <strong>Project Auditor</strong> to add projects.
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <div className="save-notification">
          <span className="material-symbols-outlined">check_circle</span>
          Profile saved successfully!
        </div>
      )}
    </div>
  );
}
