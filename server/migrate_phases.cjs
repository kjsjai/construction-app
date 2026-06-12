const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('server/db/construction.db');

try {
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('BEGIN TRANSACTION');

  // 1. Delete "Construction Stages" and its subcategories
  console.log('Cleaning up old categories...');
  const stagesCat = db.prepare('SELECT id FROM categories WHERE name = ?').get('Construction Stages');
  
  if (stagesCat) {
    db.prepare('DELETE FROM categories WHERE parent_id = ?').run(stagesCat.id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(stagesCat.id);
    console.log('Deleted Construction Stages categories.');
  } else {
    // If name is different but id=1 is what we saw
    db.prepare('DELETE FROM categories WHERE parent_id = 1').run();
    db.prepare('DELETE FROM categories WHERE id = 1').run();
    console.log('Deleted category ID 1 and children.');
  }

  // 2. Clear existing phases
  console.log('Clearing existing phases...');
  db.prepare('DELETE FROM phases').run();

  // Reset sqlite_sequence for phases so IDs start at 1
  try {
    db.prepare("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'phases'").run();
  } catch(e) {
    // ignore if sqlite_sequence doesn't exist yet
  }

  // 3. Insert the 8 specific phases
  console.log('Inserting ordered phases...');
  const phases = [
    '01.Foundation',
    '02.Ground Floor Lintel Casting',
    '03.Ground Floor Roof',
    '04.First Floor Roof',
    '05.Plastering Completion',
    '06.Flooring & Joineries',
    '07.Fitting, Painting & Finishing',
    '08.Ready to Occupy'
  ];

  const insertPhase = db.prepare('INSERT INTO phases (name, status) VALUES (?, ?)');
  for (const p of phases) {
    insertPhase.run(p, 'active');
  }

  db.exec('COMMIT');
  console.log('Migration completed successfully!');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('Migration failed:', error);
}
