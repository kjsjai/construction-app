import express from 'express';
import multer from 'multer';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { parseExcelFile, generateExcelFile } from '../utils/excel.js';

const router = express.Router();
router.use(authenticate);
router.use(requireRole(['admin', 'manager']));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

// POST /api/import/expenses
router.post('/expenses', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const rows = parseExcelFile(req.file.buffer);
    if (!rows || rows.length === 0) return res.status(400).json({ message: 'Empty or invalid Excel file' });

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    const insertExpense = db.prepare(`
      INSERT INTO expenses (date, description, quantity, unit, rate, amount, category_id, phase_id, payment_source, vendor, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const getOrCreateCategory = (catName) => {
      const existing = db.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE').get(catName);
      if (existing) return existing.id;
      const result = db.prepare("INSERT INTO categories (name, color, icon, description) VALUES (?, '#6366f1', 'Tag', '')").run(catName);
      return result.lastInsertRowid;
    };

    const standardKeys = ['Date', 'Description', 'Qty', 'Amt Qty Total', 'Amt', 'Per Day Exp', 'Category', 'Phase', 'Vendor', 'PaymentSource', 'Unit', 'Rate', 'Notes', 'Quantity', 'Amount'];

    db.exec('BEGIN');
    try {
      for (const [index, row] of rows.entries()) {
        try {
          if (!row.Date || !row.Description) {
            throw new Error('Missing required fields (Date, Description)');
          }

          let dateStr = row.Date;
          if (typeof row.Date === 'number') {
             // Excel serial date to JS Date
             dateStr = new Date(Math.round((row.Date - 25569) * 86400 * 1000)).toISOString().split('T')[0];
          }

          const description = row.Description;
          const qty = row.Qty || row.Quantity || null;
          const amt = row.Amt || row.Amount || null;
          const rate = row.Rate || null;
          const unit = row.Unit || null;
          const paymentSource = row.PaymentSource || null;
          const vendor = row.Vendor || null;
          const notes = row.Notes || null;

          let expenseCreated = false;
          
          for (const [key, value] of Object.entries(row)) {
            if (!standardKeys.includes(key) && value !== null && value !== undefined && value !== '') {
              const amountVal = parseFloat(value);
              if (!isNaN(amountVal)) {
                const categoryId = getOrCreateCategory(key);
                
                insertExpense.run(
                  dateStr, description, qty, unit, 
                  rate, amountVal, categoryId, null, 
                  paymentSource, vendor, notes
                );
                successCount++;
                expenseCreated = true;
              }
            }
          }

          if (!expenseCreated && amt) {
            let categoryId = null;
            if (row.Category) {
              categoryId = getOrCreateCategory(row.Category);
            }

            let phaseId = null;
            if (row.Phase) {
              const phase = db.prepare('SELECT id FROM phases WHERE name = ? COLLATE NOCASE').get(row.Phase);
              phaseId = phase ? phase.id : null;
            }

            insertExpense.run(
              dateStr, description, qty, unit, 
              rate, amt, categoryId, phaseId, 
              paymentSource, vendor, notes
            );
            successCount++;
          }

          if (!expenseCreated && !amt) {
             throw new Error('No amount or category values found');
          }

        } catch (err) {
          errorCount++;
          errors.push(`Row ${index + 2}: ${err.message}`);
        }
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    res.json({ message: 'Import completed', successCount, errorCount, errors });
  } catch (error) {
    next(error);
  }
});

// GET /api/import/template/:type
router.get('/template/:type', (req, res, next) => {
  const { type } = req.params;
  console.log(`Template export requested for: ${type}`);
  
  try {
    let templateData = [];
    
    if (type === 'expenses') {
      templateData = [
        {
          Date: '2025-05-24',
          Description: 'Tree cutting - Hashmat',
          Qty: '',
          'Amt Qty Total': '',
          Amt: 6000,
          'Per Day Exp': 6000,
          Ashish: '',
          'Well Digging': '',
          'Carpentry Work': '',
          'Wood Acquire': '',
          'Others Payment': 6000,
          'Laterite Brick': '',
          'Const. Material': '',
          'Electric Prakash': ''
        },
        {
          Date: '2025-06-03',
          Description: 'MSand & PSand - 1 load each',
          Qty: '',
          'Amt Qty Total': '',
          Amt: 30210,
          'Per Day Exp': 30210,
          Ashish: '',
          'Well Digging': '',
          'Carpentry Work': 30210,
          'Wood Acquire': '',
          'Others Payment': '',
          'Laterite Brick': '',
          'Const. Material': '',
          'Electric Prakash': ''
        }
      ];
    } else if (type === 'categories') {
      templateData = [
        { Name: 'Electrical', Description: 'All electrical wiring and fixtures' },
        { Name: 'Plumbing', Description: 'Pipes, taps, and sanitary' }
      ];
    } else {
      return res.status(400).json({ message: `Template type '${type}' not supported yet.` });
    }
    
    const buffer = generateExcelFile(templateData, 'Template');
    console.log(`Generated template buffer size: ${buffer.length} bytes`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_template.xlsx"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

export default router;
