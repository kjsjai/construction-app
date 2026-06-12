import express from 'express';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { generateExcelFile } from '../utils/excel.js';

const router = express.Router();
router.use(authenticate);

// GET /api/expenses
router.get('/', (req, res, next) => {
  try {
    const { page = 1, limit = 50, category_id, phase_id, source, search, date_from, date_to, sort = 'date', order = 'desc' } = req.query;
    
    let query = `
      SELECT e.*, c.name as category_name, p.name as phase_name 
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN phases p ON e.phase_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) { query += ` AND e.category_id = ?`; params.push(category_id); }
    if (phase_id) { query += ` AND e.phase_id = ?`; params.push(phase_id); }
    if (source) { query += ` AND e.payment_source = ?`; params.push(source); }
    if (date_from) { query += ` AND e.date >= ?`; params.push(date_from); }
    if (date_to) { query += ` AND e.date <= ?`; params.push(date_to); }
    if (search) {
      query += ` AND (e.description LIKE ? OR e.vendor LIKE ? OR e.notes LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Sorting
    const validSortFields = ['date', 'amount', 'created_at', 'description'];
    const sortField = validSortFields.includes(sort) ? sort : 'date';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY e.${sortField} ${sortOrder}`;

    // Pagination
    const limitNum = parseInt(limit);
    const offset = (parseInt(page) - 1) * limitNum;
    
    const countQuery = query.replace(/SELECT e\.\*, c\.name as category_name, p\.name as phase_name/, 'SELECT count(*) as total');
    
    const total = db.prepare(countQuery).get(...params).total;
    
    query += ` LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const expenses = db.prepare(query).all(...params);

    res.json({
      data: expenses,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/expenses/export
router.get('/export', (req, res, next) => {
  try {
    const expenses = db.prepare(`
      SELECT e.date, e.description, c.name as category, p.name as phase, 
             e.vendor, e.payment_source, e.quantity, e.unit, e.rate, e.amount, e.notes
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN phases p ON e.phase_id = p.id
      ORDER BY e.date DESC
    `).all();

    const buffer = generateExcelFile(expenses, 'Expenses');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses_export.xlsx"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// POST /api/expenses
router.post('/', requireRole(['admin', 'manager']), (req, res, next) => {
  try {
    const { date, description, quantity, unit, rate, amount, category_id, phase_id, payment_source, vendor, notes } = req.body;
    
    const calculatedAmount = amount !== undefined ? amount : (quantity || 0) * (rate || 0);

    const stmt = db.prepare(`
      INSERT INTO expenses (date, description, quantity, unit, rate, amount, category_id, phase_id, payment_source, vendor, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(date, description, quantity, unit, rate, calculatedAmount, category_id, phase_id, payment_source, vendor, notes);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Expense created' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/expenses/:id
router.put('/:id', requireRole(['admin', 'manager']), (req, res, next) => {
  try {
    const { date, description, quantity, unit, rate, amount, category_id, phase_id, payment_source, vendor, notes } = req.body;
    
    const stmt = db.prepare(`
      UPDATE expenses 
      SET date = ?, description = ?, quantity = ?, unit = ?, rate = ?, amount = ?, 
          category_id = ?, phase_id = ?, payment_source = ?, vendor = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    
    stmt.run(date, description, quantity, unit, rate, amount, category_id, phase_id, payment_source, vendor, notes, req.params.id);
    res.json({ message: 'Expense updated' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', requireRole(['admin', 'manager']), (req, res, next) => {
  try {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/expenses/bulk
router.delete('/bulk', requireRole(['admin', 'manager']), (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided' });
    }
    
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM expenses WHERE id IN (${placeholders})`).run(...ids);
    res.json({ message: `${ids.length} expenses deleted` });
  } catch (error) {
    next(error);
  }
});

export default router;
