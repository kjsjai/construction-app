import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import db from './db/database.js';

try {
  const tableInfo = db.prepare('PRAGMA table_info(categories)').all();
  const hasParentId = tableInfo.some(col => col.name === 'parent_id');

  if (!hasParentId) {
    console.log('Adding parent_id column to categories table...');
    db.exec('ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(id)');
    console.log('Successfully added parent_id column.');
  } else {
    console.log('parent_id column already exists.');
  }
} catch (error) {
  console.error('Migration failed:', error);
}
