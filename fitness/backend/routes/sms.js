/**
 * Workout SMS Routes
 *
 * Endpoints for "Text me my workout" feature:
 * - POST /api/fitness/sms/phone - Save/update user phone
 * - GET /api/fitness/sms/phone - Get user phone
 * - POST /api/fitness/sms/send/:workoutId - Send workout link via SMS
 * - GET /api/fitness/workout/check-off/:token - Get workout items (public)
 * - POST /api/fitness/workout/check-off/:token - Toggle item completion (public)
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const {
  generateShareToken,
  validateShareToken,
  getShareUrl,
  TOKEN_EXPIRY_HOURS
} = require('../lib/workoutToken');

const {
  sendWorkoutLinkSms,
  formatPhoneNumber,
  isValidPhoneNumber,
  checkRateLimit
} = require('../lib/sms');

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'your-secret-key';

// Lazy-initialize Prisma client
let prismaClient = null;

function getDb() {
  if (!prismaClient) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }

    prismaClient = new PrismaClient({
      datasources: { db: { url: dbUrl } },
      log: ['warn', 'error']
    });
  }
  return prismaClient;
}

/**
 * Verify JWT Token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Authentication Middleware
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'not_authenticated', message: 'No authentication token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'invalid_token', message: 'Invalid or expired authentication token' });
  }

  req.user = decoded;
  next();
}

// ============================================================================
// PHONE NUMBER MANAGEMENT
// ============================================================================

/**
 * GET /api/fitness/sms/phone
 * Get user's saved phone number
 */
router.get('/phone', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const userPhone = await getDb().user_phones.findUnique({
      where: { user_id: userId }
    });

    if (!userPhone) {
      return res.json({ phone: null, verified: false });
    }

    // Mask phone number for security (show last 4 digits)
    const masked = userPhone.phone_number.slice(0, -4).replace(/\d/g, '*') +
      userPhone.phone_number.slice(-4);

    res.json({
      phone: masked,
      verified: userPhone.is_verified,
      verifiedAt: userPhone.verified_at
    });
  } catch (err) {
    console.error('[SMS] Failed to get phone:', err.message);
    res.status(500).json({ error: 'Failed to get phone number' });
  }
});

/**
 * POST /api/fitness/sms/phone
 * Save or update user's phone number
 *
 * Body: { phone: string }
 */
router.post('/phone', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    // Format and validate phone number
    const formatted = formatPhoneNumber(phone);
    if (!formatted) {
      return res.status(400).json({
        error: 'Invalid phone number format',
        message: 'Please enter a valid phone number (e.g., +1234567890 or 1234567890)'
      });
    }

    // Upsert phone number
    const userPhone = await getDb().user_phones.upsert({
      where: { user_id: userId },
      update: {
        phone_number: formatted,
        is_verified: false, // Reset verification on change
        verified_at: null,
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        phone_number: formatted,
        is_verified: false
      }
    });

    console.log(`[SMS] Phone saved for user ${userId}: ${formatted}`);

    res.json({
      success: true,
      phone: formatted.slice(0, -4).replace(/\d/g, '*') + formatted.slice(-4)
    });
  } catch (err) {
    console.error('[SMS] Failed to save phone:', err.message);
    res.status(500).json({ error: 'Failed to save phone number' });
  }
});

// ============================================================================
// SEND WORKOUT SMS
// ============================================================================

/**
 * POST /api/fitness/sms/send/:workoutId
 * Generate share token and send workout link via SMS
 */
router.post('/send/:workoutId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { workoutId } = req.params;

    // Verify workout belongs to user
    const workout = await getDb().fitness_workouts.findFirst({
      where: {
        id: workoutId,
        user_id: userId
      }
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Get user's phone number
    const userPhone = await getDb().user_phones.findUnique({
      where: { user_id: userId }
    });

    if (!userPhone) {
      return res.status(400).json({
        error: 'No phone number',
        message: 'Please save your phone number first'
      });
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You can send ${rateLimit.remaining} more SMS in the next hour`
      });
    }

    // Generate share token
    const { token, expiresAt } = await generateShareToken(workoutId, userId);

    // Build share URL
    const baseUrl = process.env.FRONTEND_URL || 'https://frontend-six-topaz-27.vercel.app';
    const shareUrl = getShareUrl(token, baseUrl);

    // Extract workout name from workout_data if available
    const workoutName = workout.workout_data?.title ||
      workout.workout_data?.name ||
      `${workout.workout_type || 'Workout'} for ${new Date(workout.workout_date).toLocaleDateString()}`;

    // Ensure workout items exist (extract from workout_data if needed)
    await ensureWorkoutItems(workoutId, workout.workout_data);

    // Send SMS
    const result = await sendWorkoutLinkSms(
      userId,
      userPhone.phone_number,
      shareUrl,
      workoutName
    );

    if (!result.success) {
      return res.status(500).json({
        error: 'SMS failed',
        message: result.error
      });
    }

    console.log(`[SMS] Workout link sent for ${workoutId} to ${userPhone.phone_number}`);

    res.json({
      success: true,
      message: 'Workout link sent to your phone!',
      expiresAt,
      expiresInHours: TOKEN_EXPIRY_HOURS
    });
  } catch (err) {
    console.error('[SMS] Failed to send workout:', err.message);
    res.status(500).json({ error: 'Failed to send workout' });
  }
});

/**
 * Ensure workout_items exist for a workout
 * Extracts exercises from workout_data JSON if items don't exist
 */
async function ensureWorkoutItems(workoutId, workoutData) {
  const db = getDb();

  // Check if items already exist
  const existingItems = await db.workout_items.count({
    where: { workout_id: workoutId }
  });

  if (existingItems > 0) {
    return; // Items already exist
  }

  // Extract exercises from workout_data
  if (!workoutData) return;

  const items = [];
  let order = 0;

  // Handle different workout_data structures
  // Structure 1: { sections: [{ name, exercises: [...] }] }
  if (workoutData.sections) {
    for (const section of workoutData.sections) {
      for (const exercise of section.exercises || []) {
        items.push({
          workout_id: workoutId,
          exercise_name: exercise.name || exercise.exercise || 'Unknown',
          section: section.name || section.title,
          item_order: order++,
          sets: exercise.sets || null,
          reps: String(exercise.reps || exercise.duration || ''),
          weight: exercise.weight || null,
          notes: exercise.notes || exercise.instructions || null
        });
      }
    }
  }
  // Structure 2: { warm_up: [...], main: [...], cool_down: [...] }
  else {
    const sectionOrder = ['warm_up', 'warmUp', 'main', 'workout', 'cool_down', 'coolDown'];
    for (const sectionKey of sectionOrder) {
      const section = workoutData[sectionKey];
      if (Array.isArray(section)) {
        for (const exercise of section) {
          items.push({
            workout_id: workoutId,
            exercise_name: exercise.name || exercise.exercise || 'Unknown',
            section: sectionKey.replace('_', ' '),
            item_order: order++,
            sets: exercise.sets || null,
            reps: String(exercise.reps || exercise.duration || ''),
            weight: exercise.weight || null,
            notes: exercise.notes || exercise.instructions || null
          });
        }
      }
    }
  }

  // Bulk insert items
  if (items.length > 0) {
    await db.workout_items.createMany({ data: items });
    console.log(`[SMS] Created ${items.length} workout items for ${workoutId}`);
  }
}

// ============================================================================
// PUBLIC CHECK-OFF ENDPOINTS (No auth required)
// ============================================================================

/**
 * GET /api/fitness/workout/check-off/:token
 * Get workout items for check-off (public, token-validated)
 */
router.get('/workout/check-off/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Validate token
    const validation = await validateShareToken(token);
    if (!validation.valid) {
      return res.status(401).json({
        error: 'Invalid token',
        message: validation.error
      });
    }

    const db = getDb();

    // Get workout with items
    const workout = await db.fitness_workouts.findUnique({
      where: { id: validation.workoutId },
      include: {
        workout_items: {
          orderBy: { item_order: 'asc' }
        }
      }
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Group items by section
    const sections = {};
    for (const item of workout.workout_items) {
      const sectionName = item.section || 'Exercises';
      if (!sections[sectionName]) {
        sections[sectionName] = [];
      }
      sections[sectionName].push({
        id: item.id,
        name: item.exercise_name,
        sets: item.sets,
        reps: item.reps,
        weight: item.weight,
        notes: item.notes,
        completed: item.is_completed,
        completedAt: item.completed_at
      });
    }

    res.json({
      workoutId: workout.id,
      date: workout.workout_date,
      type: workout.workout_type,
      intensity: workout.intensity,
      sections,
      totalItems: workout.workout_items.length,
      completedItems: workout.workout_items.filter(i => i.is_completed).length
    });
  } catch (err) {
    console.error('[Check-off] Failed to get workout:', err.message);
    res.status(500).json({ error: 'Failed to get workout' });
  }
});

/**
 * POST /api/fitness/workout/check-off/:token
 * Toggle item completion (public, token-validated)
 *
 * Body: { itemId: string, completed: boolean }
 */
router.post('/workout/check-off/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { itemId, completed } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'itemId required' });
    }

    // Validate token
    const validation = await validateShareToken(token);
    if (!validation.valid) {
      return res.status(401).json({
        error: 'Invalid token',
        message: validation.error
      });
    }

    const db = getDb();

    // Verify item belongs to the workout
    const item = await db.workout_items.findFirst({
      where: {
        id: itemId,
        workout_id: validation.workoutId
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update completion status
    const updated = await db.workout_items.update({
      where: { id: itemId },
      data: {
        is_completed: completed !== false, // Default to true
        completed_at: completed !== false ? new Date() : null
      }
    });

    // Get updated counts
    const workout = await db.workout_items.aggregate({
      where: { workout_id: validation.workoutId },
      _count: { id: true }
    });

    const completedCount = await db.workout_items.count({
      where: {
        workout_id: validation.workoutId,
        is_completed: true
      }
    });

    console.log(`[Check-off] Item ${itemId} marked ${completed ? 'complete' : 'incomplete'}`);

    res.json({
      success: true,
      item: {
        id: updated.id,
        completed: updated.is_completed,
        completedAt: updated.completed_at
      },
      progress: {
        total: workout._count.id,
        completed: completedCount
      }
    });
  } catch (err) {
    console.error('[Check-off] Failed to update item:', err.message);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

module.exports = router;
