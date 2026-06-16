import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

// --- metric utilities (also exported for WorkoutLibrary) ---

export function parseTimeToSeconds(str) {
  if (!str && str !== 0) return null;
  str = String(str).trim();
  if (!str) return null;
  const parts = str.split(':');
  if (parts.length === 2) {
    const m = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    if (isNaN(m) || isNaN(s)) return null;
    return m * 60 + s;
  }
  const v = parseFloat(str);
  return isNaN(v) ? null : v;
}

export function formatSeconds(secs) {
  if (secs === null || secs === undefined || isNaN(secs)) return '—';
  const m = Math.floor(secs / 60);
  const s = secs - m * 60;
  if (m === 0) return `${s.toFixed(1)}s`;
  return `${m}:${String(Math.floor(s)).padStart(2, '0')}`;
}

export function computeMetric(workout, times) {
  if (!workout?.target_metric || !times?.length) return null;
  if (workout.target_metric === 'alternating_splits') return null;
  const parsed = times.map(parseTimeToSeconds).filter(t => t !== null);
  if (!parsed.length) return null;
  if (workout.target_metric === 'average_split') {
    return parsed.reduce((a, b) => a + b, 0) / parsed.length;
  }
  if (workout.target_metric === 'best_split') {
    return Math.min(...parsed);
  }
  return null;
}

// Even indices = fast reps, odd indices = slow reps
export function computeAlternatingMetrics(times) {
  if (!times?.length) return null;
  const parsed = times.map(parseTimeToSeconds);
  const fast = parsed.filter((_, i) => i % 2 === 0).filter(t => t !== null);
  const slow = parsed.filter((_, i) => i % 2 === 1).filter(t => t !== null);
  if (!fast.length && !slow.length) return null;
  return {
    fast: fast.length ? fast.reduce((a, b) => a + b, 0) / fast.length : null,
    slow: slow.length ? slow.reduce((a, b) => a + b, 0) / slow.length : null,
  };
}

export function metricLabel(workout) {
  if (!workout?.target_metric) return null;
  if (workout.target_metric === 'average_split') return 'Avg split';
  if (workout.target_metric === 'best_split') return 'Best split';
  if (workout.target_metric === 'alternating_splits') return 'Fast / Slow avg';
  return workout.target_metric;
}

// --- chart tooltip ---

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isAlt = d.fast !== undefined;
  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-date">{new Date(d.ts).toLocaleDateString()}</div>
      {isAlt ? (
        <>
          <div className="analytics-tooltip-value analytics-fast">Fast: {formatSeconds(d.fast)}</div>
          <div className="analytics-tooltip-value analytics-slow">Slow: {formatSeconds(d.slow)}</div>
        </>
      ) : (
        <div className="analytics-tooltip-value">{formatSeconds(d.value)}</div>
      )}
      {d.rating && <div className="analytics-tooltip-rating">Rating: {d.rating}/10</div>}
    </div>
  );
};

// --- Y axis tick formatter ---
const formatYTick = (v) => formatSeconds(v);

// --- X axis tick formatter ---
const formatXTick = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// --- main component ---

const Analytics = ({ workoutLibrary, workoutHistory, findWorkoutById, initialWorkoutId }) => {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(initialWorkoutId || '');

  // Build flat list of all workouts for the selector
  const allWorkouts = useMemo(() => {
    const result = [];
    for (const category of Object.values(workoutLibrary)) {
      for (const w of category.workouts) {
        if (w.target_metric) result.push(w);
      }
    }
    return result;
  }, [workoutLibrary]);

  const selectedWorkout = findWorkoutById(selectedWorkoutId);
  const isAlternating = selectedWorkout?.target_metric === 'alternating_splits';

  // Build chart data points
  const chartData = useMemo(() => {
    if (!selectedWorkoutId) return [];
    return workoutHistory
      .filter(e => e.workoutId === selectedWorkoutId && e.actualTimes?.length)
      .map(e => {
        const ts = new Date(e.date).getTime();
        if (isAlternating) {
          const alt = computeAlternatingMetrics(e.actualTimes);
          if (!alt) return null;
          return { ts, fast: alt.fast, slow: alt.slow, date: e.date, rating: e.rating, id: e.id };
        }
        const value = computeMetric(selectedWorkout, e.actualTimes);
        if (value === null) return null;
        return { ts, value, date: e.date, rating: e.rating, id: e.id };
      })
      .filter(Boolean)
      .sort((a, b) => a.ts - b.ts);
  }, [selectedWorkoutId, workoutHistory, selectedWorkout, isAlternating]);

  // Sessions list (sorted newest first)
  const sessions = useMemo(() => {
    if (!selectedWorkoutId) return [];
    return workoutHistory
      .filter(e => e.workoutId === selectedWorkoutId)
      .map(e => ({
        ...e,
        metric: !isAlternating ? computeMetric(selectedWorkout, e.actualTimes) : null,
        altMetrics: isAlternating ? computeAlternatingMetrics(e.actualTimes) : null,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedWorkoutId, workoutHistory, selectedWorkout, isAlternating]);

  // Y axis domain with a bit of padding
  const yDomain = useMemo(() => {
    if (!chartData.length) return ['auto', 'auto'];
    const vals = chartData.flatMap(d => [d.value, d.fast, d.slow].filter(v => v != null));
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min) * 0.15 || 5;
    return [Math.max(0, min - pad), max + pad];
  }, [chartData]);

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Analytics</h2>
        <p>Track your performance over time for any workout.</p>
      </div>

      <div className="analytics-selector">
        <label htmlFor="analytics-workout-select">Workout</label>
        <select
          id="analytics-workout-select"
          value={selectedWorkoutId}
          onChange={e => setSelectedWorkoutId(e.target.value)}
          className="analytics-workout-select"
        >
          <option value="">— Select a workout —</option>
          {allWorkouts.map(w => (
            <option key={w.id} value={w.id}>{w.nickname}</option>
          ))}
        </select>
      </div>

      {selectedWorkoutId && (
        <>
          {chartData.length < 2 ? (
            <div className="analytics-empty">
              {chartData.length === 0
                ? 'No sessions with recorded times yet. Log some workouts to see your progress!'
                : 'Log at least 2 sessions to see the trend line.'}
            </div>
          ) : (
            <div className="analytics-chart-wrap">
              <div className="analytics-metric-label">
                {isAlternating ? 'Fast / Slow avg split over time' : `${metricLabel(selectedWorkout)} over time`}
              </div>
              {isAlternating && (
                <div className="analytics-legend">
                  <span className="analytics-legend-fast">Fast 400s</span>
                  <span className="analytics-legend-slow">Slow 400s</span>
                </div>
              )}
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                  <XAxis
                    dataKey="ts"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={formatXTick}
                    tick={{ fontSize: 11, fill: '#aaa' }}
                    tickLine={false}
                    axisLine={{ stroke: '#444' }}
                  />
                  <YAxis
                    tickFormatter={formatYTick}
                    domain={yDomain}
                    tick={{ fontSize: 11, fill: '#aaa' }}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {isAlternating ? (
                    <>
                      <Line type="monotone" dataKey="fast" stroke="#6c5ce7" strokeWidth={2} dot={{ r: 4, fill: '#6c5ce7', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="slow" stroke="#00b894" strokeWidth={2} dot={{ r: 4, fill: '#00b894', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </>
                  ) : (
                    <Line type="monotone" dataKey="value" stroke="#6c5ce7" strokeWidth={2} dot={{ r: 4, fill: '#6c5ce7', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="analytics-sessions">
            <h3>Sessions</h3>
            {sessions.length === 0 ? (
              <div className="analytics-empty">No sessions logged yet.</div>
            ) : (
              <div className="analytics-session-list">
                {sessions.map(entry => (
                  <div key={entry.id} className="analytics-session-row">
                    <div className="analytics-session-date">
                      {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="analytics-session-metric">
                      {isAlternating ? (
                        entry.altMetrics ? (
                          <>
                            <span className="analytics-session-value analytics-fast">{formatSeconds(entry.altMetrics.fast)}</span>
                            <span className="analytics-session-label">Fast</span>
                            <span className="analytics-session-sep">·</span>
                            <span className="analytics-session-value analytics-slow">{formatSeconds(entry.altMetrics.slow)}</span>
                            <span className="analytics-session-label">Slow</span>
                          </>
                        ) : <span className="analytics-session-no-data">—</span>
                      ) : (
                        entry.metric !== null
                          ? <><span className="analytics-session-value">{formatSeconds(entry.metric)}</span><span className="analytics-session-label">{metricLabel(selectedWorkout)}</span></>
                          : <span className="analytics-session-no-data">—</span>
                      )}
                    </div>
                    <div className="analytics-session-rating">
                      {entry.rating}/10
                    </div>
                    {entry.actualTimes?.length > 0 && (
                      <div className="analytics-session-times">
                        {entry.actualTimes.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
