import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedDatabase = async () => {
  console.log('Initializing database...');
  
  // Create tables
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('Schema loaded.');

  // Check if users exist
  const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('Seeding initial data...');
    
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, username, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const passwordHash = await bcrypt.hash('admin123', 10);
    insertUser.run('Administrator', 'admin@example.com', 'admin', passwordHash, 'admin');
    console.log('Admin user seeded.');

    // Seed Categories
    const categories = [
      ['Ashish Engineer', '#3B82F6', 'hard-hat'],
      ['Well Contract', '#8B5CF6', 'droplets'],
      ['Laterite Bricks', '#F97316', 'layers'],
      ['Wood & Carpentry', '#A16207', 'tree-pine'],
      ['Construction Materials', '#6B7280', 'package'],
      ['Paid - Others', '#EC4899', 'receipt'],
      ['Electrical & Electrician', '#EAB308', 'zap']
    ];
    
    const insertCategory = db.prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)');
    db.exec('BEGIN');
    try {
      for (const cat of categories) insertCategory.run(cat[0], cat[1], cat[2]);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    console.log('Categories seeded.');

    // Seed Phases
    const phases = [
      ['Pre-Construction'],
      ['Foundation Work'],
      ['Septic Tank Construction'],
      ['Phase 1 — Ground Floor'],
      ['Ground Floor Concrete'],
      ['Phase 2 — First Floor']
    ];
    
    const insertPhase = db.prepare('INSERT INTO phases (name) VALUES (?)');
    db.exec('BEGIN');
    try {
      for (const ph of phases) insertPhase.run(ph[0]);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    console.log('Phases seeded.');

    // Seed Funds
    const funds = [
      ['2023-01-01', 'Loan', 'HDFC Housing Loan — ₹9,00,000 (Inst 1)', 900000],
      ['2023-03-01', 'Loan', 'HDFC Housing Loan — ₹9,00,000 (Inst 2)', 900000],
      ['2023-06-01', 'Loan', 'HDFC Housing Loan — ₹9,00,000 (Inst 3)', 900000],
      ['2023-02-01', 'Loan', 'NMG Gold Loan 1 — ₹2,50,118', 250118],
      ['2023-04-01', 'Loan', 'NMG Gold Loan 2 — ₹2,04,784 @ 7% interest', 204784],
      ['2023-01-15', 'Cash', 'Cash from Deedhu — ₹10,00,000', 1000000],
      ['2023-05-01', 'Loan', 'Sachin Personal Loan — ₹65,000 (Closed)', 65000],
      ['2023-05-15', 'Loan', 'Anjana Personal Loan — ₹10,000 (Closed)', 10000]
    ];

    const insertFund = db.prepare('INSERT INTO funds (date, source_type, source_name, amount) VALUES (?, ?, ?, ?)');
    db.exec('BEGIN');
    try {
      for (const f of funds) insertFund.run(f[0], f[1], f[2], f[3]);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    console.log('Funds seeded.');
    
    console.log('Database seeding complete!');
  } else {
    console.log('Database already has data. Skipping seed.');
  }
};

seedDatabase().catch(console.error);
