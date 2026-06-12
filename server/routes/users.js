import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

// Apply auth middleware to all user routes
router.use(authenticate, requireRole(['admin']));

// GET /api/users
router.get('/', (req, res, next) => {
  try {
    const users = db.prepare('SELECT id, name, email, username, role, status, last_login, created_at FROM users').all();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// POST /api/users
router.post('/', async (req, res, next) => {
  try {
    const { name, email, username, password, role, status } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (name, email, username, password_hash, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, email, username, passwordHash, role || 'viewer', status || 'active');
    
    res.status(201).json({ id: result.lastInsertRowid, message: 'User created' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id
router.put('/:id', (req, res, next) => {
  try {
    const { name, email, username, role, status } = req.body;
    const stmt = db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, username = ?, role = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(name, email, username, role, status, req.params.id);
    res.json({ message: 'User updated' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id/password
router.put('/:id/password', async (req, res, next) => {
  try {
    const { password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?')
      .run(passwordHash, req.params.id);
    res.json({ message: 'Password updated' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id
router.delete('/:id', (req, res, next) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
