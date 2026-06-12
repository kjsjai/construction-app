import db from './database.js';

try {
  // Check if parent_id column exists
  const tableInfo = db.prepare('PRAGMA table_info(categories)').all();
  const hasParentId = tableInfo.some(col => col.name === 'parent_id');

  if (!hasParentId) {
    console.log('Adding parent_id column to categories table...');
    db.exec('ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(id)');
    console.log('Successfully added parent_id column.');
  } else {
    console.log('parent_id column already exists.');
  }

  // Check if budget_limit column exists
  const hasBudgetLimit = tableInfo.some(col => col.name === 'budget_limit');

  if (!hasBudgetLimit) {
    console.log('Adding budget_limit column to categories table...');
    db.exec('ALTER TABLE categories ADD COLUMN budget_limit REAL DEFAULT 0');
    console.log('Successfully added budget_limit column.');
  } else {
    console.log('budget_limit column already exists.');
  }

  // Check and create import_history table
  const importHistoryTableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='import_history'`).get();
  if (!importHistoryTableExists) {
    console.log('Creating import_history table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS import_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        import_date TEXT NOT NULL,
        row_count INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL,
        imported_by TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log('Successfully created import_history table.');
  }

  // Check and add columns to expenses table
  const expensesTableInfo = db.prepare('PRAGMA table_info(expenses)').all();
  
  const hasImportId = expensesTableInfo.some(col => col.name === 'import_id');
  if (!hasImportId) {
    console.log('Adding import_id column to expenses table...');
    db.exec('ALTER TABLE expenses ADD COLUMN import_id INTEGER REFERENCES import_history(id)');
    console.log('Successfully added import_id column.');
  }

  const hasPaymentMode = expensesTableInfo.some(col => col.name === 'payment_mode');
  if (!hasPaymentMode) {
    console.log('Adding payment_mode column to expenses table...');
    db.exec('ALTER TABLE expenses ADD COLUMN payment_mode TEXT');
    console.log('Successfully added payment_mode column.');
  }

  const hasSubcategoryText = expensesTableInfo.some(col => col.name === 'subcategory_text');
  if (!hasSubcategoryText) {
    console.log('Adding subcategory_text column to expenses table...');
    db.exec('ALTER TABLE expenses ADD COLUMN subcategory_text TEXT');
    console.log('Successfully added subcategory_text column.');
  }
} catch (error) {
  console.error('Migration failed:', error);
}
