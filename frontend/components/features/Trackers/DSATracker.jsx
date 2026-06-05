import React, { useState } from 'react';
import './DSATracker.css';
import { curriculumData } from './curriculumData';
import { useProfile } from '../../../contexts/ProfileContext';
import { getBackendUrl } from '../../../utils/config';

export default function DSATracker({ dsaProgress, setDsaProgress }) {
  const { profile } = useProfile();
  const leetcodeUsername = profile?.leetcode;

  // Active view: 'curriculum' or 'history'
  const [activeView, setActiveView] = useState('curriculum');
  const [activeTopicId, setActiveTopicId] = useState(curriculumData[0].id);
  const [topicSearch, setTopicSearch] = useState('');
  const [mobileShowDetails, setMobileShowDetails] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Syncing state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ success: null, message: '' });

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    platform: 'LeetCode',
    difficulty: 'Easy',
    status: 'Solved',
    notes: '',
  });

  // Normalize data safely
  const watchedVideos = dsaProgress.watchedVideos || [];
  const questions = dsaProgress.questions || [];
  const lastSynced = dsaProgress.lastSynced || null;

  // Helper to calculate local date string YYYY-MM-DD
  const getLocalDateString = (timestampSec) => {
    if (!timestampSec) return '';
    const date = new Date(timestampSec * 1000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Helper to parse local date string back to Date safely
  const parseLocalDate = (dateStr) => {
    const parts = dateStr.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  // Group solved questions by date
  const dateToQuestions = {};
  questions.forEach((q) => {
    if (q.timestamp) {
      const dStr = getLocalDateString(q.timestamp);
      if (dStr) {
        if (!dateToQuestions[dStr]) {
          dateToQuestions[dStr] = [];
        }
        dateToQuestions[dStr].push(q);
      }
    }
  });

  // Calculate streaks
  const activeDatesSet = new Set(Object.keys(dateToQuestions));
  const sortedDatesStr = Object.keys(dateToQuestions).sort(); // chronological order
  
  let maxStreak = 0;
  let currentRun = 0;
  let prevStr = null;
  
  sortedDatesStr.forEach((dateStr) => {
    if (prevStr === null) {
      currentRun = 1;
    } else {
      const prevD = parseLocalDate(prevStr);
      prevD.setDate(prevD.getDate() + 1);
      const expectedStr = getLocalDateString(prevD.getTime() / 1000);
      if (dateStr === expectedStr) {
        currentRun++;
      } else {
        maxStreak = Math.max(maxStreak, currentRun);
        currentRun = 1;
      }
    }
    prevStr = dateStr;
  });
  maxStreak = Math.max(maxStreak, currentRun);
  
  // Calculate current streak
  let currentStreak = 0;
  const todayDate = new Date();
  const todayStr = getLocalDateString(todayDate.getTime() / 1000);
  
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDate.getTime() / 1000);
  
  if (activeDatesSet.has(todayStr) || activeDatesSet.has(yesterdayStr)) {
    let checkDate = activeDatesSet.has(todayStr) ? new Date(todayDate) : new Date(yesterdayDate);
    while (true) {
      const checkStr = getLocalDateString(checkDate.getTime() / 1000);
      if (activeDatesSet.has(checkStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate submissions and active days in the past 1 year
  const oneYearAgoTime = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const submissionsPastYear = questions.filter(
    (q) => q.timestamp && q.timestamp * 1000 >= oneYearAgoTime
  );
  const totalSubmissionsLastYear = submissionsPastYear.length;

  const activeDaysPastYear = Object.keys(dateToQuestions).filter((dStr) => {
    const dTime = parseLocalDate(dStr).getTime();
    return dTime >= oneYearAgoTime;
  }).length;

  // Generate 53 weeks grid
  const gridWeeks = [];
  const calendarStart = new Date(todayDate);
  calendarStart.setDate(calendarStart.getDate() - 364); // 52 weeks back
  
  // Align to Sunday
  const startDayOfWeek = calendarStart.getDay();
  calendarStart.setDate(calendarStart.getDate() - startDayOfWeek);
  
  const tempDate = new Date(calendarStart);
  const totalDaysCount = 53 * 7;
  const gridDays = [];
  
  for (let i = 0; i < totalDaysCount; i++) {
    const timestampSec = tempDate.getTime() / 1000;
    const dateStr = getLocalDateString(timestampSec);
    const count = dateToQuestions[dateStr]?.length || 0;
    
    gridDays.push({
      dateStr,
      count,
      dayOfWeek: tempDate.getDay(),
      month: tempDate.toLocaleString('default', { month: 'short' }),
      dayOfMonth: tempDate.getDate(),
      isFuture: tempDate > todayDate,
    });
    
    tempDate.setDate(tempDate.getDate() + 1);
  }
  
  for (let i = 0; i < gridDays.length; i += 7) {
    gridWeeks.push(gridDays.slice(i, i + 7));
  }

  // Calculate month labels positions
  const monthCols = [];
  let currentMonth = '';
  gridWeeks.forEach((week, index) => {
    const validDay = week.find(d => !d.isFuture);
    const monthName = validDay ? validDay.month : week[0].month;
    
    if (monthName !== currentMonth) {
      monthCols.push({ index, label: monthName });
      currentMonth = monthName;
    }
  });

  // Helper to check if a recommended problem is solved
  const isProblemSolved = (slug) => {
    return questions.some(
      (q) =>
        q.titleSlug === slug ||
        q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug
    );
  };

  // Toggle Video Watched status
  const toggleVideo = (videoId) => {
    let updatedVideos;
    if (watchedVideos.includes(videoId)) {
      updatedVideos = watchedVideos.filter((id) => id !== videoId);
    } else {
      updatedVideos = [...watchedVideos, videoId];
    }
    setDsaProgress({
      ...dsaProgress,
      watchedVideos: updatedVideos,
    });
  };

  // Manual Add Question Solver Handler
  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQuestion.title) return;

    // Create title slug for manual entries if platform is LeetCode
    const titleSlug = newQuestion.platform === 'LeetCode'
      ? newQuestion.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : '';

    const added = {
      id: `manual_${Date.now()}`,
      titleSlug,
      ...newQuestion,
      timestamp: Math.floor(Date.now() / 1000),
    };

    setDsaProgress({
      ...dsaProgress,
      questions: [added, ...questions],
    });

    setShowAddForm(false);
    setNewQuestion({
      title: '',
      platform: 'LeetCode',
      difficulty: 'Easy',
      status: 'Solved',
      notes: '',
    });
  };

  // Delete question
  const handleDeleteQuestion = (qid) => {
    if (window.confirm('Delete this solved question record?')) {
      setDsaProgress({
        ...dsaProgress,
        questions: questions.filter((q) => q.id !== qid),
      });
    }
  };

  // Sync with LeetCode API
  const handleLeetCodeSync = async () => {
    if (!leetcodeUsername) return;
    setIsSyncing(true);
    setSyncStatus({ success: null, message: 'Fetching submissions...' });

    const BACKEND_URL = getBackendUrl();

    try {
      const response = await fetch(`${BACKEND_URL}/api/leetcode/submissions/${leetcodeUsername}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error (${response.status})`);
      }

      const syncedQuestions = await response.json();
      
      if (syncedQuestions.length === 0) {
        setSyncStatus({
          success: true,
          message: 'Synced! No new accepted submissions found recently.',
        });
        setIsSyncing(false);
        return;
      }

      // Merge only new questions (avoiding duplicate timestamp + slug)
      const existingIds = new Set(questions.map((q) => `${q.timestamp}_${q.titleSlug}`));
      const newQuestionsToAdd = syncedQuestions.filter(
        (sq) => !existingIds.has(`${sq.timestamp}_${sq.titleSlug}`)
      );

      if (newQuestionsToAdd.length === 0) {
        setSyncStatus({
          success: true,
          message: 'Synced! All recent submissions are already registered.',
        });
      } else {
        setDsaProgress({
          ...dsaProgress,
          questions: [...newQuestionsToAdd, ...questions],
          lastSynced: new Date().toLocaleString(),
        });
        setSyncStatus({
          success: true,
          message: `Successfully synced! Registered ${newQuestionsToAdd.length} new solved problem(s).`,
        });
      }
    } catch (error) {
      console.error('LeetCode sync error:', error);
      setSyncStatus({
        success: false,
        message: error.message || 'Failed to connect to sync server.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Get difficulty badge class
  const getDifficultyClass = (diff) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return 'difficulty-easy';
      case 'medium':
        return 'difficulty-medium';
      case 'hard':
      default:
        return 'difficulty-hard';
    }
  };

  // Filtered questions in Solved Log
  const filteredQuestions = questions.filter((q) => {
    if (!topicSearch) return true;
    return (
      q.title.toLowerCase().includes(topicSearch.toLowerCase()) ||
      q.platform.toLowerCase().includes(topicSearch.toLowerCase()) ||
      (q.tags && q.tags.some(t => t.toLowerCase().includes(topicSearch.toLowerCase())))
    );
  });

  // Calculate statistics for active topic
  const getTopicProgress = (topic) => {
    const topicVideosCount = topic.videos.length;
    const watchedTopicVideosCount = topic.videos.filter(v => watchedVideos.includes(v.id)).length;
    const topicProblemsCount = topic.problems.length;
    const solvedTopicProblemsCount = topic.problems.filter(p => isProblemSolved(p.slug)).length;

    const videoPercent = topicVideosCount > 0 ? Math.round((watchedTopicVideosCount / topicVideosCount) * 100) : 0;
    const problemPercent = topicProblemsCount > 0 ? Math.round((solvedTopicProblemsCount / topicProblemsCount) * 100) : 0;

    return {
      watchedVideos: watchedTopicVideosCount,
      totalVideos: topicVideosCount,
      videoPercent,
      solvedProblems: solvedTopicProblemsCount,
      totalProblems: topicProblemsCount,
      problemPercent,
      overallPercent: Math.round((videoPercent + problemPercent) / 2)
    };
  };

  const activeTopic = curriculumData.find(t => t.id === activeTopicId) || curriculumData[0];
  const activeTopicProgress = getTopicProgress(activeTopic);

  const navigateToProfile = () => {
    document.dispatchEvent(new CustomEvent('pos:navigate', { detail: 'profile' }));
  };

  return (
    <div className="dsatracker-wrapper">
      {/* Top Banner & Control Board */}
      <div className="dsa-header-card animate-slide-up delay-100">
        <div className="dsa-header-info">
          <h2 className="text-hero-title">DSA Prep Hub</h2>
          <p className="text-hero-desc">
            Focus on your coding foundations. Sync your LeetCode profile to automatically log achievements and track course progress.
          </p>
        </div>

        {/* LeetCode Sync Widget */}
        <div className="leetcode-sync-box">
          <div className="sync-box-logo">
            <span className="material-symbols-outlined sync-icon-style">code</span>
            <div>
              <div className="sync-box-title">LeetCode Integration</div>
              <div className="sync-box-username">
                {leetcodeUsername ? (
                  <span className="username-active">
                    Connected: <a href={`https://leetcode.com/${leetcodeUsername}`} target="_blank" rel="noreferrer">{leetcodeUsername}</a>
                  </span>
                ) : (
                  <span className="username-inactive">No profile linked</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="sync-actions">
            {leetcodeUsername ? (
              <button 
                className={`btn-pill btn-pill-primary sync-btn ${isSyncing ? 'loading' : ''}`}
                onClick={handleLeetCodeSync}
                disabled={isSyncing}
              >
                <span className="material-symbols-outlined">{isSyncing ? 'sync' : 'sync_saved_locally'}</span>
                {isSyncing ? 'Syncing...' : 'Sync LeetCode'}
              </button>
            ) : (
              <button className="btn-pill btn-pill-secondary configure-btn" onClick={navigateToProfile}>
                <span className="material-symbols-outlined">settings</span>
                Link LeetCode in Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sync Status Notifications */}
      {syncStatus.message && (
        <div className={`sync-toast animate-slide-up ${syncStatus.success ? 'toast-success' : 'toast-error'}`}>
          <span className="material-symbols-outlined">
            {syncStatus.success ? 'check_circle' : 'error'}
          </span>
          <span className="toast-text">{syncStatus.message}</span>
          <button className="toast-close" onClick={() => setSyncStatus({ success: null, message: '' })}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* DSA Activity Contribution Calendar */}
      <div className="dsa-calendar-card animate-slide-up delay-200">
        <div className="dsa-calendar-header">
          <div className="dsa-calendar-total">
            <span className="total-count">{totalSubmissionsLastYear}</span>
            submissions in the past one year
          </div>
          <div className="dsa-calendar-stats">
            <div className="calendar-stat-item" title="Current streak of active days">
              <span className="stat-label">Current streak:</span>
              <span className="stat-value">{currentStreak} day{currentStreak !== 1 ? 's' : ''}</span>
            </div>
            <div className="calendar-stat-item" title="Longest streak of active days in history">
              <span className="stat-label">Max streak:</span>
              <span className="stat-value">{maxStreak} day{maxStreak !== 1 ? 's' : ''}</span>
            </div>
            <div className="calendar-stat-item" title="Total number of active coding days in the past year">
              <span className="stat-label">Total active days:</span>
              <span className="stat-value">{activeDaysPastYear} day{activeDaysPastYear !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="dsa-calendar-layout">
          <div className="dsa-calendar-grid-scroll">
            <div className="dsa-calendar-grid">
              {/* Day Labels Column */}
              <div className="dsa-calendar-day-label"></div>
              <div className="dsa-calendar-day-label">Mon</div>
              <div className="dsa-calendar-day-label"></div>
              <div className="dsa-calendar-day-label">Wed</div>
              <div className="dsa-calendar-day-label"></div>
              <div className="dsa-calendar-day-label">Fri</div>
              <div className="dsa-calendar-day-label"></div>

              {/* Grid cells flowing column-first */}
              {gridWeeks.flat().map((day) => {
                let intensityClass = 'lvl-0';
                if (day.isFuture) intensityClass = 'future';
                else if (day.count === 1) intensityClass = 'lvl-1';
                else if (day.count === 2) intensityClass = 'lvl-2';
                else if (day.count === 3) intensityClass = 'lvl-3';
                else if (day.count >= 4) intensityClass = 'lvl-4';

                const parsedDate = parseLocalDate(day.dateStr);
                const formattedDate = parsedDate.toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });

                return (
                  <div
                    key={day.dateStr}
                    className={`dsa-calendar-day-cell ${intensityClass}`}
                    title={day.isFuture ? 'Future date' : `${day.count} solved on ${formattedDate}`}
                  />
                );
              })}
            </div>

            <div className="dsa-calendar-months">
              {/* Spacer matching Day Labels width */}
              <div className="dsa-calendar-month-label-col"></div>
              
              {gridWeeks.map((week, wIdx) => {
                const labelObj = monthCols.find((m) => m.index === wIdx);
                return (
                  <div key={wIdx} className="dsa-calendar-month-label-col">
                    {labelObj ? (
                      <span className="dsa-calendar-month-label">{labelObj.label}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="dsa-calendar-footer">
          <div className="dsa-calendar-legend">
            <span>Less</span>
            <div className="dsa-calendar-day-cell lvl-0" />
            <div className="dsa-calendar-day-cell lvl-1" />
            <div className="dsa-calendar-day-cell lvl-2" />
            <div className="dsa-calendar-day-cell lvl-3" />
            <div className="dsa-calendar-day-cell lvl-4" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="dsa-tab-nav animate-slide-up delay-300">
        <button 
          className={`dsa-tab-btn ${activeView === 'curriculum' ? 'active' : ''}`}
          onClick={() => setActiveView('curriculum')}
        >
          <span className="material-symbols-outlined">map</span>
          Syllabus & Roadmap
        </button>
        <button 
          className={`dsa-tab-btn ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('history');
            setShowAddForm(false);
          }}
        >
          <span className="material-symbols-outlined">receipt_long</span>
          Solved Log ({questions.length})
        </button>
        {lastSynced && (
          <span className="last-sync-timestamp">Last Synced: {lastSynced}</span>
        )}
      </div>

      {/* Main content viewport */}
      <div className="dsa-content-view">
        
        {/* VIEW 1: Curriculum / Syllabus Roadmap */}
        {activeView === 'curriculum' && (
          <div className="curriculum-layout bento-grid">
            
            {/* Left sidebar: Topic selector list */}
            <div className={`bento-card span-4 topic-sidebar-card animate-slide-up delay-400 ${mobileShowDetails ? 'hide-on-mobile' : ''}`}>
              <h3 className="card-inner-title">Syllabus Chapters</h3>
              <p className="text-muted text-small">Select a topic to focus on videos and recommended problems.</p>
              
              <div className="topic-menu-list">
                {curriculumData.map((topic) => {
                  const progress = getTopicProgress(topic);
                  const isActive = topic.id === activeTopicId;
                  return (
                    <div 
                      key={topic.id}
                      className={`topic-menu-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setActiveTopicId(topic.id);
                        setMobileShowDetails(true);
                      }}
                    >
                      <div className="topic-menu-info">
                        <span className="topic-menu-name">{topic.name}</span>
                        <span className="topic-menu-stat">
                          {progress.solvedProblems}/{progress.totalProblems} solved
                        </span>
                      </div>
                      
                      {/* Topic Mini Progress Indicators */}
                      <div className="topic-menu-progress-bar">
                        <div 
                          className="progress-fill video" 
                          style={{ width: `${progress.videoPercent}%` }}
                          title={`Videos: ${progress.videoPercent}%`}
                        ></div>
                        <div 
                          className="progress-fill problem" 
                          style={{ width: `${progress.problemPercent}%` }}
                          title={`Problems: ${progress.problemPercent}%`}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right details panel: Video checklist and recommended problems */}
            <div className={`bento-card span-8 topic-details-card animate-slide-up delay-500 ${!mobileShowDetails ? 'hide-on-mobile' : ''}`}>
              <button className="dsa-back-btn" onClick={() => setMobileShowDetails(false)}>
                <span className="material-symbols-outlined">arrow_back</span>
                Back to Chapters
              </button>
              <div className="topic-details-header">
                <div>
                  <h3 className="topic-details-title">{activeTopic.name}</h3>
                  <p className="topic-details-desc">{activeTopic.description}</p>
                </div>

                <div className="topic-overall-stats">
                  <div className="stat-circle">
                    <span className="circle-percent">{activeTopicProgress.overallPercent}%</span>
                    <span className="circle-label">Ready</span>
                  </div>
                </div>
              </div>

              {/* Progress bars inside details panel */}
              <div className="topic-progress-detail-row">
                <div className="progress-detail-item">
                  <div className="progress-label-row">
                    <span>Videos Watched</span>
                    <span>{activeTopicProgress.watchedVideos} / {activeTopicProgress.totalVideos}</span>
                  </div>
                  <div className="progress-track-bg">
                    <div className="progress-fill-detail video" style={{ width: `${activeTopicProgress.videoPercent}%` }}></div>
                  </div>
                </div>

                <div className="progress-detail-item">
                  <div className="progress-label-row">
                    <span>Questions Solved</span>
                    <span>{activeTopicProgress.solvedProblems} / {activeTopicProgress.totalProblems}</span>
                  </div>
                  <div className="progress-track-bg">
                    <div className="progress-fill-detail problem" style={{ width: `${activeTopicProgress.problemPercent}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="curriculum-splits">
                {/* 1. Curated Video Tutorials */}
                <div className="curriculum-section">
                  <h4 className="curriculum-sub-title">
                    <span className="material-symbols-outlined">play_circle</span>
                    Recommended Video Tutorials
                  </h4>
                  <div className="videos-checklist-container">
                    {activeTopic.videos.map((vid) => {
                      const isWatched = watchedVideos.includes(vid.id);
                      return (
                        <div key={vid.id} className={`video-row ${isWatched ? 'watched' : ''}`}>
                          <div className="video-meta-cell" onClick={() => toggleVideo(vid.id)}>
                            <div className="video-checkbox">
                              <span className="material-symbols-outlined">check</span>
                            </div>
                            <div>
                              <div className="video-title">{vid.title}</div>
                              <div className="video-details-sub">
                                <span className="channel-badge">{vid.channel}</span>
                                <span className="duration-tag">
                                  <span className="material-symbols-outlined">schedule</span>
                                  {vid.duration}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <a 
                            href={vid.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="video-play-btn"
                            title="Watch Video on YouTube"
                            onClick={() => {
                              // Automatically mark as watched when they click the play link if not already watched
                              if (!isWatched) toggleVideo(vid.id);
                            }}
                          >
                            <span className="material-symbols-outlined">play_arrow</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Recommended Practice Problems */}
                <div className="curriculum-section">
                  <h4 className="curriculum-sub-title">
                    <span className="material-symbols-outlined">assignment_turned_in</span>
                    Target Practice Problems
                  </h4>
                  
                  <div className="problems-grid">
                    {activeTopic.problems.map((prob) => {
                      const solved = isProblemSolved(prob.slug);
                      return (
                        <div key={prob.slug} className={`problem-curriculum-card ${solved ? 'solved' : ''}`}>
                          <div className="prob-header-row">
                            <span className={`difficulty-badge ${getDifficultyClass(prob.difficulty)}`}>
                              {prob.difficulty}
                            </span>
                            <div className="prob-status-icon">
                              <span className="material-symbols-outlined">
                                {solved ? 'check_circle' : 'pending'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="prob-title">{prob.title}</div>
                          
                          <a 
                            href={`https://leetcode.com/problems/${prob.slug}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="prob-solve-link"
                          >
                            <span>{solved ? 'Review on LeetCode' : 'Solve on LeetCode'}</span>
                            <span className="material-symbols-outlined">open_in_new</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: Solved Log & History */}
        {activeView === 'history' && (
          <div className="bento-grid">
            
            {/* Toggle form button */}
            <div className="span-12 history-controls">
              <button 
                className="btn-pill btn-pill-secondary mobile-padded-btn" 
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <span className="material-symbols-outlined">{showAddForm ? 'close' : 'add'}</span>
                {showAddForm ? 'Close Log Form' : 'Log Manual Problem'}
              </button>
            </div>

            {/* Card 1: Add Solved Problem (Conditional) */}
            {showAddForm && (
              <div className="bento-card span-12 animate-slide-up">
                <div className="card-title">
                  <span className="material-symbols-outlined">playlist_add</span>
                  <span>Log Problem Achievement Manually</span>
                </div>

                <form onSubmit={handleAddQuestion}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Problem Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Reverse a Binary Tree"
                        value={newQuestion.title}
                        onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Platform</label>
                      <select
                        value={newQuestion.platform}
                        onChange={(e) => setNewQuestion({ ...newQuestion, platform: e.target.value })}
                      >
                        <option value="LeetCode">LeetCode</option>
                        <option value="HackerRank">HackerRank</option>
                        <option value="Codeforces">Codeforces</option>
                        <option value="GeeksforGeeks">GeeksforGeeks</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Difficulty</label>
                      <select
                        value={newQuestion.difficulty}
                        onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={newQuestion.status}
                        onChange={(e) => setNewQuestion({ ...newQuestion, status: e.target.value })}
                      >
                        <option value="Solved">Solved</option>
                        <option value="Revision Needed">Revision Needed</option>
                        <option value="Todo">Todo</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Key Takeaway / Optimal Complexity</label>
                    <input
                      type="text"
                      placeholder="e.g. Time complexity O(N) using double pointers, space O(1)"
                      value={newQuestion.notes}
                      onChange={(e) => setNewQuestion({ ...newQuestion, notes: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn-pill btn-pill-primary">
                      Log Solved
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Card 2: Log details */}
            <div className="bento-card span-12 animate-slide-up">
              <div className="history-table-header">
                <div className="card-title" style={{ marginBottom: 0 }}>
                  <span className="material-symbols-outlined">receipt_long</span>
                  <span>Solved Problem History</span>
                </div>
                
                {/* Search filter input */}
                <input
                  type="text"
                  placeholder="Search title, platform, or tags..."
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  className="search-input-field"
                />
              </div>

              {filteredQuestions.length === 0 ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '3rem' }}>
                  No logged questions found matching your filter.
                </p>
              ) : (
                <div className="question-table-container">
                  <table className="question-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Platform</th>
                        <th>Difficulty</th>
                        <th>Key Takeaway / Notes</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuestions.map((q) => (
                        <tr key={q.id || q.title}>
                          <td style={{ fontWeight: '700' }}>
                            {q.titleSlug && q.platform === 'LeetCode' ? (
                              <a 
                                href={`https://leetcode.com/problems/${q.titleSlug}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ color: 'inherit', textDecoration: 'none' }}
                                className="history-link-hover"
                              >
                                {q.title}
                                <span className="material-symbols-outlined ext-link-icon">open_in_new</span>
                              </a>
                            ) : (
                              q.title
                            )}
                            {q.tags && q.tags.length > 0 && (
                              <div className="history-row-tags">
                                {q.tags.map((tag) => (
                                  <span key={tag} className="history-tag">{tag}</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="platform-tag">{q.platform}</span>
                          </td>
                          <td>
                            <span className={`difficulty-badge ${getDifficultyClass(q.difficulty)}`}>
                              {q.difficulty}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {q.notes || 'No takeaways added.'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn-icon"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleDeleteQuestion(q.id)}
                              title="Delete record"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
