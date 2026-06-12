import db from '../db/database.js';

console.log('Starting seed script for construction project setup...');

try {
  // Use a transaction for safety
  db.exec('BEGIN TRANSACTION');
  try {
    // 1. Wipe existing categories and funds
    console.log('Clearing existing categories and funds...');
    db.prepare('DELETE FROM expenses').run();
    db.prepare('DELETE FROM repayments').run();
    db.prepare('DELETE FROM categories').run();
    db.prepare('DELETE FROM funds').run();
    
    // reset auto-increment counters
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('categories', 'funds', 'expenses', 'repayments')").run();

    // 2. Insert Funds
    console.log('Inserting initial funds...');
    const insertFund = db.prepare(`
      INSERT INTO funds (date, source_type, source_name, account_number, amount, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Sanctioned Loan
    insertFund.run(new Date().toISOString(), 'Loan', 'Bank Construction Loan', 'LOAN-1001', 6000000, 'active', 'Disbursed in 7 tranches of 9L + 1 tranche of 6L');
    
    // Owner Contribution
    const ocFundResult = insertFund.run(new Date().toISOString(), 'Cash/Bank', 'Owner Contribution', 'OC-2001', 1500000, 'active', 'Self-funded portion');
    const ocFundId = ocFundResult.lastInsertRowid;

    // 3. Insert Categories
    console.log('Inserting categories and subcategories...');
    const insertCat = db.prepare(`
      INSERT INTO categories (name, color, icon, description, parent_id, budget_limit)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Master Category: Construction Stages
    const masterStageResult = insertCat.run('Construction Stages', '#3B82F6', 'building-2', 'Main construction phases tied to loan disbursements', null, 0);
    const masterStageId = masterStageResult.lastInsertRowid;

    // Stages
    const stages = [
      { name: 'Basement', budget: 900000 },
      { name: 'Ground Floor Lintel Casting', budget: 900000 },
      { name: 'Ground Floor Roof', budget: 900000 },
      { name: 'First Floor Roof', budget: 900000 },
      { name: 'Plastering Completion', budget: 900000 },
      { name: 'Flooring & Joineries', budget: 900000 },
      { name: 'Fittings, Painting & Finishing', budget: 600000 },
      { name: 'Ready to Occupy', budget: 0 } // Owner Contribution stage
    ];

    const expenseSubCats = [
      'Engineer Contract', 'Carpentry', 'Wood Acquire', 'Laterite Bricks',
      'Construction Materials', 'Electrical', 'Plumbing', 'Miscellaneous', 'Other Expenses'
    ];

    for (const stage of stages) {
      const stageResult = insertCat.run(stage.name, '#6366F1', 'hammer', `Construction Stage: ${stage.name}`, masterStageId, stage.budget);
      const stageId = stageResult.lastInsertRowid;
      
      // Insert subcategories for this stage
      for (const sub of expenseSubCats) {
        insertCat.run(`${sub} (${stage.name})`, '#94A3B8', 'tag', `${sub} expenses for ${stage.name}`, stageId, 0);
      }
    }

    // Separate Top-Level Categories
    const landResult = insertCat.run('Land & Property', '#10B981', 'map', 'Land purchase, registration, and survey costs', null, 4000000);
    const landId = landResult.lastInsertRowid;
    insertCat.run('Owner Contribution (OC)', '#F59E0B', 'wallet', 'Tracking self-funded portion expenses', null, 1500000);
    insertCat.run('Loan Account', '#EF4444', 'landmark', 'EMI tracking, disbursement records, interest payments', null, 0);

    // 4. Record the initial OC spent amount
    // User mentioned OC spent: 4L. We'll log an expense against "Land & Property" using the OC fund
    console.log('Recording initial ₹4,00,000 Land & Property expense from OC fund...');
    const insertExpense = db.prepare(`
      INSERT INTO expenses (date, description, amount, category_id, payment_source, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    // Log expense
    insertExpense.run(new Date().toISOString(), 'Initial Land Advance / Purchase', 400000, landId, 'Owner Contribution', 'Initial OC spent amount');

    db.exec('COMMIT');
    console.log('✅ Seed script completed successfully!');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('❌ Transaction failed, rolling back:', err);
  }
} catch (error) {
  console.error('❌ Error running seed script:', error);
}
