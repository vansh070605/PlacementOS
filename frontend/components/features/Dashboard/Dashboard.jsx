import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { curriculumData } from '../Trackers/curriculumData';
import { useProfile } from '../../../contexts/ProfileContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getBackendUrl } from '../../../utils/config';

export default function Dashboard({ applications, dsaProgress, goals, setGoals, setActiveTab }) {
  const { profile } = useProfile();
  const { settings } = useTheme();
  const leetcodeUsername = profile?.leetcode;

  const [configOpen, setConfigOpen] = useState(false);
  const [tempGoals, setTempGoals] = useState({ ...goals });
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Fetch portfolio list for project stats
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const BACKEND_URL = getBackendUrl();
        const response = await fetch(`${BACKEND_URL}/api/portfolio/list`);
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error('Failed to fetch projects for dashboard:', err);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Calculate Metrics
  const totalApps = applications.length;
  const activeInterviews = applications.filter((a) => a.status === 'interviewing').length;
  const offersReceived = applications.filter((a) => a.status === 'offered').length;
  const solvedDSA = dsaProgress.questions.filter((q) => q.status === 'Solved').length;

  // Calculate weekly applications count (in the last 7 days)
  const getWeeklyAppsCount = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return applications.filter((app) => {
      if (!app.date) return false;
      const appDate = new Date(app.date);
      return appDate >= sevenDaysAgo;
    }).length;
  };

  const weeklyAppsCount = getWeeklyAppsCount();
  const weeklyAppsPercent = Math.min(100, Math.round((weeklyAppsCount / goals.weeklyApplications) * 100)) || 0;
  const weeklyDSAPercent = Math.min(100, Math.round((solvedDSA / goals.weeklyDSAQuestions) * 100)) || 0;
  const offersPercent = Math.min(100, Math.round((offersReceived / goals.targetOffers) * 100)) || 0;

  // Calculate syllabus stats
  const totalRecQuestions = curriculumData.reduce((acc, topic) => acc + topic.problems.length, 0);
  const solvedRecQuestions = curriculumData.reduce((acc, topic) => {
    return acc + topic.problems.filter(p => 
      dsaProgress.questions.some(q => q.titleSlug === p.slug || q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === p.slug)
    ).length;
  }, 0);

  const totalVideos = curriculumData.reduce((acc, topic) => acc + topic.videos.length, 0);
  const watchedVideosCount = dsaProgress.watchedVideos ? dsaProgress.watchedVideos.length : 0;
  
  const dsaPercent = totalRecQuestions > 0 ? Math.round((solvedRecQuestions / totalRecQuestions) * 100) : 0;
  const videoPercent = totalVideos > 0 ? Math.round((watchedVideosCount / totalVideos) * 100) : 0;

  const handleSaveGoals = (e) => {
    e.preventDefault();
    setGoals({
      weeklyApplications: parseInt(tempGoals.weeklyApplications, 10) || 5,
      weeklyDSAQuestions: parseInt(tempGoals.weeklyDSAQuestions, 10) || 10,
      targetOffers: parseInt(tempGoals.targetOffers, 10) || 2
    });
    setConfigOpen(false);
  };

  return (
    <div className="dashboard-wrapper animate-fade-in">
      {/* Title block */}
      <div className="text-hero-title">Command Center</div>
      <p className="text-hero-desc">
        Welcome back, Vansh. Here is a site-wide overview of your career progress, active applications, codebase indexing, and roadmap achievements.
      </p>

      {/* Bento Row 1: Metrics */}
      <div className="dashboard-metrics" style={{ marginTop: '2.5rem' }}>
        <div className="metric-card animate-slide-up delay-100">
          <div className="metric-icon-wrapper blue">
            <span className="material-symbols-outlined">folder_open</span>
          </div>
          <div className="metric-info">
            <span className="metric-value">{totalApps}</span>
            <span className="metric-label">Applications</span>
          </div>
        </div>

        <div className="metric-card animate-slide-up delay-200">
          <div className="metric-icon-wrapper purple">
            <span className="material-symbols-outlined">forum</span>
          </div>
          <div className="metric-info">
            <span className="metric-value">{activeInterviews}</span>
            <span className="metric-label">Interviews</span>
          </div>
        </div>

        <div className="metric-card animate-slide-up delay-300">
          <div className="metric-icon-wrapper emerald">
            <span className="material-symbols-outlined">emoji_events</span>
          </div>
          <div className="metric-info">
            <span className="metric-value">{offersReceived}</span>
            <span className="metric-label">Offers</span>
          </div>
        </div>

        <div className="metric-card animate-slide-up delay-400">
          <div className="metric-icon-wrapper orange">
            <span className="material-symbols-outlined">task_alt</span>
          </div>
          <div className="metric-info">
            <span className="metric-value">{solvedDSA}</span>
            <span className="metric-label">Solved DSA</span>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* Card 1: Target Gauges */}
        {settings.showAnalytics !== false && (
        <div className="bento-card span-6 animate-slide-up delay-100">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined">ads_click</span>
            <span>Weekly Progress & Targets</span>
          </div>

          <div className="target-list">
            {/* Apps Target */}
            <div className="target-item">
              <div className="target-header">
                <span className="target-name">Weekly Applications</span>
                <span className="target-ratio">{weeklyAppsCount} / {goals.weeklyApplications}</span>
                <span className="target-percent">{weeklyAppsPercent}%</span>
              </div>
              <div className="target-progress-bg">
                <div className="target-progress-fill" style={{ width: `${weeklyAppsPercent}%`, background: 'var(--primary)' }}></div>
              </div>
            </div>

            {/* DSA Target */}
            <div className="target-item">
              <div className="target-header">
                <span className="target-name">DSA Questions Mastered</span>
                <span className="target-ratio">{solvedDSA} / {goals.weeklyDSAQuestions}</span>
                <span className="target-percent">{weeklyDSAPercent}%</span>
              </div>
              <div className="target-progress-bg">
                <div className="target-progress-fill" style={{ width: `${weeklyDSAPercent}%`, background: 'var(--warning)' }}></div>
              </div>
            </div>

            {/* Offers Target */}
            <div className="target-item">
              <div className="target-header">
                <span className="target-name">Career Offers Milestone</span>
                <span className="target-ratio">{offersReceived} / {goals.targetOffers}</span>
                <span className="target-percent">{offersPercent}%</span>
              </div>
              <div className="target-progress-bg">
                <div className="target-progress-fill" style={{ width: `${offersPercent}%`, background: 'var(--success)' }}></div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button className="btn-pill btn-pill-secondary" onClick={() => setConfigOpen(!configOpen)}>
              <span className="material-symbols-outlined">settings</span>
              Configure Targets
            </button>
          </div>
        </div>
        )}

        {/* Card 2: Configure Targets Panel (Conditional inline) */}
        {settings.showJobPipeline !== false && (
        configOpen ? (
          <div className="bento-card span-6 animate-slide-up">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">tune</span>
              <span>Edit Weekly Goals</span>
            </div>

            <form onSubmit={handleSaveGoals}>
              <div className="config-inputs-row">
                <div className="config-input-field">
                  <label>Applications Goal</label>
                  <input
                    type="number"
                    min="1"
                    value={tempGoals.weeklyApplications}
                    onChange={(e) => setTempGoals({ ...tempGoals, weeklyApplications: e.target.value })}
                  />
                </div>
                <div className="config-input-field">
                  <label>DSA Target</label>
                  <input
                    type="number"
                    min="1"
                    value={tempGoals.weeklyDSAQuestions}
                    onChange={(e) => setTempGoals({ ...tempGoals, weeklyDSAQuestions: e.target.value })}
                  />
                </div>
                <div className="config-input-field">
                  <label>Offers Milestone</label>
                  <input
                    type="number"
                    min="1"
                    value={tempGoals.targetOffers}
                    onChange={(e) => setTempGoals({ ...tempGoals, targetOffers: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn-pill btn-pill-primary">
                  Save Changes
                </button>
                <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setConfigOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Card 3: Recent Activity / Live Pipeline */
          <div className="bento-card span-6 animate-slide-up delay-200">
            <div className="dashboard-section-title">
              <span className="material-symbols-outlined">update</span>
              <span>Recent Applications</span>
            </div>

            {applications.length === 0 ? (
              <p className="text-muted" style={{ padding: '1rem 0' }}>No active applications found. Open the Job Tracker to add one.</p>
            ) : (
              <div className="recent-app-list">
                {applications.slice(0, 3).map((app) => (
                  <div key={app.id} className="recent-app-item">
                    <div className="recent-app-meta">
                      <span className="recent-app-role">{app.title}</span>
                      <span className="recent-app-company">{app.company} • {app.date}</span>
                    </div>
                    
                    <span className="recent-app-status" style={{
                      background: app.status === 'offered' ? 'var(--success-light)' : app.status === 'interviewing' ? 'var(--primary-light)' : app.status === 'applied' ? 'var(--bg-secondary)' : 'var(--danger-light)',
                      color: app.status === 'offered' ? 'var(--success)' : app.status === 'interviewing' ? 'var(--primary)' : app.status === 'applied' ? 'var(--text-muted)' : 'var(--danger)',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '2rem' }}>
              <button className="btn-pill btn-pill-secondary" onClick={() => setActiveTab('applications')}>
                View Job Pipeline
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        )
        )}

        {/* Card 4: LeetCode & DSA Prep Hub Cockpit */}
        {settings.showDsaRoadmap !== false && (
        <div className="bento-card span-6 animate-slide-up delay-300">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined" style={{ color: '#FFA116' }}>code</span>
            <span>LeetCode & DSA Roadmap</span>
          </div>

          <div className="dashboard-linked-account">
            {leetcodeUsername ? (
              <div className="dashboard-account-status active">
                <span className="material-symbols-outlined">check_circle</span>
                <span>Linked LeetCode: <strong>{leetcodeUsername}</strong></span>
              </div>
            ) : (
              <div className="dashboard-account-status inactive" onClick={() => setActiveTab('profile')}>
                <span className="material-symbols-outlined">info</span>
                <span>No LeetCode profile linked. Link in Profile.</span>
              </div>
            )}
          </div>

          <div className="dashboard-cockpit-metrics">
            <div className="cockpit-stat-item">
              <span className="cockpit-stat-label">Syllabus Solved</span>
              <span className="cockpit-stat-val">{solvedRecQuestions} / {totalRecQuestions}</span>
              <div className="cockpit-progress-track">
                <div className="cockpit-progress-fill success" style={{ width: `${dsaPercent}%` }}></div>
              </div>
            </div>

            <div className="cockpit-stat-item">
              <span className="cockpit-stat-label">Video Tutorials watched</span>
              <span className="cockpit-stat-val">{watchedVideosCount} / {totalVideos}</span>
              <div className="cockpit-progress-track">
                <div className="cockpit-progress-fill primary" style={{ width: `${videoPercent}%` }}></div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button className="btn-pill btn-pill-secondary" onClick={() => setActiveTab('prep')}>
              Resume DSA Syllabus
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
        )}

        {/* Card 5: Local Database & AI Assets Cockpit */}
        {settings.showVectorIndex !== false && (
        <div className="bento-card span-6 animate-slide-up delay-400">
          <div className="dashboard-section-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--purple)' }}>database</span>
            <span>RAG Vector Store & Profile Assets</span>
          </div>

          <div className="dashboard-linked-account">
            <div className="dashboard-account-status active">
              <div className="pulse-green-dot"></div>
              <span>ChromaDB Vector Store: <strong>Active</strong></span>
            </div>
          </div>

          <div className="vector-stats-layout">
            <div className="vector-projects-summary">
              <div className="summary-label">Indexed Codebase Projects:</div>
              {loadingProjects ? (
                <div className="summary-val text-muted" style={{ fontSize: '0.85rem' }}>Loading index...</div>
              ) : projects.length > 0 ? (
                <div className="dashboard-project-chips">
                  {projects.map(p => (
                    <span key={p.id} className="project-chip">{p.title}</span>
                  ))}
                </div>
              ) : (
                <div className="summary-val text-muted" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No projects indexed. Use the Project Auditor to index your repositories.
                </div>
              )}
            </div>

            {profile?.skills && profile.skills.length > 0 && (
              <div className="vector-skills-summary" style={{ marginTop: '1.25rem' }}>
                <div className="summary-label">Candidate Skills:</div>
                <div className="dashboard-project-chips" style={{ marginTop: '0.5rem' }}>
                  {profile.skills.slice(0, 6).map(skill => (
                    <span key={skill} className="skill-chip">{skill}</span>
                  ))}
                  {profile.skills.length > 6 && <span className="chip-more">+{profile.skills.length - 6} more</span>}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <button className="btn-pill btn-pill-secondary" onClick={() => setActiveTab('auditor')}>
              Audit Codebase
              <span className="material-symbols-outlined">terminal</span>
            </button>
            <button className="btn-pill btn-pill-secondary" onClick={() => setActiveTab('compass')}>
              Career Paths
              <span className="material-symbols-outlined">explore</span>
            </button>
          </div>
        </div>
        )}

        {/* Fallback View in Case All Cards Are Hidden */}
        {!(settings.showAnalytics !== false || settings.showJobPipeline !== false || settings.showDsaRoadmap !== false || settings.showVectorIndex !== false) && (
          <div className="bento-card span-12 animate-slide-up" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', background: 'var(--surface)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3.5rem', color: 'var(--text-muted)' }}>dashboard_customize</span>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>All Bento Cards Hidden</h3>
            <p className="text-muted" style={{ maxWidth: '480px', margin: 0, fontSize: '0.95rem', lineHeight: '1.6' }}>
              You have disabled all widgets. Visit the Settings dashboard to choose which bento panels to display.
            </p>
            <button className="btn-pill btn-pill-primary" onClick={() => setActiveTab('settings')} style={{ marginTop: '0.5rem' }}>
              Configure Widgets
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
