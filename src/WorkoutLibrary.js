import React, { useState } from 'react';
import { Calendar, Download, Copy, Edit3, Trash2, Plus, Clock, BarChart3 } from 'lucide-react';
import './WorkoutLibrary.css';

const WorkoutLibrary = () => {
  const [workoutLibrary] = useState({
    primary: {
      name: "Primary/Core Workouts (Tuesdays)",
      description: "Longer intervals, pace work, and endurance-focused sessions",
      workouts: [
        {
          id: "p1",
          name: "400-1000-400 Pyramid",
          nickname: "The Pyramid 1000",
          description: "2x 400m, 3x 1000m, 2x 400m",
          rx: "400s @68-70s, 1000s @72-76s, 400s @68-70s w/ 400m recoveries"
        },
        {
          id: "p2",
          name: "200-400-600-400-200 Pyramid Sets",
          nickname: "The Pyramid 600",
          description: "2 x (200-400-600-400-200)",
          rx: "200s @31-33s, 400s @68s, 600s @70-72s w/ 200m recoveries"
        },
        {
          id: "p3",
          name: "400m Alternating Recovery",
          nickname: "The 400 Alternator",
          description: "8-10 x 400m with alternating recovery",
          rx: "Odds @68s w/ 100m recoveries, Evens @70s w/ 400m recoveries"
        },
        {
          id: "p4",
          name: "800-400-200-400-800 Sandwich",
          nickname: "The V",
          description: "2x800 @72, 1x400 @68, 1x200 @32, 1x400 @68, 2x800 @72",
          rx: "800s @72s, 400s @68s, 200s @32s w/ 400m recoveries after 800s & 400s and 200m recoveries after 200s"
        },
        {
          id: "p5",
          name: "600-200 Couplets",
          nickname: "Dan's Couplets",
          description: "5 x (600-200)",
          rx: "600s @70-72s, 200s @30-32s w/ 200m rec between, 400m rec between sets"
        },
        {
          id: "p6",
          name: "400-200-800-200-400",
          nickname: "The W",
          description: "2x400, 2x200, 2x800, 2x200, 2x400",
          rx: "400s @66-68s, 200s @31-32s, 800s @72-75s w/ 200m rec (400m after 800s)"
        },
        {
          id: "p7",
          name: "600-400-200-100 Descending Ladder",
          nickname: "The Descender",
          description: "3x (600-400-200-100)",
          rx: "600s @78s, 400s @76s, 200s @33s, 100s @16s w/ 200/400/300/400m recoveries"
        },
        {
          id: "p8",
          name: "400 @ Goal",
          nickname: "Goal Pace Special",
          description: "6x 400m @goal pace",
          rx: "400s @64-67s (goal race pace) w/ 400m recoveries"
        },
        {
          id: "p9",
          name: "1000 @ Goal",
          nickname: "1000 Hot",
          description: "4x200, 1x1000, 4x150 one step",
          rx: "200s @32s w/ 200m rec, 1000 @68s w/ 400m rec, 150s one step w/ 250m rec"
        }
      ]
    },
    secondary: {
      name: "Secondary/Speed Workouts (Fridays)",
      description: "Shorter, faster intervals focused on speed and neuromuscular power",
      workouts: [
        {
          id: "s1",
          name: "200m Repeats",
          nickname: "My Little Delights",
          description: "6-8 x 200m",
          rx: "@28-32s w/ 600m recoveries - best possible average"
        },
        {
          id: "s2",
          name: "100m Strides",
          nickname: "Hunger Builder",
          description: "8 x 100m",
          rx: "@12-14s w/ 300m recoveries - relaxed speed"
        },
        {
          id: "s3",
          name: "300-200-100 Descending Triplets",
          nickname: "The Triplets",
          description: "3 x (300-200-100)",
          rx: "300s @48-50s, 200s @30-33s, 100s @13-15s w/ 500/600/700m recoveries"
        },
        {
          id: "s4",
          name: "150m One Step",
          nickname: "One Steps",
          description: "4-6 x 150m one step",
          rx: "Relaxed acceleration to near-max w/ 250m recoveries"
        },
        {
          id: "s5",
          name: "400m Time Trial",
          nickname: "The 400 TT",
          description: "4 x 400m @best average",
          rx: "@59-62s w/ 1200m recoveries - race simulation"
        },
        {
          id: "s6",
          name: "250m Repeats",
          nickname: "The 250s",
          description: "6 x 250m",
          rx: "Fast effort w/ 650m recoveries"
        },
        {
          id: "s7",
          name: "200-400-200 Sandwich",
          nickname: "400 All Out",
          description: "4x200, 1x400, 4x200",
          rx: "200s @ 31-32s, 400 @ 58-60s w/ 200m recoveries after 200s and 600-800m recovery after the 400"
        },
        {
          id: "s8",
          name: "300m Repeats",
          nickname: "The 300s",
          description: "6 x 300m",
          rx: "@best possible average w/ 500m recoveries"
        }
      ]
    }
  });

  const [schedule, setSchedule] = useState({
    weeks: Array(12).fill(null).map((_, i) => ({
      id: `week-${i + 1}`,
      weekNumber: i + 1,
      workouts: []
    }))
  });

  const [trainingStartDate, setTrainingStartDate] = useState('');
  const [workoutHistory, setWorkoutHistory] = useState([
    {
      id: 'h1',
      workoutId: 'p1',
      date: '2024-10-15',
      actualTimes: ['70.0', '69.0', '3:11.0', '3:10.0', '3:10.0', '66.0', '68.0'],
      targetTimes: ['72', '72', '3:18', '3:18', '3:18', '72', '72'],
      notes: 'This far exceeded expectations. First workout of 2024 training cycle - matched 2023 fitness levels.',
      weather: 'Cool, calm',
      location: 'Track',
      rating: 9
    },
    {
      id: 'h2',
      workoutId: 's5',
      date: '2024-12-20',
      actualTimes: ['59.98', '61.48', '61.73', '60.93'],
      targetTimes: ['61', '61', '61', '61'],
      notes: 'Spiked up. Very happy with this given I had been pretty sick Tue/Wed/Thu. Sub-60 opener was a pleasant surprise!',
      weather: 'Cool',
      location: 'Track',
      rating: 8
    }
  ]);

  const [activeTab, setActiveTab] = useState('library');
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showAddHistory, setShowAddHistory] = useState(false);
  const [historyForm, setHistoryForm] = useState({
    workoutId: '',
    date: new Date().toISOString().split('T')[0],
    actualTimes: '',
    targetTimes: '',
    notes: '',
    weather: '',
    location: '',
    rating: 5
  });

  const [draggedWorkout, setDraggedWorkout] = useState(null);

  const handleDragStart = (e, workout) => {
    setDraggedWorkout(workout);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e, weekIndex) => {
    e.preventDefault();
    if (draggedWorkout) {
      const newWorkout = {
        ...draggedWorkout,
        id: `${draggedWorkout.id}-${Date.now()}`,
        originalId: draggedWorkout.id
      };

      const newSchedule = { ...schedule };
      newSchedule.weeks[weekIndex].workouts.push(newWorkout);
      setSchedule(newSchedule);
      setDraggedWorkout(null);
    }
  };

  const removeWorkout = (weekIndex, workoutIndex) => {
    const newSchedule = { ...schedule };
    newSchedule.weeks[weekIndex].workouts.splice(workoutIndex, 1);
    setSchedule(newSchedule);
  };

  const duplicateWorkout = (weekIndex, workoutIndex) => {
    const newSchedule = { ...schedule };
    const originalWorkout = newSchedule.weeks[weekIndex].workouts[workoutIndex];
    const duplicatedWorkout = {
      ...originalWorkout,
      id: `${originalWorkout.originalId || originalWorkout.id}-${Date.now()}`
    };
    newSchedule.weeks[weekIndex].workouts.splice(workoutIndex + 1, 0, duplicatedWorkout);
    setSchedule(newSchedule);
  };

  const updateHistoryForm = (field, value) => {
    setHistoryForm(prev => ({ ...prev, [field]: value }));
  };

  const getWeekStartDate = (weekNumber) => {
    if (!trainingStartDate) return '';
    const startDate = new Date(trainingStartDate);
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + ((weekNumber - 1) * 7));

    return weekStartDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const addWorkoutHistory = () => {
    const newEntry = {
      id: `h${Date.now()}`,
      workoutId: historyForm.workoutId,
      date: historyForm.date,
      actualTimes: historyForm.actualTimes.split(',').map(t => t.trim()),
      targetTimes: historyForm.targetTimes.split(',').map(t => t.trim()),
      notes: historyForm.notes,
      weather: historyForm.weather,
      location: historyForm.location,
      rating: parseInt(historyForm.rating)
    };

    setWorkoutHistory([...workoutHistory, newEntry]);
    setHistoryForm({
      workoutId: '',
      date: new Date().toISOString().split('T')[0],
      actualTimes: '',
      targetTimes: '',
      notes: '',
      weather: '',
      location: '',
      rating: 5
    });
    setShowAddHistory(false);
  };

  const findWorkoutById = (id) => {
    for (const category of Object.values(workoutLibrary)) {
      const workout = category.workouts.find(w => w.id === id);
      if (workout) return workout;
    }
    return null;
  };

  const getWorkoutHistory = (workoutId) => {
    return workoutHistory.filter(h => h.workoutId === workoutId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const exportToMarkdown = () => {
    let markdown = "# Gruber's Mile Training Schedule\n\n";
    markdown += `Generated on ${new Date().toLocaleDateString()}\n\n`;

    schedule.weeks.forEach(week => {
      if (week.workouts.length > 0) {
        markdown += `## Week ${week.weekNumber}`;
        if (trainingStartDate) {
          markdown += `: ${getWeekStartDate(week.weekNumber)}`;
        }
        markdown += `\n\n`;

        week.workouts.forEach((workout, index) => {
          const day = index === 0 ? "Tuesday" : index === 1 ? "Friday" : `Day ${index + 1}`;
          markdown += `### ${day}: ${workout.nickname} (${workout.name})\n`;
          markdown += `**Description:** ${workout.description}\n\n`;
          markdown += `**Rx:** ${workout.rx}\n\n`;

          const history = getWorkoutHistory(workout.originalId || workout.id);
          if (history.length > 0) {
            markdown += `**Recent Performance:** Last run ${history[0].date} - Rating: ${history[0].rating}/10\n\n`;
          }

          markdown += "---\n\n";
        });
      }
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gruber-mile-training-schedule.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const LibraryWorkout = ({ workout }) => {
    const history = getWorkoutHistory(workout.id);
    const lastRun = history[0];

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, workout)}
        className="library-workout"
        onClick={() => setSelectedWorkout(workout)}
      >
        <div className="workout-header">
          {lastRun && (
            <span className="last-run-date">
              {new Date(lastRun.date).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="workout-nickname">{workout.nickname}</div>
        <div className="workout-name">{workout.name}</div>
        <div className="workout-description">{workout.description}</div>
        {lastRun && (
          <div className="last-rating">
            Last rating: {lastRun.rating}/10
          </div>
        )}
      </div>
    );
  };

  const ScheduleWorkout = ({ workout, weekIndex, workoutIndex }) => {
    const history = getWorkoutHistory(workout.originalId || workout.id);
    const lastRun = history[0];

    return (
      <div className="schedule-workout">
        <div className="schedule-workout-content">
          <div className="workout-info">
            <div className="workout-title">
              <span className="workout-nickname">{workout.nickname}</span>
            </div>
            <div className="workout-name">{workout.name}</div>
            <div className="workout-description">{workout.description}</div>
            {lastRun && (
              <div className="last-performance">
                Last: {new Date(lastRun.date).toLocaleDateString()} ({lastRun.rating}/10)
              </div>
            )}
          </div>
          <div className="workout-actions">
            <button
              onClick={() => duplicateWorkout(weekIndex, workoutIndex)}
              className="action-btn duplicate-btn"
              title="Duplicate workout"
            >
              <Copy size={12} />
            </button>
            <button
              onClick={() => setSelectedWorkout(workout)}
              className="action-btn details-btn"
              title="View details"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={() => removeWorkout(weekIndex, workoutIndex)}
              className="action-btn remove-btn"
              title="Remove workout"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="workout-app">
      <div className="app-header">
        <div className="header-content">
          <div className="app-logo">
            <span>GM</span>
          </div>
          <div className="header-text">
            <h1>Gruber's Mile Training</h1>
            <p>Build schedules, track workout history, and export to markdown. (17 total workouts)</p>
          </div>
        </div>
      </div>

      <div className="tab-navigation">
        {[
          { id: 'library', label: 'Workout Library', icon: Calendar },
          { id: 'schedule', label: 'Training Schedule', icon: BarChart3 },
          { id: 'history', label: 'Workout History', icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'library' && (
        <div className="library-grid">
          {Object.values(workoutLibrary).map((category, categoryIndex) => (
            <div key={categoryIndex} className="category-card">
              <h3 className="category-title">{category.name}</h3>
              <p className="category-description">{category.description}</p>

              <div className="workouts-list">
                {category.workouts.map((workout) => (
                  <LibraryWorkout key={workout.id} workout={workout} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="schedule-container">
          <div className="schedule-header">
            <h2>Training Schedule</h2>
            <div className="schedule-controls">
              <div className="date-input-group">
                <label>Training Start Date:</label>
                <input
                  type="date"
                  value={trainingStartDate}
                  onChange={(e) => setTrainingStartDate(e.target.value)}
                  className="date-input"
                />
              </div>
              <button
                onClick={exportToMarkdown}
                className="export-btn"
              >
                <Download size={16} />
                Export Markdown
              </button>
            </div>
          </div>

          <div className="weeks-grid">
            {schedule.weeks.map((week, weekIndex) => (
              <div
                key={week.id}
                className="week-card"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, weekIndex)}
              >
                <h3 className="week-title">
                  Week {week.weekNumber}
                  {trainingStartDate && (
                    <span className="week-date">
                      : {getWeekStartDate(week.weekNumber)}
                    </span>
                  )}
                </h3>

                <div className="week-drop-zone">
                  {week.workouts.map((workout, workoutIndex) => (
                    <ScheduleWorkout
                      key={workout.id}
                      workout={workout}
                      weekIndex={weekIndex}
                      workoutIndex={workoutIndex}
                    />
                  ))}
                  {week.workouts.length === 0 && (
                    <div className="empty-week">
                      Drop workouts here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-container">
          <div className="history-header">
            <h2>Workout History</h2>
            <button
              onClick={() => setShowAddHistory(true)}
              className="add-entry-btn"
            >
              <Plus size={16} />
              Add Entry
            </button>
          </div>

          <div className="history-list">
            {workoutHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((entry) => {
              const workout = findWorkoutById(entry.workoutId);
              return (
                <div key={entry.id} className="history-entry">
                  <div className="entry-header">
                    <div className="entry-workout">
                      <h3>{workout?.nickname || 'Unknown Workout'}</h3>
                      <p>{workout?.name}</p>
                    </div>
                    <div className="entry-meta">
                      <div className="entry-date">{new Date(entry.date).toLocaleDateString()}</div>
                      <div className="entry-rating">Rating: {entry.rating}/10</div>
                    </div>
                  </div>

                  {entry.actualTimes.length > 0 && (
                    <div className="entry-times">
                      <div className="times-label">Times:</div>
                      <div className="times-values">{entry.actualTimes.join(', ')}</div>
                    </div>
                  )}

                  {entry.notes && (
                    <div className="entry-notes">
                      <div className="notes-label">Notes:</div>
                      <div className="notes-text">{entry.notes}</div>
                    </div>
                  )}

                  <div className="entry-details">
                    {entry.weather && <span>Weather: {entry.weather}</span>}
                    {entry.location && <span>Location: {entry.location}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedWorkout && (
        <div className="modal-overlay" onClick={() => setSelectedWorkout(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{selectedWorkout.nickname}</h3>
                <p>{selectedWorkout.name}</p>
              </div>
              <button
                onClick={() => setSelectedWorkout(null)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="workout-detail">
                <span className="detail-label">Description:</span> {selectedWorkout.description}
              </div>
              <div className="workout-detail">
                <span className="detail-label">Rx:</span> {selectedWorkout.rx}
              </div>

              <div className="workout-history">
                <h4>Recent History:</h4>
                {getWorkoutHistory(selectedWorkout.id).slice(0, 3).map((entry) => (
                  <div key={entry.id} className="history-item">
                    <div className="history-date">{new Date(entry.date).toLocaleDateString()}</div>
                    <div className="history-rating">Rating: {entry.rating}/10</div>
                    {entry.notes && <div className="history-notes">{entry.notes}</div>}
                  </div>
                ))}
                {getWorkoutHistory(selectedWorkout.id).length === 0 && (
                  <p className="no-history">No history recorded yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddHistory && (
        <div className="modal-overlay" onClick={() => setShowAddHistory(false)}>
          <div className="modal-content small-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Workout Entry</h3>
              <button
                onClick={() => setShowAddHistory(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="form-container">
              <div className="form-field">
                <label>Workout</label>
                <select
                  value={historyForm.workoutId}
                  onChange={(e) => updateHistoryForm('workoutId', e.target.value)}
                >
                  <option value="">Select workout...</option>
                  {Object.values(workoutLibrary).map(category =>
                    category.workouts.map(workout => (
                      <option key={workout.id} value={workout.id}>
                        {workout.nickname}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-field">
                <label>Date</label>
                <input
                  type="date"
                  value={historyForm.date}
                  onChange={(e) => updateHistoryForm('date', e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Actual Times (comma separated)</label>
                <input
                  type="text"
                  value={historyForm.actualTimes}
                  onChange={(e) => updateHistoryForm('actualTimes', e.target.value)}
                  placeholder="e.g., 68.2, 67.9, 3:03.3"
                />
              </div>

              <div className="form-field">
                <label>Target Times (comma separated)</label>
                <input
                  type="text"
                  value={historyForm.targetTimes}
                  onChange={(e) => updateHistoryForm('targetTimes', e.target.value)}
                  placeholder="e.g., 68, 68, 3:03"
                />
              </div>

              <div className="form-field">
                <label>Notes</label>
                <textarea
                  value={historyForm.notes}
                  onChange={(e) => updateHistoryForm('notes', e.target.value)}
                  rows={3}
                  placeholder="How did the workout feel? Any observations..."
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Weather</label>
                  <input
                    type="text"
                    value={historyForm.weather}
                    onChange={(e) => updateHistoryForm('weather', e.target.value)}
                    placeholder="Cool, windy"
                  />
                </div>

                <div className="form-field">
                  <label>Location</label>
                  <input
                    type="text"
                    value={historyForm.location}
                    onChange={(e) => updateHistoryForm('location', e.target.value)}
                    placeholder="Track, Armory"
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Rating (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={historyForm.rating}
                  onChange={(e) => updateHistoryForm('rating', e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowAddHistory(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={addWorkoutHistory}
                disabled={!historyForm.workoutId || !historyForm.date}
                className="submit-btn"
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutLibrary;