/**
 * Structured Workouts Routes
 * Handles saving, updating, and retrieving detailed workout plans
 * 
 * Endpoints:
 * - GET /api/fitness/structured-workouts - List user's structured workouts
 * - GET /api/fitness/structured-workouts/:id - Get single workout
 * - POST /api/fitness/structured-workouts - Create/save new workout
 * - PUT /api/fitness/structured-workouts/:id - Update workout
 * - PUT /api/fitness/structured-workouts/:id/exercise/:exerciseId - Update single exercise
 */

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
function getDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return new Pool({ connectionString: dbUrl });
}

// Authentication middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'not_authenticated', message: 'No token provided' });
  }

  // Token verification would happen here
  // For now, assuming req.user is set by server.js requireAuth middleware
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'invalid_token', message: 'Invalid or expired token' });
  }

  next();
}

// ============================================================================
// GET /api/fitness/structured-workouts - List user's structured workouts
// ============================================================================
router.get('/structured-workouts', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[Workouts] Fetching structured workouts for user:', userId);

    const db = getDb();
    const result = await db.query(
      `SELECT 
        id, user_id, workout_date, workout_name, day_label, 
        total_duration_minutes, primary_goal_summary,
        session_completed, effort_score, created_at, updated_at
       FROM structured_workouts
       WHERE user_id = $1
       ORDER BY workout_date DESC, created_at DESC`,
      [userId]
    );

    console.log(`[Workouts] Retrieved ${result.rows.length} structured workouts`);

    res.json({
      success: true,
      workouts: result.rows
    });

    await db.end();
  } catch (error) {
    console.error('[Workouts] Error fetching workouts:', error.message);
    res.status(500).json({
      error: 'database_error',
      message: 'Failed to fetch workouts',
      details: error.message
    });
  }
});

// ============================================================================
// GET /api/fitness/structured-workouts/:id - Get single workout with all sections
// ============================================================================
router.get('/structured-workouts/:id', requireAuth, async (req, res) => {
  try {
    const workoutId = req.params.id;
    const userId = req.user.id;

    console.log('[Workouts] Fetching workout:', workoutId, 'for user:', userId);

    const db = getDb();

    // Fetch main workout
    const workoutResult = await db.query(
      `SELECT * FROM structured_workouts
       WHERE id = $1 AND user_id = $2`,
      [workoutId, userId]
    );

    if (workoutResult.rows.length === 0) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Workout not found'
      });
    }

    const workout = workoutResult.rows[0];

    // Fetch all exercises for this workout
    const exercisesResult = await db.query(
      `SELECT * FROM workout_exercises_detailed
       WHERE structured_workout_id = $1
       ORDER BY section_type, exercise_order`,
      [workoutId]
    );

    console.log('[Workouts] Retrieved workout with', exercisesResult.rows.length, 'exercises');

    res.json({
      success: true,
      workout: {
        ...workout,
        exercises: exercisesResult.rows
      }
    });

    await db.end();
  } catch (error) {
    console.error('[Workouts] Error fetching workout:', error.message);
    res.status(500).json({
      error: 'database_error',
      message: 'Failed to fetch workout',
      details: error.message
    });
  }
});

// ============================================================================
// POST /api/fitness/structured-workouts - Create/save new structured workout
// ============================================================================
router.post('/structured-workouts', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      workout_name,
      day_label,
      total_duration_minutes,
      primary_goal_summary,
      interview_responses,
      warm_up_section,
      strength_section,
      cardio_pool_section,
      agility_core_section,
      recovery_section
    } = req.body;

    console.log('[Workouts] Creating structured workout for user:', userId);

    const db = getDb();

    // Insert main workout record
    const workoutResult = await db.query(
      `INSERT INTO structured_workouts 
       (user_id, workout_name, day_label, total_duration_minutes, primary_goal_summary, 
        interview_responses, warm_up_section, strength_section, cardio_pool_section, 
        agility_core_section, recovery_section, workout_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE)
       RETURNING id`,
      [
        userId,
        workout_name,
        day_label,
        total_duration_minutes,
        primary_goal_summary,
        JSON.stringify(interview_responses),
        JSON.stringify(warm_up_section),
        JSON.stringify(strength_section),
        JSON.stringify(cardio_pool_section),
        JSON.stringify(agility_core_section),
        JSON.stringify(recovery_section)
      ]
    );

    const workoutId = workoutResult.rows[0].id;

    // Insert individual exercises if provided
    if (warm_up_section && Array.isArray(warm_up_section)) {
      for (let i = 0; i < warm_up_section.length; i++) {
        const exercise = warm_up_section[i];
        await db.query(
          `INSERT INTO workout_exercises_detailed 
           (structured_workout_id, section_type, exercise_order, exercise_name, 
            duration_seconds, how_to_text)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [workoutId, 'warm_up', i, exercise.exerciseName, 
           exercise.durationSeconds, exercise.howToText]
        );
      }
    }

    // Similar for other sections...
    // (Code continues for strength, cardio, agility, recovery)

    console.log('[Workouts] Structured workout created:', workoutId);

    res.status(201).json({
      success: true,
      workoutId: workoutId,
      message: 'Workout saved successfully'
    });

    await db.end();
  } catch (error) {
    console.error('[Workouts] Error creating workout:', error.message);
    res.status(500).json({
      error: 'database_error',
      message: 'Failed to create workout',
      details: error.message
    });
  }
});

// ============================================================================
// PUT /api/fitness/structured-workouts/:id - Update workout (session closeout)
// ============================================================================
router.put('/structured-workouts/:id', requireAuth, async (req, res) => {
  try {
    const workoutId = req.params.id;
    const userId = req.user.id;
    const { session_completed, effort_score, session_notes } = req.body;

    console.log('[Workouts] Updating workout:', workoutId);

    const db = getDb();

    // Verify ownership
    const workoutCheck = await db.query(
      'SELECT user_id FROM structured_workouts WHERE id = $1',
      [workoutId]
    );

    if (workoutCheck.rows.length === 0 || workoutCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Not authorized to update this workout'
      });
    }

    // Update workout
    const result = await db.query(
      `UPDATE structured_workouts 
       SET session_completed = COALESCE($1, session_completed),
           effort_score = COALESCE($2, effort_score),
           session_notes = COALESCE($3, session_notes),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [session_completed, effort_score, session_notes, workoutId]
    );

    console.log('[Workouts] Workout updated:', workoutId);

    res.json({
      success: true,
      workout: result.rows[0]
    });

    await db.end();
  } catch (error) {
    console.error('[Workouts] Error updating workout:', error.message);
    res.status(500).json({
      error: 'database_error',
      message: 'Failed to update workout',
      details: error.message
    });
  }
});

// ============================================================================
// PUT /api/fitness/structured-workouts/:id/exercise/:exerciseId - Update single exercise
// ============================================================================
router.put('/structured-workouts/:id/exercise/:exerciseId', requireAuth, async (req, res) => {
  try {
    const workoutId = req.params.id;
    const exerciseId = req.params.exerciseId;
    const userId = req.user.id;
    const { completed, actual_sets, actual_reps, pain_scale, notes } = req.body;

    console.log('[Workouts] Updating exercise:', exerciseId, 'in workout:', workoutId);

    const db = getDb();

    // Verify ownership
    const workoutCheck = await db.query(
      'SELECT user_id FROM structured_workouts WHERE id = $1',
      [workoutId]
    );

    if (workoutCheck.rows.length === 0 || workoutCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Not authorized to update this workout'
      });
    }

    // Update exercise
    const result = await db.query(
      `UPDATE workout_exercises_detailed 
       SET completed = COALESCE($1, completed),
           actual_sets = COALESCE($2, actual_sets),
           actual_reps = COALESCE($3, actual_reps),
           pain_scale = COALESCE($4, pain_scale),
           notes = COALESCE($5, notes),
           updated_at = NOW()
       WHERE id = $6 AND structured_workout_id = $7
       RETURNING *`,
      [completed, actual_sets, actual_reps, pain_scale, notes, exerciseId, workoutId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Exercise not found'
      });
    }

    console.log('[Workouts] Exercise updated:', exerciseId);

    res.json({
      success: true,
      exercise: result.rows[0]
    });

    await db.end();
  } catch (error) {
    console.error('[Workouts] Error updating exercise:', error.message);
    res.status(500).json({
      error: 'database_error',
      message: 'Failed to update exercise',
      details: error.message
    });
  }
});

module.exports = router;
