import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// GET / — List all templates
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const templates = db
      .prepare('SELECT * FROM templates ORDER BY category, name')
      .all();

    res.json(templates);
  } catch (err) {
    console.error('[templates] GET / error:', err);
    res.status(500).json({ error: 'Failed to fetch templates', details: err.message });
  }
});

// POST / — Create new template
router.post('/', (req, res) => {
  try {
    const { name, category, brief_template, default_platforms } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required and must be a string' });
    }

    if (!brief_template || typeof brief_template !== 'string') {
      return res.status(400).json({ error: 'brief_template is required and must be a string' });
    }

    const db = getDb();
    const result = db
      .prepare(
        'INSERT INTO templates (name, category, brief_template, default_platforms) VALUES (?, ?, ?, ?)'
      )
      .run(
        name,
        category || null,
        brief_template,
        default_platforms || 'youtube,instagram,tiktok,pinterest,behance,vimeo,meta-ads'
      );

    const template = db
      .prepare('SELECT * FROM templates WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json(template);
  } catch (err) {
    console.error('[templates] POST / error:', err);
    res.status(500).json({ error: 'Failed to create template', details: err.message });
  }
});

// DELETE /:id — Delete template
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();

    const existing = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);

    res.json({ message: 'Template deleted', id: Number(req.params.id) });
  } catch (err) {
    console.error('[templates] DELETE /:id error:', err);
    res.status(500).json({ error: 'Failed to delete template', details: err.message });
  }
});

export default router;
