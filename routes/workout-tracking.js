/**
 * Workout Tracking Module - Express Routes
 *
 * Endpoints:
 * - GET /api/workouts/templates - List user's workout templates
 * - POST /api/workouts/templates - Create a new template
 * - GET /api/workouts/templates/:id - Get template details
 * - PUT /api/workouts/templates/:id - Update a template
 * - DELETE /api/workouts/templates/:id - Delete a template
 * - POST /api/workouts/session/start - Start a new workout session
 * - GET /api/workouts/session/:id - Get session details
 * - PATCH /api/workouts/session/:id/exercise/:exerciseId - Update exercise completion
 * - PATCH /api/workouts/session/:id/finish - Finish a workout session
 * - PATCH /api/workouts/session/:id/reset - Reset a session
 * - GET /api/workouts/calendar - Get calendar data for a month
 * - GET /api/workouts/calendar/day - Get sessions for a specific day
 *
 * Security:
 * - All routes require authentication (requireAuth middleware)
 * - All queries scoped to authenticated user_id
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();

// JWT Secret from environment
const JWT_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'your-secret-key';

// Lazy-initialize Prisma client
let prisma = null;

function getDb() {
  if (!prisma) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }
    prisma = new PrismaClient({
      datasources: { db: { url: dbUrl } },
      log: ['warn', 'error'],
    });
    console.log('[Workout Tracking] ✅ Prisma client initialized');
  }
  return prisma;
}

/**
 * Authentication Middleware
 */
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, error_code: 'missing_token', message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('[Workout Auth] Token verification failed:', error.message);
    return res.status(401).json({ ok: false, error_code: 'invalid_token', message: 'Invalid or expired token' });
  }
};

// Apply auth to all routes
router.use(requireAuth);

// ============================================================================
// TEMPLATES ENDPOINTS
// ============================================================================

/**
 * GET /api/workouts/templates
 * List user's workout templates with derived status
 */
router.get('/templates', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { search, filter } = req.query;

    // Get templates with their latest sessions
    const templates = await db.workout_templates.findMany({
      where: {
        user_id: userId,
        ...(search && { name: { contains: search, mode: 'insensitive' } })
      },
      include: {
        exercises: { orderBy: { sort_order: 'asc' } },
        sessions: {
          orderBy: { created_at: 'desc' },
          take: 10
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    // Derive status and last_completed_at for each template
    const templatesWithStatus = templates.map(template => {
      const sessions = template.sessions;
      const inProgressSession = sessions.find(s => s.status === 'in_progress');
      const finishedSessions = sessions.filter(s => s.status === 'finished');
      const lastFinished = finishedSessions[0];

      let status = 'not_started';
      if (inProgressSession) status = 'in_progress';
      else if (finishedSessions.length > 0) status = 'done';

      return {
        id: template.id,
        name: template.name,
        notes: template.notes,
        exercise_count: template.exercises.length,
        status,
        last_completed_at: lastFinished?.finished_at || null,
        in_progress_session_id: inProgressSession?.id || null,
        latest_finished_session_id: lastFinished?.id || null,
        created_at: template.created_at,
        updated_at: template.updated_at
      };
    });

    // Apply filter
    let filtered = templatesWithStatus;
    if (filter && filter !== 'all') {
      if (filter === 'not_started') filtered = templatesWithStatus.filter(t => t.status === 'not_started');
      else if (filter === 'in_progress') filtered = templatesWithStatus.filter(t => t.status === 'in_progress');
      else if (filter === 'done') filtered = templatesWithStatus.filter(t => t.status === 'done');
    }

    res.json({ ok: true, templates: filtered });
  } catch (error) {
    console.error('[GET /templates] Error:', error);
    res.status(500).json({ ok: false, error_code: 'server_error', message: error.message });
  }
});

/**
 * POST /api/workouts/templates
 * Create a new workout template
 */
router.post('/templates', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { name, notes, exercises } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, error_code: 'missing_name', message: 'Template name is required' });
    }

    const template = await db.workout_templates.create({
      data: {
        user_id: userId,
        name: name.trim(),
        notes: notes || null,
        exercises: exercises?.length ? {
          create: exercises.map((ex, index) => ({
            sort_order: index + 1,
            name: ex.name,
            prescription_type: ex.prescription_type || 'reps',
            sets: ex.sets || null,
            reps: ex.reps || null,
            seconds: ex.seconds || null,
            rest_seconds: ex.rest_seconds || null
          }))
        } : undefined
      },
      include: { exercises: { orderBy: { sort_order: 'asc' } } }
    });

    res.json({ ok: true, template });
  } catch (error) {
    console.error('[POST /templates] Error:', error);
    res.status(500).json({ ok: false, error_code: 'server_error', message: error.message });
  }
});

/**
 * GET /api/workouts/templates/:id
 * Get template details
 */
router.get('/templates/:id', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { id } = req.params;

    const template = await db.workout_templates.findFirst({
      where: { id, user_id: userId },
      include: { exercises: { orderBy: { sort_order: 'asc' } } }
    });

    if (!template) {
      return res.status(404).json({ ok: false, error_code: 'not_found', message: 'Template not found' });
    }

    res.json({ ok: true, template });
  } catch (error) {
    console.error('[GET /templates/:id] Error:', error);
    res.status(500).json({ ok: false, error_code: 'server_error', message: error.message });
  }
});

/**
 * PUT /api/workouts/templates/:id
 * Update a template
 */
router.put('/templates/:id', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { id } = req.params;
    const { name, notes, exercises } = req.body;

    // Verify ownership
    const existing = await db.workout_templates.findFirst({ where: { id, user_id: userId } });
    if (!existing) {
      return res.status(404).json({ ok: false, error_code: 'not_found', message: 'Template not found' });
    }

    // Update template and replace exercises
    const template = await db.workout_templates.update({
      where: { id },
      data: {
        name: name?.trim() || existing.name,
        notes: notes !== undefined ? notes : existing.notes,
        updated_at: new Date()
      }
    });

    // If exercises provided, replace them
    if (exercises) {
      await db.workout_template_exercises.deleteMany({ where: { workout_template_id: id } });
      await db.workout_template_exercises.createMany({
        data: exercises.map((ex, index) => ({
          workout_template_id: id,
          sort_order: index + 1,
          name: ex.name,
          prescription_type: ex.prescription_type || 'reps',
          sets: ex.sets || null,
          reps: ex.reps || null,
          seconds: ex.seconds || null,
          rest_seconds: ex.rest_seconds || null
        }))
      });
    }

    const updated = await db.workout_templates.findFirst({
      where: { id },
      include: { exercises: { orderBy: { sort_order: 'asc' } } }
    });

    res.json({ ok: true, template: updated });
  } catch (error) {
    console.error('[PUT /templates/:id] Error:', error);
    res.status(500).json({ ok: false, error_code: 'server_error', message: error.message });
  }
});

/**
 * DELETE /api/workouts/templates/:id
 * Delete a template
 */
router.delete('/templates/:id', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await db.workout_templates.findFirst({ where: { id, user_id: userId } });
    if (!existing) {
      return res.status(404).json({ ok: false, error_code: 'not_found', message: 'Template not found' });
    }

    await db.workout_templates.delete({ where: { id } });

    res.json({ ok: true, message: 'Template deleted' });
  } catch (error) {
    console.error('[DELETE /templates/:id] Error:', error);
    res.status(500).json({ ok: false, error_code: 'server_error', message: error.message });
  }
});

// ============================================================================
// SESSION ENDPOINTS
// ============================================================================

/**
 * POST /api/workouts/session/start
 * Start a new workout session from a template
 */
router.post('/session/start', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { workout_template_id } = req.body;

    if (!workout_template_id) {
      return res.status(400).json({ ok: false, error_code: 'missing_template', message: 'workout_template_id is required' });
    }

    // Get template with exercises
    const template = await db.workout_templates.findFirst({
      where: { id: workout_template_id, user_id: userId },
      include: { exercises: { orderBy: { sort_order: 'asc' } } }
    });

    if (!template) {
      return res.status(404).json({ ok: false, error_code: 'template_not_found', message: 'Template not found' });
    }

    // Check for existing in-progress session
    const existingSession = await db.workout_sessions.findFirst({
      where: { workout_template_id, user_id: userId, status: 'in_progress' }
    });

    if (existingSession) {
      return res.status(409).json({
        ok: false,
        error_code: 'session_in_progress',
        message: 'A session is already in progress for this template',
        session_id: existingSession.id
      });
    }

    // Create session with exercise snapshots
    const session = await db.workout_sessions.create({
      data: {
        user_id: userId,
        workout_template_id,
        status: 'in_progress',
        started_at: new Date(),
        completion_percent: 0,
        exercises: {
          create: template.exercises.map(ex => ({
            workout_template_exercise_id: ex.id,
            name_snapshot: ex.name,
            sort_order_snapshot: ex.sort_order,
            prescription_snapshot: {
              prescription_type: ex.prescription_type,
              sets: ex.sets,
              reps: ex.reps,
              seconds: ex.seconds,
              rest_seconds: ex.rest_seconds
            },
            is_completed: false
          }))
        }
      },
      include: {
        template: true,
        exercises: { orderBy: { sort_order_snapshot: 'asc' } }
      }
    });

    res.json({ ok: true, session });
  } catch (error) {
    console.error('[POST /session/start] Error:', error);
    res.status(500).json({ ok: false, error_code: 'server_error', message: error.message });
  }
});

/**
 * GET /api/workouts/session/:id
 * Get session details
 */
router.get('/session/:id', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { id } = req.params;

    const session = await db.workout_sessions.findFirst({
      where: { id, user_id: userId },
      include: {
        template: true,
        exercises: { orderBy: { sort_order_snapshot: 'asc' } }
      }
    });

    if (!session) {
      return res.status(404).json({ ok: false, error_code: 'not_found', message: 'Session not found' });
    }

    res.json({ ok: true, session });
  } catch (error) {
    console.error('[GET /session/:id] Error:', error);
    res.status(500).json({ ok: false, error_code: 'server_error', message: error.message });
  }
});

/**
 * PATCH /api/workouts/session/:id/exercise/:exerciseId
 * Update exercise completion status
 */
router.patch('/session/:id/exercise/:exerciseId', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { id, exerciseId } = req.params;
    const { is_completed, notes } = req.body;

    // Verify session ownership
    const session = await db.workout_sessions.findFirst({
      where: { id, user_id: userId }
    });

    if (!session) {
      return res.status(404).json({ ok: false, error_code: 'session_not_found', message: 'Session not found' });
    }

    // Update exercise
    const updateData = { updated_at: new Date() };
    if (is_completed !== undefined) {
      updateData.is_completed = is_completed;
      updateData.completed_at = is_completed ? new Date() : null;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    await db.workout_session_exercises.update({
      where: { id: exerciseId },
      data: updateData
    });

    // Recalculate completion percentage
    const allExercises = await db.workout_session_exercises.findMany({
      where: { workout_session_id: id }
    });
    const completedCount = allExercises.filter(e => e.is_completed).length;
    const completionPercent = Math.round((completedCount / allExercises.length) * 100);

    await db.workout_sessions.update({
      where: { id },
      data: { completion_percent: completionPercent, updated_at: new Date() }
    });

    // Return updated session
    const updatedSession = await db.workout_sessions.findFirst({
      where: { id },
      include: {
        template: true,
        exercises: { orderBy: { sort_order_snapshot: 'asc' } }
      }
    });

    res.json({ ok: true, session: updatedSession });
  } catch (error) {
    console.error('[PATCH /session/:id/exercise/:exerciseId] Error:', error);
    res.status(500).json({ ok: false, error_code: 'server_error', message: error.message });
  }
});

/**
 * PATCH /api/workouts/session/:id/finish
 * Finish a workout session
 */
router.patch('/session/:id/finish', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { id } = req.params;
    const { day_note } = req.body;

    const session = await db.workout_sessions.findFirst({
      where: { id, user_id: userId }
    });

    if (!session) {
      return res.status(404).json({ ok: false, error_code: 'not_found', message: 'Session not found' });
    }

    const updateData = {
      status: 'finished',
      finished_at: new Date(),
      updated_at: new Date()
    };

    if (day_note !== undefined) {
      updateData.day_note = day_note;
    }

    await db.workout_sessions.update({
      where: { id },
      data: updateData
    });

    const updatedSession = await db.workout_sessions.findFirst({
      where: { id },
      include: {
        template: true,
        exercises: { orderBy: { sort_order_snapshot: 'asc' } }
      }
    });

    res.json({ ok: true, session: updatedSession });
  } catch (error) {
    console.error('[PATCH /session/:id/finish] Error:', error);
    res.status(500).json({ ok: false, error_code: 'server_error', message: error.message });
  }
});

/**
 * PATCH /api/workouts/session/:id/reset
 * Reset a workout session
 */
router.patch('/session/:id/reset', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { id } = req.params;

    const session = await db.workout_sessions.findFirst({
      where: { id, user_id: userId }
    });

    if (!session) {
      return res.status(404).json({ ok: false, error_code: 'not_found', message: 'Session not found' });
    }

    // Reset session
    await db.workout_sessions.update({
      where: { id },
      data: {
        status: 'in_progress',
        finished_at: null,
        completion_percent: 0,
        updated_at: new Date()
      }
    });

    // Reset all exercises
    await db.workout_session_exercises.updateMany({
      where: { workout_session_id: id },
      data: {
        is_completed: false,
        completed_at: null,
        updated_at: new Date()
      }
    });

    const updatedSession = await db.workout_sessions.findFirst({
      where: { id },
      include: {
        template: true,
        exercises: { orderBy: { sort_order_snapshot: 'asc' } }
      }
    });

    res.json({ ok: true, session: updatedSession });
  } catch (error) {
    console.error('[PATCH /session/:id/reset] Error:', error);
    res.status(500).json({ ok: false, error_code: 'server_error', message: error.message });
  }
});

// ============================================================================
// CALENDAR ENDPOINTS
// ============================================================================

/**
 * GET /api/workouts/calendar
 * Get calendar data for a month
 * Query: month=YYYY-MM
 */
router.get('/calendar', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ ok: false, error_code: 'invalid_month', message: 'month must be in YYYY-MM format' });
    }

    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    const sessions = await db.workout_sessions.findMany({
      where: {
        user_id: userId,
        status: 'finished',
        finished_at: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { template: { select: { name: true } } },
      orderBy: { finished_at: 'asc' }
    });

    // Group by day
    const dayMap = {};
    sessions.forEach(session => {
      const day = session.finished_at.toISOString().split('T')[0];
      if (!dayMap[day]) {
        dayMap[day] = { date: day, count: 0, sessions: [] };
      }
      dayMap[day].count++;
      dayMap[day].sessions.push({
        id: session.id,
        template_name: session.template.name,
        completion_percent: session.completion_percent,
        finished_at: session.finished_at
      });
    });

    res.json({
      ok: true,
      month,
      days: Object.values(dayMap)
    });
  } catch (error) {
    console.error('[GET /calendar] Error:', error);
    res.status(500).json({ ok: false, error_code: 'server_error', message: error.message });
  }
});

/**
 * GET /api/workouts/calendar/day
 * Get sessions for a specific day
 * Query: date=YYYY-MM-DD
 */
router.get('/calendar/day', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ ok: false, error_code: 'invalid_date', message: 'date must be in YYYY-MM-DD format' });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const sessions = await db.workout_sessions.findMany({
      where: {
        user_id: userId,
        status: 'finished',
        finished_at: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        template: { select: { name: true } },
        exercises: { orderBy: { sort_order_snapshot: 'asc' } }
      },
      orderBy: { finished_at: 'asc' }
    });

    res.json({
      ok: true,
      date,
      sessions: sessions.map(s => ({
        id: s.id,
        template_name: s.template.name,
        completion_percent: s.completion_percent,
        started_at: s.started_at,
        finished_at: s.finished_at,
        day_note: s.day_note,
        exercises: s.exercises
      }))
    });
  } catch (error) {
    console.error('[GET /calendar/day] Error:', error);
    res.status(500).json({ ok: false, error_code: 'server_error', message: error.message });
  }
});

/**
 * PATCH /api/workouts/session/:id/note
 * Update session day note
 */
router.patch('/session/:id/note', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user.id;
    const { id } = req.params;
    const { day_note } = req.body;

    const session = await db.workout_sessions.findFirst({
      where: { id, user_id: userId }
    });

    if (!session) {
      return res.status(404).json({ ok: false, error_code: 'not_found', message: 'Session not found' });
    }

    await db.workout_sessions.update({
      where: { id },
      data: { day_note, updated_at: new Date() }
    });

    res.json({ ok: true, message: 'Note updated' });
  } catch (error) {
    console.error('[PATCH /session/:id/note] Error:', error);
    res.status(500).json({ ok: false, error_code: 'server_error', message: error.message });
  }
});

module.exports = router;
