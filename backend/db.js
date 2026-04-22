const { Pool } = require('pg');
require('dotenv').config();

// ============================================
// DATABASE CONFIGURATION
// ============================================
let poolConfig;

if (process.env.NODE_ENV === 'production') {
  // Use Supabase for production
  console.log('🔒 Production DB - Connecting to Supabase');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set in production environment');
    process.exit(1);
  }
  
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { require: true, rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
} else {
  // Use local PostgreSQL for development
  console.log('💻 Development DB - Connecting to local PostgreSQL');
  
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'student_scheduling',
    user: process.env.DB_USER || 'app_user',
    password: process.env.DB_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

const pool = new Pool(poolConfig);

// Set search path to public for Supabase
pool.query('SET search_path TO public', (err) => {
  if (err) {
    console.error('❌ Error setting search_path:', err.message);
  } else {
    console.log('✅ Search path set to public schema');
  }
});

// Test database connection on start
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    if (process.env.NODE_ENV === 'production') {
      console.log('   Using Supabase Transaction Pooler with SSL');
    }
    release();
  }
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;