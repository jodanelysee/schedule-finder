const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 3000

// PostgreSQL database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.message)
    console.error('Check your .env file and database credentials')
  } else {
    console.log('Connected to PostgreSQL database')
  }
})

// Handle unexpected errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err)
})

// Middleware
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Test database connection
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: result.rows[0].now 
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    })
  }
})

// Get all departments
app.get('/api/departments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT 
        SUBSTRING(course_name FROM '^[A-Z]+') as department
      FROM courses
      WHERE course_name ~ '^[A-Z]+-'
      ORDER BY department
    `)
    
    res.json(result.rows.map(row => row.department))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})