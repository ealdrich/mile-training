// Usage: node reset-password.js <email> <new-password>
require('dotenv').config()
const bcrypt = require('bcrypt')
const db = require('./db')

const [email, password] = process.argv.slice(2)

if (!email || !password) {
  console.error('Usage: node reset-password.js <email> <new-password>')
  process.exit(1)
}
if (password.length < 6) {
  console.error('Password must be at least 6 characters')
  process.exit(1)
}

async function reset() {
  const hash = await bcrypt.hash(password, 12)
  const result = await db.query(
    'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email',
    [hash, email.toLowerCase()]
  )
  if (result.rows.length === 0) {
    console.error(`No user found with email: ${email}`)
    process.exit(1)
  }
  console.log(`Password reset for ${result.rows[0].email}`)
  process.exit(0)
}

reset().catch(err => { console.error(err); process.exit(1) })
