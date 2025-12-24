# Monorepo Architecture - Complete Reference

## Quick Answer to Your Question

| Question | Answer |
|----------|--------|
| Should we separate into multiple Vercel projects? | **No** ❌ |
| Is the current monorepo limiting? | **No** ✅ |
| Will it scale with more apps? | **Yes, easily** ✅ |
| Should we prepare for separation later? | **No, not needed** ✅ |
| Is this a bad architecture decision? | **No, it's excellent** ✅ |

---

## Current Architecture Deep Dive

### Frontend Layer
```
Vercel: https://meal-planner-gold-one.vercel.app/

Single React application with modular structure:

App.js (Main component)
├─ State: user, currentView, authToken, mealPlan, etc.
├─ useEffect: Handles OAuth callback, token verification
├─ handleSelectApp(): Routes to selected module
│
├─ Module: AppSwitchboard
│   └─ Displays tiles for [🍽️ Meals] [🥗 Nutrition] [💪 Fitness] etc.
│
├─ Module: LoginPage
│   └─ Shows Google OAuth button
│
├─ View: MealPlanView
│   ├─ /zip → /store → /questionnaire → /mealplan
│   └─ Makes requests to /api/generate-meals
│
├─ Module: NutritionApp
│   ├─ Nutrition dashboard
│   └─ Makes requests to /api/nutrition/*
│
├─ Module: FitnessApp
│   ├─ Fitness dashboard
│   ├─ Workouts, goals, tracking
│   └─ Makes requests to /api/fitness/*
│
├─ Module: CoachingApp
│   ├─ AI Coach interface
│   └─ Makes requests to /api/coaching/*
│
├─ Module: ProgressApp
│   ├─ Streaks, badges, referrals
│   └─ Makes requests to /api/progress/*
│
├─ Module: AdminSwitchboard
│   ├─ User management
│   ├─ Settings
│   └─ Makes requests to /api/admin/*
│
└─ Module: IntegrationsApp
    ├─ Apple Health, Fitbit, etc.
    └─ Makes requests to /api/integrations/*

All modules share:
├─ localStorage (single auth_token)
├─ React context
├─ Shared components
├─ Common styles
├─ Utility functions
└─ CSS variables
```

### Backend Layer
```
Render: https://meal-planner-app-mve2.onrender.com

Single Express server:

server.js (Main entry point)
├─ Middlewares:
│   ├─ CORS (allows Vercel origin)
│   ├─ Express session
│   ├─ Passport OAuth
│   ├─ Rate limiting
│   └─ Error handling
│
├─ Routes: Authentication
│   ├─ GET /auth/google → Initiate Google OAuth
│   ├─ GET /auth/google/callback → Handle OAuth return
│   ├─ GET /auth/user → Verify JWT token
│   └─ POST /auth/logout → Clear session
│
├─ Routes: Meal Planner
│   ├─ POST /api/generate-meals → AI meal generation
│   ├─ GET /api/meals/:id → Get meal details
│   ├─ GET /api/find-stores → Find nearby stores
│   └─ POST /api/submit-recipe-changes → User feedback
│
├─ Routes: Nutrition
│   ├─ GET /api/nutrition/profile
│   ├─ POST /api/nutrition/log
│   └─ GET /api/nutrition/history
│
├─ Routes: Fitness
│   ├─ GET /api/fitness/profile
│   ├─ POST /api/fitness/workout
│   ├─ GET /api/fitness/goals
│   └─ GET /api/fitness/ai-coach
│
├─ Routes: Admin
│   ├─ GET /api/admin/users
│   ├─ POST /api/admin/user/:id/role
│   ├─ GET /api/admin/settings
│   └─ POST /api/admin/settings
│
├─ Middleware: JWT Authentication
│   ├─ Extract token from Authorization header
│   ├─ Verify JWT signature
│   ├─ Decode payload
│   ├─ Set req.user from decoded token
│   └─ Check permissions (admin, role, etc.)
│
└─ Database queries
    └─ PostgreSQL (Render hosted)
```

### Database Layer
```
PostgreSQL (Render): Single database for all data

Schema:
├─ Authentication
│   └─ users (id, email, google_id, role, status)
│
├─ Meal Planning
│   ├─ meals
│   ├─ recipes
│   ├─ ingredients
│   ├─ user_meals
│   └─ meal_history
│
├─ Nutrition
│   ├─ nutrition_logs
│   ├─ macro_tracking
│   ├─ daily_summaries
│   └─ user_nutrition_goals
│
├─ Fitness
│   ├─ fitness_profiles
│   ├─ workouts
│   ├─ exercises
│   ├─ fitness_goals
│   └─ progress_tracking
│
├─ Coaching
│   ├─ ai_coach_profiles
│   ├─ coaching_sessions
│   ├─ coaching_feedback
│   └─ interview_questions
│
├─ Admin
│   ├─ admin_settings
│   ├─ audit_logs
│   ├─ user_subscriptions
│   └─ feature_flags
│
└─ General
    ├─ session (stores user sessions)
    ├─ feedback
    ├─ notifications
    └─ integrations (Apple Health, Fitbit, etc.)
```

---

## Data Flow Example: User Switches Apps

### Scenario: User logged in, switches from Meals to Fitness

```
TIME STEP 1: User at MealPlanView
──────────────────────────────────
State:
  - currentView: 'mealplan'
  - user: { id: 'uuid', email: '...', role: 'user' }
  - token: 'eyJ0eXA...' (in localStorage)

localStorage:
  auth_token: 'eyJ0eXA...'


TIME STEP 2: User clicks [Back to Switchboard]
──────────────────────────────────────────────
handleGoToSwitchboard() called:
  setCurrentView('switchboard')

React re-renders:
  └─ App renders AppSwitchboard component


TIME STEP 3: AppSwitchboard Displayed
──────────────────────────────────────
Shows tiles with user authenticated:
  user?.role === 'admin' checked
  Admin tile shown or hidden accordingly
  All app tiles clickable


TIME STEP 4: User clicks [💪 Fitness]
─────────────────────────────────────
onSelectApp('fitness') called:
  
  handleSelectApp('fitness') executed:
    const token = getToken()  // Returns 'eyJ0eXA...'
    if (token && user) {
      setCurrentView('fitness')  // ✅ Go directly!
    }

No login page shown (token exists)
No OAuth needed (token still valid)
No redirect needed (already have token)


TIME STEP 5: FitnessApp Loads
──────────────────────────────
React renders FitnessApp component:

  useEffect (() => {
    // Fetch user's fitness profile
    fetchWithAuth('/api/fitness/profile', {
      headers: {
        'Authorization': `Bearer eyJ0eXA...`
      }
    })
      .then(res => res.json())
      .then(data => {
        setProfile(data)
      })
  }, [])


TIME STEP 6: Backend Receives Request
───────────────────────────────────────
Express middleware chain:

  1. Request: GET /api/fitness/profile
     Headers: { Authorization: Bearer eyJ0eXA... }

  2. CORS middleware:
     Verifies origin: meal-planner-gold-one.vercel.app ✅

  3. Auth middleware (requireAuth):
     Extract token from header: 'eyJ0eXA...'
     Verify signature: ✅ Valid
     Decode payload: { id, email, role, status, ... }
     Set req.user = { id, email, role, status, ... }

  4. Route handler:
     GET /api/fitness/profile:
       Query DB: SELECT * FROM fitness_profiles 
                 WHERE user_id = req.user.id
       Return: { workouts, goals, profile_data, ... }


TIME STEP 7: Response Sent Back
─────────────────────────────────
Backend response:
  {
    user_id: 'uuid',
    age: 28,
    height: '6ft',
    weight: '180lbs',
    activity_level: 'moderate',
    goals: ['lose weight', 'build muscle'],
    recent_workouts: [...]
  }

Frontend receives JSON
FitnessApp component updates state
UI re-renders with user's fitness data


TIME STEP 8: Fitness App Rendered
──────────────────────────────────
User sees:
  - Their fitness profile
  - Recent workouts
  - Goals
  - Progress tracking
  - All features available

Behind the scenes:
  - Same token used (no re-auth)
  - Same user context (from JWT)
  - Same database (all data available)
  - Seamless transition


TOTAL TIME: ~200ms from click to data displayed
LOGINS NEEDED: 0 (already authenticated)
REDIRECTS: 0
COMPLEXITY: Simple
```

---

## Why Separation Would Break This

### If Each App Had Its Own Vercel Project

```
Scenario: Same user action (switch from Meals to Fitness)

TIME STEP 1: User at meals.vercel.app
──────────────────────────────────────
localStorage:
  auth_token: 'eyJ0eXA...' ✅ (at meals.vercel.app)


TIME STEP 2: Click [Back to Switchboard]
──────────────────────────────────────
At switchboard.vercel.app (or meals.vercel.app)
localStorage still available:
  auth_token: 'eyJ0eXA...' ✅


TIME STEP 3: Click [💪 Fitness]
─────────────────────────────────
Browser navigates to: fitness.vercel.app
URL changes to different domain


TIME STEP 4: FitnessApp Loads
──────────────────────────────
App tries to get token:
  getToken() = localStorage.getItem('auth_token')
  
PROBLEM: Different domain!
  ❌ localStorage at fitness.vercel.app is EMPTY
  ❌ Can't access meals.vercel.app's localStorage
  ❌ Token is lost

Result: FitnessApp doesn't have token


TIME STEP 5: App Checks Authentication
──────────────────────────────────────
if (token && user) {
  // Token exists, go to fitness app
} else {
  // No token, show login
  localStorage.setItem('redirect_after_login', 'fitness')
  setCurrentView('login')  ❌ SHOW LOGIN AGAIN!
}


TIME STEP 6: User Frustrated
──────────────────────────────
User already logged in at meals.vercel.app
Now sees login page at fitness.vercel.app
Has to click "Sign in with Google" AGAIN
Or system needs complex token exchange mechanism

Options to fix:
  1. Send token in URL hash when redirecting
     ↓ fitness.vercel.app/#token=eyJ0eXA...
     ↓ Extract from hash, store in localStorage
     ↓ Complex but works
     
  2. Use shared cookies (more complex CORS)
  
  3. Implement SSO gateway (very complex)
  
  4. Query auth server (more API calls)


Any solution is 3-5x more complex
And users might see unnecessary login prompts
```

---

## Module Addition Path

### How to Add a New App (Using Current Architecture)

```
Want to add: 🥊 Boxing training app

Step 1: Create module folder
────────────────────────────
mkdir -p client/src/modules/boxing
  ├─ BoxingApp.js
  ├─ components/
  │   ├─ WorkoutTracker.js
  │   ├─ TargetBags.js
  │   └─ TechniqueGuide.js
  ├─ hooks/
  │   └─ useBoxingWorkout.js
  ├─ styles/
  │   └─ boxing.css
  └─ api.js


Step 2: Add to App.js
─────────────────────
import { BoxingApp } from './modules/boxing';

// In handleSelectApp:
case 'boxing': {
  const token = getToken();
  if (token && user) {
    setCurrentView('boxing');
  } else {
    localStorage.setItem('redirect_after_login', 'boxing');
    setCurrentView('login');
  }
  break;
}


Step 3: Add to Switchboard
──────────────────────────
In AppSwitchboard.js apps array:
{
  id: 'boxing',
  name: 'Boxing',
  description: 'Track your boxing training',
  icon: '🥊',
  color: '#ff6b00',
  available: true
}


Step 4: Add backend routes
──────────────────────────
In server.js:

app.get('/api/boxing/workouts', requireAuth, (req, res) => {
  // Query boxing_workouts table
  // Return user's workouts
});

app.post('/api/boxing/workout', requireAuth, (req, res) => {
  // Create new workout entry
});

app.get('/api/boxing/stats', requireAuth, (req, res) => {
  // Calculate training stats
});


Step 5: Add database tables
───────────────────────────
migrations/add_boxing_tables.sql:

CREATE TABLE boxing_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  skill_level VARCHAR,
  training_frequency INT,
  created_at TIMESTAMP
);

CREATE TABLE boxing_workouts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  date DATE,
  duration INT,
  bag_hits INT,
  techniques TEXT[],
  created_at TIMESTAMP
);


Step 6: Deploy
──────────────
git add .
git commit -m "Add boxing app module"
git push
  ↓ Vercel auto-builds and deploys
  ↓ New module available immediately


TOTAL TIME: 30-60 minutes
COMPLEXITY: Low
BREAKING CHANGES: None
```

---

## Conclusion

Your monorepo is:
- ✅ The right choice for your apps
- ✅ Easy to extend with new modules
- ✅ Cost-effective
- ✅ Easy to maintain
- ✅ User-friendly (seamless experience)
- ✅ Developer-friendly (simple flow)

Keep it. Build more on it. Only consider separation if you hit real scaling problems (which requires 100k+ users first).

You're doing architecture right. 👍
