/**
 * Step Media Public Routes
 *
 * Public endpoints for fetching active step media
 * Used by the meal planning flow to display videos/posters
 *
 * Endpoints:
 * - GET /api/step-media/active/:stepKey - Get active media for a step
 * - GET /api/step-media/active - Get all active media
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
 * GET /api/step-media/active/:stepKey
 * Get active media for a specific step
 */
router.get('/active/:stepKey', async (req, res) => {
  try {
    const { stepKey } = req.params;

    // Validate step key
    if (!VALID_STEP_KEYS.includes(stepKey)) {
      return res.status(400).json({
        error: `Invalid stepKey. Must be one of: ${VALID_STEP_KEYS.join(', ')}`
      });
    }

    const result = await pool.query(`
      SELECT
        sm.id,
        sm.step_key,
        sm.video_url,
        sm.poster_url,
        sm.run_rule,
        sma.published_at
      FROM step_media_active sma
      JOIN step_media sm ON sm.id = sma.active_media_id
      WHERE sma.step_key = $1
    `, [stepKey]);

    if (result.rows.length === 0) {
      // No active media for this step - return null (not an error)
      return res.json({
        stepKey,
        media: null
      });
    }

    const row = result.rows[0];
    res.json({
      stepKey: row.step_key,
      media: {
        id: row.id,
        videoUrl: row.video_url,
        posterUrl: row.poster_url,
        runRule: row.run_rule,
        publishedAt: row.published_at
      }
    });
  } catch (error) {
    console.error('[StepMedia] Error fetching active media:', error);
    res.status(500).json({ error: 'Failed to fetch step media' });
  }
});

/**
 * GET /api/step-media/active
 * Get all active media (one per step that has media)
 */
router.get('/active', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        sm.id,
        sm.step_key,
        sm.video_url,
        sm.poster_url,
        sm.run_rule,
        sma.published_at
      FROM step_media_active sma
      JOIN step_media sm ON sm.id = sma.active_media_id
      ORDER BY sm.step_key
    `);

    // Build a map of stepKey -> media
    const mediaMap = {};
    result.rows.forEach(row => {
      mediaMap[row.step_key] = {
        id: row.id,
        videoUrl: row.video_url,
        posterUrl: row.poster_url,
        runRule: row.run_rule,
        publishedAt: row.published_at
      };
    });

    res.json({
      stepKeys: VALID_STEP_KEYS,
      media: mediaMap
    });
  } catch (error) {
    console.error('[StepMedia] Error fetching all active media:', error);
    res.status(500).json({ error: 'Failed to fetch step media' });
  }
});

module.exports = router;
