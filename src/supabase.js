import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Authentication functions
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: scheduleData, error: scheduleError } = await supabase
    .from('training_schedules')
    .insert([{
      name: schedule.name,
      training_start_date: schedule.trainingStartDate,
      user_id: user.id
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

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
      rating: entry.rating,
      user_id: user.id
    }])
    .select()

  return { data, error }
}

// Workout Library CRUD operations
export const createWorkout = async (workout) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('workout_library')
    .insert([{
      id: workout.id,
      name: workout.name,
      nickname: workout.nickname,
      description: workout.description,
      rx: workout.rx,
      category: workout.category,
      version: 1,
      is_custom: true,
      created_by: user.id
    }])
    .select()
    .single()

  return { data, error }
}

export const updateWorkout = async (workoutId, updates, editReason = null) => {
  // First, get the current workout to create a version
  const { data: currentWorkout, error: fetchError } = await supabase
    .from('workout_library')
    .select('*')
    .eq('id', workoutId)
    .single()

  if (fetchError) return { data: null, error: fetchError }

  // Create a version record of the current workout
  const { error: versionError } = await supabase
    .from('workout_versions')
    .insert([{
      workout_id: workoutId,
      version_number: currentWorkout.version,
      name: currentWorkout.name,
      nickname: currentWorkout.nickname,
      description: currentWorkout.description,
      rx: currentWorkout.rx,
      category: currentWorkout.category,
      edit_reason: editReason
    }])

  if (versionError) return { data: null, error: versionError }

  // Update the workout with new version number
  const { data, error } = await supabase
    .from('workout_library')
    .update({
      ...updates,
      version: currentWorkout.version + 1
    })
    .eq('id', workoutId)
    .select()
    .single()

  return { data, error }
}

export const deleteWorkout = async (workoutId) => {
  // Check if workout is used in any schedules
  const { data: usages, error: usageError } = await supabase
    .from('schedule_workouts')
    .select('id')
    .eq('workout_id', workoutId)
    .limit(1)

  if (usageError) return { data: null, error: usageError }

  if (usages && usages.length > 0) {
    return {
      data: null,
      error: new Error('Cannot delete workout as it is used in existing training schedules')
    }
  }

  const { data, error } = await supabase
    .from('workout_library')
    .delete()
    .eq('id', workoutId)

  return { data, error }
}

export const getWorkoutVersions = async (workoutId) => {
  const { data, error } = await supabase
    .from('workout_versions')
    .select('*')
    .eq('workout_id', workoutId)
    .order('version_number', { ascending: false })

  return { data, error }
}

export const updateWorkoutHistory = async (historyId, updates) => {
  const { data, error } = await supabase
    .from('workout_history')
    .update({
      date: updates.date,
      actual_times: updates.actualTimes,
      target_times: updates.targetTimes,
      notes: updates.notes,
      weather: updates.weather,
      location: updates.location,
      rating: updates.rating
    })
    .eq('id', historyId)
    .select()
    .single()

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

// Schedule Sharing functions
export const shareSchedule = async (scheduleId, userEmail, permissionLevel = 'view') => {
  // First, look up the user by email
  const { data: userData, error: userError } = await supabase.rpc('get_user_by_email', {
    email_address: userEmail
  })

  if (userError || !userData) {
    return { data: null, error: new Error('User not found with that email address') }
  }

  // Create the share
  const { data, error } = await supabase
    .from('schedule_shares')
    .insert([{
      schedule_id: scheduleId,
      shared_with_user_id: userData.id,
      shared_by_user_id: (await supabase.auth.getUser()).data.user.id,
      permission_level: permissionLevel
    }])
    .select()
    .single()

  return { data, error }
}

export const getScheduleShares = async (scheduleId) => {
  const { data, error } = await supabase
    .from('schedule_shares')
    .select(`
      *,
      shared_with_user:shared_with_user_id(email)
    `)
    .eq('schedule_id', scheduleId)

  return { data, error }
}

export const removeScheduleShare = async (shareId) => {
  const { error } = await supabase
    .from('schedule_shares')
    .delete()
    .eq('id', shareId)

  return { error }
}

export const getSharedSchedules = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }

  const { data, error } = await supabase
    .from('schedule_shares')
    .select(`
      *,
      training_schedules (
        *,
        schedule_weeks (
          *,
          schedule_workouts (
            *,
            workout_library (*)
          )
        )
      ),
      shared_by_user:shared_by_user_id(email)
    `)
    .eq('shared_with_user_id', user.id)

  return { data, error }
}

export const checkSchedulePermissions = async (scheduleId) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isOwner: false, canEdit: false, canView: false }

  // Check if user owns the schedule
  const { data: schedule } = await supabase
    .from('training_schedules')
    .select('user_id')
    .eq('id', scheduleId)
    .single()

  if (schedule?.user_id === user.id) {
    return { isOwner: true, canEdit: true, canView: true }
  }

  // Check if schedule is shared with user
  const { data: share } = await supabase
    .from('schedule_shares')
    .select('permission_level')
    .eq('schedule_id', scheduleId)
    .eq('shared_with_user_id', user.id)
    .single()

  if (share) {
    return {
      isOwner: false,
      canEdit: share.permission_level === 'edit',
      canView: true
    }
  }

  return { isOwner: false, canEdit: false, canView: false }
}