// API client — replaces Supabase SDK
// Token stored in localStorage under this key
const TOKEN_KEY = 'mile_training_token'
const API_BASE = process.env.REACT_APP_API_URL || ''

export const getToken = () => localStorage.getItem(TOKEN_KEY)
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
const clearToken = () => localStorage.removeItem(TOKEN_KEY)

async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    return { data: null, error: { message: 'Network error — is the server running?' } }
  }

  const json = await res.json().catch(() => null)
  if (!res.ok) return { data: null, error: { message: json?.error || 'Request failed' } }
  return { data: json, error: null }
}

// Auth
export const signUp = async (email, password, name = '') => {
  const { data, error } = await apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  })
  if (error) return { data: null, error }
  setToken(data.token)
  return { data, error: null }
}

export const signIn = async (email, password) => {
  const { data, error } = await apiFetch('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
  if (error) return { data: null, error }
  setToken(data.token)
  return { data, error: null }
}

export const updateUserSettings = async (settings) =>
  apiFetch('/api/auth/settings', { method: 'PUT', body: JSON.stringify(settings) })

export const signOut = async () => {
  clearToken()
  return { error: null }
}

export const getCurrentUser = async () => {
  if (!getToken()) return null
  const { data, error } = await apiFetch('/api/auth/me')
  if (error) { clearToken(); return null }
  return data
}

// No-op — kept for API compatibility with App.tsx
export const onAuthStateChange = (_callback) => ({
  data: { subscription: { unsubscribe: () => {} } }
})

// Workout Library
export const getWorkoutLibrary = async () => apiFetch('/api/workouts')

export const createWorkout = async (workout) =>
  apiFetch('/api/workouts', { method: 'POST', body: JSON.stringify(workout) })

export const updateWorkout = async (workoutId, updates, editReason = null) =>
  apiFetch(`/api/workouts/${workoutId}`, {
    method: 'PUT',
    body: JSON.stringify({ ...updates, editReason })
  })

export const deleteWorkout = async (workoutId) =>
  apiFetch(`/api/workouts/${workoutId}`, { method: 'DELETE' })

export const getWorkoutVersions = async (workoutId) =>
  apiFetch(`/api/workouts/${workoutId}/versions`)

// Training Schedules
export const getTrainingSchedules = async () => apiFetch('/api/schedules')

export const saveTrainingSchedule = async (schedule) =>
  apiFetch('/api/schedules', { method: 'POST', body: JSON.stringify(schedule) })

export const updateTrainingSchedule = async (id, schedule) =>
  apiFetch(`/api/schedules/${id}`, { method: 'PUT', body: JSON.stringify(schedule) })

export const deleteTrainingSchedule = async (id) =>
  apiFetch(`/api/schedules/${id}`, { method: 'DELETE' })

export const updateScheduleWorkout = async (weekId, workoutIndex, updates) =>
  apiFetch(`/api/schedules/workouts/${weekId}/${workoutIndex}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })

// Workout History
export const getWorkoutHistory = async () => apiFetch('/api/history')

export const saveWorkoutHistory = async (entry) =>
  apiFetch('/api/history', { method: 'POST', body: JSON.stringify(entry) })

export const updateWorkoutHistory = async (historyId, updates) =>
  apiFetch(`/api/history/${historyId}`, { method: 'PUT', body: JSON.stringify(updates) })

// Schedule Sharing
export const shareSchedule = async (scheduleId, userEmail, permissionLevel = 'view') =>
  apiFetch('/api/shares', {
    method: 'POST',
    body: JSON.stringify({ scheduleId, userEmail, permissionLevel })
  })

export const getScheduleShares = async (scheduleId) =>
  apiFetch(`/api/shares/${scheduleId}`)

export const removeScheduleShare = async (shareId) =>
  apiFetch(`/api/shares/${shareId}`, { method: 'DELETE' })

export const getSharedSchedules = async () => apiFetch('/api/shares/incoming')

// Strava integration
export const getStravaStatus = async () => apiFetch('/api/strava/status')

export const getStravaAuthUrl = async () => apiFetch('/api/strava/auth-url')

export const disconnectStrava = async () =>
  apiFetch('/api/strava/disconnect', { method: 'DELETE' })

export const importStravaActivity = async (activityId) =>
  apiFetch(`/api/strava/import/${activityId}`)

// Public profile (no auth required)
export const getPublicProfile = async (userId) =>
  apiFetch(`/api/public/profile/${userId}`)

export const getPublicSchedules = async (userId) =>
  apiFetch(`/api/public/schedules/${userId}`)

export const getPublicHistory = async (userId) =>
  apiFetch(`/api/public/history/${userId}`)

export const searchUsers = async (query) =>
  apiFetch(`/api/public/search?q=${encodeURIComponent(query)}`)

export const checkSchedulePermissions = async (scheduleId) => {
  const user = await getCurrentUser()
  if (!user) return { isOwner: false, canEdit: false, canView: false }

  const { data: schedules } = await getTrainingSchedules()
  const owned = schedules?.find(s => s.id === scheduleId)
  if (owned) return { isOwner: true, canEdit: true, canView: true }

  const { data: shared } = await getSharedSchedules()
  const share = shared?.find(s => s.schedule_id === scheduleId)
  if (share) {
    return { isOwner: false, canEdit: share.permission_level === 'edit', canView: true }
  }

  return { isOwner: false, canEdit: false, canView: false }
}
