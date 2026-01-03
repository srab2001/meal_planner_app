/**
 * Admin Step Media Routes
 *
 * Manage video/poster media for meal planning steps
 * All routes require authentication and admin role
 *
 * Endpoints:
 * - GET /api/admin/step-media - List all media grouped by step
 * - GET /api/admin/step-media/:id - Get single media detail
 * - POST /api/admin/step-media - Create new media version
 * - POST /api/admin/step-media/:id/publish - Publish media version
 * - DELETE /api/admin/step-media/:id - Delete media version
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Use DATABASE_URL for main app database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Valid step keys
const VALID_STEP_KEYS = [
  'CUISINES',
  'SERVINGS',
  'INGREDIENTS',
  'DIETARY',
  'MEALS',
  'STORES',
  'RECIPES_WITH_PRICES'
];

/**
 * Middleware: Verify admin role
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    console.log('[StepMedia] Rejected - user role:', req.user?.role);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * GET /api/admin/step-media
 * List all media grouped by step key, with active status
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        sm.id,
        sm.step_key,
        sm.label,
        sm.video_url,
        sm.poster_url,
        sm.run_rule,
        sm.created_at,
        sm.updated_at,
        CASE WHEN sma.active_media_id = sm.id THEN true ELSE false END as is_active,
        sma.published_at
      FROM step_media sm
      LEFT JOIN step_media_active sma ON sma.active_media_id = sm.id
      ORDER BY sm.step_key, sm.created_at DESC
    `);

    // Group by step_key
    const grouped = {};
    VALID_STEP_KEYS.forEach(key => {
      grouped[key] = [];
    });

    result.rows.forEach(row => {
      if (grouped[row.step_key]) {
        grouped[row.step_key].push({
          id: row.id,
          stepKey: row.step_key,
          label: row.label,
          videoUrl: row.video_url,
          posterUrl: row.poster_url,
          runRule: row.run_rule,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          isActive: row.is_active,
          publishedAt: row.published_at
        });
      }
    });

    res.json({
      stepKeys: VALID_STEP_KEYS,
      media: grouped
    });
  } catch (error) {
    console.error('[StepMedia] Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch step media' });
  }
});

/**
 * GET /api/admin/step-media/:id
 * Get single media detail
 */
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        sm.id,
        sm.step_key,
        sm.label,
        sm.video_url,
        sm.poster_url,
        sm.run_rule,
        sm.created_by,
        sm.created_at,
        sm.updated_at,
        CASE WHEN sma.active_media_id = sm.id THEN true ELSE false END as is_active,
        sma.published_at,
        sma.published_by
      FROM step_media sm
      LEFT JOIN step_media_active sma ON sma.active_media_id = sm.id
      WHERE sm.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      stepKey: row.step_key,
      label: row.label,
      videoUrl: row.video_url,
      posterUrl: row.poster_url,
      runRule: row.run_rule,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active,
      publishedAt: row.published_at,
      publishedBy: row.published_by
    });
  } catch (error) {
    console.error('[StepMedia] Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

/**
 * POST /api/admin/step-media
 * Create new media version
 * Body: { stepKey, label, videoUrl?, posterUrl?, runRule? }
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { stepKey, label, videoUrl, posterUrl, runRule = 'loop' } = req.body;

    // Validate step key
    if (!stepKey || !VALID_STEP_KEYS.includes(stepKey)) {
      return res.status(400).json({
        error: `Invalid stepKey. Must be one of: ${VALID_STEP_KEYS.join(', ')}`
      });
    }

    // Validate label
    if (!label || label.trim().length === 0) {
      return res.status(400).json({ error: 'Label is required' });
    }

    // Validate run rule
    if (!['loop', 'stopOnUserAction'].includes(runRule)) {
      return res.status(400).json({ error: 'runRule must be "loop" or "stopOnUserAction"' });
    }

    const result = await pool.query(`
      INSERT INTO step_media (step_key, label, video_url, poster_url, run_rule, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, step_key, label, video_url, poster_url, run_rule, created_at
    `, [stepKey, label.trim(), videoUrl || null, posterUrl || null, runRule, req.user.id]);

    const row = result.rows[0];
    console.log(`[StepMedia] Created media for step ${stepKey}: ${row.id}`);

    res.status(201).json({
      id: row.id,
      stepKey: row.step_key,
      label: row.label,
      videoUrl: row.video_url,
      posterUrl: row.poster_url,
      runRule: row.run_rule,
      createdAt: row.created_at,
      isActive: false
    });
  } catch (error) {
    console.error('[StepMedia] Error creating media:', error);
    res.status(500).json({ error: 'Failed to create media' });
  }
});

/**
 * PATCH /api/admin/step-media/:id
 * Update media version
 * Body: { label?, videoUrl?, posterUrl?, runRule? }
 */
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, videoUrl, posterUrl, runRule } = req.body;

    // Build dynamic update
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (label !== undefined) {
      updates.push(`label = $${paramCount++}`);
      values.push(label.trim());
    }

    if (videoUrl !== undefined) {
      updates.push(`video_url = $${paramCount++}`);
      values.push(videoUrl || null);
    }

    if (posterUrl !== undefined) {
      updates.push(`poster_url = $${paramCount++}`);
      values.push(posterUrl || null);
    }

    if (runRule !== undefined) {
      if (!['loop', 'stopOnUserAction'].includes(runRule)) {
        return res.status(400).json({ error: 'runRule must be "loop" or "stopOnUserAction"' });
      }
      updates.push(`run_rule = $${paramCount++}`);
      values.push(runRule);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(`
      UPDATE step_media
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, step_key, label, video_url, poster_url, run_rule, created_at, updated_at
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const row = result.rows[0];
    console.log(`[StepMedia] Updated media: ${row.id}`);

    res.json({
      id: row.id,
      stepKey: row.step_key,
      label: row.label,
      videoUrl: row.video_url,
      posterUrl: row.poster_url,
      runRule: row.run_rule,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('[StepMedia] Error updating media:', error);
    res.status(500).json({ error: 'Failed to update media' });
  }
});

/**
 * POST /api/admin/step-media/:id/publish
 * Publish a media version (make it active for its step)
 */
router.post('/:id/publish', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the media to find its step_key
    const mediaResult = await pool.query(
      'SELECT id, step_key, label FROM step_media WHERE id = $1',
      [id]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const media = mediaResult.rows[0];

    // Upsert into step_media_active
    await pool.query(`
      INSERT INTO step_media_active (step_key, active_media_id, published_at, published_by)
      VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
      ON CONFLICT (step_key)
      DO UPDATE SET
        active_media_id = $2,
        published_at = CURRENT_TIMESTAMP,
        published_by = $3
    `, [media.step_key, id, req.user.id]);

    console.log(`[StepMedia] Published media ${id} for step ${media.step_key}`);

    res.json({
      success: true,
      stepKey: media.step_key,
      mediaId: id,
      label: media.label,
      publishedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[StepMedia] Error publishing media:', error);
    res.status(500).json({ error: 'Failed to publish media' });
  }
});

/**
 * DELETE /api/admin/step-media/:id
 * Delete a media version (cannot delete if active)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if this media is currently active
    const activeCheck = await pool.query(
      'SELECT id FROM step_media_active WHERE active_media_id = $1',
      [id]
    );

    if (activeCheck.rows.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete active media. Publish a different version first.'
      });
    }

    const result = await pool.query(
      'DELETE FROM step_media WHERE id = $1 RETURNING id, step_key, label',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    console.log(`[StepMedia] Deleted media: ${id}`);

    res.json({
      success: true,
      deleted: result.rows[0]
    });
  } catch (error) {
    console.error('[StepMedia] Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

module.exports = router;
