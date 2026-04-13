const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { generateTokens, verifyAccessToken } = require('../utils/tokens');
const { authenticate } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');

const router = express.Router();
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Session duration: 15 minutes
const SESSION_DURATION = 15 * 60 * 1000;

// Cookie configuration for development
const cookieOptions = {
  httpOnly: true,
  secure: false,  // false for localhost
  sameSite: 'lax',
  path: '/',
};

// Login endpoint with validation
router.post('/api/v1/auth/login', validateLogin, async (req, res) => {
  try {
    console.log('\n=== LOGIN ATTEMPT ===');
    console.log('Email:', req.body.email);
    
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND is_active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    const { accessToken, refreshToken } = generateTokens(user);

    console.log('Login successful for user:', email);
    console.log('Setting session cookie with maxAge:', SESSION_DURATION, 'ms');

    res.cookie('sessionToken', accessToken, {
      ...cookieOptions,
      maxAge: SESSION_DURATION
    });
    
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: SESSION_DURATION
    });

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ 
      message: 'Login successful',
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh endpoint - disabled for strict timeout
router.post('/api/v1/auth/refresh', async (req, res) => {
  console.log('Refresh endpoint called - disabled');
  res.status(401).json({ error: 'Session expired. Please login again.' });
});

// Logout endpoint
router.post('/api/v1/auth/logout', (req, res) => {
  console.log('Logout endpoint called');
  res.clearCookie('sessionToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/api/v1/auth/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, first_name, last_name, email, department, role, created_at FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Check authentication status
router.get('/api/v1/auth/check', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, first_name, last_name, email, department, role FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ authenticated: false });
    }
    
    res.json({ authenticated: true, user: result.rows[0] });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({ authenticated: false });
  }
});

module.exports = router;