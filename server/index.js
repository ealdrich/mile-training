require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    }
  }
}))

app.use(express.json())

// Stricter rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later' }
})
app.use('/api/auth', authLimiter)

app.use('/api/auth',      require('./routes/auth'))
app.use('/api/workouts',  require('./routes/workouts'))
app.use('/api/schedules', require('./routes/schedules'))
app.use('/api/history',   require('./routes/history'))
app.use('/api/shares',    require('./routes/shares'))
app.use('/api/strava',    require('./routes/strava'))
app.use('/api/public',    require('./routes/public'))
app.use('/api/feedback',  require('./routes/feedback'))

// Serve React build for all non-API routes
const buildDir = path.join(__dirname, '../build')
app.use(express.static(buildDir))
app.get('*', (_req, res) => res.sendFile(path.join(buildDir, 'index.html')))

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server listening on 127.0.0.1:${PORT}`)
})
