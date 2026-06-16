const router = require('express').Router()
const db = require('../db')
const { SCHEDULE_SELECT } = require('../utils')

// User search (only returns users with at least one public setting)
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim()
  if (q.length < 2) return res.json([])
  try {
    const result = await db.query(
      `SELECT id, email, display_name, schedule_public, history_public FROM users
       WHERE (email ILIKE $1 OR display_name ILIKE $1) AND (schedule_public = true OR history_public = true)
       ORDER BY display_name NULLS LAST, email LIMIT 20`,
      [`%${q}%`]
    )
    res.json(result.rows.map(u => ({
      id: u.id, email: u.email, displayName: u.display_name, schedulePublic: u.schedule_public, historyPublic: u.history_public
    })))
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Public profile info
router.get('/profile/:userId', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, display_name, schedule_public, history_public FROM users WHERE id = $1',
      [req.params.userId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })
    const u = result.rows[0]
    res.json({ id: u.id, email: u.email, displayName: u.display_name, schedulePublic: u.schedule_public, historyPublic: u.history_public })
  } catch (err) {
    console.error('Public profile error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Public schedules
router.get('/schedules/:userId', async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT schedule_public FROM users WHERE id = $1',
      [req.params.userId]
    )
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' })
    if (!userResult.rows[0].schedule_public) return res.status(403).json({ error: 'Training plan is private' })

    const result = await db.query(
      SCHEDULE_SELECT + ' WHERE ts.user_id = $1 GROUP BY ts.id ORDER BY ts.created_at DESC',
      [req.params.userId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Public schedules error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Public workout history
router.get('/history/:userId', async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT history_public FROM users WHERE id = $1',
      [req.params.userId]
    )
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' })
    if (!userResult.rows[0].history_public) return res.status(403).json({ error: 'Workout history is private' })

    const result = await db.query(
      `SELECT wh.*,
        (SELECT to_json(wl.*) FROM workout_library wl WHERE wl.id = wh.workout_id) AS workout_library
       FROM workout_history wh
       WHERE wh.user_id = $1
       ORDER BY wh.date DESC`,
      [req.params.userId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Public history error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
