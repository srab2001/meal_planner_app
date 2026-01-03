/**
 * Pantry API Routes
 *
 * IMPORTANT: Uses CORE DB (Neon) NOT Render DB
 * See docs/ISOLATION.md for database isolation rules.
 *
 * Endpoints:
 * - GET /api/pantry/items - List items with view filter
 * - POST /api/pantry/items - Add new item
 * - POST /api/pantry/items/update - Update item
 * - POST /api/pantry/items/event - Record consume/waste/adjust event
 * - GET /api/pantry/events - List recent events
 */

const express = require('express');
const router = express.Router();
const { getCoreDb } = require('../src/lib/coreDb');
const {
  getUserHouseholdRole,
  canViewPantryRole,
  canEditPantryRole
} = require('../src/lib/permissions');

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate quantity is positive number
 */
function validateQuantity(quantity, fieldName = 'quantity') {
  const num = parseFloat(quantity);
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: `${fieldName} must be a positive number` };
  }
  return { valid: true, value: num };
}

/**
 * Validate quantity is non-negative
 */
function validateQuantityNonNegative(quantity, fieldName = 'quantity') {
  const num = parseFloat(quantity);
  if (isNaN(num) || num < 0) {
    return { valid: false, error: `${fieldName} must be a non-negative number` };
  }
  return { valid: true, value: num };
}

/**
 * Validate dates (expiration >= purchase if both present)
 */
function validateDates(purchaseDate, expirationDate) {
  if (purchaseDate && expirationDate) {
    const purchase = new Date(purchaseDate);
    const expiration = new Date(expirationDate);
    if (expiration < purchase) {
      return { valid: false, error: 'Expiration date must be on or after purchase date' };
    }
  }
  return { valid: true };
}

/**
 * Mask ID for logging (show last 4 chars)
 */
function maskId(id) {
  if (!id || id.length < 4) return '****';
  return '***' + id.slice(-4);
}

/**
 * Log pantry event (privacy-safe)
 */
function logPantryEvent(eventType, userId, householdId, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: eventType,
    userId: maskId(userId),
    householdId: maskId(householdId),
    ...metadata
  };
  console.log('[PANTRY_EVENT]', JSON.stringify(logEntry));
}

/**
 * Get default shelf life in days based on food category
 */
function getDefaultShelfLife(category) {
  const defaults = {
    produce: 5,
    dairy: 10,
    meat: 3,
    seafood: 2,
    bakery: 5,
    pantry: 180,
    frozen: 90,
    beverages: 30,
    snacks: 60,
    condiments: 90,
    other: 14
  };
  return defaults[category] || 14;
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Verify authentication
 */
const verifyAuth = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

/**
 * Get household ID and verify membership + set role
 */
const withHouseholdContext = async (req, res, next) => {
  const householdId = req.headers['x-household-id'] || req.query.household_id || req.body.household_id;

  if (!householdId) {
    return res.status(400).json({ error: 'household_id is required' });
  }

  // First, find the user in CORE DB by email (req.user.id is from Render DB)
  const db = getCoreDb();
  const coreUser = await db.users.findUnique({
    where: { email: req.user.email }
  });

  if (!coreUser) {
    return res.status(403).json({ error: 'User not found in CORE DB. Please set up household first.' });
  }

  const { membershipRole } = await getUserHouseholdRole({
    userId: coreUser.id,
    householdId
  });

  if (!membershipRole) {
    return res.status(403).json({ error: 'Access denied to this household' });
  }

  req.householdId = householdId;
  req.coreUserId = coreUser.id;
  req.membershipRole = membershipRole;
  next();
};

/**
 * Require view permission
 */
const requireView = (req, res, next) => {
  if (!canViewPantryRole(req.membershipRole)) {
    return res.status(403).json({ error: 'View permission required' });
  }
  next();
};

/**
 * Require edit permission
 */
const requireEdit = (req, res, next) => {
  if (!canEditPantryRole(req.membershipRole)) {
    return res.status(403).json({ error: 'Edit permission required' });
  }
  next();
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get or create household's default pantry
 */
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
// ROUTES
// ============================================================================

/**
 * GET /api/pantry/items
 *
 * Query params:
 * - view: all | exp3 | exp7 | exp14
 * - search: optional string
 *
 * Response: { items: [...], count: number }
 */
router.get('/items', verifyAuth, withHouseholdContext, requireView, async (req, res) => {
  try {
    const { view = 'all', search } = req.query;
    const db = getCoreDb();

    const pantry = await getOrCreatePantry(req.householdId);

    // Build where clause
    const where = { pantry_id: pantry.id };

    // View filter for expiring items
    if (view === 'exp3' || view === 'exp7' || view === 'exp14') {
      const days = view === 'exp3' ? 3 : view === 'exp7' ? 7 : 14;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      where.expiration_date = {
        lte: expiryDate,
        gte: new Date() // Not already expired
      };
      where.status = { notIn: ['consumed', 'wasted'] };
    }

    // Search filter
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

    // Format response to match spec
    const formattedItems = items.map(item => ({
      id: item.id,
      itemName: item.name,
      brand: item.brand,
      quantity: parseFloat(item.quantity),
      unit: item.unit,
      purchaseDate: item.purchase_date?.toISOString().split('T')[0] || null,
      expirationDate: item.expiration_date?.toISOString().split('T')[0] || null,
      notes: item.notes,
      updatedAt: item.updated_at?.toISOString() || null,
      category: item.category,
      status: item.status
    }));

    res.json({
      items: formattedItems,
      count: formattedItems.length
    });
  } catch (error) {
    console.error('Error fetching pantry items:', error);
    res.status(500).json({ error: 'Failed to fetch pantry items' });
  }
});

/**
 * POST /api/pantry/items
 *
 * Body:
 * - itemName*: string
 * - brand: string
 * - quantity*: number > 0
 * - unit: string
 * - purchaseDate: date
 * - expirationDate: date
 * - notes: string
 */
router.post('/items', verifyAuth, withHouseholdContext, requireEdit, async (req, res) => {
  try {
    const db = getCoreDb();
    const {
      itemName,
      brand,
      quantity,
      unit = 'count',
      purchaseDate,
      expirationDate,
      notes,
      category = 'pantry'
    } = req.body;

    // Validation
    if (!itemName || !itemName.trim()) {
      return res.status(400).json({ error: 'itemName is required' });
    }

    const qtyValidation = validateQuantity(quantity);
    if (!qtyValidation.valid) {
      return res.status(400).json({ error: qtyValidation.error });
    }

    const dateValidation = validateDates(purchaseDate, expirationDate);
    if (!dateValidation.valid) {
      return res.status(400).json({ error: dateValidation.error });
    }

    const pantry = await getOrCreatePantry(req.householdId);

    const item = await db.pantry_items.create({
      data: {
        pantry_id: pantry.id,
        name: itemName.trim(),
        brand: brand?.trim() || null,
        category,
        quantity: qtyValidation.value,
        unit,
        purchase_date: purchaseDate ? new Date(purchaseDate) : null,
        expiration_date: expirationDate ? new Date(expirationDate) : null,
        notes: notes?.trim() || null,
        status: 'available'
      }
    });

    // Log add event (non-blocking - item save is more important)
    try {
      await db.pantry_item_events.create({
        data: {
          pantry_item_id: item.id,
          user_id: req.coreUserId,
          event_type: 'add',
          quantity_change: qtyValidation.value,
          unit,
          notes: `Added ${qtyValidation.value} ${unit}`
        }
      });
      logPantryEvent('pantry_item_added', req.coreUserId, req.householdId, {
        itemId: maskId(item.id),
        quantity: qtyValidation.value
      });
    } catch (eventError) {
      console.error('Failed to log pantry event (non-fatal):', eventError.message);
      console.error('coreUserId:', req.coreUserId);
    }

    res.status(201).json({
      item: {
        id: item.id,
        itemName: item.name,
        brand: item.brand,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        purchaseDate: item.purchase_date?.toISOString().split('T')[0] || null,
        expirationDate: item.expiration_date?.toISOString().split('T')[0] || null,
        notes: item.notes,
        updatedAt: item.updated_at?.toISOString() || null
      }
    });
  } catch (error) {
    console.error('Error adding pantry item:', error);
    res.status(500).json({ error: 'Failed to add pantry item' });
  }
});

/**
 * POST /api/pantry/items/update
 *
 * Body:
 * - pantryItemId*: string
 * - quantity*: number >= 0
 * - unit: string
 * - notes: string
 */
router.post('/items/update', verifyAuth, withHouseholdContext, requireEdit, async (req, res) => {
  try {
    const db = getCoreDb();
    const { pantryItemId, quantity, unit, notes } = req.body;

    if (!pantryItemId) {
      return res.status(400).json({ error: 'pantryItemId is required' });
    }

    const qtyValidation = validateQuantityNonNegative(quantity);
    if (!qtyValidation.valid) {
      return res.status(400).json({ error: qtyValidation.error });
    }

    // Get current item and verify ownership
    const item = await db.pantry_items.findUnique({
      where: { id: pantryItemId },
      include: { pantry: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.pantry.household_id !== req.householdId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const oldQuantity = parseFloat(item.quantity);
    const quantityChange = qtyValidation.value - oldQuantity;

    // Determine new status
    let newStatus = item.status;
    if (qtyValidation.value === 0) {
      newStatus = 'consumed';
    } else if (qtyValidation.value < 1) {
      newStatus = 'low';
    } else {
      newStatus = 'available';
    }

    // Update item
    const updated = await db.pantry_items.update({
      where: { id: pantryItemId },
      data: {
        quantity: qtyValidation.value,
        unit: unit || item.unit,
        notes: notes !== undefined ? notes : item.notes,
        status: newStatus
      }
    });

    // Log adjust event (non-blocking)
    try {
      await db.pantry_item_events.create({
        data: {
          pantry_item_id: pantryItemId,
          user_id: req.coreUserId,
          event_type: 'adjust',
          quantity_change: quantityChange,
          unit: unit || item.unit,
          notes: notes || `Adjusted from ${oldQuantity} to ${qtyValidation.value}`
        }
      });
      logPantryEvent('pantry_item_adjusted', req.coreUserId, req.householdId, {
        itemId: maskId(pantryItemId),
        oldQuantity,
        newQuantity: qtyValidation.value
      });
    } catch (eventError) {
      console.error('Failed to log adjust event (non-fatal):', eventError.message);
    }

    res.json({
      item: {
        id: updated.id,
        itemName: updated.name,
        quantity: parseFloat(updated.quantity),
        unit: updated.unit,
        notes: updated.notes,
        status: updated.status,
        updatedAt: updated.updated_at?.toISOString() || null
      }
    });
  } catch (error) {
    console.error('Error updating pantry item:', error);
    res.status(500).json({ error: 'Failed to update pantry item' });
  }
});

/**
 * POST /api/pantry/items/event
 *
 * Body:
 * - pantryItemId*: string
 * - eventType*: consume | waste | adjust
 * - amount*: number > 0
 * - unit: string
 * - relatedPlanItemId: string (optional)
 * - notes: string
 */
router.post('/items/event', verifyAuth, withHouseholdContext, requireEdit, async (req, res) => {
  try {
    const db = getCoreDb();
    const {
      pantryItemId,
      eventType,
      amount,
      unit,
      relatedPlanItemId,
      notes
    } = req.body;

    // Validation
    if (!pantryItemId) {
      return res.status(400).json({ error: 'pantryItemId is required' });
    }

    if (!eventType || !['consume', 'waste', 'adjust'].includes(eventType)) {
      return res.status(400).json({ error: 'eventType must be consume, waste, or adjust' });
    }

    const amtValidation = validateQuantity(amount, 'amount');
    if (!amtValidation.valid) {
      return res.status(400).json({ error: amtValidation.error });
    }

    // Get current item and verify ownership
    const item = await db.pantry_items.findUnique({
      where: { id: pantryItemId },
      include: { pantry: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.pantry.household_id !== req.householdId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // For consume/waste, decrease quantity (floor at 0)
    let quantityChange = amtValidation.value;
    let newQuantity = parseFloat(item.quantity);

    if (eventType === 'consume' || eventType === 'waste') {
      quantityChange = -amtValidation.value;
      newQuantity = Math.max(0, newQuantity - amtValidation.value);
    } else if (eventType === 'adjust') {
      // For adjust, amount is the new quantity
      quantityChange = amtValidation.value - parseFloat(item.quantity);
      newQuantity = amtValidation.value;
    }

    // Determine new status
    let newStatus = item.status;
    if (newQuantity === 0) {
      newStatus = eventType === 'waste' ? 'wasted' : 'consumed';
    } else if (newQuantity < 1) {
      newStatus = 'low';
    } else {
      newStatus = 'available';
    }

    // Update item quantity
    const updated = await db.pantry_items.update({
      where: { id: pantryItemId },
      data: {
        quantity: newQuantity,
        status: newStatus
      }
    });

    // Create event record (non-blocking)
    let event = null;
    try {
      event = await db.pantry_item_events.create({
        data: {
          pantry_item_id: pantryItemId,
          user_id: req.coreUserId,
          event_type: eventType,
          quantity_change: quantityChange,
          unit: unit || item.unit,
          notes,
          related_plan_item_id: relatedPlanItemId || null
        }
      });
      const logEventType = eventType === 'consume' ? 'pantry_item_consumed' :
                           eventType === 'waste' ? 'pantry_item_wasted' :
                           'pantry_item_adjusted';
      logPantryEvent(logEventType, req.coreUserId, req.householdId, {
        itemId: maskId(pantryItemId),
        amount: amtValidation.value,
        newQuantity
      });
    } catch (eventError) {
      console.error('Failed to log consume/waste event (non-fatal):', eventError.message);
    }

    res.status(201).json({
      event: event ? {
        id: event.id,
        eventType: event.event_type,
        quantityChange: parseFloat(event.quantity_change || 0),
        createdAt: event.created_at?.toISOString() || null
      } : null,
      item: {
        id: updated.id,
        itemName: updated.name,
        quantity: parseFloat(updated.quantity),
        status: updated.status,
        updatedAt: updated.updated_at?.toISOString() || null
      }
    });
  } catch (error) {
    console.error('Error recording pantry event:', error);
    res.status(500).json({ error: 'Failed to record event' });
  }
});

/**
 * GET /api/pantry/events
 *
 * Query params:
 * - limit: number (default 50)
 *
 * Response: { events: [...] }
 */
router.get('/events', verifyAuth, withHouseholdContext, requireView, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const db = getCoreDb();

    const pantry = await getOrCreatePantry(req.householdId);

    // Get events for items in this pantry (join within CORE DB is allowed)
    const events = await db.pantry_item_events.findMany({
      where: {
        pantry_item: {
          pantry_id: pantry.id
        }
      },
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

    const formattedEvents = events.map(e => ({
      id: e.id,
      itemId: e.pantry_item_id,
      itemName: e.pantry_item?.name || 'Unknown',
      eventType: e.event_type,
      quantityChange: e.quantity_change ? parseFloat(e.quantity_change) : 0,
      unit: e.unit,
      notes: e.notes,
      createdBy: e.user?.display_name || e.user?.email || 'Unknown',
      createdAt: e.created_at?.toISOString() || null
    }));

    res.json({
      events: formattedEvents
    });
  } catch (error) {
    console.error('Error fetching pantry events:', error);
    res.status(500).json({ error: 'Failed to fetch pantry events' });
  }
});

/**
 * POST /api/pantry/analyze-photo
 *
 * Analyze a photo using OpenAI Vision to identify food items
 *
 * Body:
 * - image*: base64 encoded image data (with or without data URL prefix)
 *
 * Response: { items: [{ name, quantity, unit, category, confidence }] }
 */
router.post('/analyze-photo', verifyAuth, withHouseholdContext, requireEdit, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Get OpenAI instance from app
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Clean up image data - handle both raw base64 and data URL format
    let imageData = image;
    if (!image.startsWith('data:')) {
      imageData = `data:image/jpeg;base64,${image}`;
    }

    console.log('[PANTRY] Analyzing photo for food items...');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert food inventory assistant with keen attention to detail. Analyze the image CLOSELY and identify all visible food items with SPECIFIC names.

IMPORTANT: Be as SPECIFIC as possible when naming items:
- Read labels, packaging, and brand names carefully
- Use specific variety names (e.g., "Cheese Ravioli" not just "Pasta", "Fuji Apples" not just "Apples")
- Include brand names when clearly visible (e.g., "Barilla Spaghetti", "Kraft Mac & Cheese")
- Distinguish between similar items (e.g., "2% Milk" vs "Whole Milk", "Cheddar Cheese" vs "Mozzarella")
- For produce, identify the specific type (e.g., "Roma Tomatoes", "Russet Potatoes", "Green Seedless Grapes")

For each item, provide:
- name: The SPECIFIC item name with variety/brand when visible (e.g., "Barilla Cheese Ravioli", "Organic Fuji Apples", "Chobani Greek Yogurt")
- quantity: Estimated quantity as a number (e.g., 1, 6, 12)
- unit: The unit type (count, lbs, oz, gallon, dozen, box, bag, can, bottle, jar, pack)
- category: One of: dairy, produce, meat, seafood, bakery, pantry, frozen, beverages, snacks, condiments, other
- confidence: Your confidence level (high, medium, low)
- shelfLifeDays: Estimated days until expiration based on typical shelf life for this food type:
  * Fresh produce: 3-7 days
  * Dairy (milk, yogurt): 7-14 days
  * Cheese: 14-30 days
  * Fresh meat/seafood: 2-5 days
  * Deli meats: 5-7 days
  * Bread/bakery: 5-7 days
  * Eggs: 21-35 days
  * Pantry items (canned, dried): 180-365 days
  * Frozen foods: 90-180 days
  * Condiments: 60-180 days

Return ONLY a JSON array of items. If no food items are visible, return an empty array [].
Example: [{"name":"Barilla Cheese Ravioli","quantity":1,"unit":"box","category":"pantry","confidence":"high","shelfLifeDays":365},{"name":"Organic Fuji Apples","quantity":6,"unit":"count","category":"produce","confidence":"high","shelfLifeDays":7}]`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Look closely at this image and identify all food items with SPECIFIC names. Read any visible labels, brands, and varieties. Include estimated shelf life in days for each item. Return as JSON array only.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageData,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.2
    });

    const content = response.choices[0]?.message?.content || '[]';

    // Parse the JSON response
    let items = [];
    try {
      // Handle possible markdown code blocks in response
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }
      items = JSON.parse(jsonStr);

      // Validate and clean items, calculate dates
      const today = new Date();
      const purchaseDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

      items = items.filter(item => item.name && item.quantity).map(item => {
        // Get shelf life or use category-based defaults
        let shelfLifeDays = parseInt(item.shelfLifeDays) || getDefaultShelfLife(item.category);

        // Calculate expiration date
        const expirationDate = new Date(today);
        expirationDate.setDate(expirationDate.getDate() + shelfLifeDays);

        return {
          name: String(item.name).trim(),
          quantity: parseFloat(item.quantity) || 1,
          unit: item.unit || 'count',
          category: item.category || 'pantry',
          confidence: item.confidence || 'medium',
          shelfLifeDays,
          purchaseDate,
          expirationDate: expirationDate.toISOString().split('T')[0]
        };
      });
    } catch (parseError) {
      console.error('[PANTRY] Failed to parse AI response:', content);
      return res.status(500).json({ error: 'Failed to parse food items from image' });
    }

    console.log(`[PANTRY] Identified ${items.length} food items from photo`);

    res.json({ items });
  } catch (error) {
    console.error('Error analyzing photo:', error);
    if (error.code === 'invalid_api_key') {
      return res.status(500).json({ error: 'Invalid OpenAI API key' });
    }
    res.status(500).json({ error: 'Failed to analyze photo' });
  }
});

module.exports = router;
