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
 * 
 * Security:
 * - All routes require authentication (requireAuth middleware)
 * - All queries scoped to authenticated user_id
 * - User data isolation enforced via WHERE user_id = $N
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();

// Lazy-initialize Prisma client on first use to avoid failures at module load time
// Use main DATABASE_URL instead of separate FITNESS_DATABASE_URL
let fitnessDb = null;

function getDb() {
  if (!fitnessDb) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Fitness routes cannot operate without a database connection.'
      );
    }
    
    fitnessDb = new PrismaClient({
      datasources: {
        db: { url: dbUrl },
      },
    });
  }
  return fitnessDb;
}

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user context
 */
function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      error: 'not_authenticated',
      message: 'Authentication required',
    });
  }
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

    const profile = await getDb().fitness_profiles.findUnique({
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
    const existingProfile = await getDb().fitness_profiles.findUnique({
      where: { user_id: userId },
    });

    let profile;

    if (existingProfile) {
      // Update existing profile
      profile = await getDb().fitness_profiles.update({
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
      profile = await getDb().fitness_profiles.create({
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

    const workouts = await getDb().fitness_workouts.findMany({
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
    const existingWorkout = await getDb().fitness_workouts.findFirst({
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
    const workout = await getDb().fitness_workouts.create({
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

    const goals = await getDb().fitness_goals.findMany({
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
    const goal = await getDb().fitness_goals.create({
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

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'invalid_input',
        message: 'Messages array is required'
      });
    }

    // Check if OpenAI API is available
    const openai = req.app.locals.openai;
    if (!openai) {
      return res.status(503).json({
        error: 'service_unavailable',
        message: 'AI service is not available'
      });
    }

    // Build context for AI
    const systemPrompt = `You are a professional fitness coach. Your goal is to interview the user about their workout preferences and create a personalized workout plan.

Interview flow:
1. Start by asking about their preferred exercise type
2. Ask about duration/intensity preference
3. Ask about any physical limitations or preferences
4. After gathering info, generate a detailed workout plan

When you have enough information (usually after 3-4 exchanges), generate a JSON workout object and include it in your response like this:
<WORKOUT_JSON>
{
  "exercise_type": "string",
  "duration_minutes": number,
  "calories_burned": number,
  "intensity": "low|medium|high",
  "notes": "detailed workout description"
}
</WORKOUT_JSON>

Be friendly, encouraging, and professional. Keep responses concise.`;

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
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

    // Check if workout was generated
    const workoutMatch = aiMessage.match(/<WORKOUT_JSON>([\s\S]*?)<\/WORKOUT_JSON>/);
    let workoutGenerated = false;
    let workout = null;
    let cleanMessage = aiMessage;

    if (workoutMatch) {
      try {
        workout = JSON.parse(workoutMatch[1]);
        workoutGenerated = true;
        // Remove the JSON tags from the message
        cleanMessage = aiMessage.replace(/<WORKOUT_JSON>[\s\S]*?<\/WORKOUT_JSON>/, '').trim();
        
        // Save the workout to database
        await getDb().fitness_workouts.create({
          data: {
            user_id: userId,
            exercise_type: workout.exercise_type,
            duration_minutes: workout.duration_minutes,
            calories_burned: workout.calories_burned,
            intensity: workout.intensity,
            notes: workout.notes,
            workout_date: new Date()
          }
        });
      } catch (parseError) {
        console.error('Error parsing/saving workout:', parseError);
      }
    }

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

