import React, { useState, useEffect } from 'react';
import { Calendar, Download, Copy, Edit3, Trash2, Plus, Clock, BarChart3, Save, FileText, Eye, PanelLeft, Info } from 'lucide-react';
import {
  getWorkoutLibrary,
  getTrainingSchedules,
  saveTrainingSchedule,
  updateTrainingSchedule,
  deleteTrainingSchedule,
  getWorkoutHistory,
  saveWorkoutHistory
} from './supabase.js';
import './WorkoutLibrary.css';

const WorkoutLibrary = () => {
  const [workoutLibrary, setWorkoutLibrary] = useState({
    primary: { name: "Primary/Core Workouts (Tuesdays)", description: "Longer intervals, pace work, and endurance-focused sessions", workouts: [] },
    secondary: { name: "Secondary/Speed Workouts (Fridays)", description: "Shorter, faster intervals focused on speed and neuromuscular power", workouts: [] }
  });
  const [loading, setLoading] = useState(true);

  const [schedule, setSchedule] = useState({
    weeks: Array(12).fill(null).map((_, i) => ({
      id: `week-${i + 1}`,
      weekNumber: i + 1,
      workouts: [],
      mileageGoal: '',
      actualMileage: ''
    }))
  });

  const [trainingStartDate, setTrainingStartDate] = useState('');
  const [workoutHistory, setWorkoutHistory] = useState([]);

  const [activeTab, setActiveTab] = useState('library');
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showAddHistory, setShowAddHistory] = useState(false);
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [currentScheduleName, setCurrentScheduleName] = useState('');
  const [savedSchedules, setSavedSchedules] = useState([]);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [expandedScheduleId, setExpandedScheduleId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [draggedWorkout, setDraggedWorkout] = useState(null);
  const [showWorkoutEdit, setShowWorkoutEdit] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editingWeekIndex, setEditingWeekIndex] = useState(null);
  const [editingWorkoutIndex, setEditingWorkoutIndex] = useState(null);
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

  // Load data from Supabase on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Loading data from Supabase...');

        // Load workout library
        const { data: workouts, error: workoutError } = await getWorkoutLibrary();
        if (workoutError) {
          console.error('Failed to load workout library:', workoutError);
        } else {
          console.log('Loaded workouts:', workouts?.length);
          // Group workouts by category
          const primary = workouts?.filter(w => w.category === 'primary') || [];
          const secondary = workouts?.filter(w => w.category === 'secondary') || [];

          setWorkoutLibrary({
            primary: {
              name: "Primary/Core Workouts (Tuesdays)",
              description: "Longer intervals, pace work, and endurance-focused sessions",
              workouts: primary
            },
            secondary: {
              name: "Secondary/Speed Workouts (Fridays)",
              description: "Shorter, faster intervals focused on speed and neuromuscular power",
              workouts: secondary
            }
          });
        }

        // Load workout history
        const { data: history, error: historyError } = await getWorkoutHistory();
        if (historyError) {
          console.error('Failed to load workout history:', historyError);
        } else {
          console.log('Loaded workout history:', history?.length);
          // Transform Supabase data to match existing format
          const transformedHistory = (history || []).map(entry => ({
            id: entry.id,
            workoutId: entry.workout_id,
            date: entry.date,
            actualTimes: entry.actual_times || [],
            targetTimes: entry.target_times || [],
            notes: entry.notes || '',
            weather: entry.weather || '',
            location: entry.location || '',
            rating: entry.rating || 5
          }));
          setWorkoutHistory(transformedHistory);
        }

        // Load saved schedules
        const { data: schedules, error: schedulesError } = await getTrainingSchedules();
        if (schedulesError) {
          console.error('Failed to load schedules:', schedulesError);
        } else {
          console.log('Loaded schedules:', schedules?.length);
          // Transform Supabase schedules to match existing format
          const transformedSchedules = (schedules || []).map(schedule => ({
            id: schedule.id,
            name: schedule.name,
            trainingStartDate: schedule.training_start_date,
            createdAt: schedule.created_at,
            updatedAt: schedule.updated_at,
            schedule: {
              weeks: Array(12).fill(null).map((_, i) => {
                const weekNumber = i + 1;
                const weekData = schedule.schedule_weeks?.find(w => w.week_number === weekNumber);
                return {
                  id: `week-${weekNumber}`,
                  weekNumber,
                  workouts: weekData?.schedule_workouts?.map(sw => ({
                    id: `${sw.workout_id}-${Date.now()}-${Math.random()}`,
                    originalId: sw.workout_id,
                    name: sw.workout_library?.name || '',
                    nickname: sw.workout_library?.nickname || '',
                    description: sw.workout_library?.description || '',
                    rx: sw.workout_library?.rx || '',
                    completed: sw.completed || false,
                    completedDate: sw.completed_date,
                    completedNotes: sw.completed_notes
                  })) || [],
                  mileageGoal: weekData?.mileage_goal?.toString() || '',
                  actualMileage: weekData?.actual_mileage?.toString() || ''
                };
              })
            }
          }));
          setSavedSchedules(transformedSchedules);
          console.log('Set saved schedules:', transformedSchedules.length);
        }

      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
        console.log('Data loading complete');
      }
    };

    loadData();
  }, []);

  const openWorkoutPicker = (weekIndex) => {
    setSelectedWeekIndex(weekIndex);
    setShowWorkoutPicker(true);
  };

  const handleDragStart = (e, workout) => {
    setDraggedWorkout(workout);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify(workout));
    e.dataTransfer.setData('application/json', JSON.stringify(workout));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e, weekIndex) => {
    e.preventDefault();

    let workoutToDrop = draggedWorkout;

    // Try to get from dataTransfer as primary source
    try {
      let workoutData = e.dataTransfer.getData('application/json');
      if (!workoutData) {
        workoutData = e.dataTransfer.getData('text/plain');
      }
      if (workoutData) {
        workoutToDrop = JSON.parse(workoutData);
      }
    } catch (err) {
      // Silent fallback
    }

    // Fallback to draggedWorkout state
    if (!workoutToDrop) {
      workoutToDrop = draggedWorkout;
    }

    if (workoutToDrop) {
      const newWorkout = {
        ...workoutToDrop,
        id: `${workoutToDrop.id}-${Date.now()}`,
        originalId: workoutToDrop.id
      };

      const newSchedule = { ...schedule };
      newSchedule.weeks[weekIndex].workouts.push(newWorkout);
      setSchedule(newSchedule);
    }

    setDraggedWorkout(null);
  };

  const addWorkoutToSchedule = (workout) => {
    if (selectedWeekIndex !== null) {
      const newWorkout = {
        ...workout,
        id: `${workout.id}-${Date.now()}`,
        originalId: workout.id
      };

      const newSchedule = { ...schedule };
      newSchedule.weeks[selectedWeekIndex].workouts.push(newWorkout);
      setSchedule(newSchedule);
    }
    setShowWorkoutPicker(false);
    setSelectedWeekIndex(null);
  };

  const saveSchedule = async () => {
    const finalName = scheduleName || currentScheduleName || `Training Schedule ${savedSchedules.length + 1}`;
    const scheduleData = {
      name: finalName,
      trainingStartDate,
      schedule: { ...schedule }
    };

    try {
      if (editingScheduleId) {
        // Update existing schedule
        const { error } = await updateTrainingSchedule(editingScheduleId, scheduleData);
        if (error) {
          console.error('Failed to update schedule:', error);
          alert('Failed to update schedule. Please try again.');
          return;
        }

        // Refresh schedules from database
        const { data: schedules, error: schedulesError } = await getTrainingSchedules();
        if (!schedulesError) {
          const transformedSchedules = schedules.map(schedule => ({
            id: schedule.id,
            name: schedule.name,
            trainingStartDate: schedule.training_start_date,
            createdAt: schedule.created_at,
            updatedAt: schedule.updated_at,
            schedule: {
              weeks: Array(12).fill(null).map((_, i) => {
                const weekNumber = i + 1;
                const weekData = schedule.schedule_weeks?.find(w => w.week_number === weekNumber);
                return {
                  id: `week-${weekNumber}`,
                  weekNumber,
                  workouts: weekData?.schedule_workouts?.map(sw => ({
                    id: `${sw.workout_id}-${Date.now()}-${Math.random()}`,
                    originalId: sw.workout_id,
                    name: sw.workout_library?.name || '',
                    nickname: sw.workout_library?.nickname || '',
                    description: sw.workout_library?.description || '',
                    rx: sw.workout_library?.rx || '',
                    completed: sw.completed || false,
                    completedDate: sw.completed_date,
                    completedNotes: sw.completed_notes
                  })) || [],
                  mileageGoal: weekData?.mileage_goal?.toString() || '',
                  actualMileage: weekData?.actual_mileage?.toString() || ''
                };
              })
            }
          }));
          setSavedSchedules(transformedSchedules);
        }
        setEditingScheduleId(null);
      } else {
        // Create new schedule
        const { data, error } = await saveTrainingSchedule(scheduleData);
        if (error) {
          console.error('Failed to save schedule:', error);
          alert('Failed to save schedule. Please try again.');
          return;
        }

        // Add new schedule to local state
        const newSchedule = {
          id: data.id,
          name: finalName,
          trainingStartDate,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          schedule: { ...schedule }
        };
        setSavedSchedules(prev => [...prev, newSchedule]);
      }

      setCurrentScheduleName(finalName);
      setScheduleName('');
      setShowSaveModal(false);
    } catch (err) {
      console.error('Error saving schedule:', err);
      alert('Failed to save schedule. Please try again.');
    }
  };

  const loadSchedule = (savedSchedule) => {
    setSchedule(savedSchedule.schedule);
    setTrainingStartDate(savedSchedule.trainingStartDate);
    setCurrentScheduleName(savedSchedule.name);
    setEditingScheduleId(savedSchedule.id);
    setActiveTab('builder');
  };

  const deleteSchedule = async (scheduleId) => {
    try {
      const { error } = await deleteTrainingSchedule(scheduleId);
      if (error) {
        console.error('Failed to delete schedule:', error);
        alert('Failed to delete schedule. Please try again.');
        return;
      }

      setSavedSchedules(prev => prev.filter(s => s.id !== scheduleId));
      if (editingScheduleId === scheduleId) {
        setEditingScheduleId(null);
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert('Failed to delete schedule. Please try again.');
    }
  };

  const clearSchedule = () => {
    setSchedule({
      weeks: Array(12).fill(null).map((_, i) => ({
        id: `week-${i + 1}`,
        weekNumber: i + 1,
        workouts: [],
        mileageGoal: '',
        actualMileage: ''
      }))
    });
    setTrainingStartDate('');
    setCurrentScheduleName('');
    setEditingScheduleId(null);
  };

  const openWorkoutEdit = (workout, weekIndex, workoutIndex) => {
    setEditingWorkout(workout);
    setEditingWeekIndex(weekIndex);
    setEditingWorkoutIndex(workoutIndex);
    setShowWorkoutEdit(true);
  };

  const completeWorkout = async (completionData) => {
    const newEntry = {
      workoutId: editingWorkout.originalId || editingWorkout.id,
      date: completionData.date,
      actualTimes: completionData.actualTimes.split(',').map(t => t.trim()).filter(t => t),
      targetTimes: completionData.targetTimes.split(',').map(t => t.trim()).filter(t => t),
      notes: completionData.notes,
      weather: completionData.weather,
      location: completionData.location,
      rating: parseInt(completionData.rating)
    };

    try {
      // Save workout history to Supabase
      const { data, error } = await saveWorkoutHistory(newEntry);
      if (error) {
        console.error('Failed to save workout history:', error);
        alert('Failed to save workout completion. Please try again.');
        return;
      }

      // Add to local workout history
      const transformedEntry = {
        id: data[0].id,
        workoutId: data[0].workout_id,
        date: data[0].date,
        actualTimes: data[0].actual_times || [],
        targetTimes: data[0].target_times || [],
        notes: data[0].notes || '',
        weather: data[0].weather || '',
        location: data[0].location || '',
        rating: data[0].rating || 5
      };
      setWorkoutHistory(prev => [transformedEntry, ...prev]);

      // Mark workout as completed in the appropriate schedule
      if (activeTab === 'builder') {
        // Update current schedule
        const newSchedule = { ...schedule };
        newSchedule.weeks[editingWeekIndex].workouts[editingWorkoutIndex] = {
          ...editingWorkout,
          completed: true,
          completedDate: completionData.date,
          completedNotes: completionData.notes
        };
        setSchedule(newSchedule);
      } else if (activeTab === 'schedules' && expandedScheduleId) {
        // Update saved schedule
        const updatedSchedules = savedSchedules.map(s => {
          if (s.id === expandedScheduleId) {
            const newSavedSchedule = { ...s };
            newSavedSchedule.schedule.weeks[editingWeekIndex].workouts[editingWorkoutIndex] = {
              ...editingWorkout,
              completed: true,
              completedDate: completionData.date,
              completedNotes: completionData.notes
            };
            return newSavedSchedule;
          }
          return s;
        });
        setSavedSchedules(updatedSchedules);

        // Update the completion status in Supabase for saved schedules
        // Note: This is a simplified approach - in a full implementation you'd want to update the specific schedule_workout
        try {
          await updateTrainingSchedule(expandedScheduleId, savedSchedules.find(s => s.id === expandedScheduleId));
        } catch (updateError) {
          console.error('Failed to update schedule completion status:', updateError);
          // Don't block the UI, but log the error
        }
      }

      setShowWorkoutEdit(false);
    } catch (err) {
      console.error('Error completing workout:', err);
      alert('Failed to save workout completion. Please try again.');
    }
  };

  const updateMileage = (weekIndex, field, value) => {
    const newSchedule = { ...schedule };
    newSchedule.weeks[weekIndex][field] = value;
    setSchedule(newSchedule);
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

  const addWorkoutHistory = async () => {
    const newEntry = {
      workoutId: historyForm.workoutId,
      date: historyForm.date,
      actualTimes: historyForm.actualTimes.split(',').map(t => t.trim()).filter(t => t),
      targetTimes: historyForm.targetTimes.split(',').map(t => t.trim()).filter(t => t),
      notes: historyForm.notes,
      weather: historyForm.weather,
      location: historyForm.location,
      rating: parseInt(historyForm.rating)
    };

    try {
      const { data, error } = await saveWorkoutHistory(newEntry);
      if (error) {
        console.error('Failed to save workout history:', error);
        alert('Failed to save workout entry. Please try again.');
        return;
      }

      // Add to local state with transformed data
      const transformedEntry = {
        id: data[0].id,
        workoutId: data[0].workout_id,
        date: data[0].date,
        actualTimes: data[0].actual_times || [],
        targetTimes: data[0].target_times || [],
        notes: data[0].notes || '',
        weather: data[0].weather || '',
        location: data[0].location || '',
        rating: data[0].rating || 5
      };

      setWorkoutHistory(prev => [transformedEntry, ...prev]);
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
    } catch (err) {
      console.error('Error saving workout history:', err);
      alert('Failed to save workout entry. Please try again.');
    }
  };

  const findWorkoutById = (id) => {
    for (const category of Object.values(workoutLibrary)) {
      const workout = category.workouts.find(w => w.id === id);
      if (workout) return workout;
    }
    return null;
  };

  const getWorkoutHistoryForWorkout = (workoutId) => {
    return workoutHistory.filter(h => h.workoutId === workoutId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const exportHistoryToMarkdown = () => {
    let markdown = "# Workout History\n\n";
    markdown += `Generated on ${new Date().toLocaleDateString()}\n\n`;

    if (workoutHistory.length === 0) {
      markdown += "No workout history recorded yet.\n";
    } else {
      const sortedHistory = [...workoutHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      sortedHistory.forEach((entry) => {
        const workout = findWorkoutById(entry.workoutId);
        markdown += `## ${workout?.nickname || 'Unknown Workout'} - ${new Date(entry.date).toLocaleDateString()}\n\n`;

        if (workout) {
          markdown += `**Workout:** ${workout.name}\n`;
          markdown += `**Description:** ${workout.description}\n`;
          markdown += `**Rx:** ${workout.rx}\n\n`;
        }

        markdown += `**Date:** ${new Date(entry.date).toLocaleDateString()}\n`;
        markdown += `**Rating:** ${entry.rating}/10\n`;

        if (entry.actualTimes && entry.actualTimes.length > 0) {
          markdown += `**Actual Times:** ${entry.actualTimes.join(', ')}\n`;
        }

        if (entry.targetTimes && entry.targetTimes.length > 0) {
          markdown += `**Target Times:** ${entry.targetTimes.join(', ')}\n`;
        }

        if (entry.weather) {
          markdown += `**Weather:** ${entry.weather}\n`;
        }

        if (entry.location) {
          markdown += `**Location:** ${entry.location}\n`;
        }

        if (entry.notes) {
          markdown += `**Notes:** ${entry.notes}\n`;
        }

        markdown += "\n---\n\n";
      });
    }

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workout-history.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToMarkdown = (scheduleData = null, fileName = null) => {
    // Use provided schedule or current builder schedule
    const exportSchedule = scheduleData ? scheduleData.schedule : schedule;
    const exportStartDate = scheduleData ? scheduleData.trainingStartDate : trainingStartDate;
    const exportName = scheduleData ? scheduleData.name : (currentScheduleName || "Training Schedule");

    let markdown = `# ${exportName}\n\n`;
    markdown += `Generated on ${new Date().toLocaleDateString()}\n\n`;

    if (exportStartDate) {
      markdown += `**Training Start Date:** ${new Date(exportStartDate).toLocaleDateString()}\n\n`;
    }

    const getExportWeekStartDate = (weekNumber) => {
      if (!exportStartDate) return '';
      const startDate = new Date(exportStartDate);
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(startDate.getDate() + ((weekNumber - 1) * 7));
      return weekStartDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    exportSchedule.weeks.forEach(week => {
      if (week.workouts && week.workouts.length > 0) {
        markdown += `## Week ${week.weekNumber}`;
        if (exportStartDate) {
          markdown += `: ${getExportWeekStartDate(week.weekNumber)}`;
        }
        markdown += `\n\n`;

        if (week.mileageGoal) {
          markdown += `**Mileage Goal:** ${week.mileageGoal} miles\n`;
        }
        if (week.actualMileage) {
          markdown += `**Actual Mileage:** ${week.actualMileage} miles\n`;
        }
        if (week.mileageGoal || week.actualMileage) {
          markdown += `\n`;
        }

        week.workouts.forEach((workout, index) => {
          const day = index === 0 ? "Tuesday" : index === 1 ? "Friday" : `Day ${index + 1}`;
          markdown += `### ${day}: ${workout.nickname} (${workout.name})\n`;
          markdown += `**Description:** ${workout.description}\n\n`;
          markdown += `**Rx:** ${workout.rx}\n\n`;

          if (workout.completed) {
            markdown += `**Status:** ✅ Completed on ${new Date(workout.completedDate).toLocaleDateString()}\n`;
            if (workout.completedNotes) {
              markdown += `**Notes:** ${workout.completedNotes}\n`;
            }
            markdown += `\n`;
          }

          const history = getWorkoutHistoryForWorkout(workout.originalId || workout.id);
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
    a.download = fileName || `${exportName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-training-schedule.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const LibraryWorkout = ({ workout, isPickerMode = false, onSelect = null, isDraggable = false }) => {
    const history = getWorkoutHistoryForWorkout(workout.id);
    const lastRun = history[0];

    const handleInfoClick = (e) => {
      e.stopPropagation();
      if (isPickerMode && onSelect) {
        onSelect(workout);
      } else {
        setSelectedWorkout(workout);
      }
    };

    const handlePickerClick = () => {
      if (isPickerMode && onSelect) {
        onSelect(workout);
      }
    };

    const handleDragStartLocal = (e) => {
      handleDragStart(e, workout);
    };

    return (
      <div
        draggable={isDraggable}
        onDragStart={isDraggable ? handleDragStartLocal : undefined}
        className={`library-workout ${isPickerMode ? 'picker-mode' : ''} ${isDraggable ? 'draggable' : ''}`}
        onClick={isPickerMode ? handlePickerClick : undefined}
      >
        <div className="workout-header">
          {!isPickerMode && (
            <div
              className="info-icon"
              onClick={handleInfoClick}
              title="View workout details"
            >
              <Info size={16} />
            </div>
          )}
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
    const history = getWorkoutHistoryForWorkout(workout.originalId || workout.id);
    const lastRun = history[0];

    return (
      <div className={`schedule-workout ${workout.completed ? 'completed' : ''}`}>
        <div className="schedule-workout-content">
          <div className="workout-info">
            <div className="workout-title">
              <span className="workout-nickname">{workout.nickname}</span>
              {workout.completed && <span className="completed-badge">✓ Completed</span>}
            </div>
            <div className="workout-name">{workout.name}</div>
            <div className="workout-description">{workout.description}</div>
            {workout.completed && workout.completedDate && (
              <div className="completion-info">
                Completed: {new Date(workout.completedDate).toLocaleDateString()}
                {workout.completedNotes && <span> - {workout.completedNotes}</span>}
              </div>
            )}
            {!workout.completed && lastRun && (
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
              <Eye size={12} />
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

  if (loading) {
    return (
      <div className="workout-app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading workout data from Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-app">
      <div className="app-header">
        <div className="header-content">
          <div className="app-logo">
            <img
              src={`${process.env.PUBLIC_URL}/grubes_logo.png`}
              alt="Grube's GOOBS"
              className="logo-image"
            />
          </div>
          <div className="header-text">
            <h1>Mile Training with Dan Gruber</h1>
            <p>Build schedules, track workout history, and export to markdown. (17 total workouts)</p>
          </div>
        </div>
      </div>

      <div className="tab-navigation">
        {[
          { id: 'library', label: 'Workout Library', icon: Calendar },
          { id: 'builder', label: 'Training Schedule Builder', icon: BarChart3 },
          { id: 'schedules', label: 'Training Schedules', icon: FileText },
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

      {activeTab === 'builder' && (
        <div className="builder-layout">
          <div className={`workout-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
              <h3>Workout Library</h3>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="sidebar-toggle"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <PanelLeft size={16} />
              </button>
            </div>

            {!sidebarCollapsed && (
              <div className="sidebar-content">
                {Object.values(workoutLibrary).map((category, categoryIndex) => (
                  <div key={categoryIndex} className="sidebar-category">
                    <h4 className="sidebar-category-title">{category.name}</h4>
                    <div className="sidebar-workouts">
                      {category.workouts.map((workout) => (
                        <LibraryWorkout
                          key={workout.id}
                          workout={workout}
                          isDraggable={true}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="schedule-container">
            <div className="schedule-header">
              <div className="builder-header-section">
                <h2>Training Schedule Builder</h2>
                <div className="schedule-name-input-group">
                  <label>Schedule Name:</label>
                  <input
                    type="text"
                    value={currentScheduleName}
                    onChange={(e) => setCurrentScheduleName(e.target.value)}
                    placeholder="e.g., Eric's Fall Training Schedule"
                    className="schedule-name-input"
                  />
                </div>
              </div>
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
                <div className="builder-actions">
                  <button
                    onClick={() => {
                      setScheduleName(currentScheduleName);
                      setShowSaveModal(true);
                    }}
                    className="save-btn"
                    disabled={schedule.weeks.every(week => week.workouts.length === 0)}
                  >
                    <Save size={16} />
                    {editingScheduleId ? 'Update Schedule' : 'Save Schedule'}
                  </button>
                  <button
                    onClick={clearSchedule}
                    className="clear-btn"
                  >
                    Clear
                  </button>
                  <button
                    onClick={exportToMarkdown}
                    className="export-btn"
                  >
                    <Download size={16} />
                    Export Markdown
                  </button>
                </div>
              </div>
              {editingScheduleId && (
                <div className="editing-indicator">
                  <Edit3 size={16} />
                  Editing: {savedSchedules.find(s => s.id === editingScheduleId)?.name}
                </div>
              )}
            </div>

            <div className="weeks-grid">
              {schedule.weeks.map((week, weekIndex) => (
                <div
                  key={week.id}
                  className="week-card"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, weekIndex)}
                >
                  <div className="week-header">
                    <h3 className="week-title">
                      Week {week.weekNumber}
                      {trainingStartDate && (
                        <span className="week-date">
                          : {getWeekStartDate(week.weekNumber)}
                        </span>
                      )}
                    </h3>
                    <button
                      onClick={() => openWorkoutPicker(weekIndex)}
                      className="add-workout-btn"
                      title="Add workout"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="week-mileage">
                    <div className="mileage-field">
                      <label>Mileage Goal:</label>
                      <input
                        type="number"
                        value={week.mileageGoal}
                        onChange={(e) => updateMileage(weekIndex, 'mileageGoal', e.target.value)}
                        placeholder="0"
                        className="mileage-input"
                        min="0"
                        step="0.1"
                      />
                      <span>mi</span>
                    </div>
                  </div>

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
                        Drag workouts here or click +
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="schedules-container">
          <div className="schedules-header">
            <h2>Training Schedules</h2>
            <button
              onClick={() => setActiveTab('builder')}
              className="new-schedule-btn"
            >
              <Plus size={16} />
              New Schedule
            </button>
          </div>

          {savedSchedules.length === 0 ? (
            <div className="empty-schedules">
              <FileText size={48} />
              <h3>No Saved Schedules</h3>
              <p>Create your first training schedule in the Schedule Builder</p>
              <button
                onClick={() => setActiveTab('builder')}
                className="get-started-btn"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="schedules-grid">
              {savedSchedules.map((savedSchedule) => (
                <div key={savedSchedule.id} className="schedule-card">
                  <div className="schedule-card-header">
                    <h3>{savedSchedule.name}</h3>
                    <div className="schedule-actions">
                      <button
                        onClick={() => setExpandedScheduleId(
                          expandedScheduleId === savedSchedule.id ? null : savedSchedule.id
                        )}
                        className="action-btn view-btn"
                        title="View schedule"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => exportToMarkdown(savedSchedule)}
                        className="action-btn export-btn"
                        title="Export to Markdown"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => loadSchedule(savedSchedule)}
                        className="action-btn edit-btn"
                        title="Edit schedule"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => deleteSchedule(savedSchedule.id)}
                        className="action-btn delete-btn"
                        title="Delete schedule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="schedule-info">
                    <p>Created: {new Date(savedSchedule.createdAt).toLocaleDateString()}</p>
                    {savedSchedule.trainingStartDate && (
                      <p>Start Date: {new Date(savedSchedule.trainingStartDate).toLocaleDateString()}</p>
                    )}
                    <p>Total Workouts: {savedSchedule.schedule.weeks.reduce((total, week) => total + week.workouts.length, 0)}</p>
                  </div>

                  {expandedScheduleId === savedSchedule.id && (
                    <ScheduleDetailView
                      schedule={savedSchedule}
                      onWorkoutEdit={openWorkoutEdit}
                      onMileageUpdate={(weekIndex, field, value) => {
                        const updatedSchedules = savedSchedules.map(s => {
                          if (s.id === savedSchedule.id) {
                            const newSchedule = { ...s };
                            newSchedule.schedule.weeks[weekIndex][field] = value;
                            return newSchedule;
                          }
                          return s;
                        });
                        setSavedSchedules(updatedSchedules);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-container">
          <div className="history-header">
            <h2>Workout History</h2>
            <div className="history-actions">
              <button
                onClick={exportHistoryToMarkdown}
                className="export-history-btn"
                disabled={workoutHistory.length === 0}
              >
                <Download size={16} />
                Export to Markdown
              </button>
              <button
                onClick={() => setShowAddHistory(true)}
                className="add-entry-btn"
              >
                <Plus size={16} />
                Add Entry
              </button>
            </div>
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
                {getWorkoutHistoryForWorkout(selectedWorkout.id).slice(0, 3).map((entry) => (
                  <div key={entry.id} className="history-item">
                    <div className="history-date">{new Date(entry.date).toLocaleDateString()}</div>
                    <div className="history-rating">Rating: {entry.rating}/10</div>
                    {entry.notes && <div className="history-notes">{entry.notes}</div>}
                  </div>
                ))}
                {getWorkoutHistoryForWorkout(selectedWorkout.id).length === 0 && (
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

      {showWorkoutPicker && (
        <div className="modal-overlay" onClick={() => setShowWorkoutPicker(false)}>
          <div className="modal-content workout-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Workout for Week {selectedWeekIndex !== null ? schedule.weeks[selectedWeekIndex].weekNumber : ''}</h3>
              <button
                onClick={() => setShowWorkoutPicker(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="workout-picker-content">
              {Object.values(workoutLibrary).map((category, categoryIndex) => (
                <div key={categoryIndex} className="picker-category">
                  <h4 className="picker-category-title">{category.name}</h4>
                  <p className="picker-category-description">{category.description}</p>

                  <div className="picker-workouts-grid">
                    {category.workouts.map((workout) => (
                      <LibraryWorkout
                        key={workout.id}
                        workout={workout}
                        isPickerMode={true}
                        onSelect={addWorkoutToSchedule}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content small-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingScheduleId ? 'Update Schedule' : 'Save Training Schedule'}</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="form-container">
              <div className="form-field">
                <label>Schedule Name</label>
                <input
                  type="text"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  placeholder="e.g., Eric's Fall Training Schedule"
                  autoFocus
                />
              </div>

              <div className="schedule-summary">
                <h4>Schedule Summary:</h4>
                <p>Total Weeks with Workouts: {schedule.weeks.filter(week => week.workouts.length > 0).length}</p>
                <p>Total Workouts: {schedule.weeks.reduce((total, week) => total + week.workouts.length, 0)}</p>
                {trainingStartDate && (
                  <p>Start Date: {new Date(trainingStartDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowSaveModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={saveSchedule}
                className="submit-btn"
              >
                <Save size={16} />
                {editingScheduleId ? 'Update' : 'Save'} Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {showWorkoutEdit && editingWorkout && (
        <div className="modal-overlay" onClick={() => setShowWorkoutEdit(false)}>
          <div className="modal-content small-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Edit Workout</h3>
                <p>{editingWorkout.nickname} - {editingWorkout.name}</p>
              </div>
              <button
                onClick={() => setShowWorkoutEdit(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <WorkoutEditForm
              workout={editingWorkout}
              onComplete={completeWorkout}
              onCancel={() => setShowWorkoutEdit(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const WorkoutEditForm = ({ workout, onComplete, onCancel }) => {
  const [completionForm, setCompletionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    actualTimes: '',
    targetTimes: '',
    notes: '',
    weather: '',
    location: '',
    rating: 5,
    markCompleted: false
  });

  const updateForm = (field, value) => {
    setCompletionForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (completionForm.markCompleted) {
      onComplete(completionForm);
    } else {
      // Just save notes without marking as completed
      // This could be extended for other editing features
      onCancel();
    }
  };

  return (
    <div className="workout-edit-form">
      <div className="form-container">
        <div className="form-field">
          <label>
            <input
              type="checkbox"
              checked={completionForm.markCompleted}
              onChange={(e) => updateForm('markCompleted', e.target.checked)}
            />
            Mark as completed
          </label>
        </div>

        {completionForm.markCompleted && (
          <>
            <div className="form-field">
              <label>Completion Date</label>
              <input
                type="date"
                value={completionForm.date}
                onChange={(e) => updateForm('date', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Actual Times (comma separated)</label>
              <input
                type="text"
                value={completionForm.actualTimes}
                onChange={(e) => updateForm('actualTimes', e.target.value)}
                placeholder="e.g., 68.2, 67.9, 3:03.3"
              />
            </div>

            <div className="form-field">
              <label>Target Times (comma separated)</label>
              <input
                type="text"
                value={completionForm.targetTimes}
                onChange={(e) => updateForm('targetTimes', e.target.value)}
                placeholder="e.g., 68, 68, 3:03"
              />
            </div>

            <div className="form-field">
              <label>Notes</label>
              <textarea
                value={completionForm.notes}
                onChange={(e) => updateForm('notes', e.target.value)}
                rows={3}
                placeholder="How did the workout feel? Any observations..."
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Weather</label>
                <input
                  type="text"
                  value={completionForm.weather}
                  onChange={(e) => updateForm('weather', e.target.value)}
                  placeholder="Cool, windy"
                />
              </div>

              <div className="form-field">
                <label>Location</label>
                <input
                  type="text"
                  value={completionForm.location}
                  onChange={(e) => updateForm('location', e.target.value)}
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
                value={completionForm.rating}
                onChange={(e) => updateForm('rating', e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className="modal-footer">
        <button onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="submit-btn"
          disabled={completionForm.markCompleted && !completionForm.date}
        >
          {completionForm.markCompleted ? 'Complete Workout' : 'Save'}
        </button>
      </div>
    </div>
  );
};

const ScheduleDetailView = ({ schedule, onWorkoutEdit, onMileageUpdate }) => {
  const getWeekStartDate = (weekNumber) => {
    if (!schedule.trainingStartDate) return '';
    const startDate = new Date(schedule.trainingStartDate);
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + ((weekNumber - 1) * 7));

    return weekStartDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="schedule-detail-view">
      <div className="detail-weeks-grid">
        {schedule.schedule.weeks.filter(week => week.workouts.length > 0 || week.mileageGoal || week.actualMileage).map((week, weekIndex) => (
          <div key={week.id} className="detail-week-card">
            <div className="detail-week-header">
              <h4>Week {week.weekNumber}</h4>
              {schedule.trainingStartDate && (
                <span className="week-date">{getWeekStartDate(week.weekNumber)}</span>
              )}
            </div>

            <div className="detail-week-mileage">
              <div className="mileage-display">
                <span className="mileage-label">Goal:</span>
                <span className="mileage-value">{week.mileageGoal || '0'} mi</span>
              </div>
              <div className="mileage-field">
                <label>Actual:</label>
                <input
                  type="number"
                  value={week.actualMileage || ''}
                  onChange={(e) => onMileageUpdate(weekIndex, 'actualMileage', e.target.value)}
                  placeholder="0"
                  className="mileage-input small"
                  min="0"
                  step="0.1"
                />
                <span>mi</span>
              </div>
            </div>

            <div className="detail-workouts">
              {week.workouts.map((workout, workoutIndex) => (
                <ScheduleViewWorkout
                  key={workout.id}
                  workout={workout}
                  weekIndex={weekIndex}
                  workoutIndex={workoutIndex}
                  onEdit={onWorkoutEdit}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ScheduleViewWorkout = ({ workout, weekIndex, workoutIndex, onEdit }) => {
  return (
    <div className={`schedule-view-workout ${workout.completed ? 'completed' : ''}`}>
      <div className="workout-content">
        <div className="workout-info">
          <div className="workout-title">
            <span className="workout-nickname">{workout.nickname}</span>
            {workout.completed && <span className="completed-badge">✓ Completed</span>}
          </div>
          <div className="workout-name">{workout.name}</div>
          {workout.completed && workout.completedDate && (
            <div className="completion-info">
              Completed: {new Date(workout.completedDate).toLocaleDateString()}
              {workout.completedNotes && <span> - {workout.completedNotes}</span>}
            </div>
          )}
        </div>
        <div className="workout-actions">
          <button
            onClick={() => onEdit(workout, weekIndex, workoutIndex)}
            className="action-btn edit-workout-btn"
            title="Edit workout"
          >
            <Edit3 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutLibrary;