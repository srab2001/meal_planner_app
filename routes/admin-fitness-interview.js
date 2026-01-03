/**
 * Admin Fitness Interview Routes
 *
 * Endpoints (admin only):
 * - GET /questions
 * - POST /questions
 * - PATCH /questions/:id
 * - PUT /questions/reorder
 * - GET /questions/:id/options
 * - POST /questions/:id/options
 * - PATCH /options/:id
 */

const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

let getDb = function() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL not set');
  return new Pool({ connectionString: dbUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
}

// Allow tests to inject a custom DB getter
module.exports.__setDbGetter = function(fn) { getDb = fn; };

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, error_code: 'not_authenticated', message: 'Authentication required' });
  if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error_code: 'forbidden', message: 'Admin role required' });
  next();
}

// List questions
router.get('/questions', requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const result = await db.query(`SELECT id, key, label, help_text, input_type, is_required, sort_order, is_enabled FROM fitness_interview_questions ORDER BY sort_order ASC`);
    const rows = result.rows || [];
    // Fetch options for all question ids
    const qIds = rows.map(r => r.id);
    let optsMap = {};
    if (qIds.length > 0) {
      const optsRes = await db.query(`SELECT question_id, value, label, sort_order, is_enabled FROM fitness_interview_options WHERE question_id = ANY($1) ORDER BY sort_order ASC`, [qIds]);
      for (const o of optsRes.rows || []) {
        optsMap[o.question_id] = optsMap[o.question_id] || [];
        optsMap[o.question_id].push({ value: o.value, label: o.label, sort_order: o.sort_order, is_enabled: o.is_enabled });
      }
    }
    await db.end();

    // Return compatibility shape expected by admin UI
    const out = rows.map(r => ({
      id: r.id,
      key: r.key,
      question_text: r.label,
      question_type: (r.input_type === 'single_select' ? 'multiple_choice' : (r.input_type === 'multi_select' ? 'multiple_choice' : (r.input_type === 'number' ? 'range' : 'text'))),
      options: optsMap[r.id] ? optsMap[r.id].map(o => o.label) : [],
      option_range: null,
      order_position: r.sort_order,
      is_active: r.is_enabled
    }));

    return res.json({ ok: true, data: out });
  } catch (err) {
    console.error('[Admin Fitness] GET /questions error', err);
    return res.status(500).json({ ok: false, error_code: 'server_error', message: 'Failed to list questions' });
  }
});

// Create question
router.post('/questions', requireAdmin, async (req, res) => {
  try {
    // Accept legacy admin UI shape too: question_text, question_type, options, is_active
    const body = req.body || {};
    let key = body.key;
    let label = body.label;
    let help_text = body.help_text;
    let input_type = body.input_type;
    let is_required = body.is_required;
    let sort_order = body.sort_order;
    let is_enabled = body.is_enabled;

    // Legacy mapping
    if (!label && body.question_text) label = body.question_text;
    if (!input_type && body.question_type) {
      // Map legacy types to our types
      if (body.question_type === 'text') input_type = 'text';
      else if (body.question_type === 'multiple_choice') input_type = body.options && Array.isArray(body.options) && body.options.length > 1 ? 'single_select' : 'single_select';
      else if (body.question_type === 'yes_no') input_type = 'single_select';
      else if (body.question_type === 'range') input_type = 'number';
    }
    if (is_enabled === undefined && body.is_active !== undefined) is_enabled = body.is_active;

    if (!key) key = (label || 'q').toLowerCase().replace(/[^a-z0-9_]+/g, '_').slice(0,60);
    if (!label || !input_type) return res.status(400).json({ ok: false, error_code: 'validation_error', message: 'label and input_type are required' });

    const allowed = ['single_select','multi_select','number','text'];
    if (!allowed.includes(input_type)) return res.status(400).json({ ok: false, error_code: 'validation_error', message: 'invalid input_type' });

    const db = getDb();
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      // ensure unique key
      const exists = await client.query('SELECT id FROM fitness_interview_questions WHERE key = $1', [key]);
      if (exists.rows.length > 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(409).json({ ok: false, error_code: 'conflict', message: 'Question key already exists' });
      }

      const insert = await client.query(
        `INSERT INTO fitness_interview_questions (key, label, help_text, input_type, is_required, sort_order, is_enabled, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW()) RETURNING *`,
        [key, label, help_text || null, input_type, is_required === false ? false : true, sort_order || 999, is_enabled === false ? false : true]
      );
      const qrow = insert.rows[0];

      // Insert options if provided, ensure uniqueness per-question
      if (Array.isArray(body.options) && body.options.length > 0) {
        const seen = new Set();
        for (let i = 0; i < body.options.length; i++) {
          const val = String(body.options[i]);
          if (seen.has(val)) continue;
          seen.add(val);
          await client.query('INSERT INTO fitness_interview_options (question_id, value, label, sort_order, is_enabled, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW())', [qrow.id, val, val, i+1, true]);
        }
      }

      await client.query('COMMIT');
      client.release();
      return res.status(201).json({ ok: true, data: qrow });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (e) {}
      client.release();
      console.error('[Admin Fitness] POST /questions transaction error', err);
      return res.status(500).json({ ok: false, error_code: 'server_error', message: 'Failed to create question' });
    }
  } catch (err) {
    console.error('[Admin Fitness] POST /questions error', err);
    return res.status(500).json({ ok: false, error_code: 'server_error', message: 'Failed to create question' });
  }
});

// Patch question
router.patch('/questions/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    // Support legacy payloads (question_text, question_type, options, is_active)
    const body = req.body || {};
    const updates = [];
    const vals = [];
    let idx = 1;
    if (body.label !== undefined) { updates.push(`label = $${idx++}`); vals.push(body.label); }
    if (body.help_text !== undefined) { updates.push(`help_text = $${idx++}`); vals.push(body.help_text); }
    if (body.input_type !== undefined) { updates.push(`input_type = $${idx++}`); vals.push(body.input_type); }
    if (body.is_required !== undefined) { updates.push(`is_required = $${idx++}`); vals.push(body.is_required); }
    if (body.sort_order !== undefined) { updates.push(`sort_order = $${idx++}`); vals.push(body.sort_order); }
    if (body.is_enabled !== undefined) { updates.push(`is_enabled = $${idx++}`); vals.push(body.is_enabled); }
    // legacy mappings
    if (body.question_text !== undefined) { updates.push(`label = $${idx++}`); vals.push(body.question_text); }
    if (body.question_type !== undefined) {
      // map to input_type where possible
      const map = { text: 'text', multiple_choice: 'single_select', yes_no: 'single_select', range: 'number' };
      const it = map[body.question_type] || body.question_type;
      updates.push(`input_type = $${idx++}`); vals.push(it);
    }
    if (body.is_active !== undefined) { updates.push(`is_enabled = $${idx++}`); vals.push(body.is_active); }

    if (updates.length === 0) return res.status(400).json({ ok: false, error_code: 'validation_error', message: 'No fields to update' });
    vals.push(id);
    const db = getDb();
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const q = `UPDATE fitness_interview_questions SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
      const result = await client.query(q, vals);

      if (Array.isArray(body.options)) {
        // Replace existing options with provided list in a transactional manner
        await client.query('DELETE FROM fitness_interview_options WHERE question_id = $1', [id]);
        const seen = new Set();
        for (let i = 0; i < body.options.length; i++) {
          const val = String(body.options[i]);
          if (seen.has(val)) continue;
          seen.add(val);
          await client.query('INSERT INTO fitness_interview_options (question_id, value, label, sort_order, is_enabled, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW())', [id, val, val, i+1, true]);
        }
      }

      await client.query('COMMIT');
      client.release();
      if (result.rows.length === 0) return res.status(404).json({ ok: false, error_code: 'not_found', message: 'Question not found' });
      return res.json({ ok: true, data: result.rows[0] });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (e) {}
      client.release();
      console.error('[Admin Fitness] PATCH /questions transaction error', err);
      return res.status(500).json({ ok: false, error_code: 'server_error', message: 'Failed to update question' });
    }
  } catch (err) {
    console.error('[Admin Fitness] PATCH /questions/:id error', err);
    return res.status(500).json({ ok: false, error_code: 'server_error', message: 'Failed to update question' });
  }
});

// Reorder questions
router.put('/questions/reorder', requireAdmin, async (req, res) => {
  try {
    const { orders } = req.body; // [{id, sort_order}]
    if (!Array.isArray(orders)) return res.status(400).json({ ok: false, error_code: 'validation_error', message: 'orders must be array' });
    const db = getDb();
    await db.query('BEGIN');
    for (const o of orders) {
      await db.query('UPDATE fitness_interview_questions SET sort_order = $1, updated_at = NOW() WHERE id = $2', [o.sort_order, o.id]);
    }
    await db.query('COMMIT');
    await db.end();
    return res.json({ ok: true });
  } catch (err) {
    console.error('[Admin Fitness] PUT /questions/reorder error', err);
    return res.status(500).json({ ok: false, error_code: 'server_error', message: 'Failed to reorder' });
  }
});

// Options: list
router.get('/questions/:id/options', requireAdmin, async (req, res) => {
  try {
    const qid = req.params.id;
    const db = getDb();
    const r = await db.query('SELECT id, value, label, sort_order, is_enabled FROM fitness_interview_options WHERE question_id = $1 ORDER BY sort_order ASC', [qid]);
    await db.end();
    return res.json({ ok: true, data: r.rows });
  } catch (err) {
    console.error('[Admin Fitness] GET /questions/:id/options error', err);
    return res.status(500).json({ ok: false, error_code: 'server_error', message: 'Failed to list options' });
  }
});

// Options: create
router.post('/questions/:id/options', requireAdmin, async (req, res) => {
  try {
    const qid = req.params.id;
    const { value, label, sort_order, is_enabled } = req.body;
    if (!value || !label) return res.status(400).json({ ok: false, error_code: 'validation_error', message: 'value and label required' });
    const db = getDb();
    const insert = await db.query('INSERT INTO fitness_interview_options (question_id, value, label, sort_order, is_enabled, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW()) RETURNING *', [qid, value, label, sort_order || 999, is_enabled === false ? false : true]);
    await db.end();
    return res.status(201).json({ ok: true, data: insert.rows[0] });
  } catch (err) {
    console.error('[Admin Fitness] POST /questions/:id/options error', err);
    return res.status(500).json({ ok: false, error_code: 'server_error', message: 'Failed to create option' });
  }
});

// Options: patch
router.patch('/options/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const fields = [];
    const vals = [];
    let idx = 1;
    const allowed = ['value','label','sort_order','is_enabled'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) { fields.push(`${k} = $${idx++}`); vals.push(req.body[k]); }
    }
    if (fields.length === 0) return res.status(400).json({ ok: false, error_code: 'validation_error', message: 'No fields to update' });
    vals.push(id);
    const db = getDb();
    const q = `UPDATE fitness_interview_options SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
    const result = await db.query(q, vals);
    await db.end();
    if (result.rows.length === 0) return res.status(404).json({ ok: false, error_code: 'not_found', message: 'Option not found' });
    return res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    console.error('[Admin Fitness] PATCH /options/:id error', err);
    return res.status(500).json({ ok: false, error_code: 'server_error', message: 'Failed to update option' });
  }
});

module.exports = router;

// Export setter for tests (if overwritten earlier attach it again)
module.exports.__setDbGetter = function(fn) { getDb = fn; };
