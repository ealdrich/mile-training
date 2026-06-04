const router = require('express').Router()
const db = require('../db')
const authMiddleware = require('../middleware/auth')

router.get('/', async (_req, res) => {
  try {
    const result = await db.query('SELECT * FROM workout_library ORDER BY category, id')
    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  const { id, name, nickname, description, rx, category } = req.body
  try {
    const result = await db.query(
      `INSERT INTO workout_library (id, name, nickname, description, rx, category, version, is_custom, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 1, true, $7) RETURNING *`,
      [id, name, nickname, description, rx, category, req.user.id]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Create workout error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  const { name, nickname, description, rx, category, editReason } = req.body
  try {
    const current = await db.query('SELECT * FROM workout_library WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ error: 'Workout not found' })
    if (current.rows[0].created_by !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    await db.query(
      `INSERT INTO workout_versions (workout_id, version_number, name, nickname, description, rx, category, edited_by, edit_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [req.params.id, current.rows[0].version, current.rows[0].name, current.rows[0].nickname,
       current.rows[0].description, current.rows[0].rx, current.rows[0].category,
       req.user.id, editReason || null]
    )

    const result = await db.query(
      `UPDATE workout_library
       SET name=$1, nickname=$2, description=$3, rx=$4, category=$5, version=version+1
       WHERE id=$6 RETURNING *`,
      [name, nickname, description, rx, category, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error('Update workout error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const workout = await db.query(
      'SELECT created_by, is_custom FROM workout_library WHERE id = $1',
      [req.params.id]
    )
    if (!workout.rows[0]) return res.status(404).json({ error: 'Workout not found' })
    if (workout.rows[0].created_by !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
    if (!workout.rows[0].is_custom) return res.status(403).json({ error: 'Cannot delete built-in workouts' })

    const inUse = await db.query(
      'SELECT id FROM schedule_workouts WHERE workout_id = $1 LIMIT 1',
      [req.params.id]
    )
    if (inUse.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete workout as it is used in existing training schedules' })
    }

    await db.query('DELETE FROM workout_library WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:id/versions', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM workout_versions WHERE workout_id = $1 ORDER BY version_number DESC',
      [req.params.id]
    )
    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
