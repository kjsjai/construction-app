import express from 'express';
import * as xlsx from 'xlsx';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/reports/summary
router.get('/summary', (req, res, next) => {
  try {
    const totalExpenses = db.prepare('SELECT SUM(amount) as total FROM expenses').get().total || 0;
    const totalFunds = db.prepare('SELECT SUM(amount) as total FROM funds').get().total || 0;
    const totalRepaid = db.prepare('SELECT SUM(amount) as total FROM repayments').get().total || 0;
    
    // This month spending
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const dateStr = startOfMonth.toISOString().split('T')[0];
    const thisMonthSpending = db.prepare('SELECT SUM(amount) as total FROM expenses WHERE date >= ?').get(dateStr).total || 0;

    res.json({
      totalExpenses,
      totalFunds,
      totalRepaid,
      availableBalance: totalFunds - totalExpenses - totalRepaid,
      thisMonthSpending
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/by-category
router.get('/by-category', (req, res, next) => {
  try {
    const data = db.prepare(`
      SELECT c.name, c.color, SUM(e.amount) as value 
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      GROUP BY c.id
      ORDER BY value DESC
    `).all();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/by-phase
router.get('/by-phase', (req, res, next) => {
  try {
    const data = db.prepare(`
      SELECT p.name, SUM(e.amount) as value 
      FROM expenses e
      JOIN phases p ON e.phase_id = p.id
      GROUP BY p.id
      ORDER BY value DESC
    `).all();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/monthly
router.get('/monthly', (req, res, next) => {
  try {
    const data = db.prepare(`
      SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
      FROM expenses
      GROUP BY month
      ORDER BY month ASC
      LIMIT 12
    `).all();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/by-source
router.get('/by-source', (req, res, next) => {
  try {
    const data = db.prepare(`
      SELECT payment_source as source, SUM(amount) as value
      FROM expenses
      WHERE payment_source IS NOT NULL
      GROUP BY payment_source
      ORDER BY value DESC
    `).all();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/fund-flow
router.get('/fund-flow', (req, res, next) => {
  // Can be expanded to show monthly in vs out
  res.json({ message: "Not fully implemented yet" });
});

// GET /api/reports/vendors
router.get('/vendors', (req, res, next) => {
  try {
    const data = db.prepare(`
      SELECT vendor, SUM(amount) as total_paid, COUNT(id) as transaction_count
      FROM expenses
      WHERE vendor IS NOT NULL AND vendor != ''
      GROUP BY vendor
      ORDER BY total_paid DESC
      LIMIT 20
    `).all();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

import { generateExcelFile } from '../utils/excel.js';

// GET /api/reports/export/excel
router.get('/export/excel', (req, res, next) => {
  try {
    const expenses = db.prepare(`
      SELECT e.date, e.amount, e.vendor, c.name as category, p.name as phase, e.payment_source, e.notes
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      JOIN phases p ON e.phase_id = p.id
      ORDER BY e.date DESC
    `).all();

    const funds = db.prepare(`
      SELECT date, source_type, source_name, bank_name, amount, interest_rate, tenure_months, notes
      FROM funds
      ORDER BY date DESC
    `).all();

    const repayments = db.prepare(`
      SELECT r.date, f.source_name as fund_name, r.amount, r.repayment_type, r.notes
      FROM repayments r
      JOIN funds f ON r.fund_id = f.id
      ORDER BY r.date DESC
    `).all();

    const summaryData = [
      { Metric: 'Total Funds', Value: db.prepare('SELECT SUM(amount) as total FROM funds').get().total || 0 },
      { Metric: 'Total Expenses', Value: db.prepare('SELECT SUM(amount) as total FROM expenses').get().total || 0 },
      { Metric: 'Total Repaid', Value: db.prepare('SELECT SUM(amount) as total FROM repayments').get().total || 0 },
      { Metric: 'Available Balance', Value: 0 } // Calculate below
    ];
    summaryData[3].Value = summaryData[0].Value - summaryData[1].Value - summaryData[2].Value;

    // We need a way to generate multiple sheets. Let's update excel.js or use it multiple times.
    // Actually xlsx library can do it easily. I'll do it here directly for multi-sheet.
    const workbook = xlsx.utils.book_new();
    
    const s1 = xlsx.utils.json_to_sheet(summaryData);
    xlsx.utils.book_append_sheet(workbook, s1, 'Summary');
    
    const s2 = xlsx.utils.json_to_sheet(expenses);
    xlsx.utils.book_append_sheet(workbook, s2, 'Expenses');
    
    const s3 = xlsx.utils.json_to_sheet(funds);
    xlsx.utils.book_append_sheet(workbook, s3, 'Funds');
    
    const s4 = xlsx.utils.json_to_sheet(repayments);
    xlsx.utils.book_append_sheet(workbook, s4, 'Repayments');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Construction_Report.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

export default router;
