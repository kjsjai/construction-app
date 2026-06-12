import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db/database.js';
import { generateTokens } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';
import { validateRequest } from '../utils/validation.js';

const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,                  // Not accessible via JS (XSS protection)
  secure: isProduction,            // HTTPS only in production
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/',
};
const ACCESS_COOKIE_OPTIONS  = { ...COOKIE_OPTIONS, maxAge: 60 * 60 * 1000 };        // 1 hour
const REFRESH_COOKIE_OPTIONS = { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 }; // 7 days

const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// POST /api/auth/login
router.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = db.prepare(
      'SELECT * FROM users WHERE username = ? OR email = ?'
    ).get(username, username);

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid credentials or account disabled' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Persist refresh token in DB
    db.prepare(`
      INSERT INTO user_sessions (user_id, refresh_token, expires_at)
      VALUES (?, ?, datetime('now', '+7 days'))
    `).run(user.id, refreshToken);

    // Update last login
    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

    // Set tokens as HttpOnly cookies
    res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      db.prepare('DELETE FROM user_sessions WHERE refresh_token = ?').run(refreshToken);
    }
    // Clear both cookies
    res.clearCookie('accessToken', { ...COOKIE_OPTIONS, maxAge: 0 });
    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res, next) => {
  try {
    // Read refresh token from HttpOnly cookie
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const session = db.prepare(`
      SELECT * FROM user_sessions
      WHERE refresh_token = ? AND expires_at > datetime('now')
    `).get(refreshToken);

    if (!session) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ? AND status = 'active'").get(session.user_id);
    if (!user) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const tokens = generateTokens(user);

    // Rotate refresh token in DB
    db.prepare(
      "UPDATE user_sessions SET refresh_token = ?, expires_at = datetime('now', '+7 days') WHERE id = ?"
    ).run(tokens.refreshToken, session.id);

    // Set fresh cookies
    res.cookie('accessToken', tokens.accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({ message: 'Tokens refreshed' });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare(
    'SELECT id, name, email, username, role, status FROM users WHERE id = ?'
  ).get(req.user.id);
  res.json(user);
});

export default router;
