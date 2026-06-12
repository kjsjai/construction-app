import express from 'express';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();
router.use(authenticate);

// GET /api/repayments
router.get('/', (req, res, next) => {
  try {
    const repayments = db.prepare(`
      SELECT r.*, f.source_name as fund_name 
      FROM repayments r
      LEFT JOIN funds f ON r.fund_id = f.id
      ORDER BY r.date DESC
    `).all();
    res.json(repayments);
  } catch (error) {
    next(error);
  }
});

// POST /api/repayments
router.post('/', requireRole(['admin', 'manager']), (req, res, next) => {
  try {
    const { date, fund_id, amount, repayment_type, notes } = req.body;
    
    db.exec('BEGIN');
    let id;
    try {
      const stmt = db.prepare(`
        INSERT INTO repayments (date, fund_id, amount, repayment_type, notes)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(date, fund_id, amount, repayment_type, notes);
      id = result.lastInsertRowid;
      
      // Update fund's repaid_amount
      db.prepare(`
        UPDATE funds SET repaid_amount = repaid_amount + ? WHERE id = ?
      `).run(amount, fund_id);
      
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    res.status(201).json({ id, message: 'Repayment recorded' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/repayments/:id
router.delete('/:id', requireRole(['admin', 'manager']), (req, res, next) => {
  try {
    db.exec('BEGIN');
    try {
      const repayment = db.prepare('SELECT amount, fund_id FROM repayments WHERE id = ?').get(req.params.id);
      if (repayment) {
        // Revert fund's repaid_amount
        db.prepare(`
          UPDATE funds SET repaid_amount = repaid_amount - ? WHERE id = ?
        `).run(repayment.amount, repayment.fund_id);
        
        db.prepare('DELETE FROM repayments WHERE id = ?').run(req.params.id);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    res.json({ message: 'Repayment deleted' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/repayments/:id
router.put('/:id', requireRole(['admin', 'manager']), (req, res, next) => {
  try {
    const { date, fund_id, amount, repayment_type, notes } = req.body;
    const repaymentId = req.params.id;

    db.exec('BEGIN');
    try {
      // Get old repayment details
      const oldRepayment = db.prepare('SELECT amount, fund_id FROM repayments WHERE id = ?').get(repaymentId);
      if (!oldRepayment) {
        db.exec('ROLLBACK');
        return res.status(404).json({ message: 'Repayment not found' });
      }

      // Revert old amount from old fund
      db.prepare('UPDATE funds SET repaid_amount = repaid_amount - ? WHERE id = ?')
        .run(oldRepayment.amount, oldRepayment.fund_id);

      // Apply new amount to new fund (even if it's the same fund)
      db.prepare('UPDATE funds SET repaid_amount = repaid_amount + ? WHERE id = ?')
        .run(amount, fund_id);

      // Update repayment
      db.prepare(`
        UPDATE repayments 
        SET date = ?, fund_id = ?, amount = ?, repayment_type = ?, notes = ?
        WHERE id = ?
      `).run(date, fund_id, amount, repayment_type, notes, repaymentId);

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    res.json({ message: 'Repayment updated' });
  } catch (error) {
    next(error);
  }
});

export default router;
