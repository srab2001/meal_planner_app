/**
 * Pantry API Routes
 *
 * IMPORTANT: Uses CORE DB (Neon) NOT Render DB
 * See docs/ISOLATION.md for database isolation rules.
 *
 * Endpoints for food inventory management:
 * - Items: CRUD operations for pantry items
 * - Events: Track consumption, waste, and adjustments
 * - Reports: Expiration alerts and waste tracking
 */

const express = require('express');
const router = express.Router();
const { getCoreDb, getHouseholdContext } = require('../src/lib/coreDb');

// Middleware to verify authentication
const verifyAuth = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Middleware to verify household access (RBAC)
const verifyHouseholdAccess = async (req, res, next) => {
  const householdId = req.headers['x-household-id'] || req.query.household_id || req.body.household_id;

  if (!householdId) {
    return res.status(400).json({ error: 'household_id is required' });
  }

  const db = getCoreDb();
  const membership = await db.household_memberships.findFirst({
    where: {
      user_id: req.user.id,
      household_id: householdId,
      is_active: true
    }
  });

  if (!membership) {
    return res.status(403).json({ error: 'Access denied to this household' });
  }

  req.householdId = householdId;
  req.householdRole = membership.role;
  next();
};

// Get or create household's pantry
const getOrCreatePantry = async (householdId) => {
  const db = getCoreDb();

  let pantry = await db.pantries.findFirst({
    where: { household_id: householdId }
  });

  if (!pantry) {
    pantry = await db.pantries.create({
      data: {
        household_id: householdId,
        name: 'Main Pantry'
      }
    });
  }

  return pantry;
};

// ============================================================================
// ITEMS ENDPOINTS
// ============================================================================

/**
 * GET /api/core/pantry/items
 * List all pantry items with optional filters
 * Query params: household_id, category, status, expiring_within (days), search
 */
router.get('/items', verifyAuth, verifyHouseholdAccess, async (req, res) => {
  try {
    const { category, status, expiring_within, search } = req.query;
    const db = getCoreDb();

    const pantry = await getOrCreatePantry(req.householdId);

    // Build where clause
    const where = { pantry_id: pantry.id };

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (expiring_within) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiring_within));
      where.expiration_date = {
        lte: expiryDate,
        not: null
      };
      where.status = { not: 'expired' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    const items = await db.pantry_items.findMany({
      where,
      orderBy: [
        { expiration_date: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      items,
      count: items.length,
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
router.post('/items', verifyAuth, verifyHouseholdAccess, async (req, res) => {
  try {
    // Check write permissions
    if (!['owner', 'admin', 'member'].includes(req.householdRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const db = getCoreDb();
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

    const pantry = await getOrCreatePantry(req.householdId);

    const item = await db.pantry_items.create({
      data: {
        pantry_id: pantry.id,
        name,
        brand,
        category,
        quantity: parseFloat(quantity),
        unit,
        purchase_date: purchase_date ? new Date(purchase_date) : null,
        expiration_date: expiration_date ? new Date(expiration_date) : null,
        notes,
        barcode,
        status: 'available'
      }
    });

    // Log the add event
    await db.pantry_item_events.create({
      data: {
        pantry_item_id: item.id,
        user_id: req.user.id,
        event_type: 'add',
        quantity_change: parseFloat(quantity),
        unit,
        notes: `Added ${quantity} ${unit} of ${name}`
      }
    });

    res.status(201).json({ item });
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
    const db = getCoreDb();

    const item = await db.pantry_items.findUnique({
      where: { id },
      include: {
        pantry: true,
        events: {
          orderBy: { created_at: 'desc' },
          take: 10
        }
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Verify household access
    const membership = await db.household_memberships.findFirst({
      where: {
        user_id: req.user.id,
        household_id: item.pantry.household_id,
        is_active: true
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ item });
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
    const db = getCoreDb();

    // Get current item
    const current = await db.pantry_items.findUnique({
      where: { id },
      include: { pantry: true }
    });

    if (!current) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Verify household access
    const membership = await db.household_memberships.findFirst({
      where: {
        user_id: req.user.id,
        household_id: current.pantry.household_id,
        is_active: true
      }
    });

    if (!membership || !['owner', 'admin', 'member'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const {
      name,
      brand,
      category,
      quantity,
      unit,
      purchase_date,
      expiration_date,
      status,
      notes,
      barcode
    } = req.body;

    // Build update data (only include provided fields)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (brand !== undefined) updateData.brand = brand;
    if (category !== undefined) updateData.category = category;
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
    if (unit !== undefined) updateData.unit = unit;
    if (purchase_date !== undefined) updateData.purchase_date = purchase_date ? new Date(purchase_date) : null;
    if (expiration_date !== undefined) updateData.expiration_date = expiration_date ? new Date(expiration_date) : null;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (barcode !== undefined) updateData.barcode = barcode;

    const item = await db.pantry_items.update({
      where: { id },
      data: updateData
    });

    // Log adjustment event if quantity changed
    if (quantity !== undefined && parseFloat(quantity) !== parseFloat(current.quantity)) {
      const quantityChange = parseFloat(quantity) - parseFloat(current.quantity);
      await db.pantry_item_events.create({
        data: {
          pantry_item_id: id,
          user_id: req.user.id,
          event_type: 'adjust',
          quantity_change: quantityChange,
          unit: current.unit,
          notes: `Adjusted from ${current.quantity} to ${quantity}`
        }
      });
    }

    res.json({ item });
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
    const db = getCoreDb();

    // Get item for verification and event logging
    const item = await db.pantry_items.findUnique({
      where: { id },
      include: { pantry: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Verify household access
    const membership = await db.household_memberships.findFirst({
      where: {
        user_id: req.user.id,
        household_id: item.pantry.household_id,
        is_active: true
      }
    });

    if (!membership || !['owner', 'admin', 'member'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Delete item (cascades to events via Prisma schema)
    await db.pantry_items.delete({
      where: { id }
    });

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
router.get('/events', verifyAuth, verifyHouseholdAccess, async (req, res) => {
  try {
    const { event_type, limit = 50 } = req.query;
    const db = getCoreDb();

    const pantry = await getOrCreatePantry(req.householdId);

    // Get all item IDs for this pantry
    const pantryItems = await db.pantry_items.findMany({
      where: { pantry_id: pantry.id },
      select: { id: true }
    });
    const itemIds = pantryItems.map(i => i.id);

    // Build where clause
    const where = {
      pantry_item_id: { in: itemIds }
    };

    if (event_type) {
      where.event_type = event_type;
    }

    const events = await db.pantry_item_events.findMany({
      where,
      include: {
        pantry_item: {
          select: { name: true, category: true }
        },
        user: {
          select: { display_name: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit)
    });

    // Format for frontend compatibility
    const formattedEvents = events.map(e => ({
      id: e.id,
      item_id: e.pantry_item_id,
      item_name: e.pantry_item?.name || 'Unknown',
      event_type: e.event_type,
      quantity_change: e.quantity_change ? parseFloat(e.quantity_change) : 0,
      unit: e.unit,
      notes: e.notes,
      created_by_name: e.user?.display_name || e.user?.email,
      created_at: e.created_at
    }));

    res.json({
      events: formattedEvents,
      count: formattedEvents.length
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
    const db = getCoreDb();

    const {
      event_type, // consume, waste, adjust
      quantity_change,
      notes,
      related_plan_item_id
    } = req.body;

    // Normalize event type (support legacy names)
    const normalizedType = event_type === 'consumed' ? 'consume' :
                          event_type === 'wasted' ? 'waste' :
                          event_type === 'adjusted' ? 'adjust' :
                          event_type;

    if (!normalizedType || !['consume', 'waste', 'adjust', 'add'].includes(normalizedType)) {
      return res.status(400).json({ error: 'Valid event_type is required (consume, waste, adjust, add)' });
    }

    // Get current item
    const item = await db.pantry_items.findUnique({
      where: { id },
      include: { pantry: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Verify household access
    const membership = await db.household_memberships.findFirst({
      where: {
        user_id: req.user.id,
        household_id: item.pantry.household_id,
        is_active: true
      }
    });

    if (!membership || !['owner', 'admin', 'member'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Calculate new quantity
    const change = parseFloat(quantity_change) || 0;
    const newQuantity = Math.max(0, parseFloat(item.quantity) + change);

    // Determine new status
    let newStatus = item.status;
    if (newQuantity === 0) {
      newStatus = normalizedType === 'waste' ? 'wasted' : 'consumed';
    } else if (newQuantity < 1) {
      newStatus = 'low';
    } else {
      newStatus = 'available';
    }

    // Update item quantity
    await db.pantry_items.update({
      where: { id },
      data: {
        quantity: newQuantity,
        status: newStatus
      }
    });

    // Log the event
    const event = await db.pantry_item_events.create({
      data: {
        pantry_item_id: id,
        user_id: req.user.id,
        event_type: normalizedType,
        quantity_change: change,
        unit: item.unit,
        notes,
        related_plan_item_id
      }
    });

    res.status(201).json({
      event: {
        id: event.id,
        item_id: id,
        item_name: item.name,
        event_type: event.event_type,
        quantity_change: change,
        created_at: event.created_at
      },
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
router.get('/reports/expiring', verifyAuth, verifyHouseholdAccess, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const db = getCoreDb();

    const pantry = await getOrCreatePantry(req.householdId);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    const items = await db.pantry_items.findMany({
      where: {
        pantry_id: pantry.id,
        status: 'available',
        expiration_date: {
          lte: expiryDate,
          not: null
        }
      },
      orderBy: { expiration_date: 'asc' }
    });

    res.json({
      items,
      count: items.length,
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
router.get('/reports/waste', verifyAuth, verifyHouseholdAccess, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const db = getCoreDb();

    const pantry = await getOrCreatePantry(req.householdId);

    // Get all item IDs for this pantry
    const pantryItems = await db.pantry_items.findMany({
      where: { pantry_id: pantry.id },
      select: { id: true }
    });
    const itemIds = pantryItems.map(i => i.id);

    // Build where clause for waste events
    const where = {
      pantry_item_id: { in: itemIds },
      event_type: 'waste'
    };

    if (start_date) {
      where.created_at = { ...where.created_at, gte: new Date(start_date) };
    }
    if (end_date) {
      where.created_at = { ...where.created_at, lte: new Date(end_date) };
    }

    const wasteEvents = await db.pantry_item_events.findMany({
      where,
      include: {
        pantry_item: {
          select: { name: true, category: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Calculate totals
    const totalEvents = wasteEvents.length;
    const totalWasted = wasteEvents.reduce((sum, e) =>
      sum + Math.abs(parseFloat(e.quantity_change) || 0), 0
    );

    // Group by date for breakdown
    const breakdown = {};
    wasteEvents.forEach(e => {
      const date = e.created_at.toISOString().split('T')[0];
      if (!breakdown[date]) {
        breakdown[date] = { date, events: 0, quantity: 0 };
      }
      breakdown[date].events++;
      breakdown[date].quantity += Math.abs(parseFloat(e.quantity_change) || 0);
    });

    res.json({
      breakdown: Object.values(breakdown),
      totals: {
        total_events: totalEvents,
        total_wasted: totalWasted
      }
    });
  } catch (error) {
    console.error('Error fetching waste report:', error);
    res.status(500).json({ error: 'Failed to fetch waste report' });
  }
});

module.exports = router;
