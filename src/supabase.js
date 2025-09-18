import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Workout Library operations
export const getWorkoutLibrary = async () => {
  const { data, error } = await supabase
    .from('workout_library')
    .select('*')
    .order('category', { ascending: true })

  return { data, error }
}

// Training Schedule operations
export const getTrainingSchedules = async () => {
  const { data, error } = await supabase
    .from('training_schedules')
    .select(`
      *,
      schedule_weeks (
        *,
        schedule_workouts (
          *,
          workout_library (*)
        )
      )
    `)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const saveTrainingSchedule = async (schedule) => {
  const { data: scheduleData, error: scheduleError } = await supabase
    .from('training_schedules')
    .insert([{
      name: schedule.name,
      training_start_date: schedule.trainingStartDate
    }])
    .select()
    .single()

  if (scheduleError) return { data: null, error: scheduleError }

  // Insert weeks
  const weeks = schedule.schedule.weeks.map(week => ({
    schedule_id: scheduleData.id,
    week_number: week.weekNumber,
    mileage_goal: week.mileageGoal ? parseFloat(week.mileageGoal) : null,
    actual_mileage: week.actualMileage ? parseFloat(week.actualMileage) : null
  }))

  const { data: weeksData, error: weeksError } = await supabase
    .from('schedule_weeks')
    .insert(weeks)
    .select()

  if (weeksError) return { data: null, error: weeksError }

  // Insert workouts for each week
  const workouts = []
  schedule.schedule.weeks.forEach((week, weekIndex) => {
    week.workouts.forEach(workout => {
      const weekId = weeksData.find(w => w.week_number === week.weekNumber)?.id
      if (weekId) {
        workouts.push({
          week_id: weekId,
          workout_id: workout.originalId || workout.id,
          completed: workout.completed || false,
          completed_date: workout.completedDate || null,
          completed_notes: workout.completedNotes || null
        })
      }
    })
  })

  if (workouts.length > 0) {
    const { error: workoutsError } = await supabase
      .from('schedule_workouts')
      .insert(workouts)

    if (workoutsError) return { data: null, error: workoutsError }
  }

  return { data: scheduleData, error: null }
}

export const updateTrainingSchedule = async (id, schedule) => {
  const { data: scheduleData, error: scheduleError } = await supabase
    .from('training_schedules')
    .update({
      name: schedule.name,
      training_start_date: schedule.trainingStartDate
    })
    .eq('id', id)
    .select()
    .single()

  if (scheduleError) return { data: null, error: scheduleError }

  // Update weeks (delete and recreate for simplicity)
  await supabase
    .from('schedule_weeks')
    .delete()
    .eq('schedule_id', id)

  const weeks = schedule.schedule.weeks.map(week => ({
    schedule_id: id,
    week_number: week.weekNumber,
    mileage_goal: week.mileageGoal ? parseFloat(week.mileageGoal) : null,
    actual_mileage: week.actualMileage ? parseFloat(week.actualMileage) : null
  }))

  const { data: weeksData, error: weeksError } = await supabase
    .from('schedule_weeks')
    .insert(weeks)
    .select()

  if (weeksError) return { data: null, error: weeksError }

  // Insert workouts for each week
  const workouts = []
  schedule.schedule.weeks.forEach((week, weekIndex) => {
    week.workouts.forEach(workout => {
      const weekId = weeksData.find(w => w.week_number === week.weekNumber)?.id
      if (weekId) {
        workouts.push({
          week_id: weekId,
          workout_id: workout.originalId || workout.id,
          completed: workout.completed || false,
          completed_date: workout.completedDate || null,
          completed_notes: workout.completedNotes || null
        })
      }
    })
  })

  if (workouts.length > 0) {
    await supabase
      .from('schedule_workouts')
      .insert(workouts)
  }

  return { data: scheduleData, error: null }
}

export const deleteTrainingSchedule = async (id) => {
  const { data, error } = await supabase
    .from('training_schedules')
    .delete()
    .eq('id', id)

  return { data, error }
}

// Workout History operations
export const getWorkoutHistory = async () => {
  const { data, error } = await supabase
    .from('workout_history')
    .select(`
      *,
      workout_library (*)
    `)
    .order('date', { ascending: false })

  return { data, error }
}

export const saveWorkoutHistory = async (entry) => {
  const { data, error } = await supabase
    .from('workout_history')
    .insert([{
      workout_id: entry.workoutId,
      date: entry.date,
      actual_times: entry.actualTimes,
      target_times: entry.targetTimes,
      notes: entry.notes,
      weather: entry.weather,
      location: entry.location,
      rating: entry.rating
    }])
    .select()

  return { data, error }
}

export const updateScheduleWorkout = async (weekId, workoutIndex, updates) => {
  // First get the workout to update
  const { data: workouts, error: fetchError } = await supabase
    .from('schedule_workouts')
    .select('*')
    .eq('week_id', weekId)
    .order('created_at', { ascending: true })

  if (fetchError) return { data: null, error: fetchError }

  const workoutToUpdate = workouts[workoutIndex]
  if (!workoutToUpdate) return { data: null, error: new Error('Workout not found') }

  const { data, error } = await supabase
    .from('schedule_workouts')
    .update(updates)
    .eq('id', workoutToUpdate.id)
    .select()

  return { data, error }
}