const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { Pool } = require('pg')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 3000

// ============ CORS CONFIGURATION - MUST BE FIRST ============
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With, Accept');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.removeHeader('X-Powered-By')
    next()
})

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// Test database connection on start
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.message)
  } else {
    console.log('Connected to PostgreSQL database')
  }
})

pool.on('error', (err) => {
  console.error('Unexpected database error:', err)
})

// Body parsing middleware
app.use(express.json())
app.use(cookieParser())

// Debug endpoint to check session status
app.get('/debug-session', (req, res) => {
  console.log('=== DEBUG SESSION ===');
  console.log('All cookies:', req.cookies);
  console.log('Session token present:', !!req.cookies.sessionToken);
  
  res.json({
    hasSessionToken: !!req.cookies.sessionToken,
    tokenPreview: req.cookies.sessionToken ? req.cookies.sessionToken.substring(0, 50) + '...' : null,
    allCookies: Object.keys(req.cookies),
    cookieHeader: req.headers.cookie || 'none'
  });
});

// ============ PUBLIC ROUTES (No authentication required) ============
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

// Public health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Student Scheduling API',
    version: '1.0.0'
  })
})

// ============ FILE ROUTES - Register BEFORE global auth ============
const fileRoutes = require('./routes/files');
app.use('/api/v1/files', fileRoutes);  // Mount file routes here

// ============ PROTECTED ROUTES (Authentication required) ============
const { authenticate } = require('./middleware/auth');
const { 
  validateCourseSearch, 
  validateCourseId,
  validateStudentSearch,
  validateStudentId 
} = require('./middleware/validation');

// This applies to all other /api/v1 routes
app.use('/api/v1', authenticate);

// Get all departments
app.get('/api/v1/departments', async (req, res) => {
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

// Get all programs
app.get('/api/v1/programs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT program_code, program_name, degree_type
      FROM programs
      ORDER BY program_code
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// COURSE ROUTES 

// Get all courses with filtering - WITH VALIDATION
app.get('/api/v1/courses', validateCourseSearch, async (req, res) => {
  try {
    const { 
      search, department, professor, status, term, 
      start_date, end_date, level,
      page = 1, limit = 50 
    } = req.query

    let query = `
      SELECT 
        c.course_id, c.course_name, c.course_title, c.credits,
        c.status, c.capacity, c.available, c.term, c.location,
        STRING_AGG(DISTINCT f.name, '; ') as instructors
      FROM courses c
      LEFT JOIN course_faculty cf ON c.course_id = cf.course_id
      LEFT JOIN faculty f ON cf.faculty_id = f.faculty_id
      WHERE 1=1
    `
    const params = []

    if (search) {
      params.push(`%${search}%`)
      query += ` AND (c.course_name ILIKE $${params.length} OR c.course_title ILIKE $${params.length})`
    }
    if (department) {
      params.push(`${department}-%`)
      query += ` AND c.course_name LIKE $${params.length}`
    }
    if (professor) {
      params.push(`%${professor}%`)
      query += ` AND EXISTS (
        SELECT 1 FROM course_faculty cf2
        JOIN faculty f2 ON cf2.faculty_id = f2.faculty_id
        WHERE cf2.course_id = c.course_id AND f2.name ILIKE $${params.length}
      )`
    }
    if (status) {
      params.push(status)
      query += ` AND c.status = $${params.length}`
    }
    if (term) {
      params.push(term)
      query += ` AND c.term = $${params.length}`
    }
    if (start_date) {
      params.push(start_date)
      query += ` AND c.start_date >= $${params.length}`
    }
    if (end_date) {
      params.push(end_date)
      query += ` AND c.end_date <= $${params.length}`
    }
    if (level === 'undergraduate') {
      query += ` AND CAST(SUBSTRING(c.course_name FROM '-(\\d+)-') AS INTEGER) < 500`
    }
    if (level === 'graduate') {
      query += ` AND CAST(SUBSTRING(c.course_name FROM '-(\\d+)-') AS INTEGER) >= 500`
    }

    query += ` GROUP BY c.course_id ORDER BY c.course_name`
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    
    params.push(parseInt(limit))
    params.push((parseInt(page) - 1) * parseInt(limit))

    const result = await pool.query(query, params)

    // Get total count
    let countQuery = `SELECT COUNT(DISTINCT c.course_id) FROM courses c`
    if (professor) {
      countQuery += ` LEFT JOIN course_faculty cf ON c.course_id = cf.course_id
                      LEFT JOIN faculty f ON cf.faculty_id = f.faculty_id`
    }
    countQuery += ` WHERE 1=1`
    
    const countParams = []
    if (search) {
      countParams.push(`%${search}%`)
      countQuery += ` AND (c.course_name ILIKE $${countParams.length} OR c.course_title ILIKE $${countParams.length})`
    }
    if (department) {
      countParams.push(`${department}-%`)
      countQuery += ` AND c.course_name LIKE $${countParams.length}`
    }
    if (professor) {
      countParams.push(`%${professor}%`)
      countQuery += ` AND f.name ILIKE $${countParams.length}`
    }
    if (status) {
      countParams.push(status)
      countQuery += ` AND c.status = $${countParams.length}`
    }
    if (term) {
      countParams.push(term)
      countQuery += ` AND c.term = $${countParams.length}`
    }
    if (start_date) {
      countParams.push(start_date)
      countQuery += ` AND c.start_date >= $${countParams.length}`
    }
    if (end_date) {
      countParams.push(end_date)
      countQuery += ` AND c.end_date <= $${countParams.length}`
    }
    if (level === 'undergraduate') {
      countQuery += ` AND CAST(SUBSTRING(c.course_name FROM '-(\\d+)-') AS INTEGER) < 500`
    }
    if (level === 'graduate') {
      countQuery += ` AND CAST(SUBSTRING(c.course_name FROM '-(\\d+)-') AS INTEGER) >= 500`
    }

    const countResult = await pool.query(countQuery, countParams)

    res.json({
      courses: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single course with full details - WITH VALIDATION
app.get('/api/v1/courses/:id', validateCourseId, async (req, res) => {
  try {
    const { id } = req.params

    const courseResult = await pool.query(`
      SELECT 
        c.*,
        STRING_AGG(DISTINCT f.name, '; ') as instructors,
        STRING_AGG(DISTINCT f.email, '; ') as instructor_emails
      FROM courses c
      LEFT JOIN course_faculty cf ON c.course_id = cf.course_id
      LEFT JOIN faculty f ON cf.faculty_id = f.faculty_id
      WHERE c.course_id = $1
      GROUP BY c.course_id
    `, [id])

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' })
    }

    const meetingsResult = await pool.query(`
      SELECT day_of_week, start_time, end_time, room, building, meeting_type
      FROM course_meetings
      WHERE course_id = $1
      ORDER BY 
        CASE day_of_week
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
        END, start_time
    `, [id])

    const enrollmentResult = await pool.query(`
      SELECT COUNT(*) as enrolled_count FROM enrollments WHERE course_id = $1
    `, [id])

    res.json({
      ...courseResult.rows[0],
      meetings: meetingsResult.rows,
      enrolled: parseInt(enrollmentResult.rows[0].enrolled_count)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get course roster
app.get('/api/v1/courses/:id/students', validateCourseId, async (req, res) => {
  try {
    const { id } = req.params
    const { athlete, honors, program } = req.query

    let query = `
      SELECT 
        s.student_id, s.first_name, s.last_name, s.class_level,
        s.athlete_flag, s.honors_flag, s.first_gen, s.completed_credits_ug,
        STRING_AGG(DISTINCT p.program_code, ', ') as programs,
        STRING_AGG(DISTINCT a.name, '; ') as advisors,
        STRING_AGG(DISTINCT a.email, '; ') as advisor_emails
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      LEFT JOIN student_programs sp ON s.student_id = sp.student_id
      LEFT JOIN programs p ON sp.program_id = p.program_id
      LEFT JOIN student_advisors sa ON s.student_id = sa.student_id
      LEFT JOIN advisors a ON sa.advisor_id = a.advisor_id
      WHERE e.course_id = $1
    `
    const params = [id]

    if (athlete === 'true') query += ` AND s.athlete_flag = true`
    if (honors === 'true') query += ` AND s.honors_flag = true`
    if (program) {
      params.push(`%${program}%`)
      query += ` AND EXISTS (
        SELECT 1 FROM student_programs sp2
        JOIN programs p2 ON sp2.program_id = p2.program_id
        WHERE sp2.student_id = s.student_id AND p2.program_code ILIKE $${params.length}
      )`
    }

    query += ` GROUP BY s.student_id ORDER BY s.last_name, s.first_name`

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get combined schedule for all students in a course
app.get('/api/v1/courses/:id/schedule', validateCourseId, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(`
      SELECT 
        s.student_id, 
        s.first_name, 
        s.last_name,
        c.course_name, 
        c.course_title,
        cm.day_of_week, 
        cm.start_time, 
        cm.end_time, 
        cm.room
      FROM enrollments e1
      JOIN students s ON e1.student_id = s.student_id
      JOIN enrollments e2 ON s.student_id = e2.student_id
      JOIN courses c ON e2.course_id = c.course_id
      LEFT JOIN course_meetings cm ON c.course_id = cm.course_id
      WHERE e1.course_id = $1
      ORDER BY 
        s.last_name, 
        s.first_name,
        CASE cm.day_of_week
          WHEN 'Monday' THEN 1 
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3 
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          ELSE 6
        END, 
        cm.start_time
    `, [id])

    // Group by student and deduplicate
    const studentSchedules = {}
    result.rows.forEach(row => {
      if (!studentSchedules[row.student_id]) {
        studentSchedules[row.student_id] = {
          student_id: row.student_id,
          first_name: row.first_name,
          last_name: row.last_name,
          courses: []
        }
      }
      
      // Deduplicate courses (same course + day + time)
      const courseKey = `${row.course_name}-${row.day_of_week}-${row.start_time}`
      if (!studentSchedules[row.student_id].courses.find(c => 
        `${c.course_name}-${c.day_of_week}-${c.start_time}` === courseKey
      )) {
        studentSchedules[row.student_id].courses.push({
          course_name: row.course_name,
          course_title: row.course_title,
          day_of_week: row.day_of_week,
          start_time: row.start_time,
          end_time: row.end_time,
          room: row.room
        })
      }
    })

    res.json(Object.values(studentSchedules))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// STUDENT ROUTES

// Get all students with filtering - WITH VALIDATION
app.get('/api/v1/students', validateStudentSearch, async (req, res) => {
  try {
    const {
      search, athlete, honors, first_gen, program, graduating, level,
      page = 1, limit = 50
    } = req.query

    let query = `
      SELECT 
        s.student_id, s.first_name, s.last_name, s.class_level,
        s.athlete_flag, s.honors_flag, s.first_gen,
        s.completed_credits_ug, s.anticipated_completion_date,
        STRING_AGG(DISTINCT p.program_code, ', ') as programs
      FROM students s
      LEFT JOIN student_programs sp ON s.student_id = sp.student_id
      LEFT JOIN programs p ON sp.program_id = p.program_id
      WHERE 1=1
    `
    const params = []

    if (search) {
      params.push(`%${search}%`)
      query += ` AND (s.first_name ILIKE $${params.length} 
                   OR s.last_name ILIKE $${params.length}
                   OR s.student_id::text LIKE $${params.length})`
    }
    if (athlete === 'true') query += ` AND s.athlete_flag = true`
    if (honors === 'true') query += ` AND s.honors_flag = true`
    if (first_gen === 'true') query += ` AND s.first_gen = true`
    if (program) {
      params.push(`%${program}%`)
      query += ` AND EXISTS (
        SELECT 1 FROM student_programs sp2
        JOIN programs p2 ON sp2.program_id = p2.program_id
        WHERE sp2.student_id = s.student_id AND p2.program_code ILIKE $${params.length}
      )`
    }
    if (graduating) {
      params.push(`${graduating}%`)
      query += ` AND s.anticipated_completion_date::text LIKE $${params.length}`
    }
    if (level === 'undergraduate') {
      query += ` AND (s.completed_credits_ug > 0 OR s.completed_credits_gr = 0)`
    }
    if (level === 'graduate') {
      query += ` AND s.completed_credits_gr > 0`
    }

    query += ` GROUP BY s.student_id ORDER BY s.last_name, s.first_name`
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`

    params.push(parseInt(limit))
    params.push((parseInt(page) - 1) * parseInt(limit))

    const result = await pool.query(query, params)

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM students')

    res.json({
      students: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single student with full details - WITH VALIDATION
app.get('/api/v1/students/:id', validateStudentId, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(`
      SELECT 
        s.*,
        json_agg(DISTINCT jsonb_build_object(
          'program_code', p.program_code,
          'program_name', p.program_name,
          'degree_type', p.degree_type
        )) FILTER (WHERE p.program_code IS NOT NULL) as programs,
        json_agg(DISTINCT jsonb_build_object(
          'name', a.name,
          'email', a.email
        )) FILTER (WHERE a.name IS NOT NULL) as advisors
      FROM students s
      LEFT JOIN student_programs sp ON s.student_id = sp.student_id
      LEFT JOIN programs p ON sp.program_id = p.program_id
      LEFT JOIN student_advisors sa ON s.student_id = sa.student_id
      LEFT JOIN advisors a ON sa.advisor_id = a.advisor_id
      WHERE s.student_id = $1
      GROUP BY s.student_id
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get student's enrolled courses - WITH MEETING TIMES
app.get('/api/v1/students/:id/courses', validateStudentId, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(`
      SELECT 
        c.course_id, 
        c.course_name, 
        c.course_title, 
        c.credits, 
        c.status,
        STRING_AGG(DISTINCT f.name, '; ') as instructors,
        e.term,
        -- Get meeting times as a JSON array
        COALESCE(
          (SELECT json_agg(json_build_object(
            'day_of_week', cm.day_of_week,
            'start_time', cm.start_time,
            'end_time', cm.end_time,
            'room', cm.room,
            'building', cm.building
          ))
          FROM course_meetings cm
          WHERE cm.course_id = c.course_id
        ), '[]'::json) as meetings
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      LEFT JOIN course_faculty cf ON c.course_id = cf.course_id
      LEFT JOIN faculty f ON cf.faculty_id = f.faculty_id
      WHERE e.student_id = $1
      GROUP BY c.course_id, e.term
      ORDER BY c.course_name
    `, [id])

    // Transform the data to include meeting info in the format your frontend expects
    const transformedResults = result.rows.map(row => {
      // Get the first meeting (or create a placeholder)
      const meetings = row.meetings || [];
      const firstMeeting = meetings[0] || {};
      
      return {
        ...row,
        day_of_week: firstMeeting.day_of_week,
        start_time: firstMeeting.start_time,
        end_time: firstMeeting.end_time,
        room: firstMeeting.room,
        building: firstMeeting.building,
        meetings: meetings  // Keep full meetings array for schedule grid
      };
    });

    res.json(transformedResults)
  } catch (error) {
    console.error('Error fetching student courses:', error);
    res.status(500).json({ error: error.message })
  }
})

// Get student's weekly schedule
app.get('/api/v1/students/:id/schedule', validateStudentId, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(`
      SELECT 
        c.course_id, 
        c.course_name, 
        c.course_title,
        cm.day_of_week, 
        cm.start_time, 
        cm.end_time, 
        cm.room, 
        cm.building,
        cm.meeting_type
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      LEFT JOIN course_meetings cm ON c.course_id = cm.course_id
      WHERE e.student_id = $1
        AND cm.meeting_id IS NOT NULL
      ORDER BY 
        CASE cm.day_of_week
          WHEN 'Monday' THEN 1 
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3 
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          ELSE 6
        END, 
        cm.start_time
    `, [id])

    console.log(`Found ${result.rows.length} meetings for student ${id}`);
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching student schedule:', error);
    res.status(500).json({ error: error.message })
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

module.exports = { app, pool }