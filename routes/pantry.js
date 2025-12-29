/**
 * Pantry API Routes
 *
 * Endpoints for food inventory management:
 * - Items: CRUD operations for pantry items
 * - Events: Track consumption, waste, and adjustments
 * - Reports: Expiration alerts and waste tracking
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Middleware to verify authentication
const verifyAuth = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Get or create household's pantry
const getOrCreatePantry = async (householdId) => {
  let result = await pool.query(
    'SELECT * FROM pantries WHERE household_id = $1',
    [householdId]
  );

  if (result.rows.length === 0) {
    result = await pool.query(
      'INSERT INTO pantries (household_id) VALUES ($1) RETURNING *',
      [householdId]
    );
  }

  return result.rows[0];
};

// ============================================================================
// ITEMS ENDPOINTS
// ============================================================================

/**
 * GET /api/core/pantry/items
 * List all pantry items with optional filters
 * Query params: household_id, category, status, expiring_within (days), search
 */
router.get('/items', verifyAuth, async (req, res) => {
  try {
    const { household_id, category, status, expiring_within, search } = req.query;

    if (!household_id) {
      return res.status(400).json({ error: 'household_id is required' });
    }

    const pantry = await getOrCreatePantry(household_id);

    let query = `
      SELECT * FROM pantry_items
      WHERE pantry_id = $1
    `;
    const params = [pantry.id];
    let paramIndex = 2;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (expiring_within) {
      query += ` AND expiration_date IS NOT NULL AND expiration_date <= CURRENT_DATE + INTERVAL '${parseInt(expiring_within)} days' AND status = 'active'`;
    }

    if (search) {
      query += ` AND (LOWER(name) LIKE $${paramIndex} OR LOWER(brand) LIKE $${paramIndex})`;
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    query += ' ORDER BY expiration_date ASC NULLS LAST, name ASC';

    const result = await pool.query(query, params);

    res.json({
      items: result.rows,
      count: result.rows.length,
      pantry_id: pantry.id
    });
  } catch (error) {
    console.error('Error fetching pantry items:', error);
    res.status(500).json({ error: 'Failed to fetch pantry items' });
  }
});

/**
 * POST /api/core/pantry/items
 * Add a new item to the pantry
 */
router.post('/items', verifyAuth, async (req, res) => {
  try {
    const householdId = req.headers['x-household-id'] || req.body.household_id;

    if (!householdId) {
      return res.status(400).json({ error: 'household_id is required' });
    }

    const {
      name,
      brand,
      category = 'pantry',
      quantity = 1,
      unit = 'count',
      purchase_date,
      expiration_date,
      notes,
      barcode
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const pantry = await getOrCreatePantry(householdId);

    const result = await pool.query(
      `INSERT INTO pantry_items
       (pantry_id, name, brand, category, quantity, unit, purchase_date, expiration_date, notes, barcode, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [pantry.id, name, brand, category, quantity, unit, purchase_date || null, expiration_date || null, notes, barcode, req.user.id]
    );

    // Log the add event
    await pool.query(
      `INSERT INTO pantry_events (pantry_id, item_id, item_name, event_type, quantity_change, unit, created_by)
       VALUES ($1, $2, $3, 'added', $4, $5, $6)`,
      [pantry.id, result.rows[0].id, name, quantity, unit, req.user.id]
    );

    res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    console.error('Error adding pantry item:', error);
    res.status(500).json({ error: 'Failed to add pantry item' });
  }
});

/**
 * GET /api/core/pantry/items/:id
 * Get a single pantry item
 */
router.get('/items/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM pantry_items WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Error fetching pantry item:', error);
    res.status(500).json({ error: 'Failed to fetch pantry item' });
  }
});

/**
 * PUT /api/core/pantry/items/:id
 * Update a pantry item (adjust quantity, expiration, etc.)
 */
router.put('/items/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      brand,
      category,
      quantity,
      unit,
      purchase_date,
      expiration_date,
      status,
      notes
    } = req.body;

    // Get current item for event logging
    const current = await pool.query('SELECT * FROM pantry_items WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const oldItem = current.rows[0];

    const result = await pool.query(
      `UPDATE pantry_items SET
        name = COALESCE($1, name),
        brand = COALESCE($2, brand),
        category = COALESCE($3, category),
        quantity = COALESCE($4, quantity),
        unit = COALESCE($5, unit),
        purchase_date = COALESCE($6, purchase_date),
        expiration_date = COALESCE($7, expiration_date),
        status = COALESCE($8, status),
        notes = COALESCE($9, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [name, brand, category, quantity, unit, purchase_date, expiration_date, status, notes, id]
    );

    // Log adjustment event if quantity changed
    if (quantity !== undefined && quantity !== oldItem.quantity) {
      const quantityChange = quantity - parseFloat(oldItem.quantity);
      await pool.query(
        `INSERT INTO pantry_events (pantry_id, item_id, item_name, event_type, quantity_change, unit, notes, created_by)
         VALUES ($1, $2, $3, 'adjusted', $4, $5, $6, $7)`,
        [oldItem.pantry_id, id, oldItem.name, quantityChange, oldItem.unit, `Adjusted from ${oldItem.quantity} to ${quantity}`, req.user.id]
      );
    }

    res.json({ item: result.rows[0] });
  } catch (error) {
    console.error('Error updating pantry item:', error);
    res.status(500).json({ error: 'Failed to update pantry item' });
  }
});

/**
 * DELETE /api/core/pantry/items/:id
 * Remove an item from the pantry
 */
router.delete('/items/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get item for event logging
    const current = await pool.query('SELECT * FROM pantry_items WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const item = current.rows[0];

    // Log removal event
    await pool.query(
      `INSERT INTO pantry_events (pantry_id, item_id, item_name, event_type, quantity_change, unit, created_by)
       VALUES ($1, $2, $3, 'removed', $4, $5, $6)`,
      [item.pantry_id, id, item.name, -parseFloat(item.quantity), item.unit, req.user.id]
    );

    await pool.query('DELETE FROM pantry_items WHERE id = $1', [id]);

    res.json({ success: true, message: 'Item removed' });
  } catch (error) {
    console.error('Error deleting pantry item:', error);
    res.status(500).json({ error: 'Failed to delete pantry item' });
  }
});

// ============================================================================
// EVENTS ENDPOINTS
// ============================================================================

/**
 * GET /api/core/pantry/events
 * Get pantry events (consumption, waste, adjustments)
 * Query params: household_id, event_type, limit
 */
router.get('/events', verifyAuth, async (req, res) => {
  try {
    const { household_id, event_type, limit = 50 } = req.query;

    if (!household_id) {
      return res.status(400).json({ error: 'household_id is required' });
    }

    const pantry = await getOrCreatePantry(household_id);

    let query = `
      SELECT e.*, u.name as created_by_name, u.email as created_by_email
      FROM pantry_events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.pantry_id = $1
    `;
    const params = [pantry.id];
    let paramIndex = 2;

    if (event_type) {
      query += ` AND e.event_type = $${paramIndex}`;
      params.push(event_type);
      paramIndex++;
    }

    query += ` ORDER BY e.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      events: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching pantry events:', error);
    res.status(500).json({ error: 'Failed to fetch pantry events' });
  }
});

/**
 * POST /api/core/pantry/items/:id/events
 * Record a consumption, waste, or adjustment event
 */
router.post('/items/:id/events', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const householdId = req.headers['x-household-id'];
    const {
      event_type, // consumed, wasted, adjusted
      quantity_change,
      reason,
      notes
    } = req.body;

    if (!event_type || !['consumed', 'wasted', 'adjusted'].includes(event_type)) {
      return res.status(400).json({ error: 'Valid event_type is required (consumed, wasted, adjusted)' });
    }

    // Get current item
    const current = await pool.query('SELECT * FROM pantry_items WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const item = current.rows[0];

    // Calculate new quantity
    const change = parseFloat(quantity_change) || 0;
    const newQuantity = Math.max(0, parseFloat(item.quantity) + change);

    // Update item quantity
    let newStatus = item.status;
    if (newQuantity === 0) {
      newStatus = event_type === 'wasted' ? 'wasted' : 'consumed';
    } else if (newQuantity < 1) {
      newStatus = 'low';
    } else {
      newStatus = 'active';
    }

    await pool.query(
      `UPDATE pantry_items SET quantity = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [newQuantity, newStatus, id]
    );

    // Log the event
    const eventResult = await pool.query(
      `INSERT INTO pantry_events (pantry_id, item_id, item_name, event_type, quantity_change, unit, reason, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [item.pantry_id, id, item.name, event_type, change, item.unit, reason, notes, req.user.id]
    );

    res.status(201).json({
      event: eventResult.rows[0],
      item: {
        id: item.id,
        name: item.name,
        quantity: newQuantity,
        status: newStatus
      }
    });
  } catch (error) {
    console.error('Error recording pantry event:', error);
    res.status(500).json({ error: 'Failed to record event' });
  }
});

// ============================================================================
// REPORTS ENDPOINTS
// ============================================================================

/**
 * GET /api/core/pantry/reports/expiring
 * Get items expiring within specified days
 */
router.get('/reports/expiring', verifyAuth, async (req, res) => {
  try {
    const { household_id, days = 7 } = req.query;

    if (!household_id) {
      return res.status(400).json({ error: 'household_id is required' });
    }

    const pantry = await getOrCreatePantry(household_id);

    const result = await pool.query(
      `SELECT * FROM pantry_items
       WHERE pantry_id = $1
         AND status = 'active'
         AND expiration_date IS NOT NULL
         AND expiration_date <= CURRENT_DATE + INTERVAL '${parseInt(days)} days'
       ORDER BY expiration_date ASC`,
      [pantry.id]
    );

    res.json({
      items: result.rows,
      count: result.rows.length,
      days: parseInt(days)
    });
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    res.status(500).json({ error: 'Failed to fetch expiring items' });
  }
});

/**
 * GET /api/core/pantry/reports/waste
 * Get waste statistics
 */
router.get('/reports/waste', verifyAuth, async (req, res) => {
  try {
    const { household_id, start_date, end_date } = req.query;

    if (!household_id) {
      return res.status(400).json({ error: 'household_id is required' });
    }

    const pantry = await getOrCreatePantry(household_id);

    let query = `
      SELECT
        COUNT(*) as waste_events,
        SUM(ABS(quantity_change)) as total_quantity_wasted,
        reason,
        DATE_TRUNC('day', created_at) as date
      FROM pantry_events
      WHERE pantry_id = $1 AND event_type = 'wasted'
    `;
    const params = [pantry.id];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ' GROUP BY reason, DATE_TRUNC(\'day\', created_at) ORDER BY date DESC';

    const result = await pool.query(query, params);

    // Get total waste count
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total_events, SUM(ABS(quantity_change)) as total_wasted
       FROM pantry_events WHERE pantry_id = $1 AND event_type = 'wasted'`,
      [pantry.id]
    );

    res.json({
      breakdown: result.rows,
      totals: totalResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching waste report:', error);
    res.status(500).json({ error: 'Failed to fetch waste report' });
  }
});

module.exports = router;
