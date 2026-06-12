import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';

// Parse categories file
const rawData = fs.readFileSync('categories_list.txt', 'utf-8');
const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const db = new DatabaseSync('db/construction.db');

db.exec('BEGIN TRANSACTION');

try {
  db.exec('DELETE FROM expenses');
  db.exec('DELETE FROM categories');

  const insertCat = db.prepare(`
    INSERT INTO categories (name, color, icon, description, parent_id, budget_limit)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let currentParentId = null;

  for (const line of lines) {
    try {
      if (line.startsWith('•') || line.startsWith('-')) {
        // It's a subcategory
        const subName = line.replace(/^[•-]\s*/, '').trim();
        if (currentParentId) {
          insertCat.run(subName, '#94A3B8', 'tag', `${subName} subcategory`, currentParentId, 0);
        }
      } else {
        // It's a master category
        const masterName = line;
        const result = insertCat.run(masterName, '#3B82F6', 'folder', `${masterName} category`, null, 0);
        currentParentId = result.lastInsertRowid;
      }
    } catch (err) {
      console.warn('Skipping duplicate or error for category:', line, err.message);
    }
  }

  db.exec('COMMIT');
  console.log('Successfully inserted all categories and subcategories.');
} catch (e) {
  db.exec('ROLLBACK');
  console.error('Failed to insert categories:', e);
}
