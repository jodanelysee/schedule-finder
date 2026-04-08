const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { generateTokens, verifyRefreshToken, verifyAccessToken } = require('../utils/tokens');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Session timeout: 15 minutes
const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes

// Cookie configuration
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',  
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',  
  path: '/',
  domain: process.env.COOKIE_DOMAIN || undefined,  
  maxAge: SESSION_DURATION
};

// Login endpoint - sets session cookie
router.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND is_active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    const { accessToken, refreshToken } = generateTokens(user);

    // Set session cookie that expires after 15 minutes
    res.cookie('sessionToken', accessToken, {
      ...cookieOptions,
      maxAge: SESSION_DURATION
    });
    
    // Optional: Set refresh token with same expiry (or don't use it at all)
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: SESSION_DURATION // Same as access token - no auto-refresh
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

// Refresh endpoint - disabled for strict timeout (returns 401)
router.post('/api/v1/auth/refresh', async (req, res) => {
  // For strict 15-minute timeout, disable automatic refresh
  // User must log in again after session expires
  res.status(401).json({ error: 'Session expired. Please login again.' });
});

// Logout endpoint - clears cookies
router.post('/api/v1/auth/logout', (req, res) => {
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
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Check if user is authenticated
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
    res.status(401).json({ authenticated: false });
  }
});

module.exports = router;