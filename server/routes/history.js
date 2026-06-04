const router = require('express').Router()
const db = require('../db')
const authMiddleware = require('../middleware/auth')

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT wh.*,
        (SELECT to_json(wl.*) FROM workout_library wl WHERE wl.id = wh.workout_id) AS workout_library
       FROM workout_history wh
       WHERE wh.user_id = $1
       ORDER BY wh.date DESC`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Get history error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  const { workoutId, date, actualTimes, targetTimes, notes, weather, location, rating } = req.body
  try {
    const result = await db.query(
      `INSERT INTO workout_history
         (workout_id, date, actual_times, target_times, notes, weather, location, rating, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [workoutId, date, actualTimes, targetTimes, notes, weather, location, rating, req.user.id]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Save history error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  const { date, actualTimes, targetTimes, notes, weather, location, rating } = req.body
  try {
    const check = await db.query('SELECT user_id FROM workout_history WHERE id = $1', [req.params.id])
    if (!check.rows[0]) return res.status(404).json({ error: 'Entry not found' })
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    const result = await db.query(
      `UPDATE workout_history
       SET date=$1, actual_times=$2, target_times=$3, notes=$4, weather=$5, location=$6, rating=$7
       WHERE id=$8 RETURNING *`,
      [date, actualTimes, targetTimes, notes, weather, location, rating, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error('Update history error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
