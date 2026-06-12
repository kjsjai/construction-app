import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get db path from env, resolve relative to root or use absolute
const dbPath = process.env.DB_PATH 
  ? path.resolve(__dirname, '../../', process.env.DB_PATH) 
  : path.join(__dirname, 'construction.db');

// Ensure directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Enable Write-Ahead Logging for concurrency
db.exec('PRAGMA journal_mode = WAL');
// Set synchronous to NORMAL for optimal WAL performance (safe against power failure)
db.exec('PRAGMA synchronous = NORMAL');
// Wait up to 5 seconds when the database is locked instead of failing immediately
db.exec('PRAGMA busy_timeout = 5000');
// Enforce foreign key constraints
db.exec('PRAGMA foreign_keys = ON');

// Perform integrity check on startup to ensure database is not corrupted
const check = db.prepare('PRAGMA integrity_check;').get();
if (check.integrity_check !== 'ok') {
  console.error('FATAL: Database integrity check failed!', check);
  process.exit(1);
}

console.log(`Database connected at ${dbPath}`);

export default db;
