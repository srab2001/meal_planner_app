require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const OpenAI = require('openai');

const {
  PORT,
  NODE_ENV = 'development',
  SESSION_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  FRONTEND_BASE,
  OPENAI_API_KEY
} = process.env;

// basic env checks
console.log('GOOGLE_CLIENT_ID present:', !!GOOGLE_CLIENT_ID);
console.log(
  'GOOGLE_CLIENT_ID prefix:',
  GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.slice(0, 20) : null
);
console.log('GOOGLE_CALLBACK_URL:', GOOGLE_CALLBACK_URL);
console.log('FRONTEND_BASE:', FRONTEND_BASE);

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.error('Google OAuth env values not set');
  process.exit(1);
}

if (!SESSION_SECRET) {
  console.error('SESSION_SECRET not set');
  process.exit(1);
}

const app = express();

// behind Render proxy
app.set('trust proxy', 1);

// CORS: allow frontend and cookies
app.use(
  cors({
    origin: FRONTEND_BASE || 'http://localhost:3000',
    credentials: true
  })
);

app.use(express.json());

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: NODE_ENV === 'production',
      httpOnly: true,
      sameSite: NODE_ENV === 'production' ? 'none' : 'lax'
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Google OAuth
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails && profile.emails[0] && profile.emails[0].value;

        if (!email) {
          return done(new Error('email not in Google profile'));
        }

        const user = {
          id: profile.id,
          email,
          full_name: profile.displayName,
          picture:
            profile.photos && profile.photos[0] && profile.photos[0].value,
          role: null
        };

        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  next();
}

// health check
app.get('/health', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log('Health check at', timestamp);
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Google login
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback
app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect:
      (FRONTEND_BASE || 'http://localhost:3000') + '/login?error=1',
    session: true
  }),
  (req, res) => {
    const frontend = FRONTEND_BASE || 'http://localhost:3000';
    res.redirect(frontend);
  }
);

// current user
app.get('/auth/user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ user: null });
  }

  res.json({
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.full_name,
    role: req.user.role || null,
    picture: req.user.picture || null
  });
});

// logout
app.post('/auth/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
});

// simple profile endpoint
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.full_name
  });
});

// placeholder for meal generation route
// replace with your real logic that calls OpenAI when you are ready
app.post('/api/generate-meals', requireAuth, async (req, res) => {
  return res
    .status(501)
    .json({ error: 'generate-meals route not wired on this server build' });
});

// ============================================
// FITNESS API ROUTES
// ============================================

// In-memory storage for workouts (replace with database later)
const workoutStorage = new Map();

// Initialize OpenAI client
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Get all workouts for authenticated user
app.get('/api/fitness/workouts', requireAuth, (req, res) => {
  const userId = req.user.id;
  const userWorkouts = workoutStorage.get(userId) || [];

  res.json({
    workouts: userWorkouts.map(workout => ({
      ...workout,
      exerciseCount: workout.exercises?.length || 0,
      duration: calculateWorkoutDuration(workout)
    }))
  });
});

// Create new workout
app.post('/api/fitness/workouts', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const { workoutDate, workoutName, exercises, notes } = req.body;

    // Validation
    if (!workoutName || !workoutDate || !exercises || exercises.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: workoutName, workoutDate, and exercises'
      });
    }

    // Create workout object
    const workout = {
      id: Date.now().toString(),
      userId,
      workoutDate,
      workoutName,
      exercises,
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    // Store workout
    const userWorkouts = workoutStorage.get(userId) || [];
    userWorkouts.push(workout);
    workoutStorage.set(userId, userWorkouts);

    res.status(201).json({
      success: true,
      workout: {
        ...workout,
        exerciseCount: exercises.length,
        duration: calculateWorkoutDuration(workout)
      }
    });
  } catch (error) {
    console.error('Error creating workout:', error);
    res.status(500).json({ error: 'Failed to create workout' });
  }
});

// Get weekly fitness stats
app.get('/api/fitness/stats/weekly', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const userWorkouts = workoutStorage.get(userId) || [];

    // Filter workouts from last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyWorkouts = userWorkouts.filter(workout => {
      const workoutDate = new Date(workout.workoutDate);
      return workoutDate >= sevenDaysAgo && workoutDate <= now;
    });

    // Calculate stats
    const workoutCount = weeklyWorkouts.length;
    const totalDuration = weeklyWorkouts.reduce((sum, w) => {
      return sum + calculateWorkoutDuration(w);
    }, 0);

    const completionRate = workoutCount > 0 ? Math.round((workoutCount / 7) * 100) : 0;
    const estimatedCalories = totalDuration * 5; // Rough estimate: 5 cal/min

    res.json({
      workoutCount,
      totalDuration,
      completionRate: Math.min(completionRate, 100),
      estimatedCalories
    });
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    res.status(500).json({ error: 'Failed to fetch weekly stats' });
  }
});

// Delete workout
app.delete('/api/fitness/workouts/:id', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const workoutId = req.params.id;
    const userWorkouts = workoutStorage.get(userId) || [];

    const filteredWorkouts = userWorkouts.filter(w => w.id !== workoutId);

    if (filteredWorkouts.length === userWorkouts.length) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    workoutStorage.set(userId, filteredWorkouts);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

// AI Workout Generation
app.post('/api/fitness/ai/generate-workout', requireAuth, async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        error: 'AI workout generation is not available. OpenAI API key not configured.'
      });
    }

    const {
      fitnessGoal,
      experienceLevel,
      workoutDuration,
      equipment,
      targetMuscles,
      daysPerWeek
    } = req.body;

    // Validate required fields
    if (!fitnessGoal || !experienceLevel || !workoutDuration || !equipment || equipment.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: fitnessGoal, experienceLevel, workoutDuration, equipment'
      });
    }

    // Build the prompt for OpenAI
    const prompt = buildWorkoutPrompt({
      fitnessGoal,
      experienceLevel,
      workoutDuration,
      equipment,
      targetMuscles,
      daysPerWeek
    });

    console.log('Generating AI workout with OpenAI...');

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional fitness coach and personal trainer. Create personalized workout plans based on user preferences. Return ONLY valid JSON without markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseText = completion.choices[0].message.content.trim();

    // Parse the JSON response
    let workoutData;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      workoutData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Format the workout for our frontend
    const formattedWorkout = {
      workoutDate: new Date().toISOString().split('T')[0],
      workoutName: workoutData.workoutName || `${fitnessGoal} Workout`,
      exercises: workoutData.exercises.map(ex => ({
        exerciseName: ex.name || ex.exerciseName,
        category: ex.category || 'General',
        sets: ex.sets.map(set => ({
          reps: set.reps || 10,
          weight: set.weight || 0,
          unit: set.unit || 'lbs'
        }))
      })),
      notes: workoutData.notes || workoutData.coachNotes || ''
    };

    res.json({
      success: true,
      workout: formattedWorkout
    });

  } catch (error) {
    console.error('Error generating AI workout:', error);

    if (error.status === 401) {
      return res.status(503).json({
        error: 'Invalid OpenAI API key. Please check your configuration.'
      });
    }

    res.status(500).json({
      error: error.message || 'Failed to generate AI workout'
    });
  }
});

// Helper function to build workout generation prompt
function buildWorkoutPrompt(params) {
  const {
    fitnessGoal,
    experienceLevel,
    workoutDuration,
    equipment,
    targetMuscles,
    daysPerWeek
  } = params;

  const goalDescriptions = {
    muscle_gain: 'build muscle mass and increase size',
    weight_loss: 'lose weight and burn fat',
    endurance: 'improve cardiovascular endurance and stamina',
    strength: 'increase maximum strength and power',
    flexibility: 'enhance flexibility and mobility',
    general: 'improve overall fitness and health'
  };

  const muscleTargets = targetMuscles && targetMuscles.length > 0
    ? ` Focus on these muscle groups: ${targetMuscles.join(', ')}.`
    : '';

  return `Create a ${workoutDuration}-minute workout plan for someone who wants to ${goalDescriptions[fitnessGoal]}.

Experience Level: ${experienceLevel}
Available Equipment: ${equipment.join(', ')}
Days per Week: ${daysPerWeek}${muscleTargets}

Requirements:
1. Create ${Math.min(8, Math.floor(parseInt(workoutDuration) / 5))} exercises appropriate for ${experienceLevel} level
2. Each exercise should have 3-4 sets
3. Provide appropriate rep ranges for the fitness goal
4. Include exercise categories (Chest, Back, Legs, Shoulders, Arms, Core)
5. Add helpful coaching notes at the end

Return ONLY a JSON object in this exact format (no markdown, no code blocks):
{
  "workoutName": "Descriptive workout name",
  "exercises": [
    {
      "name": "Exercise name",
      "category": "Muscle group",
      "sets": [
        {"reps": 10, "weight": 0, "unit": "lbs"}
      ]
    }
  ],
  "notes": "Coaching tips and form cues"
}`;
}

// Helper function to calculate workout duration
function calculateWorkoutDuration(workout) {
  // Estimate: 3 minutes per set + 1 minute rest
  let totalSets = 0;
  (workout.exercises || []).forEach(exercise => {
    totalSets += (exercise.sets || []).length;
  });
  return Math.max(totalSets * 4, 20); // Minimum 20 minutes
}

// Global error handler - must be after all routes
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

const port = PORT || 5000;
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});