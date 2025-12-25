/**
 * Fitness Module - Express Routes
 * 
 * Endpoints:
 * - GET /api/fitness/profile - Get user's fitness profile
 * - POST /api/fitness/profile - Create/update fitness profile
 * - GET /api/fitness/workouts - List user's workouts
 * - POST /api/fitness/workouts - Create new workout (no duplicates per day)
 * - GET /api/fitness/goals - List user's fitness goals
 * - POST /api/fitness/goals - Create new fitness goal
 * - POST /api/fitness/ai-interview - AI-powered workout planning via conversation

 * 
 * Security:
 * - All routes require authentication (requireAuth middleware)
 * - All queries scoped to authenticated user_id
 * - User data isolation enforced via WHERE user_id = $N
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();

// JWT Secret from environment - MUST match main server's SESSION_SECRET
// Main server uses: const JWT_SECRET = SESSION_SECRET
// So fitness routes must use the same secret for token verification to work
const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'your-secret-key';

if (!process.env.SESSION_SECRET && !process.env.JWT_SECRET) {
  console.warn('[Fitness Auth] ⚠️  WARNING: Neither SESSION_SECRET nor JWT_SECRET is set!');
  console.warn('[Fitness Auth] Tokens will fail verification. Set SESSION_SECRET in your environment.');
}

// Lazy-initialize Prisma clients on first use to avoid failures at module load time
// NOTE: Fitness tables (fitness_profiles, fitness_goals, etc.) are in FITNESS_DATABASE_URL (Neon)
// Admin tables (admin_interview_questions) are in DATABASE_URL (main Render)
let fitnessDb = null;
let mainDb = null;

function getFitnessDb() {
  if (!fitnessDb) {
    // Use FITNESS_DATABASE_URL (Neon) for fitness tables, fallback to DATABASE_URL
    const dbUrl = process.env.FITNESS_DATABASE_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error(
        'FITNESS_DATABASE_URL or DATABASE_URL environment variable is not set. ' +
        'Fitness routes cannot operate without a database connection.'
      );
    }
    
    console.log('[Fitness DB] Initializing Prisma client for fitness database (Neon)...');
    
    fitnessDb = new PrismaClient({
      datasources: {
        db: { url: dbUrl },
      },
      // Enable connection pooling and error recovery
      log: ['warn', 'error'],
    });
    
    // Handle connection errors gracefully
    fitnessDb.$on('error', (event) => {
      console.error('[Fitness DB] Prisma error event:', event.message);
    });
    
    // Reconnect on disconnect
    fitnessDb.$on('disconnect', () => {
      console.warn('[Fitness DB] Database disconnected - will reconnect on next query');
      fitnessDb = null; // Reset to force reconnection
    });
    
    console.log('[Fitness DB] ✅ Prisma client initialized');
  }
  return fitnessDb;
}

function getMainDb() {
  if (!mainDb) {
    // Use main database URL for admin tables (admin_interview_questions)
    // In fitness backend, this is MAIN_DATABASE_URL; in main server, it's DATABASE_URL
    const dbUrl = process.env.MAIN_DATABASE_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error(
        'MAIN_DATABASE_URL or DATABASE_URL environment variable is not set. ' +
        'Admin interview questions table cannot be accessed without main database connection.'
      );
    }
    
    console.log('[Main DB] Initializing Prisma client for main database (Render)...');
    
    mainDb = new PrismaClient({
      datasources: {
        db: { url: dbUrl },
      },
      // Enable connection pooling and error recovery
      log: ['warn', 'error'],
    });
    
    // Handle connection errors gracefully
    mainDb.$on('error', (event) => {
      console.error('[Main DB] Prisma error event:', event.message);
    });
    
    // Reconnect on disconnect
    mainDb.$on('disconnect', () => {
      console.warn('[Main DB] Database disconnected - will reconnect on next query');
      mainDb = null; // Reset to force reconnection
    });
    
    console.log('[Main DB] ✅ Prisma client initialized');
  }
  return mainDb;
}

/**
 * Verify JWT Token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('[Fitness Auth] Token verification failed:', err.message);
    return null;
  }
}

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header and attaches user context
 */
function requireAuth(req, res, next) {
  // Check for token in Authorization header or query parameter
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : req.query.token;

  console.log('[Fitness Auth] Checking authorization');
  console.log('[Fitness Auth] Authorization header:', authHeader ? 'present' : 'missing');
  console.log('[Fitness Auth] Token found:', token ? 'yes' : 'no');

  if (!token) {
    console.error('[Fitness Auth] No token provided');
    return res.status(401).json({
      error: 'not_authenticated',
      message: 'No authentication token provided',
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    console.error('[Fitness Auth] Invalid or expired token');
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Invalid or expired authentication token',
    });
  }

  console.log('[Fitness Auth] Token verified for user:', decoded.email);
  req.user = decoded;
  next();
}

// ============================================================================
// FITNESS PROFILE ENDPOINTS
// ============================================================================

/**
 * GET /api/fitness/profile
 * Retrieve the authenticated user's fitness profile
 * 
 * Response: { id, user_id, height_cm, weight_kg, age, gender, activity_level, created_at, updated_at }
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[GET /api/fitness/profile] Fetching profile for user: ${req.user.email}`);

    const profile = await getFitnessDb().fitness_profiles.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      console.log(`[GET /api/fitness/profile] No profile found for user: ${userId}`);
      return res.status(404).json({
        error: 'profile_not_found',
        message: 'Fitness profile not found. Create one first.',
      });
    }

    console.log(`✅ Profile retrieved for ${req.user.email}`);
    res.json({
      id: profile.id,
      user_id: profile.user_id,
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      age: profile.age,
      gender: profile.gender,
      activity_level: profile.activity_level,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    });
  } catch (error) {
    console.error('[GET /api/fitness/profile] Error:', error.message);
    console.error('[GET /api/fitness/profile] User ID:', req.user?.id);
    res.status(500).json({
      error: 'Failed to retrieve profile',
      details: error.message,
    });
  }
});

/**
 * POST /api/fitness/profile
 * Create or update the authenticated user's fitness profile
 * 
 * Request Body:
 * {
 *   height_cm: number (optional),
 *   weight_kg: number (optional),
 *   age: number (optional),
 *   gender: string (optional),
 *   activity_level: string (optional)
 * }
 * 
 * Response: { success, profile: {...} }
 */
router.post('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { height_cm, weight_kg, age, gender, activity_level } = req.body;

    console.log(`[POST /api/fitness/profile] Creating/updating profile for user: ${req.user.email}`);

    // Input validation
    if (height_cm !== undefined && (typeof height_cm !== 'number' || height_cm <= 0)) {
      return res.status(400).json({
        error: 'invalid_height_cm',
        message: 'height_cm must be a positive number',
      });
    }

    if (weight_kg !== undefined && (typeof weight_kg !== 'number' || weight_kg <= 0)) {
      return res.status(400).json({
        error: 'invalid_weight_kg',
        message: 'weight_kg must be a positive number',
      });
    }

    if (age !== undefined && (typeof age !== 'number' || age < 0 || age > 150)) {
      return res.status(400).json({
        error: 'invalid_age',
        message: 'age must be a number between 0 and 150',
      });
    }

    if (
      activity_level !== undefined &&
      activity_level &&
      !['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(activity_level)
    ) {
      return res.status(400).json({
        error: 'invalid_activity_level',
        message: 'activity_level must be one of: sedentary, light, moderate, active, very_active',
      });
    }

    // Check if profile exists
    const existingProfile = await getFitnessDb().fitness_profiles.findUnique({
      where: { user_id: userId },
    });

    let profile;

    if (existingProfile) {
      // Update existing profile
      profile = await getFitnessDb().fitness_profiles.update({
        where: { user_id: userId },
        data: {
          height_cm: height_cm !== undefined ? height_cm : existingProfile.height_cm,
          weight_kg: weight_kg !== undefined ? weight_kg : existingProfile.weight_kg,
          age: age !== undefined ? age : existingProfile.age,
          gender: gender !== undefined ? gender : existingProfile.gender,
          activity_level: activity_level !== undefined ? activity_level : existingProfile.activity_level,
          updated_at: new Date(),
        },
      });
      console.log(`📝 Profile updated for ${req.user.email}`);
    } else {
      // Create new profile
      profile = await getFitnessDb().fitness_profiles.create({
        data: {
          user_id: userId,
          height_cm: height_cm || null,
          weight_kg: weight_kg || null,
          age: age || null,
          gender: gender || null,
          activity_level: activity_level || null,
        },
      });
      console.log(`✨ Profile created for ${req.user.email}`);
    }

    res.json({
      success: true,
      profile: {
        id: profile.id,
        user_id: profile.user_id,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        age: profile.age,
        gender: profile.gender,
        activity_level: profile.activity_level,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
    });
  } catch (error) {
    console.error('[POST /api/fitness/profile] Error:', error.message);
    console.error('[POST /api/fitness/profile] User ID:', req.user?.id);
    res.status(500).json({
      error: 'Failed to save profile',
      details: error.message,
    });
  }
});

// ============================================================================
// WORKOUT ENDPOINTS
// ============================================================================

/**
 * GET /api/fitness/workouts
 * Retrieve all workouts for the authenticated user
 * 
 * Query Parameters:
 * - ?startDate=YYYY-MM-DD (optional) - Filter from start date
 * - ?endDate=YYYY-MM-DD (optional) - Filter to end date
 * - ?type=strength|cardio|hiit (optional) - Filter by workout type
 * 
 * Response: { workouts: [...] }
 */
router.get('/workouts', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, type } = req.query;

    console.log(`[GET /api/fitness/workouts] Fetching workouts for user: ${req.user.email}`);
    if (startDate) console.log(`  Filter: startDate=${startDate}`);
    if (endDate) console.log(`  Filter: endDate=${endDate}`);
    if (type) console.log(`  Filter: type=${type}`);

    // Build where clause
    const where = { user_id: userId };

    if (startDate) {
      where.workout_date = {
        ...where.workout_date,
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.workout_date = {
        ...where.workout_date,
        lte: new Date(endDate),
      };
    }

    if (type) {
      where.workout_type = type;
    }

    const workouts = await getFitnessDb().fitness_workouts.findMany({
      where,
      include: {
        workout_exercises: {
          include: {
            sets: true,
          },
        },
      },
      orderBy: { workout_date: 'desc' },
    });

    console.log(`✅ Retrieved ${workouts.length} workouts for ${req.user.email}`);

    res.json({
      workouts: workouts.map((w) => ({
        id: w.id,
        user_id: w.user_id,
        workout_date: w.workout_date,
        workout_type: w.workout_type,
        duration_minutes: w.duration_minutes,
        notes: w.notes,
        created_at: w.created_at,
        exercises: w.workout_exercises.map((ex) => ({
          id: ex.id,
          exercise_name: ex.exercise_name,
          exercise_order: ex.exercise_order,
          sets: ex.sets.map((s) => ({
            id: s.id,
            set_number: s.set_number,
            reps: s.reps,
            weight: s.weight,
            duration_seconds: s.duration_seconds,
          })),
        })),
      })),
    });
  } catch (error) {
    console.error('[GET /api/fitness/workouts] Error:', error.message);
    console.error('[GET /api/fitness/workouts] User ID:', req.user?.id);
    res.status(500).json({
      error: 'Failed to retrieve workouts',
      details: error.message,
    });
  }
});

/**
 * POST /api/fitness/workouts
 * Create a new workout for the authenticated user
 * 
 * Prevents duplicate workouts on the same day (same user_id + date + type)
 * 
 * Request Body:
 * {
 *   workout_date: string (ISO date format YYYY-MM-DD),
 *   workout_type: string (strength | cardio | hiit),
 *   duration_minutes: number (optional),
 *   notes: string (optional)
 * }
 * 
 * Response: { success, workout: {...} }
 */
router.post('/workouts', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { workout_date, workout_type, duration_minutes, notes } = req.body;

    console.log(`[POST /api/fitness/workouts] Creating workout for user: ${req.user.email}`);
    console.log(`  Date: ${workout_date}, Type: ${workout_type}`);

    // Input validation
    if (!workout_date) {
      return res.status(400).json({
        error: 'missing_workout_date',
        message: 'workout_date is required (format: YYYY-MM-DD)',
      });
    }

    if (!workout_type) {
      return res.status(400).json({
        error: 'missing_workout_type',
        message: 'workout_type is required',
      });
    }

    // Validate workout_type
    if (!['strength', 'cardio', 'hiit'].includes(workout_type)) {
      return res.status(400).json({
        error: 'invalid_workout_type',
        message: 'workout_type must be one of: strength, cardio, hiit',
      });
    }

    // Validate date format
    const dateObj = new Date(workout_date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        error: 'invalid_date_format',
        message: 'workout_date must be in YYYY-MM-DD format',
      });
    }

    // Validate duration_minutes if provided
    if (duration_minutes !== undefined && (typeof duration_minutes !== 'number' || duration_minutes <= 0)) {
      return res.status(400).json({
        error: 'invalid_duration_minutes',
        message: 'duration_minutes must be a positive number',
      });
    }

    // Check for duplicate workout on the same day for this user
    const existingWorkout = await getFitnessDb().fitness_workouts.findFirst({
      where: {
        user_id: userId,
        workout_date: dateObj,
        workout_type: workout_type,
      },
    });

    if (existingWorkout) {
      console.warn(
        `⚠️  Duplicate workout prevented for ${req.user.email} on ${workout_date} (${workout_type})`
      );
      return res.status(409).json({
        error: 'duplicate_workout',
        message: `A ${workout_type} workout already exists for ${workout_date}. Delete the existing one first or update it instead.`,
        existingWorkout: {
          id: existingWorkout.id,
          created_at: existingWorkout.created_at,
        },
      });
    }

    // Create the workout
    const workout = await getFitnessDb().fitness_workouts.create({
      data: {
        user_id: userId,
        workout_date: dateObj,
        workout_type,
        duration_minutes: duration_minutes || null,
        notes: notes || null,
      },
    });

    console.log(`💪 Workout created for ${req.user.email}: ${workout.id}`);

    res.json({
      success: true,
      workout: {
        id: workout.id,
        user_id: workout.user_id,
        workout_date: workout.workout_date,
        workout_type: workout.workout_type,
        duration_minutes: workout.duration_minutes,
        notes: workout.notes,
        created_at: workout.created_at,
        exercises: [],
      },
    });
  } catch (error) {
    console.error('[POST /api/fitness/workouts] Error:', error.message);
    console.error('[POST /api/fitness/workouts] User ID:', req.user?.id);
    res.status(500).json({
      error: 'Failed to create workout',
      details: error.message,
    });
  }
});

/**
 * GET /api/fitness/workouts/:id
 * Get single workout with all exercises and sets
 *
 * Security: Only returns workout if user owns it
 * Response: { success: true, data: { ...workout, exercises: [...] } }
 */
router.get('/workouts/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`[GET /api/fitness/workouts/${id}] User: ${req.user.email}`);

    const workout = await getFitnessDb().fitness_workouts.findFirst({
      where: {
        id: id,
        user_id: userId  // Security: only user's workouts
      },
      include: {
        workout_exercises: {
          include: {
            sets: {
              orderBy: { set_number: 'asc' }
            }
          },
          orderBy: { exercise_order: 'asc' }
        }
      }
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    console.log(`✅ Retrieved workout with ${workout.workout_exercises.length} exercises`);

    res.json({
      success: true,
      data: workout
    });
  } catch (error) {
    console.error('[GET /api/fitness/workouts/:id] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workout'
    });
  }
});

/**
 * PUT /api/fitness/workouts/:id
 * Update workout metadata (name, date, duration, notes)
 *
 * Security: Only allows updates if user owns the workout
 * Body: { workout_name?, workout_date?, duration_minutes?, notes? }
 */
router.put('/workouts/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { workout_name, workout_date, duration_minutes, notes } = req.body;

    console.log(`[PUT /api/fitness/workouts/${id}] User: ${req.user.email}`);

    // Verify ownership
    const existing = await getFitnessDb().fitness_workouts.findFirst({
      where: { id, user_id: userId }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    // Build update object with only provided fields
    const updateData = { updated_at: new Date() };
    if (workout_name !== undefined) updateData.workout_name = workout_name;
    if (workout_date !== undefined) updateData.workout_date = new Date(workout_date);
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await getFitnessDb().fitness_workouts.update({
      where: { id },
      data: updateData
    });

    console.log(`✅ Workout updated successfully`);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('[PUT /api/fitness/workouts/:id] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update workout'
    });
  }
});

/**
 * DELETE /api/fitness/workouts/:id
 * Delete workout and all associated exercises/sets (cascade)
 *
 * Security: Only allows deletion if user owns the workout
 */
router.delete('/workouts/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`[DELETE /api/fitness/workouts/${id}] User: ${req.user.email}`);

    // Verify ownership
    const workout = await getFitnessDb().fitness_workouts.findFirst({
      where: { id, user_id: userId }
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    // Delete workout (cascade will remove exercises and sets)
    await getFitnessDb().fitness_workouts.delete({ where: { id } });

    console.log(`✅ Workout deleted successfully`);

    res.json({
      success: true,
      message: 'Workout deleted successfully'
    });
  } catch (error) {
    console.error('[DELETE /api/fitness/workouts/:id] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete workout'
    });
  }
});

/**
 * POST /api/fitness/workouts/:workoutId/exercises
 * Add an exercise to a workout with its sets
 *
 * Body: {
 *   exercise_name: string,
 *   exercise_order: number,
 *   sets: [{ set_number, reps?, weight?, duration_seconds? }]
 * }
 */
router.post('/workouts/:workoutId/exercises', requireAuth, async (req, res) => {
  try {
    const { workoutId } = req.params;
    const userId = req.user.id;
    const { exercise_name, exercise_order, sets } = req.body;

    console.log(`[POST /api/fitness/workouts/${workoutId}/exercises] User: ${req.user.email}`);

    // Verify workout ownership
    const workout = await getFitnessDb().fitness_workouts.findFirst({
      where: { id: workoutId, user_id: userId }
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    // Validate required fields
    if (!exercise_name) {
      return res.status(400).json({
        success: false,
        error: 'exercise_name is required'
      });
    }

    // Create exercise with sets
    const exercise = await getFitnessDb().fitness_workout_exercises.create({
      data: {
        workout_id: workoutId,
        exercise_name,
        exercise_order: exercise_order || 1,
        sets: {
          create: (sets || []).map(set => ({
            set_number: set.set_number,
            reps: set.reps || null,
            weight: set.weight || null,
            duration_seconds: set.duration_seconds || null
          }))
        }
      },
      include: {
        sets: true
      }
    });

    console.log(`✅ Exercise added with ${sets?.length || 0} sets`);

    res.json({
      success: true,
      data: exercise
    });
  } catch (error) {
    console.error('[POST /api/fitness/workouts/:workoutId/exercises] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to add exercise'
    });
  }
});

/**
 * PUT /api/fitness/workouts/:workoutId/exercises/:exerciseId
 * Update exercise details (name, order)
 */
router.put('/workouts/:workoutId/exercises/:exerciseId', requireAuth, async (req, res) => {
  try {
    const { workoutId, exerciseId } = req.params;
    const userId = req.user.id;
    const { exercise_name, exercise_order } = req.body;

    console.log(`[PUT /api/fitness/workouts/${workoutId}/exercises/${exerciseId}]`);

    // Verify workout ownership
    const workout = await getFitnessDb().fitness_workouts.findFirst({
      where: { id: workoutId, user_id: userId }
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    // Verify exercise belongs to workout
    const exercise = await getFitnessDb().fitness_workout_exercises.findFirst({
      where: { id: exerciseId, workout_id: workoutId }
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found'
      });
    }

    // Update exercise
    const updateData = {};
    if (exercise_name !== undefined) updateData.exercise_name = exercise_name;
    if (exercise_order !== undefined) updateData.exercise_order = exercise_order;

    const updated = await getFitnessDb().fitness_workout_exercises.update({
      where: { id: exerciseId },
      data: updateData
    });

    console.log(`✅ Exercise updated`);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('[PUT /api/fitness/workouts/:workoutId/exercises/:exerciseId] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update exercise'
    });
  }
});

/**
 * DELETE /api/fitness/workouts/:workoutId/exercises/:exerciseId
 * Remove exercise from workout (cascade deletes sets)
 */
router.delete('/workouts/:workoutId/exercises/:exerciseId', requireAuth, async (req, res) => {
  try {
    const { workoutId, exerciseId } = req.params;
    const userId = req.user.id;

    console.log(`[DELETE /api/fitness/workouts/${workoutId}/exercises/${exerciseId}]`);

    // Verify workout ownership
    const workout = await getFitnessDb().fitness_workouts.findFirst({
      where: { id: workoutId, user_id: userId }
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    // Delete exercise (cascade removes sets)
    await getFitnessDb().fitness_workout_exercises.delete({
      where: { id: exerciseId }
    });

    console.log(`✅ Exercise deleted`);

    res.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    console.error('[DELETE /api/fitness/workouts/:workoutId/exercises/:exerciseId] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete exercise'
    });
  }
});

/**
 * POST /api/fitness/workouts/:workoutId/exercises/:exerciseId/sets
 * Add a set to an exercise
 *
 * Body: { set_number, reps?, weight?, duration_seconds? }
 */
router.post('/workouts/:workoutId/exercises/:exerciseId/sets', requireAuth, async (req, res) => {
  try {
    const { workoutId, exerciseId } = req.params;
    const userId = req.user.id;
    const { set_number, reps, weight, duration_seconds } = req.body;

    console.log(`[POST /api/fitness/workouts/${workoutId}/exercises/${exerciseId}/sets]`);

    // Verify workout ownership
    const workout = await getFitnessDb().fitness_workouts.findFirst({
      where: { id: workoutId, user_id: userId },
      include: {
        workout_exercises: {
          where: { id: exerciseId }
        }
      }
    });

    if (!workout || workout.workout_exercises.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Workout or exercise not found'
      });
    }

    // Create set
    const set = await getFitnessDb().fitness_workout_sets.create({
      data: {
        exercise_id: exerciseId,
        set_number: set_number || 1,
        reps: reps || null,
        weight: weight || null,
        duration_seconds: duration_seconds || null
      }
    });

    console.log(`✅ Set added`);

    res.json({
      success: true,
      data: set
    });
  } catch (error) {
    console.error('[POST /api/fitness/workouts/:workoutId/exercises/:exerciseId/sets] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to add set'
    });
  }
});

/**
 * PUT /api/fitness/workouts/:workoutId/exercises/:exerciseId/sets/:setId
 * Update a set's details
 *
 * Body: { reps?, weight?, duration_seconds? }
 */
router.put('/workouts/:workoutId/exercises/:exerciseId/sets/:setId', requireAuth, async (req, res) => {
  try {
    const { workoutId, exerciseId, setId } = req.params;
    const userId = req.user.id;
    const { reps, weight, duration_seconds } = req.body;

    console.log(`[PUT /api/fitness/workouts/${workoutId}/exercises/${exerciseId}/sets/${setId}]`);

    // Verify workout ownership
    const workout = await getFitnessDb().fitness_workouts.findFirst({
      where: { id: workoutId, user_id: userId }
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    // Verify set belongs to exercise
    const set = await getFitnessDb().fitness_workout_sets.findFirst({
      where: { id: setId, exercise_id: exerciseId }
    });

    if (!set) {
      return res.status(404).json({
        success: false,
        error: 'Set not found'
      });
    }

    // Update set
    const updateData = {};
    if (reps !== undefined) updateData.reps = reps;
    if (weight !== undefined) updateData.weight = weight;
    if (duration_seconds !== undefined) updateData.duration_seconds = duration_seconds;

    const updated = await getFitnessDb().fitness_workout_sets.update({
      where: { id: setId },
      data: updateData
    });

    console.log(`✅ Set updated`);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('[PUT /api/fitness/workouts/:workoutId/exercises/:exerciseId/sets/:setId] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update set'
    });
  }
});

/**
 * DELETE /api/fitness/workouts/:workoutId/exercises/:exerciseId/sets/:setId
 * Remove a set from an exercise
 */
router.delete('/workouts/:workoutId/exercises/:exerciseId/sets/:setId', requireAuth, async (req, res) => {
  try {
    const { workoutId, setId } = req.params;
    const userId = req.user.id;

    console.log(`[DELETE /api/fitness/workouts/${workoutId}/exercises/:exerciseId/sets/${setId}]`);

    // Verify workout ownership
    const workout = await getFitnessDb().fitness_workouts.findFirst({
      where: { id: workoutId, user_id: userId }
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    // Delete set
    await getFitnessDb().fitness_workout_sets.delete({
      where: { id: setId }
    });

    console.log(`✅ Set deleted`);

    res.json({
      success: true,
      message: 'Set deleted successfully'
    });
  } catch (error) {
    console.error('[DELETE /api/fitness/workouts/:workoutId/exercises/:exerciseId/sets/:setId] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete set'
    });
  }
});

/**
 * GET /api/fitness/exercise-definitions
 * Get exercise library with optional filters
 *
 * Query Parameters:
 * - category: Filter by muscle category (chest, back, legs, etc.)
 * - difficulty: Filter by difficulty level (beginner, intermediate, advanced)
 * - equipment: Filter by equipment type (barbell, dumbbell, etc.)
 * - search: Search by exercise name
 */
router.get('/exercise-definitions', requireAuth, async (req, res) => {
  try {
    const { category, difficulty, equipment, search } = req.query;

    console.log(`[GET /api/fitness/exercise-definitions] Filters:`, { category, difficulty, equipment, search });

    const where = { is_active: true };
    if (category) where.category = category;
    if (difficulty) where.difficulty_level = difficulty;
    if (equipment) where.equipment = equipment;
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const exercises = await getFitnessDb().exercise_definitions.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log(`✅ Retrieved ${exercises.length} exercises`);

    res.json({
      success: true,
      data: exercises
    });
  } catch (error) {
    console.error('[GET /api/fitness/exercise-definitions] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exercises'
    });
  }
});

// ============================================================================
// GOALS ENDPOINTS
// ============================================================================

/**
 * GET /api/fitness/goals
 * Retrieve all fitness goals for the authenticated user
 * 
 * Query Parameters:
 * - ?status=active|completed|abandoned (optional) - Filter by status
 * 
 * Response: { goals: [...] }
 */
router.get('/goals', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    console.log(`[GET /api/fitness/goals] Fetching goals for user: ${req.user.email}`);
    if (status) console.log(`  Filter: status=${status}`);

    const where = { user_id: userId };

    if (status) {
      if (!['active', 'completed', 'abandoned'].includes(status)) {
        return res.status(400).json({
          error: 'invalid_status',
          message: 'status must be one of: active, completed, abandoned',
        });
      }
      where.status = status;
    }

    const goals = await getFitnessDb().fitness_goals.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    console.log(`✅ Retrieved ${goals.length} goals for ${req.user.email}`);

    res.json({
      goals: goals.map((g) => ({
        id: g.id,
        user_id: g.user_id,
        goal_type: g.goal_type,
        target_value: g.target_value,
        unit: g.unit,
        start_date: g.start_date,
        target_date: g.target_date,
        status: g.status,
        created_at: g.created_at,
        updated_at: g.updated_at,
      })),
    });
  } catch (error) {
    console.error('[GET /api/fitness/goals] Error:', error.message);
    console.error('[GET /api/fitness/goals] User ID:', req.user?.id);
    res.status(500).json({
      error: 'Failed to retrieve goals',
      details: error.message,
    });
  }
});

/**
 * POST /api/fitness/goals
 * Create a new fitness goal for the authenticated user
 * 
 * Request Body:
 * {
 *   goal_type: string (weight_loss | muscle_gain | endurance | strength, etc),
 *   target_value: number (optional),
 *   unit: string (optional - lbs, kg, minutes, reps, etc),
 *   start_date: string (optional - ISO date format YYYY-MM-DD),
 *   target_date: string (optional - ISO date format YYYY-MM-DD)
 * }
 * 
 * Response: { success, goal: {...} }
 */
router.post('/goals', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { goal_type, target_value, unit, start_date, target_date } = req.body;

    console.log(`[POST /api/fitness/goals] Creating goal for user: ${req.user.email}`);
    console.log(`  Type: ${goal_type}`);

    // Input validation
    if (!goal_type || typeof goal_type !== 'string' || !goal_type.trim()) {
      return res.status(400).json({
        error: 'missing_goal_type',
        message: 'goal_type is required and must be a non-empty string',
      });
    }

    // Validate target_value if provided
    if (target_value !== undefined && (typeof target_value !== 'number' || target_value <= 0)) {
      return res.status(400).json({
        error: 'invalid_target_value',
        message: 'target_value must be a positive number',
      });
    }

    // Validate dates if provided
    if (start_date) {
      const startDateObj = new Date(start_date);
      if (isNaN(startDateObj.getTime())) {
        return res.status(400).json({
          error: 'invalid_start_date_format',
          message: 'start_date must be in YYYY-MM-DD format',
        });
      }
    }

    if (target_date) {
      const targetDateObj = new Date(target_date);
      if (isNaN(targetDateObj.getTime())) {
        return res.status(400).json({
          error: 'invalid_target_date_format',
          message: 'target_date must be in YYYY-MM-DD format',
        });
      }
    }

    // Create the goal
    const goal = await getFitnessDb().fitness_goals.create({
      data: {
        user_id: userId,
        goal_type,
        target_value: target_value || null,
        unit: unit || null,
        start_date: start_date ? new Date(start_date) : null,
        target_date: target_date ? new Date(target_date) : null,
        status: 'active',
      },
    });

    console.log(`🎯 Goal created for ${req.user.email}: ${goal.id}`);

    res.json({
      success: true,
      goal: {
        id: goal.id,
        user_id: goal.user_id,
        goal_type: goal.goal_type,
        target_value: goal.target_value,
        unit: goal.unit,
        start_date: goal.start_date,
        target_date: goal.target_date,
        status: goal.status,
        created_at: goal.created_at,
        updated_at: goal.updated_at,
      },
    });
  } catch (error) {
    console.error('[POST /api/fitness/goals] Error:', error.message);
    console.error('[POST /api/fitness/goals] User ID:', req.user?.id);
    res.status(500).json({
      error: 'Failed to create goal',
      details: error.message,
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Handle 404 for any undefined routes
 */
router.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

/**
 * Handle unexpected errors
 */

/**
 * POST /api/fitness/ai-interview
 * AI-powered workout planning conversation
 * 
 * Request: { messages: Array, userProfile: Object }
 * Response: { message: string, workoutGenerated: boolean, workout?: Object }
 */
router.post('/ai-interview', requireAuth, async (req, res) => {
  try {
    const { messages, userProfile } = req.body;
    const userId = req.user.id;
    
    console.log('[AI Interview] Request received for user:', userId);
    console.log('[AI Interview] Messages count:', messages?.length);

    if (!messages || !Array.isArray(messages)) {
      console.error('[AI Interview] Invalid messages:', messages);
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Messages array is required'
      });
    }

    // Check if OpenAI API is available
    const openai = req.app.locals.openai;
    if (!openai) {
      console.error('[AI Interview] OpenAI client not available in req.app.locals');
      console.error('[AI Interview] req.app.locals keys:', Object.keys(req.app?.locals || {}));
      return res.status(503).json({
        error: 'service_unavailable',
        message: 'AI service is not available'
      });
    }
    
    console.log('[AI Interview] OpenAI client found, making request...');

    // Build context for AI with interview answers if provided
    const { interview_answers, question_count } = req.body;
    
    let systemPrompt = `You are a professional fitness coach AI. Your goal is to create personalized workout plans based on user information.`;
    
    // If interview answers are provided, use structured generation
    if (interview_answers && Object.keys(interview_answers).length > 0) {
      systemPrompt = `You are a professional fitness coach AI. You have received structured interview responses from a user. 

Based on their responses, you MUST generate a detailed, personalized 6-section workout plan.

The user provided these answers:
${Object.entries(interview_answers).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Generate a comprehensive workout with these 6 sections in this exact JSON format:

<WORKOUT_JSON>
{
  "warm_up": {
    "name": "string (e.g., 'Dynamic Stretching')",
    "duration": "string (e.g., '5 minutes')",
    "exercises": ["exercise 1", "exercise 2", "exercise 3"]
  },
  "strength": {
    "name": "string",
    "duration": "string",
    "exercises": ["exercise 1", "exercise 2", "exercise 3"],
    "sets_reps": "string (e.g., '3 sets of 10 reps')"
  },
  "cardio": {
    "name": "string",
    "duration": "string",
    "exercises": ["exercise 1", "exercise 2"],
    "notes": "string"
  },
  "agility": {
    "name": "string",
    "duration": "string",
    "exercises": ["exercise 1", "exercise 2"],
    "notes": "string"
  },
  "recovery": {
    "name": "string",
    "duration": "string",
    "exercises": ["stretch 1", "stretch 2", "stretch 3"]
  },
  "closeout": {
    "name": "string",
    "notes": "string (motivation and next steps)"
  },
  "summary": {
    "total_duration": "string",
    "intensity_level": "low|medium|high",
    "calories_burned_estimate": number,
    "difficulty_rating": "1-10"
  }
}
</WORKOUT_JSON>

IMPORTANT:
- Personalize based on the user's responses
- Make exercises progressively harder if intensity is high
- Include specific form cues or modifications for each exercise
- Keep the JSON valid and properly formatted
- Include motivational language in the closeout section

Be professional, encouraging, and specific with exercise recommendations.`;
    } else {
      // Fallback to conversation-based approach if no structured answers
      systemPrompt += `

When the user provides information about their fitness goals and preferences, generate a JSON workout object and include it in your response like this:
<WORKOUT_JSON>
{
  "warm_up": {
    "name": "string",
    "duration": "string",
    "exercises": ["exercise 1", "exercise 2", "exercise 3"]
  },
  "strength": {
    "name": "string",
    "duration": "string",
    "exercises": ["exercise 1", "exercise 2", "exercise 3"],
    "sets_reps": "string"
  },
  "cardio": {
    "name": "string",
    "duration": "string",
    "exercises": ["exercise 1", "exercise 2"],
    "notes": "string"
  },
  "agility": {
    "name": "string",
    "duration": "string",
    "exercises": ["exercise 1", "exercise 2"],
    "notes": "string"
  },
  "recovery": {
    "name": "string",
    "duration": "string",
    "exercises": ["stretch 1", "stretch 2", "stretch 3"]
  },
  "closeout": {
    "name": "string",
    "notes": "string"
  },
  "summary": {
    "total_duration": "string",
    "intensity_level": "low|medium|high",
    "calories_burned_estimate": number,
    "difficulty_rating": "1-10"
  }
}
</WORKOUT_JSON>

Be friendly, encouraging, and professional. Keep responses concise.`;
    }

    // Call OpenAI
    console.log('[AI Interview] Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const aiMessage = response.choices[0].message.content;
    console.log('[AI Interview] OpenAI response received');
    console.log('[AI Interview] Message length:', aiMessage.length);

    // Check if workout was generated
    const workoutMatch = aiMessage.match(/<WORKOUT_JSON>([\s\S]*?)<\/WORKOUT_JSON>/);
    let workoutGenerated = false;
    let workout = null;
    let cleanMessage = aiMessage;

    if (workoutMatch) {
      console.log('[AI Interview] Workout JSON found in response');
      try {
        workout = JSON.parse(workoutMatch[1]);
        workoutGenerated = true;
        // Remove the JSON tags from the message
        cleanMessage = aiMessage.replace(/<WORKOUT_JSON>[\s\S]*?<\/WORKOUT_JSON>/, '').trim();
        console.log('[AI Interview] Workout parsed successfully');
        
        // Save the workout to database with retry logic
        let savedWorkout = null;
        let saveAttempts = 0;
        const maxAttempts = 3;
        
        while (saveAttempts < maxAttempts && !savedWorkout) {
          try {
            saveAttempts++;
            console.log(`[AI Interview] Saving workout to database (attempt ${saveAttempts}/${maxAttempts})`);
            
            // Store the entire 6-section workout as JSON
            savedWorkout = await getFitnessDb().fitness_workouts.create({
              data: {
                user_id: userId,
                workout_data: JSON.stringify(workout), // Store full 6-section structure
                intensity: workout.summary?.intensity_level || 'medium',
                duration_minutes: parseInt(workout.summary?.total_duration) || 60,
                calories_burned: workout.summary?.calories_burned_estimate || 0,
                difficulty_rating: workout.summary?.difficulty_rating || 5,
                workout_date: new Date()
              }
            });
            
            console.log('[AI Interview] ✅ Workout saved to database successfully:', savedWorkout.id);
          } catch (dbError) {
            console.error(`[AI Interview] Database save failed (attempt ${saveAttempts}):`, dbError.message);
            
            if (saveAttempts < maxAttempts) {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000 * saveAttempts));
              console.log('[AI Interview] Retrying database save...');
            } else {
              console.error('[AI Interview] ❌ Failed to save workout after all attempts');
              throw dbError;
            }
          }
        }
      } catch (parseError) {
        console.error('[AI Interview] Error parsing/saving workout:', parseError);
      }
    }

    console.log('[AI Interview] Sending response - workoutGenerated:', workoutGenerated);
    res.json({
      message: cleanMessage || 'Workout plan created!',
      workoutGenerated,
      workout: workoutGenerated ? workout : undefined
    });
  } catch (error) {
    console.error('[AI Interview] Error:', error);
    console.error('[AI Interview] Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type
    });
    
    res.status(500).json({
      error: 'ai_error',
      message: 'Failed to process AI request. ' + (error.message || 'Unknown error'),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// ADMIN INTERVIEW QUESTIONS ENDPOINTS
// ============================================================================

/**
 * GET /api/fitness/admin/interview-questions
 * Get all admin-managed interview questions
 * 
 * Query Parameters:
 * - ?active=true|false (optional) - Filter by active status
 * 
 * Response: { questions: [...] }
 */
router.get('/admin/interview-questions', requireAuth, async (req, res) => {
  try {
    const { active } = req.query;
    
    console.log(`[GET /api/fitness/admin/interview-questions] Fetching interview questions`);
    if (active !== undefined) console.log(`  Filter: active=${active}`);
    
    const where = {};
    
    if (active !== undefined) {
      where.is_active = active === 'true' || active === true;
    }
    
    let questions = await getMainDb().admin_interview_questions.findMany({
      where,
      orderBy: { order_position: 'asc' },
    });
    
    // Auto-seed default questions if none exist
    if (questions.length === 0) {
      console.log('[GET /api/fitness/admin/interview-questions] No questions found - seeding defaults...');
      try {
        const defaultQuestions = [
          {
            question_text: 'What type of workout are you interested in?',
            question_type: 'text',
            order_position: 1,
            is_active: true
          },
          {
            question_text: 'How many days per week can you exercise?',
            question_type: 'multiple_choice',
            options: ['1-2 days', '3-4 days', '5-6 days', '7 days'],
            order_position: 2,
            is_active: true
          },
          {
            question_text: 'What is your current fitness level?',
            question_type: 'multiple_choice',
            options: ['Beginner', 'Intermediate', 'Advanced', 'Elite'],
            order_position: 3,
            is_active: true
          },
          {
            question_text: 'Do you have access to gym equipment?',
            question_type: 'yes_no',
            order_position: 4,
            is_active: true
          },
          {
            question_text: 'How much time can you dedicate per workout (in minutes)?',
            question_type: 'range',
            options: { min: 15, max: 120 },
            order_position: 5,
            is_active: true
          }
        ];

        // Create questions
        for (const q of defaultQuestions) {
          await getMainDb().admin_interview_questions.create({
            data: q
          });
        }
        
        console.log(`✅ Seeded ${defaultQuestions.length} default interview questions`);
        
        // Fetch again after seeding
        questions = await getMainDb().admin_interview_questions.findMany({
          where,
          orderBy: { order_position: 'asc' },
        });
      } catch (seedError) {
        console.error('[GET /api/fitness/admin/interview-questions] Seeding error:', seedError.message);
        // Continue anyway - return empty questions list
      }
    }
    
    console.log(`✅ Retrieved ${questions.length} interview questions`);
    
    res.json({
      questions: questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        order_position: q.order_position,
        is_active: q.is_active,
        created_at: q.created_at,
        updated_at: q.updated_at,
      })),
    });
  } catch (error) {
    console.error('[GET /api/fitness/admin/interview-questions] Error:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve interview questions',
      details: error.message,
    });
  }
});

/**
 * POST /api/fitness/admin/interview-questions
 * Create a new interview question
 * 
 * Request Body:
 * {
 *   question: string (required),
 *   type: "text" | "multiple_choice" | "range" | "yes_no" (required),
 *   options: array (required for multiple_choice, optional for others),
 *   order: number (optional, defaults to 0),
 *   active: boolean (optional, defaults to true)
 * }
 * 
 * Response: { success, question: {...} }
 */
router.post('/admin/interview-questions', requireAuth, async (req, res) => {
  try {
    const { question_text, question_type, options, order_position, is_active } = req.body;
    
    console.log(`[POST /api/fitness/admin/interview-questions] Creating question`);
    console.log(`  Type: ${question_type}, Question: ${question_text?.substring(0, 50)}...`);
    
    // Input validation
    if (!question_text || typeof question_text !== 'string' || !question_text.trim()) {
      return res.status(400).json({
        error: 'missing_question',
        message: 'question_text is required and must be a non-empty string',
      });
    }
    
    if (!question_type || !['text', 'multiple_choice', 'range', 'yes_no'].includes(question_type)) {
      return res.status(400).json({
        error: 'invalid_type',
        message: 'question_type must be one of: text, multiple_choice, range, yes_no',
      });
    }
    
    // Validate options for multiple_choice
    if (question_type === 'multiple_choice') {
      if (!options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          error: 'invalid_options',
          message: 'multiple_choice questions require at least 2 options',
        });
      }
    }
    
    // Create the question
    const newQuestion = await getMainDb().admin_interview_questions.create({
      data: {
        question_text: question_text.trim(),
        question_type: question_type,
        options: options ? options : null,
        order_position: typeof order_position === 'number' ? order_position : 0,
        is_active: is_active !== false, // default to true
      },
    });
    
    console.log(`✨ Question created: ${newQuestion.id}`);
    
    res.json({
      success: true,
      question: {
        id: newQuestion.id,
        question_text: newQuestion.question_text,
        question_type: newQuestion.question_type,
        options: newQuestion.options,
        order_position: newQuestion.order_position,
        is_active: newQuestion.is_active,
        created_at: newQuestion.created_at,
        updated_at: newQuestion.updated_at,
      },
    });
  } catch (error) {
    console.error('[POST /api/fitness/admin/interview-questions] Error:', error.message);
    res.status(500).json({
      error: 'Failed to create interview question',
      details: error.message,
    });
  }
});

/**
 * PUT /api/fitness/admin/interview-questions/:id
 * Update an interview question
 * 
 * Request Body: (any of the following fields)
 * {
 *   question: string (optional),
 *   type: string (optional),
 *   options: array (optional),
 *   order: number (optional),
 *   active: boolean (optional)
 * }
 * 
 * Response: { success, question: {...} }
 */
router.put('/admin/interview-questions/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { question_text, question_type, options, order_position, is_active } = req.body;
    
    console.log(`[PUT /api/fitness/admin/interview-questions/:id] Updating question: ${id}`);
    
    // Check if question exists
    const existingQuestion = await getMainDb().admin_interview_questions.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!existingQuestion) {
      return res.status(404).json({
        error: 'not_found',
        message: `Interview question with ID ${id} not found`,
      });
    }
    
    // Validate inputs if provided
    if (question_type && !['text', 'multiple_choice', 'range', 'yes_no'].includes(question_type)) {
      return res.status(400).json({
        error: 'invalid_type',
        message: 'question_type must be one of: text, multiple_choice, range, yes_no',
      });
    }
    
    if (question_type === 'multiple_choice' && options) {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          error: 'invalid_options',
          message: 'multiple_choice questions require at least 2 options',
        });
      }
    }
    
    // Build update object
    const updateData = {};
    if (question_text !== undefined) updateData.question_text = question_text;
    if (question_type !== undefined) updateData.question_type = question_type;
    if (options !== undefined) updateData.options = options || null;
    if (order_position !== undefined) updateData.order_position = order_position;
    if (is_active !== undefined) updateData.is_active = is_active;
    updateData.updated_at = new Date();
    
    // Update the question
    const updatedQuestion = await getMainDb().admin_interview_questions.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    
    console.log(`📝 Question updated: ${id}`);
    
    res.json({
      success: true,
      question: {
        id: updatedQuestion.id,
        question_text: updatedQuestion.question_text,
        question_type: updatedQuestion.question_type,
        options: updatedQuestion.options,
        order_position: updatedQuestion.order_position,
        is_active: updatedQuestion.is_active,
        created_at: updatedQuestion.created_at,
        updated_at: updatedQuestion.updated_at,
      },
    });
  } catch (error) {
    console.error('[PUT /api/fitness/admin/interview-questions/:id] Error:', error.message);
    res.status(500).json({
      error: 'Failed to update interview question',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/fitness/admin/interview-questions/:id
 * Delete an interview question
 * 
 * Response: { success, message }
 */
router.delete('/admin/interview-questions/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[DELETE /api/fitness/admin/interview-questions/:id] Deleting question: ${id}`);
    
    // Check if question exists
    const existingQuestion = await getMainDb().admin_interview_questions.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!existingQuestion) {
      return res.status(404).json({
        error: 'not_found',
        message: `Interview question with ID ${id} not found`,
      });
    }
    
    // Delete the question
    await getMainDb().admin_interview_questions.delete({
      where: { id: parseInt(id) },
    });
    
    console.log(`🗑️ Question deleted: ${id}`);
    
    res.json({
      success: true,
      message: `Interview question ${id} deleted successfully`,
    });
  } catch (error) {
    console.error('[DELETE /api/fitness/admin/interview-questions/:id] Error:', error.message);
    res.status(500).json({
      error: 'Failed to delete interview question',
      details: error.message,
    });
  }
});

/**
 * PATCH /api/fitness/admin/interview-questions/:id/toggle
 * Toggle the active status of an interview question
 * 
 * Response: { success, question: {...} }
 */
router.patch('/admin/interview-questions/:id/toggle', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[PATCH /api/fitness/admin/interview-questions/:id/toggle] Toggling question: ${id}`);
    
    // Check if question exists
    const existingQuestion = await getMainDb().admin_interview_questions.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!existingQuestion) {
      return res.status(404).json({
        error: 'not_found',
        message: `Interview question with ID ${id} not found`,
      });
    }
    
    // Toggle the active status
    const updatedQuestion = await getMainDb().admin_interview_questions.update({
      where: { id: parseInt(id) },
      data: {
        is_active: !existingQuestion.is_active,
        updated_at: new Date(),
      },
    });
    
    console.log(`🔄 Question toggled: ${id} (is_active=${updatedQuestion.is_active})`);
    
    res.json({
      success: true,
      question: {
        id: updatedQuestion.id,
        question_text: updatedQuestion.question_text,
        question_type: updatedQuestion.question_type,
        options: updatedQuestion.options,
        order_position: updatedQuestion.order_position,
        is_active: updatedQuestion.is_active,
        created_at: updatedQuestion.created_at,
        updated_at: updatedQuestion.updated_at,
      },
    });
  } catch (error) {
    console.error('[PATCH /api/fitness/admin/interview-questions/:id/toggle] Error:', error.message);
    res.status(500).json({
      error: 'Failed to toggle interview question',
      details: error.message,
    });
  }
});

/**
 * PATCH /api/fitness/admin/interview-questions/reorder
 * Reorder interview questions
 * 
 * Request Body:
 * {
 *   questions: [
 *     { id: number, order_position: number },
 *     ...
 *   ]
 * }
 * 
 * Response: { success, questions: [...] }
 */
router.patch('/admin/interview-questions-reorder', async (req, res) => {
  try {
    const { questions } = req.body;
    
    console.log(`[PATCH /api/fitness/admin/interview-questions-reorder] Reordering questions`);
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'questions array is required',
      });
    }
    
    // Update each question's order
    const updatedQuestions = await Promise.all(
      questions.map(q =>
        getMainDb().admin_interview_questions.update({
          where: { id: parseInt(q.id) },
          data: { order_position: q.order_position, updated_at: new Date() },
        })
      )
    );
    
    console.log(`✅ Reordered ${updatedQuestions.length} questions`);
    
    res.json({
      success: true,
      questions: updatedQuestions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        order_position: q.order_position,
        is_active: q.is_active,
        created_at: q.created_at,
        updated_at: q.updated_at,
      })),
    });
  } catch (error) {
    console.error('[PATCH /api/fitness/admin/interview-questions-reorder] Error:', error.message);
    res.status(500).json({
      error: 'Failed to reorder questions',
      details: error.message,
    });
  }
});

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
  console.error('[Fitness Routes] Unhandled error:', error);
  res.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

module.exports = router;

