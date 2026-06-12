import express from 'express';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();
router.use(authenticate);

// GET /api/funds
router.get('/', (req, res, next) => {
  try {
    const funds = db.prepare(`
      SELECT f.*, 
        (SELECT SUM(amount) FROM repayments r WHERE r.fund_id = f.id) as total_repaid
      FROM funds f 
      ORDER BY f.date DESC
    `).all();
    
    // Update the repaid_amount dynamically in response
    const enrichedFunds = funds.map(f => ({
      ...f,
      repaid_amount: f.total_repaid || 0,
      outstanding_balance: f.amount - (f.total_repaid || 0)
    }));

    res.json(enrichedFunds);
  } catch (error) {
    next(error);
  }
});

// POST /api/funds
router.post('/', requireRole(['admin', 'manager']), (req, res, next) => {
  try {
    const { date, source_type, source_name, account_number, bank_name, amount, interest_rate, tenure_months, status, notes } = req.body;
    const stmt = db.prepare(`
      INSERT INTO funds (date, source_type, source_name, account_number, bank_name, amount, interest_rate, tenure_months, status, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(date, source_type, source_name, account_number, bank_name, amount, interest_rate, tenure_months, status || 'active', notes);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Fund record created' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/funds/:id
router.put('/:id', requireRole(['admin', 'manager']), (req, res, next) => {
  try {
    const { date, source_type, source_name, account_number, bank_name, amount, interest_rate, tenure_months, status, notes } = req.body;
    const stmt = db.prepare(`
      UPDATE funds 
      SET date = ?, source_type = ?, source_name = ?, account_number = ?, bank_name = ?, 
          amount = ?, interest_rate = ?, tenure_months = ?, status = ?, notes = ?
      WHERE id = ?
    `);
    stmt.run(date, source_type, source_name, account_number, bank_name, amount, interest_rate, tenure_months, status, notes, req.params.id);
    res.json({ message: 'Fund record updated' });
  } catch (error) {
    next(error);
  }
});

export default router;
