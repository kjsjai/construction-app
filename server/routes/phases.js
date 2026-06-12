import express from 'express';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();
router.use(authenticate);

// GET /api/phases
router.get('/', (req, res, next) => {
  try {
    const phases = db.prepare(`
      SELECT p.*, COALESCE(SUM(e.amount), 0) as total_cost 
      FROM phases p
      LEFT JOIN expenses e ON p.id = e.phase_id
      GROUP BY p.id
      ORDER BY p.id ASC
    `).all();
    res.json(phases);
  } catch (error) {
    next(error);
  }
});

// POST /api/phases
router.post('/', requireRole(['admin', 'manager']), (req, res, next) => {
  try {
    const { name, description, start_date, end_date, status } = req.body;
    const stmt = db.prepare('INSERT INTO phases (name, description, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(name, description, start_date, end_date, status || 'active');
    res.status(201).json({ id: result.lastInsertRowid, message: 'Phase created' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/phases/:id
router.put('/:id', requireRole(['admin', 'manager']), (req, res, next) => {
  try {
    const { name, description, start_date, end_date, status } = req.body;
    const stmt = db.prepare(`
      UPDATE phases 
      SET name = ?, description = ?, start_date = ?, end_date = ?, status = ?
      WHERE id = ?
    `);
    stmt.run(name, description, start_date, end_date, status, req.params.id);
    res.json({ message: 'Phase updated' });
  } catch (error) {
    next(error);
  }
});

export default router;
