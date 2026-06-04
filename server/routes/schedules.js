const router = require('express').Router()
const db = require('../db')
const authMiddleware = require('../middleware/auth')
const { SCHEDULE_SELECT } = require('../utils')

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      SCHEDULE_SELECT + ' WHERE ts.user_id = $1 GROUP BY ts.id ORDER BY ts.created_at DESC',
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Get schedules error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  const { name, trainingStartDate, schedule } = req.body
  const client = await db.connect()
  try {
    await client.query('BEGIN')

    const schedResult = await client.query(
      `INSERT INTO training_schedules (name, training_start_date, user_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, trainingStartDate || null, req.user.id]
    )
    const scheduleRow = schedResult.rows[0]

    for (const week of schedule?.weeks || []) {
      const weekResult = await client.query(
        `INSERT INTO schedule_weeks (schedule_id, week_number, mileage_goal, actual_mileage)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [scheduleRow.id, week.weekNumber,
         week.mileageGoal ? parseFloat(week.mileageGoal) : null,
         week.actualMileage ? parseFloat(week.actualMileage) : null]
      )
      const weekRow = weekResult.rows[0]
      for (const workout of week.workouts || []) {
        await client.query(
          `INSERT INTO schedule_workouts (week_id, workout_id, completed, completed_date, completed_notes)
           VALUES ($1, $2, $3, $4, $5)`,
          [weekRow.id, workout.originalId || workout.id,
           workout.completed || false,
           workout.completedDate || null,
           workout.completedNotes || null]
        )
      }
    }

    await client.query('COMMIT')
    res.status(201).json(scheduleRow)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Create schedule error:', err)
    res.status(500).json({ error: 'Server error' })
  } finally {
    client.release()
  }
})

// Must be defined before /:id to avoid route shadowing
router.put('/workouts/:weekId/:index', authMiddleware, async (req, res) => {
  const { weekId, index } = req.params
  const updates = req.body
  try {
    const workouts = await db.query(
      'SELECT id FROM schedule_workouts WHERE week_id = $1 ORDER BY created_at',
      [weekId]
    )
    const target = workouts.rows[parseInt(index)]
    if (!target) return res.status(404).json({ error: 'Workout not found' })

    const result = await db.query(
      `UPDATE schedule_workouts
       SET completed=$1, completed_date=$2, completed_notes=$3
       WHERE id=$4 RETURNING *`,
      [updates.completed, updates.completed_date || null, updates.completed_notes || null, target.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error('Update schedule workout error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { name, trainingStartDate, schedule } = req.body
  const client = await db.connect()
  try {
    const check = await client.query('SELECT user_id FROM training_schedules WHERE id = $1', [id])
    if (!check.rows[0]) return res.status(404).json({ error: 'Schedule not found' })
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    await client.query('BEGIN')

    const schedResult = await client.query(
      `UPDATE training_schedules SET name=$1, training_start_date=$2 WHERE id=$3 RETURNING *`,
      [name, trainingStartDate || null, id]
    )

    // Delete old weeks (cascades to schedule_workouts)
    await client.query('DELETE FROM schedule_weeks WHERE schedule_id = $1', [id])

    for (const week of schedule?.weeks || []) {
      const weekResult = await client.query(
        `INSERT INTO schedule_weeks (schedule_id, week_number, mileage_goal, actual_mileage)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [id, week.weekNumber,
         week.mileageGoal ? parseFloat(week.mileageGoal) : null,
         week.actualMileage ? parseFloat(week.actualMileage) : null]
      )
      const weekRow = weekResult.rows[0]
      for (const workout of week.workouts || []) {
        await client.query(
          `INSERT INTO schedule_workouts (week_id, workout_id, completed, completed_date, completed_notes)
           VALUES ($1, $2, $3, $4, $5)`,
          [weekRow.id, workout.originalId || workout.id,
           workout.completed || false,
           workout.completedDate || null,
           workout.completedNotes || null]
        )
      }
    }

    await client.query('COMMIT')
    res.json(schedResult.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Update schedule error:', err)
    res.status(500).json({ error: 'Server error' })
  } finally {
    client.release()
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const check = await db.query('SELECT user_id FROM training_schedules WHERE id = $1', [req.params.id])
    if (!check.rows[0]) return res.status(404).json({ error: 'Schedule not found' })
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    await db.query('DELETE FROM training_schedules WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
