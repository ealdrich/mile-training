const router = require('express').Router()
const db = require('../db')
const authMiddleware = require('../middleware/auth')

const CLIENT_ID = process.env.STRAVA_CLIENT_ID
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET
const REDIRECT_URI = process.env.STRAVA_REDIRECT_URI || 'http://localhost:3001/api/strava/callback'
const APP_URL = process.env.APP_URL || 'http://localhost:3001'

// Check connection status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT strava_athlete_id FROM users WHERE id = $1',
      [req.user.id]
    )
    const connected = !!result.rows[0]?.strava_athlete_id
    res.json({ connected, athleteId: result.rows[0]?.strava_athlete_id || null })
  } catch (err) {
    console.error('Strava status error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Return Strava OAuth URL
router.get('/auth-url', authMiddleware, (req, res) => {
  if (!CLIENT_ID) return res.status(500).json({ error: 'Strava not configured on this server' })
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    approval_prompt: 'auto',
    scope: 'activity:read_all',
    state: req.user.id
  })
  res.json({ url: `https://www.strava.com/oauth/authorize?${params}` })
})

// OAuth callback — stores tokens, redirects to app
router.get('/callback', async (req, res) => {
  const { code, state: userId, error } = req.query
  if (error) return res.redirect(`${APP_URL}/?strava_error=access_denied`)
  if (!code || !userId) return res.redirect(`${APP_URL}/?strava_error=invalid_callback`)

  try {
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      })
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) throw new Error(tokenData.message || 'Token exchange failed')

    await db.query(
      `UPDATE users
       SET strava_access_token     = $1,
           strava_refresh_token    = $2,
           strava_token_expires_at = to_timestamp($3),
           strava_athlete_id       = $4
       WHERE id = $5`,
      [tokenData.access_token, tokenData.refresh_token, tokenData.expires_at, tokenData.athlete?.id, userId]
    )
    res.redirect(`${APP_URL}/?strava_connected=1`)
  } catch (err) {
    console.error('Strava callback error:', err)
    res.redirect(`${APP_URL}/?strava_error=token_exchange_failed`)
  }
})

// Disconnect Strava
router.delete('/disconnect', authMiddleware, async (req, res) => {
  try {
    await db.query(
      `UPDATE users
       SET strava_access_token = NULL, strava_refresh_token = NULL,
           strava_token_expires_at = NULL, strava_athlete_id = NULL
       WHERE id = $1`,
      [req.user.id]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Strava disconnect error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Fetch and parse a Strava activity, return with library matches
router.get('/import/:activityId', authMiddleware, async (req, res) => {
  try {
    const token = await getValidAccessToken(req.user.id)

    const activityRes = await fetch(
      `https://www.strava.com/api/v3/activities/${req.params.activityId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (activityRes.status === 404) return res.status(404).json({ error: 'Activity not found on Strava' })
    if (!activityRes.ok) {
      const err = await activityRes.json()
      return res.status(400).json({ error: err.message || 'Failed to fetch activity from Strava' })
    }

    const activity = await activityRes.json()
    const parsed = parseStravaActivity(activity)

    const workoutsResult = await db.query('SELECT * FROM workout_library ORDER BY category, name')
    const matches = rankMatches(parsed, workoutsResult.rows)

    res.json({ activity: parsed, matches })
  } catch (err) {
    if (err.message === 'Strava not connected') return res.status(401).json({ error: 'Strava not connected' })
    console.error('Strava import error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getValidAccessToken(userId) {
  const result = await db.query(
    'SELECT strava_access_token, strava_refresh_token, strava_token_expires_at FROM users WHERE id = $1',
    [userId]
  )
  const user = result.rows[0]
  if (!user?.strava_access_token) throw new Error('Strava not connected')

  // Return current token if it won't expire within 60 seconds
  if (new Date(user.strava_token_expires_at) > new Date(Date.now() + 60_000)) {
    return user.strava_access_token
  }

  // Refresh
  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: user.strava_refresh_token,
      grant_type: 'refresh_token'
    })
  })
  const tokenData = await tokenRes.json()
  if (!tokenRes.ok) throw new Error('Token refresh failed')

  await db.query(
    `UPDATE users
     SET strava_access_token = $1, strava_refresh_token = $2, strava_token_expires_at = to_timestamp($3)
     WHERE id = $4`,
    [tokenData.access_token, tokenData.refresh_token, tokenData.expires_at, userId]
  )
  return tokenData.access_token
}

function formatPace(secondsPerUnit) {
  const mins = Math.floor(secondsPerUnit / 60)
  const secs = Math.round(secondsPerUnit % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function parseStravaActivity(activity) {
  const laps = (activity.laps || []).map(lap => ({
    lapIndex: lap.lap_index,
    distance: Math.round(lap.distance),     // meters
    elapsedTime: lap.elapsed_time,           // seconds
    movingTime: lap.moving_time,
    avgSpeed: lap.average_speed,             // m/s
    pacePerMile: lap.average_speed > 0 ? formatPace(1609.34 / lap.average_speed) : null,
    pacePerKm:   lap.average_speed > 0 ? formatPace(1000  / lap.average_speed) : null,
    avgHeartRate: lap.average_heartrate || null
  }))

  return {
    stravaId: activity.id,
    name: activity.name,
    description: activity.description || '',
    type: activity.type,
    date: activity.start_date_local?.split('T')[0],
    distance: Math.round(activity.distance),
    elapsedTime: activity.elapsed_time,
    movingTime: activity.moving_time,
    avgHeartRate: activity.average_heartrate || null,
    workoutType: activity.workout_type,    // 3 = workout for runs
    laps,
    lapCount: laps.length
  }
}

// Extract interval structure from a workout description/rx text.
// Returns [{count, distance}] where distance is in meters.
function extractIntervalStructure(text) {
  const intervals = []
  const lower = text.toLowerCase()

  const patterns = [
    { re: /(\d+)\s*[x×]\s*(\d+\.?\d*)\s*miles?/gi,  unit: 1609.34 },
    { re: /(\d+)\s*[x×]\s*(\d+\.?\d*)\s*km/gi,       unit: 1000 },
    { re: /(\d+)\s*[x×]\s*(\d+)\s*m(?:eters?)?(?!\w)/gi, unit: 1 },
    { re: /(\d+)\s*[x×]\s*1\s*mile/gi,                unit: 1609.34, fixedDist: 1 },
    // "400s", "800s", "1000s" — less reliable, use as fallback
  ]

  for (const { re, unit, fixedDist } of patterns) {
    let m
    while ((m = re.exec(lower)) !== null) {
      const count = parseInt(m[1])
      const dist = Math.round((fixedDist ?? parseFloat(m[2])) * unit)
      if (count >= 1 && dist >= 100) intervals.push({ count, distance: dist })
    }
  }

  return intervals
}

function computeMatchScore(activity, workout) {
  const text = `${workout.name} ${workout.description} ${workout.rx}`.toLowerCase()
  const workoutIntervals = extractIntervalStructure(text)
  const activityLaps = activity.laps || []

  // Significant laps = workout reps (filter out very short laps like button-presses)
  const sigLaps = activityLaps.filter(l => l.distance >= 150)
  let score = 0

  // Name keyword overlap (minor signal)
  const nameWords = activity.name.toLowerCase().split(/\W+/).filter(w => w.length > 3)
  const textWords = new Set(text.split(/\W+/))
  for (const w of nameWords) if (textWords.has(w)) score += 0.05

  if (workoutIntervals.length === 0 || sigLaps.length === 0) return Math.min(score, 0.25)

  // Check how well each expected interval group matches the actual laps
  let intervalScore = 0
  for (const interval of workoutIntervals) {
    const TOLERANCE = 0.15  // 15% distance tolerance
    const matchingLaps = sigLaps.filter(
      l => Math.abs(l.distance - interval.distance) / interval.distance <= TOLERANCE
    )
    if (matchingLaps.length > 0) {
      // Reward matching distance AND count
      const countRatio = Math.min(matchingLaps.length, interval.count) /
                         Math.max(matchingLaps.length, interval.count)
      intervalScore += countRatio * 0.5
    }
  }
  score += intervalScore / workoutIntervals.length

  // Overall lap count match vs sum of expected intervals
  const expectedTotal = workoutIntervals.reduce((s, i) => s + i.count, 0)
  const lapCountRatio = Math.min(sigLaps.length, expectedTotal) /
                        Math.max(sigLaps.length, expectedTotal)
  score += lapCountRatio * 0.2

  return Math.min(score, 1)
}

function rankMatches(parsedActivity, libraryWorkouts) {
  return libraryWorkouts
    .map(w => ({ ...w, matchScore: Math.round(computeMatchScore(parsedActivity, w) * 100) }))
    .filter(w => w.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5)
}

module.exports = router
