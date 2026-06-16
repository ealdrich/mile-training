import React, { useState, useEffect, useMemo } from 'react';
import { getPublicProfile, getPublicSchedules, getPublicHistory, getWorkoutLibrary } from './supabase.js';
import { Calendar, Clock, Star, Lock, TrendingUp } from 'lucide-react';
import Analytics from './Analytics.js';

const PublicProfile = ({ userId, currentUser, onSignIn }) => {
  const [profile, setProfile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [history, setHistory] = useState([]);
  const [rawWorkouts, setRawWorkouts] = useState([]);
  const [activeTab, setActiveTab] = useState('schedules');
  const [loading, setLoading] = useState(true);
  const [schedulePrivate, setSchedulePrivate] = useState(false);
  const [historyPrivate, setHistoryPrivate] = useState(false);
  const [expandedScheduleId, setExpandedScheduleId] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [analyticsWorkoutId, setAnalyticsWorkoutId] = useState('fk8');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [profRes, libRes] = await Promise.all([
        getPublicProfile(userId),
        getWorkoutLibrary(),
      ]);

      if (profRes.error || !profRes.data) { setNotFound(true); setLoading(false); return; }
      setProfile(profRes.data);
      setRawWorkouts(libRes.data || []);

      const [schedRes, histRes] = await Promise.all([
        getPublicSchedules(userId),
        getPublicHistory(userId),
      ]);

      if (schedRes.error) setSchedulePrivate(true);
      else setSchedules(transformSchedules(schedRes.data || []));

      if (histRes.error) setHistoryPrivate(true);
      else setHistory(transformHistory(histRes.data || []));

      setLoading(false);
    };
    load();
  }, [userId]);

  const workoutLibrary = useMemo(() => {
    const groups = {
      primary: { name: 'Mile Workouts', workouts: [] },
      secondary: { name: 'Speed Workouts', workouts: [] },
      fiveKTenK: { name: '5k/10k Workouts', workouts: [] },
      marathon: { name: 'Marathon Workouts', workouts: [] },
    };
    for (const w of rawWorkouts) {
      if (groups[w.category]) groups[w.category].workouts.push(w);
    }
    return groups;
  }, [rawWorkouts]);

  const findWorkoutById = (id) => {
    for (const cat of Object.values(workoutLibrary)) {
      const w = cat.workouts.find(w => w.id === id);
      if (w) return w;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="public-profile-page">
        <div className="loading-container"><div className="loading-spinner" /><p>Loading…</p></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-header">
          <span className="public-profile-title">Profile not found</span>
          {!currentUser && <button className="sign-in-link" onClick={onSignIn}>Sign in</button>}
          {currentUser && <button className="sign-in-link" onClick={() => window.location.href = '/'}>My account</button>}
        </div>
        <div className="public-empty">This profile doesn't exist.</div>
      </div>
    );
  }

  const tabs = [
    { id: 'schedules', label: 'Training Plan' },
    { id: 'history', label: 'Workout History' },
    ...(!historyPrivate ? [{ id: 'analytics', label: 'Analytics', icon: TrendingUp }] : []),
  ];

  return (
    <div className="public-profile-page">
      <div className="public-profile-header">
        <div className="public-profile-title">
          <span className="public-profile-email">{profile.displayName || profile.email}</span>
          {profile.displayName && <span className="public-profile-sub-email">{profile.email}</span>}
          <span className="public-profile-badge">Public Profile</span>
        </div>
        <div className="public-profile-actions">
          {currentUser
            ? <button className="sign-in-link" onClick={() => window.location.href = '/'}>My account</button>
            : <button className="sign-in-link" onClick={onSignIn}>Sign in</button>
          }
        </div>
      </div>

      <div className="tab-bar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {Icon && <Icon size={14} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'schedules' && (
        schedulePrivate
          ? <PrivateNotice label="training plan" />
          : <SchedulesList
              schedules={schedules}
              expandedId={expandedScheduleId}
              onExpand={id => setExpandedScheduleId(expandedScheduleId === id ? null : id)}
            />
      )}

      {activeTab === 'history' && (
        historyPrivate
          ? <PrivateNotice label="workout history" />
          : <HistoryList history={history} onViewAnalytics={(workoutId) => { setAnalyticsWorkoutId(workoutId); setActiveTab('analytics'); }} findWorkoutById={findWorkoutById} />
      )}

      {activeTab === 'analytics' && !historyPrivate && (
        <Analytics
          workoutLibrary={workoutLibrary}
          workoutHistory={history}
          findWorkoutById={findWorkoutById}
          initialWorkoutId={analyticsWorkoutId}
        />
      )}
    </div>
  );
};

const PrivateNotice = ({ label }) => (
  <div className="public-private-notice">
    <Lock size={20} />
    <span>This user's {label} is private.</span>
  </div>
);

const SchedulesList = ({ schedules, expandedId, onExpand }) => {
  if (schedules.length === 0) {
    return <div className="public-empty">No training schedules yet.</div>;
  }
  return (
    <div className="public-schedules">
      {schedules.map(s => (
        <div key={s.id} className="public-schedule-card">
          <div className="public-schedule-header" onClick={() => onExpand(s.id)}>
            <div className="public-schedule-meta">
              <span className="public-schedule-name">{s.name}</span>
              {s.trainingStartDate && (
                <span className="public-schedule-date">
                  <Calendar size={13} /> Started {formatDate(s.trainingStartDate)}
                </span>
              )}
            </div>
            <span className="expand-icon">{expandedId === s.id ? '▲' : '▼'}</span>
          </div>

          {expandedId === s.id && (
            <div className="public-schedule-weeks">
              {s.schedule.weeks.map(week => (
                week.workouts.length > 0 && (
                  <div key={week.weekNumber} className="public-week">
                    <div className="public-week-header">
                      <span>Week {week.weekNumber}</span>
                      {(week.mileageGoal || week.actualMileage) && (
                        <span className="public-week-miles">
                          {week.actualMileage ? `${week.actualMileage} mi actual` : ''}
                          {week.mileageGoal ? ` / ${week.mileageGoal} mi goal` : ''}
                        </span>
                      )}
                    </div>
                    <ul className="public-workout-list">
                      {week.workouts.map((w, i) => (
                        <li key={i} className={`public-workout-item ${w.completed ? 'completed' : ''}`}>
                          <span className="public-workout-name">{w.nickname || w.name}</span>
                          {w.completed && <span className="public-workout-check">✓</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const HistoryList = ({ history, onViewAnalytics, findWorkoutById }) => {
  if (history.length === 0) {
    return <div className="public-empty">No workout history yet.</div>;
  }
  return (
    <div className="public-history">
      {history.map(entry => {
        const workout = findWorkoutById?.(entry.workoutId);
        const metric = workout ? computePublicMetric(workout, entry.actualTimes) : null;
        return (
          <div key={entry.id} className="public-history-card">
            <div className="public-history-top">
              <span className="public-history-name">{entry.workoutName || 'Workout'}</span>
              <span className="public-history-date">{formatDate(entry.date)}</span>
            </div>
            {metric !== null && (
              <div className="entry-metric">
                <span className="entry-metric-value">{formatMetricSeconds(metric)}</span>
                <span className="entry-metric-label">{workout.target_metric === 'best_split' ? 'Best split' : 'Avg split'}</span>
                {onViewAnalytics && entry.workoutId && (
                  <button className="entry-analytics-link" onClick={() => onViewAnalytics(entry.workoutId)}>
                    <TrendingUp size={13} /> View analytics
                  </button>
                )}
              </div>
            )}
            {entry.actualTimes?.length > 0 && (
              <div className="public-history-times">
                <Clock size={13} /> {entry.actualTimes.join(', ')}
              </div>
            )}
            {entry.rating != null && (
              <div className="public-history-rating">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={13} className={i < entry.rating ? 'star-filled' : 'star-empty'} />
                ))}
              </div>
            )}
            {entry.notes && <div className="public-history-notes">{entry.notes}</div>}
          </div>
        );
      })}
    </div>
  );
};

function parseTimeToSeconds(str) {
  if (!str && str !== 0) return null;
  str = String(str).trim();
  const parts = str.split(':');
  if (parts.length === 2) {
    const m = parseFloat(parts[0]), s = parseFloat(parts[1]);
    return (isNaN(m) || isNaN(s)) ? null : m * 60 + s;
  }
  const v = parseFloat(str);
  return isNaN(v) ? null : v;
}

function formatMetricSeconds(secs) {
  if (secs === null || isNaN(secs)) return '—';
  const m = Math.floor(secs / 60);
  const s = secs - m * 60;
  if (m === 0) return `${s.toFixed(1)}s`;
  return `${m}:${String(Math.floor(s)).padStart(2, '0')}`;
}

function computePublicMetric(workout, times) {
  if (!workout?.target_metric || !times?.length) return null;
  const parsed = times.map(parseTimeToSeconds).filter(t => t !== null);
  if (!parsed.length) return null;
  if (workout.target_metric === 'average_split') return parsed.reduce((a, b) => a + b, 0) / parsed.length;
  if (workout.target_metric === 'best_split') return Math.min(...parsed);
  return null;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function transformSchedules(rows) {
  return rows.map(schedule => ({
    id: schedule.id,
    name: schedule.name,
    trainingStartDate: schedule.training_start_date,
    schedule: {
      weeks: Array(12).fill(null).map((_, i) => {
        const weekNumber = i + 1;
        const weekData = schedule.schedule_weeks?.find(w => w.week_number === weekNumber);
        return {
          weekNumber,
          workouts: weekData?.schedule_workouts?.map(sw => ({
            name: sw.workout_library?.name || '',
            nickname: sw.workout_library?.nickname || '',
            completed: sw.completed || false,
          })) || [],
          mileageGoal: weekData?.mileage_goal || '',
          actualMileage: weekData?.actual_mileage || '',
        };
      })
    }
  }));
}

function transformHistory(rows) {
  return rows.map(entry => ({
    id: entry.id,
    date: entry.date,
    workoutId: entry.workout_id || null,
    workoutName: entry.workout_library?.name || null,
    actualTimes: entry.actual_times || [],
    notes: entry.notes || '',
    rating: entry.rating,
  }));
}

export default PublicProfile;
