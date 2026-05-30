import React, { useState, useEffect } from 'react';
import './ProfileScreen.css';
import { dbService } from '../../../services/firebase';

export default function ProfileScreen({ user }) {
  const [profile, setProfile] = useState({
    fullName: '', title: '', email: '', phone: '', location: '',
    github: '', linkedin: '', website: '', bio: '', skills: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (user?.uid) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    const data = await dbService.getUserProfile(user.uid);
    setProfile(data);
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await dbService.updateUserProfile(user.uid, profile);
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

  if (loading) return <div style={{ padding: '2rem' }}>Loading profile...</div>;

  const calculateCompletion = () => {
    const fields = ['fullName', 'title', 'email', 'phone', 'location', 'github', 'linkedin', 'bio'];
    const filled = fields.filter(f => profile[f] && profile[f].trim() !== '').length;
    const skillsFilled = profile.skills.length > 0 ? 1 : 0;
    return Math.round(((filled + skillsFilled) / (fields.length + 1)) * 100);
  };

  return (
    <div className="profile-screen bento-grid">
      <div className="span-12 profile-header">
        <div className="profile-header-left">
          <h1>Candidate Profile</h1>
          <p>Manage your personal details and professional links.</p>
        </div>
        <div className="profile-header-actions">
           {!isEditing ? (
             <button className="btn-pill btn-pill-primary" onClick={() => setIsEditing(true)}>
               <span className="material-symbols-outlined">edit</span>
               Edit Profile
             </button>
           ) : (
             <button className="btn-pill btn-pill-primary" onClick={handleSave} disabled={saving}>
               {saving ? 'Saving...' : 'Save Changes'}
             </button>
           )}
        </div>
      </div>

      <div className="bento-card profile-completion-card">
         <div className="completion-avatar">{profile.fullName ? profile.fullName.substring(0, 2).toUpperCase() : 'VA'}</div>
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

      <div className="bento-card profile-section-card">
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

      <div className="bento-card profile-section-card">
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
        </div>
      </div>

      <div className="bento-card profile-section-card full-width">
        <div className="section-header">
          <h3 className="section-title"><span className="material-symbols-outlined">description</span> Professional Bio</h3>
        </div>
        <div className="profile-field-grid single-col">
           <div className="profile-field">
            {isEditing ? <textarea name="bio" className="profile-edit-textarea" value={profile.bio} onChange={handleChange} /> : <span className="profile-field-value">{profile.bio || <span className="empty">Write a short professional summary...</span>}</span>}
          </div>
        </div>
      </div>

      <div className="bento-card profile-section-card full-width">
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

      {showToast && (
        <div className="save-notification">
          <span className="material-symbols-outlined">check_circle</span>
          Profile saved successfully!
        </div>
      )}
    </div>
  );
}
