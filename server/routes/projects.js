import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// GET / — List all projects
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const projects = db
      .prepare('SELECT * FROM projects ORDER BY updated_at DESC')
      .all();

    res.json(projects);
  } catch (err) {
    console.error('[projects] GET / error:', err);
    res.status(500).json({ error: 'Failed to fetch projects', details: err.message });
  }
});

// POST / — Create project
router.post('/', (req, res) => {
  try {
    const { name, client, description } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required and must be a string' });
    }

    const db = getDb();
    const result = db
      .prepare('INSERT INTO projects (name, client, description) VALUES (?, ?, ?)')
      .run(name, client || null, description || null);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(project);
  } catch (err) {
    console.error('[projects] POST / error:', err);
    res.status(500).json({ error: 'Failed to create project', details: err.message });
  }
});

// GET /:id — Get project with its items
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const items = db
      .prepare(`
        SELECT pi.id AS item_id, pi.notes, pi.added_at, r.*
        FROM project_items pi
        JOIN results r ON r.id = pi.result_id
        WHERE pi.project_id = ?
        ORDER BY pi.added_at DESC
      `)
      .all(req.params.id);

    // Parse JSON fields in result items
    const parsedItems = items.map((item) => ({
      ...item,
      engagement: item.engagement ? JSON.parse(item.engagement) : null,
      ai_tags: item.ai_tags ? JSON.parse(item.ai_tags) : [],
      raw_data: item.raw_data ? JSON.parse(item.raw_data) : null,
    }));

    res.json({ ...project, items: parsedItems });
  } catch (err) {
    console.error('[projects] GET /:id error:', err);
    res.status(500).json({ error: 'Failed to fetch project', details: err.message });
  }
});

// PUT /:id — Update project
router.put('/:id', (req, res) => {
  try {
    const { name, client, description } = req.body;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    db.prepare(`
      UPDATE projects
      SET name = ?, client = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ?? existing.name,
      client ?? existing.client,
      description ?? existing.description,
      req.params.id
    );

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json(project);
  } catch (err) {
    console.error('[projects] PUT /:id error:', err);
    res.status(500).json({ error: 'Failed to update project', details: err.message });
  }
});

// DELETE /:id — Delete project (cascade deletes items)
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();

    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);

    res.json({ message: 'Project deleted', id: Number(req.params.id) });
  } catch (err) {
    console.error('[projects] DELETE /:id error:', err);
    res.status(500).json({ error: 'Failed to delete project', details: err.message });
  }
});

// POST /:id/items — Add item to project
router.post('/:id/items', (req, res) => {
  try {
    const { result_id, notes } = req.body;

    if (!result_id) {
      return res.status(400).json({ error: 'result_id is required' });
    }

    const db = getDb();

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = db.prepare('SELECT * FROM results WHERE id = ?').get(result_id);
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const insertResult = db
      .prepare('INSERT INTO project_items (project_id, result_id, notes) VALUES (?, ?, ?)')
      .run(req.params.id, result_id, notes || null);

    // Update project updated_at
    db.prepare('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      req.params.id
    );

    const item = db
      .prepare('SELECT * FROM project_items WHERE id = ?')
      .get(insertResult.lastInsertRowid);

    res.status(201).json(item);
  } catch (err) {
    // Handle UNIQUE constraint violation
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Item already exists in project' });
    }
    console.error('[projects] POST /:id/items error:', err);
    res.status(500).json({ error: 'Failed to add item to project', details: err.message });
  }
});

// DELETE /:id/items/:itemId — Remove item from project
router.delete('/:id/items/:itemId', (req, res) => {
  try {
    const db = getDb();

    const item = db
      .prepare('SELECT * FROM project_items WHERE id = ? AND project_id = ?')
      .get(req.params.itemId, req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found in project' });
    }

    db.prepare('DELETE FROM project_items WHERE id = ?').run(req.params.itemId);

    // Update project updated_at
    db.prepare('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      req.params.id
    );

    res.json({ message: 'Item removed from project', id: Number(req.params.itemId) });
  } catch (err) {
    console.error('[projects] DELETE /:id/items/:itemId error:', err);
    res.status(500).json({ error: 'Failed to remove item from project', details: err.message });
  }
});

export default router;
