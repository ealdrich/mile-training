require('dotenv').config()
const router = require('express').Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../db')
const authMiddleware = require('../middleware/auth')

const SALT_ROUNDS = 12
const TOKEN_EXPIRY = '30d'

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const result = await db.query(
      'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, schedule_public, history_public',
      [email.toLowerCase(), passwordHash, name?.trim() || null]
    )

    const user = result.rows[0]
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
    res.status(201).json({
      user: { id: user.id, email: user.email, displayName: user.display_name, schedulePublic: user.schedule_public, historyPublic: user.history_public },
      token,
      isNewUser: true
    })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/signin', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  try {
    const result = await db.query(
      'SELECT id, email, display_name, password_hash, schedule_public, history_public FROM users WHERE email = $1',
      [email.toLowerCase()]
    )
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' })

    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
    res.json({
      user: { id: user.id, email: user.email, displayName: user.display_name, schedulePublic: user.schedule_public, historyPublic: user.history_public },
      token
    })
  } catch (err) {
    console.error('Signin error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, display_name, schedule_public, history_public FROM users WHERE id = $1',
      [req.user.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })
    const u = result.rows[0]
    res.json({ id: u.id, email: u.email, displayName: u.display_name, schedulePublic: u.schedule_public, historyPublic: u.history_public })
  } catch (err) {
    console.error('Me error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/settings', authMiddleware, async (req, res) => {
  const { schedulePublic, historyPublic, displayName } = req.body
  try {
    const result = await db.query(
      'UPDATE users SET schedule_public=$1, history_public=$2, display_name=$3 WHERE id=$4 RETURNING id, email, display_name, schedule_public, history_public',
      [!!schedulePublic, !!historyPublic, displayName?.trim() || null, req.user.id]
    )
    const u = result.rows[0]
    res.json({ id: u.id, email: u.email, displayName: u.display_name, schedulePublic: u.schedule_public, historyPublic: u.history_public })
  } catch (err) {
    console.error('Settings update error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
