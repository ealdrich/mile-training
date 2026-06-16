const router = require('express').Router()
const db = require('../db')
const nodemailer = require('nodemailer')

const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next()
  try {
    const jwt = require('jsonwebtoken')
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET)
  } catch {}
  next()
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

const TYPE_LABELS = { bug: '🐛 Bug report', feature: '✨ Feature request', feedback: '💬 Feedback' }

router.post('/', optionalAuth, async (req, res) => {
  const { type, message, email, pageUrl } = req.body
  if (!type || !message?.trim()) return res.status(400).json({ error: 'Type and message are required' })
  const validTypes = ['bug', 'feature', 'feedback']
  if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' })

  const fromEmail = email?.trim() || (req.user ? null : null)
  const userId = req.user?.id || null

  try {
    await db.query(
      `INSERT INTO feedback (type, message, email, user_id, page_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [type, message.trim(), fromEmail, userId, pageUrl || null]
    )

    // Send email notification (non-blocking)
    transporter.sendMail({
      from: `"Goobr Feedback" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `${TYPE_LABELS[type]} on Goobr`,
      text: [
        `Type: ${TYPE_LABELS[type]}`,
        `From: ${req.user?.email || fromEmail || 'anonymous'}`,
        `Page: ${pageUrl || 'unknown'}`,
        '',
        message.trim()
      ].join('\n')
    }).catch(err => console.error('Email send error:', err))

    res.status(201).json({ success: true })
  } catch (err) {
    console.error('Feedback error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
