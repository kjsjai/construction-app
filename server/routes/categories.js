import express from 'express';
import db from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();
router.use(authenticate);

// GET /api/categories
router.get('/', (req, res, next) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// POST /api/categories
router.post('/', requireRole(['admin', 'manager']), (req, res, next) => {
  try {
    const { name, color, icon, description, parent_id, budget_limit } = req.body;
    const stmt = db.prepare('INSERT INTO categories (name, color, icon, description, parent_id, budget_limit) VALUES (?, ?, ?, ?, ?, ?)');
    const result = stmt.run(name, color, icon, description, parent_id || null, budget_limit || 0);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Category created' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/categories/:id
router.put('/:id', requireRole(['admin', 'manager']), (req, res, next) => {
  try {
    const { name, color, icon, description, parent_id, budget_limit } = req.body;
    
    // Prevent self-referencing
    if (parent_id && String(parent_id) === String(req.params.id)) {
      return res.status(400).json({ message: 'A category cannot be its own parent.' });
    }

    const stmt = db.prepare(`
      UPDATE categories 
      SET name = ?, color = ?, icon = ?, description = ?, parent_id = ?, budget_limit = ?
      WHERE id = ?
    `);
    stmt.run(name, color, icon, description, parent_id || null, budget_limit || 0, req.params.id);
    res.json({ message: 'Category updated' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/categories/:id
router.delete('/:id', requireRole(['admin', 'manager']), (req, res, next) => {
  try {
    // Check if used in expenses
    const count = db.prepare('SELECT count(*) as count FROM expenses WHERE category_id = ?').get(req.params.id).count;
    if (count > 0) {
      return res.status(400).json({ message: 'Cannot delete category that is in use by expenses.' });
    }

    // Check if it has subcategories
    const subCount = db.prepare('SELECT count(*) as count FROM categories WHERE parent_id = ?').get(req.params.id).count;
    if (subCount > 0) {
      return res.status(400).json({ message: 'Cannot delete a category that has sub-categories.' });
    }
    
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
