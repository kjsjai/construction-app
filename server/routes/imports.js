import express from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import db from '../db/database.js';
import { requireRole } from '../middleware/roles.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);
const upload = multer({ storage: multer.memoryStorage() });

// Helper to get categories by parent ID
const getCategoriesByParent = (parentId) => {
  if (parentId === null) {
    return db.prepare('SELECT * FROM categories WHERE parent_id IS NULL').all();
  }
  return db.prepare('SELECT * FROM categories WHERE parent_id = ?').all(parentId);
};

// ==========================================
// 1. GENERATE & DOWNLOAD EXCEL TEMPLATE
// ==========================================
router.get('/template', requireRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Construction Tracker';
    
    // Create Main Sheet
    const sheet = workbook.addWorksheet('Expense Entry', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }]
    });

    // Formatting rules
    const headerFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF001F3F' } // Dark Navy
    };
    const headerFont = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Arial' };
    const yellowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };
    const lightGreyFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    const whiteFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

    // Row 1: Title
    sheet.mergeCells('A1:N1');
    sheet.getCell('A1').value = 'SWASTIK HOUSE CONSTRUCTION - EXPENSE ENTRY';
    sheet.getCell('A1').font = { size: 16, bold: true, name: 'Arial', color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').fill = headerFill;
    sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 2: Subtitle
    sheet.mergeCells('A2:N2');
    sheet.getCell('A2').value = 'Note: Yellow fields are mandatory. Do not rename or delete columns.';
    sheet.getCell('A2').font = { size: 10, italic: true, name: 'Arial', color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A2').fill = headerFill;
    sheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 3: Column Headers
    const headers = [
      { header: '#', key: 'sl', width: 5 },
      { header: 'Date *', key: 'date', width: 15 },
      { header: 'Description *', key: 'desc', width: 30 },
      { header: 'Construction Stage *', key: 'stage', width: 25 },
      { header: 'Expense Category *', key: 'cat', width: 25 },
      { header: 'Sub-Category', key: 'subcat', width: 20 },
      { header: 'Qty', key: 'qty', width: 10 },
      { header: 'Unit', key: 'unit', width: 15 },
      { header: 'Rate (₹)', key: 'rate', width: 15 },
      { header: 'Amount (₹) *', key: 'amount', width: 15 },
      { header: 'Payment Mode', key: 'pay_mode', width: 20 },
      { header: 'Paid To / Vendor', key: 'vendor', width: 25 },
      { header: 'Fund Source', key: 'fund', width: 25 },
      { header: 'Notes / Remarks', key: 'notes', width: 40 }
    ];

    // Set column widths and keys
    sheet.columns = headers.map(h => ({ key: h.key, width: h.width }));

    // Set header values in Row 3 manually
    const headerRow = sheet.getRow(3);
    headerRow.values = headers.map(h => h.header);

    headerRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Row 4 to 103: Data Rows
    for (let i = 4; i <= 103; i++) {
      const row = sheet.getRow(i);
      row.height = 20;
      
      const isAlt = i % 2 === 0;
      const defaultFill = isAlt ? lightGreyFill : whiteFill;

      // Auto serial number
      row.getCell('A').value = i - 3;
      row.getCell('A').fill = defaultFill;
      row.getCell('A').font = { name: 'Arial' };
      row.getCell('A').alignment = { vertical: 'middle', horizontal: 'center' };

      // Formatting and Validation
      ['B', 'C', 'D', 'E', 'J'].forEach(col => {
        row.getCell(col).fill = yellowFill;
        row.getCell(col).font = { name: 'Arial' };
        row.getCell(col).alignment = { vertical: 'middle' };
      });

      ['F', 'G', 'H', 'I', 'K', 'L', 'M', 'N'].forEach(col => {
        row.getCell(col).fill = defaultFill;
        row.getCell(col).font = { name: 'Arial' };
        row.getCell(col).alignment = { vertical: 'middle' };
      });

      // Data validation dropdowns will refer to the Reference sheet
      row.getCell('D').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['\'Reference Lists\'!$A$2:$A$100']
      };
      
      row.getCell('E').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['\'Reference Lists\'!$B$2:$B$100']
      };

      row.getCell('F').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['\'Reference Lists\'!$E$2:$E$500']
      };

      row.getCell('K').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['\'Reference Lists\'!$C$2:$C$10']
      };

      row.getCell('M').dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['\'Reference Lists\'!$D$2:$D$50']
      };

      // Formats
      row.getCell('B').numFmt = 'DD-MMM-YYYY';
      row.getCell('I').numFmt = '₹#,##0.00';
      row.getCell('J').numFmt = '₹#,##0.00';
      row.getCell('N').alignment = { vertical: 'middle', wrapText: true };
    }

    // Row 104: Total
    sheet.getCell('I104').value = 'TOTAL:';
    sheet.getCell('I104').font = { bold: true, name: 'Arial' };
    sheet.getCell('I104').alignment = { horizontal: 'right' };
    
    sheet.getCell('J104').value = { formula: 'SUM(J4:J103)' };
    sheet.getCell('J104').numFmt = '₹#,##0.00';
    sheet.getCell('J104').font = { bold: true, name: 'Arial' };
    sheet.getCell('J104').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } }; // Light green

    // ==========================================
    // Reference Lists Sheet
    // ==========================================
    const refSheet = workbook.addWorksheet('Reference Lists');
    refSheet.state = 'hidden'; // Hide the sheet from users

    // Get Database Values
    const masterStage = db.prepare('SELECT id FROM categories WHERE name = ?').get('Construction Stages');
    const stages = masterStage ? getCategoriesByParent(masterStage.id) : [];
    
    // Get Expense Categories (all master categories except structural ones)
    let expenseCategories = db.prepare(`
      SELECT name FROM categories 
      WHERE parent_id IS NULL 
      AND name NOT IN ('Construction Stages', 'Land & Property', 'Owner Contribution (OC)', 'Loan Account')
    `).all().map(c => c.name);

    const paymentModes = ['Bank Transfer', 'Cash', 'UPI / GPay', 'Cheque', 'NEFT/RTGS'];
    
    const funds = db.prepare('SELECT source_name FROM funds').all().map(f => f.source_name);

    // Get all Expense Subcategories (excluding Construction Stages children)
    let expenseSubCategories = db.prepare(`
      SELECT name FROM categories 
      WHERE parent_id IS NOT NULL 
      AND parent_id NOT IN (SELECT id FROM categories WHERE name = 'Construction Stages')
    `).all().map(c => c.name);

    // Strip duplicate suffix from names for display if present, e.g. "Hardwood (Wood Acquisition)" -> "Hardwood"
    // Wait, if we strip it, the user will submit "Hardwood", and our backend matches it anyway because it falls back to suffix!
    // But displaying suffix is safer so they know which category it belongs to if there are duplicates like "Shelving".
    // Let's just output it as is.

    refSheet.getCell('A1').value = 'Construction Stages';
    refSheet.getCell('B1').value = 'Expense Categories';
    refSheet.getCell('C1').value = 'Payment Modes';
    refSheet.getCell('D1').value = 'Fund Sources';
    refSheet.getCell('E1').value = 'Expense Subcategories';

    stages.forEach((s, idx) => { refSheet.getCell(`A${idx + 2}`).value = s.name; });
    expenseCategories.forEach((c, idx) => { refSheet.getCell(`B${idx + 2}`).value = c; });
    paymentModes.forEach((p, idx) => { refSheet.getCell(`C${idx + 2}`).value = p; });
    funds.forEach((f, idx) => { refSheet.getCell(`D${idx + 2}`).value = f; });
    expenseSubCategories.forEach((s, idx) => { refSheet.getCell(`E${idx + 2}`).value = s; });

    // Output
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Swastik_Expense_Entry_${dateStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 2. PREVIEW UPLOADED EXCEL
// ==========================================
router.post('/preview', requireRole(['admin', 'manager']), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const sheet = workbook.getWorksheet('Expense Entry');
    if (!sheet) {
      return res.status(400).json({ message: 'Invalid template. Could not find "Expense Entry" sheet.' });
    }

    const previewData = [];
    
    // Read rows 4 to 103
    for (let i = 4; i <= 103; i++) {
      const row = sheet.getRow(i);
      
      const dateCell = row.getCell('B').value;
      const descCell = row.getCell('C').value;
      const stageCell = row.getCell('D').value;
      const catCell = row.getCell('E').value;
      const subcatCell = row.getCell('F').value;
      const qtyCell = row.getCell('G').value;
      const unitCell = row.getCell('H').value;
      const rateCell = row.getCell('I').value;
      const amountCell = row.getCell('J').value;
      const payModeCell = row.getCell('K').value;
      const vendorCell = row.getCell('L').value;
      const fundCell = row.getCell('M').value;
      const notesCell = row.getCell('N').value;

      // Extract values properly (handles formulas/rich text)
      const extractVal = (cell) => {
        if (!cell) return null;
        if (typeof cell === 'object') {
          if (cell.result !== undefined) return cell.result;
          if (cell.richText) return cell.richText.map(rt => rt.text).join('');
        }
        return cell;
      };

      const date = extractVal(dateCell);
      const description = extractVal(descCell);
      const stage = extractVal(stageCell);
      const category = extractVal(catCell);
      let amount = extractVal(amountCell);

      // Skip entirely empty rows
      if (!date && !description && !amount) continue;

      let isValid = true;
      let errors = [];

      // Validate required fields
      if (!date) { isValid = false; errors.push('Missing Date'); }
      if (!description) { isValid = false; errors.push('Missing Description'); }
      if (!stage) { isValid = false; errors.push('Missing Stage'); }
      if (!category) { isValid = false; errors.push('Missing Category'); }
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { 
        isValid = false; 
        errors.push('Invalid Amount'); 
      }

      previewData.push({
        row: i,
        date: date instanceof Date ? date.toISOString().split('T')[0] : (date ? String(date) : ''),
        description: description ? String(description) : '',
        stage: stage ? String(stage) : '',
        category: category ? String(category) : '',
        subcategory: extractVal(subcatCell) ? String(extractVal(subcatCell)) : '',
        qty: extractVal(qtyCell) ? Number(extractVal(qtyCell)) : null,
        unit: extractVal(unitCell) ? String(extractVal(unitCell)) : '',
        rate: extractVal(rateCell) ? Number(extractVal(rateCell)) : null,
        amount: Number(amount) || 0,
        payment_mode: extractVal(payModeCell) ? String(extractVal(payModeCell)) : '',
        vendor: extractVal(vendorCell) ? String(extractVal(vendorCell)) : '',
        fund_source: extractVal(fundCell) ? String(extractVal(fundCell)) : '',
        notes: extractVal(notesCell) ? String(extractVal(notesCell)) : '',
        isValid,
        errors
      });
    }

    res.json(previewData);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 3. CONFIRM IMPORT
// ==========================================
router.post('/confirm', requireRole(['admin', 'manager']), async (req, res, next) => {
  try {
    const { filename, records } = req.body;
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Invalid records payload' });
    }

    // Filter to only valid records
    const validRecords = records.filter(r => r.isValid);
    if (validRecords.length === 0) {
      return res.status(400).json({ message: 'No valid records to import' });
    }

    const totalAmount = validRecords.reduce((sum, r) => sum + r.amount, 0);

    db.exec('BEGIN TRANSACTION');
    try {
      // Create import_history entry
      const insertHistory = db.prepare(`
        INSERT INTO import_history (filename, import_date, row_count, total_amount, status, imported_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const historyResult = insertHistory.run(
        filename || 'Upload.xlsx',
        new Date().toISOString(),
        validRecords.length,
        totalAmount,
        'Success',
        req.user.username
      );
      const importId = historyResult.lastInsertRowid;

      let skipped = 0;
      let imported = 0;

      const insertExpense = db.prepare(`
        INSERT INTO expenses (
          date, description, quantity, unit, rate, amount, 
          category_id, payment_source, vendor, notes, 
          import_id, payment_mode, subcategory_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const checkDuplicate = db.prepare(`
        SELECT id FROM expenses 
        WHERE date = ? AND description = ? AND amount = ?
      `);

      const masterStage = db.prepare('SELECT id FROM categories WHERE name = ?').get('Construction Stages');

      for (const row of validRecords) {
        // Check for duplicates
        const dup = checkDuplicate.get(row.date, row.description, row.amount);
        if (dup) {
          skipped++;
          continue;
        }

        // Map Category ID from new categories list
        let categoryId = null;
        
        if (row.category) {
          const masterCat = db.prepare('SELECT id FROM categories WHERE name = ? AND parent_id IS NULL').get(row.category);
          if (masterCat) {
            categoryId = masterCat.id;
            
            // Look for subcategory
            if (row.subcategory) {
              // Try exact match first
              let subCat = db.prepare('SELECT id FROM categories WHERE name = ? AND parent_id = ?').get(row.subcategory, masterCat.id);
              
              // Try with parent suffix (duplicate prevention)
              if (!subCat) {
                const suffixedName = `${row.subcategory} (${row.category})`;
                subCat = db.prepare('SELECT id FROM categories WHERE name = ? AND parent_id = ?').get(suffixedName, masterCat.id);
              }
              
              if (subCat) {
                categoryId = subCat.id;
              }
            }
          } else if (masterStage && row.stage) {
            // Fallback: If no standard category matched, try to use Construction Stage
            const stageCat = db.prepare('SELECT id FROM categories WHERE parent_id = ? AND name = ?').get(masterStage.id, row.stage);
            if (stageCat) {
              categoryId = stageCat.id;
            }
          }
        }

        insertExpense.run(
          row.date,
          row.description,
          row.qty || null,
          row.unit || null,
          row.rate || null,
          row.amount,
          categoryId,
          row.fund_source || null,
          row.vendor || null,
          row.notes || null,
          importId,
          row.payment_mode || null,
          row.subcategory || null
        );
        imported++;
      }

      if (imported === 0) {
        db.exec('ROLLBACK');
        return res.json({ message: 'No new records imported. All were duplicates or invalid.', imported: 0, skipped });
      }

      // Update actual imported count
      db.prepare('UPDATE import_history SET row_count = ? WHERE id = ?').run(imported, importId);

      db.exec('COMMIT');
      res.json({ message: 'Import successful', importId, imported, skipped });
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 4. GET IMPORT HISTORY
// ==========================================
router.get('/history', requireRole(['admin', 'manager', 'viewer']), (req, res, next) => {
  try {
    const history = db.prepare('SELECT * FROM import_history ORDER BY import_date DESC').all();
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 5. ROLLBACK IMPORT
// ==========================================
router.post('/:id/rollback', requireRole(['admin']), (req, res, next) => {
  try {
    const importId = req.params.id;
    
    db.exec('BEGIN TRANSACTION');
    try {
      // Delete expenses associated with import
      db.prepare('DELETE FROM expenses WHERE import_id = ?').run(importId);
      
      // Update history status
      db.prepare('UPDATE import_history SET status = ? WHERE id = ?').run('Rolled Back', importId);
      
      db.exec('COMMIT');
      res.json({ message: 'Import rolled back successfully.' });
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  } catch (error) {
    next(error);
  }
});

export default router;
