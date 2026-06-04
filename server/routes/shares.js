const router = require('express').Router()
const db = require('../db')
const authMiddleware = require('../middleware/auth')
const { fetchScheduleById } = require('../utils')

// Must be before /:scheduleId to avoid shadowing
router.get('/incoming', authMiddleware, async (req, res) => {
  try {
    const sharesResult = await db.query(
      `SELECT ss.id, ss.schedule_id, ss.permission_level, ss.shared_at,
         u.email AS shared_by_email
       FROM schedule_shares ss
       JOIN users u ON u.id = ss.shared_by_user_id
       WHERE ss.shared_with_user_id = $1`,
      [req.user.id]
    )

    const shares = await Promise.all(sharesResult.rows.map(async (share) => {
      const schedule = await fetchScheduleById(share.schedule_id)
      return {
        id: share.id,
        schedule_id: share.schedule_id,
        permission_level: share.permission_level,
        shared_at: share.shared_at,
        shared_by_user: { email: share.shared_by_email },
        training_schedules: schedule
      }
    }))

    res.json(shares)
  } catch (err) {
    console.error('Get incoming shares error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:scheduleId', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ss.id, ss.permission_level, ss.shared_at,
         u.email AS email
       FROM schedule_shares ss
       JOIN users u ON u.id = ss.shared_with_user_id
       WHERE ss.schedule_id = $1`,
      [req.params.scheduleId]
    )
    const shares = result.rows.map(row => ({
      id: row.id,
      permission_level: row.permission_level,
      created_at: row.shared_at,
      shared_with_user: { email: row.email }
    }))
    res.json(shares)
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  const { scheduleId, userEmail, permissionLevel = 'view' } = req.body

  try {
    // Verify caller owns the schedule
    const sched = await db.query(
      'SELECT user_id FROM training_schedules WHERE id = $1',
      [scheduleId]
    )
    if (!sched.rows[0]) return res.status(404).json({ error: 'Schedule not found' })
    if (sched.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    // Look up the target user
    const target = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [userEmail.toLowerCase()]
    )
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User not found with that email address' })
    }

    const result = await db.query(
      `INSERT INTO schedule_shares (schedule_id, shared_with_user_id, shared_by_user_id, permission_level)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (schedule_id, shared_with_user_id)
       DO UPDATE SET permission_level = EXCLUDED.permission_level
       RETURNING *`,
      [scheduleId, target.rows[0].id, req.user.id, permissionLevel]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Share schedule error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const share = await db.query(
      `SELECT ss.shared_by_user_id FROM schedule_shares ss WHERE ss.id = $1`,
      [req.params.id]
    )
    if (!share.rows[0]) return res.status(404).json({ error: 'Share not found' })
    if (share.rows[0].shared_by_user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    await db.query('DELETE FROM schedule_shares WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
