# Complete User Login & Authentication Flow Diagram

## Part 1: Initial Site Load & Login Selection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  STEP 1: User navigates to https://meal-planner-gold-one.vercel.app/        │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         VERCEL (Frontend)                            │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │ React App Loads (client/src/App.js)                          │  │   │
│  │  │                                                               │  │   │
│  │  │ 1. Check if auth_token in localStorage                      │  │   │
│  │  │    ├─ YES: Load user profile                                │  │   │
│  │  │    └─ NO: Show login page                                   │  │   │
│  │  │                                                               │  │   │
│  │  │ 2. Display Splash Screen (brief)                            │  │   │
│  │  │    └─> Redirects to login or switchboard                   │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  │                            ↓                                        │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │ Login Page Displayed                                         │  │   │
│  │  │                                                               │  │   │
│  │  │ ┌────────────────────────────────────────────────────────┐  │  │   │
│  │  │ │ [Google Login Button]                                  │  │  │   │
│  │  │ │                                                        │  │  │   │
│  │  │ │ User clicks "Sign in with Google"                    │  │  │   │
│  │  │ └────────────────────────────────────────────────────────┘  │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Part 2: Google OAuth & Backend Authentication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  STEP 2: Google OAuth Flow                                                   │
│                                                                               │
│  ┌──────────────────┐       ┌────────────────┐       ┌─────────────────┐  │
│  │                  │       │                │       │                 │  │
│  │ VERCEL           │       │ GOOGLE         │       │ RENDER (Backend)│  │
│  │ (Frontend)       │       │ OAuth Server   │       │ (server.js)     │  │
│  │                  │       │                │       │                 │  │
│  └──────────────────┘       └────────────────┘       └─────────────────┘  │
│         │                           │                        │             │
│         │  1. Click Login            │                        │             │
│         └──────────────────────────────────────────────────→ /auth/google  │
│                                      │                        │             │
│         2. Redirect to Google        │                        │             │
│         OAuth Page                   │                        │             │
│         ←─────────────────────────────────────────────────────│             │
│                                      │                        │             │
│  3. User enters credentials          │                        │             │
│     & authorizes access              │                        │             │
│  ───────────────────────────────────→│                        │             │
│                                      │                        │             │
│  4. Google validates credentials     │                        │             │
│     & sends auth code back           │                        │             │
│  ←──────────────────────────────────────────────────────────→ /auth/google │
│                                      │         /callback      │             │
│                                      │                        │             │
│         5. Frontend redirects        │                        │             │
│         to backend callback          │                        │             │
│         ←──────────────────────────────────────────────────────             │
│         (?code=...)                  │                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Part 3: Backend Validation & JWT Token Generation

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  STEP 3: Backend Processes OAuth & Validates User (server.js lines 316-480)│
│                                                                              │
│  RENDER (Backend Server)                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  /auth/google/callback                                               │  │
│  │                                                                       │  │
│  │  1. Receive OAuth code from Google                                  │  │
│  │                                                                       │  │
│  │  2. Exchange code for user profile (from Google)                    │  │
│  │     Returns: { id, email, displayName, photos }                    │  │
│  │                                                                       │  │
│  │  3. Lookup or create user in Render PostgreSQL                     │  │
│  │     ┌─────────────────────────────────────────────────────────┐   │  │
│  │     │ DATABASE: Render PostgreSQL (DATABASE_URL)              │   │  │
│  │     │                                                           │   │  │
│  │     │ Query: SELECT * FROM users WHERE google_id = $1         │   │  │
│  │     │                                                           │   │  │
│  │     │ User found? Returns: {                                   │   │  │
│  │     │   id: 'uuid',                                             │   │  │
│  │     │   email: 'user@example.com',                             │   │  │
│  │     │   google_id: 'google-id-123',                           │   │  │
│  │     │   display_name: 'John Doe',                             │   │  │
│  │     │   picture_url: 'https://...',                           │   │  │
│  │     │   role: 'admin',    ← ROLE FROM DATABASE               │   │  │
│  │     │   status: 'active'  ← STATUS FROM DATABASE             │   │  │
│  │     │ }                                                         │   │  │
│  │     └─────────────────────────────────────────────────────────┘   │  │
│  │                                                                       │  │
│  │  4. Generate JWT Token (server.js line 396-404)                    │  │
│  │                                                                       │  │
│  │     jwt.sign({                                                      │  │
│  │       id: user.id,                                                 │  │
│  │       email: user.email,                                           │  │
│  │       googleId: user.googleId,                                     │  │
│  │       displayName: user.displayName,                               │  │
│  │       picture: user.picture,                                       │  │
│  │       role: user.role || 'user',        ← NOW INCLUDED            │  │
│  │       status: user.status || 'active'   ← NOW INCLUDED            │  │
│  │     }, JWT_SECRET, { expiresIn: '30d' })                          │  │
│  │                                                                       │  │
│  │  5. Return token to frontend                                        │  │
│  │     res.redirect(`${FRONTEND}#token=${token}`)                    │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

## Part 4: Frontend Receives Token & Stores Locally

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  STEP 4: Frontend Receives & Stores Token (App.js)                         │
│                                                                              │
│  VERCEL (Frontend)                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  1. Backend redirects with token in URL hash                        │  │
│  │     https://meal-planner.vercel.app/#token=eyJ0eXAi...            │  │
│  │                                                                       │  │
│  │  2. React App.js detects token in URL                              │  │
│  │     (Lines 104-130)                                                 │  │
│  │                                                                       │  │
│  │  3. Parse token from URL                                           │  │
│  │     const token = new URLSearchParams(window.location.hash)       │  │
│  │                      .get('token')                                  │  │
│  │                                                                       │  │
│  │  4. Store token in localStorage                                    │  │
│  │     localStorage.setItem('auth_token', token)                     │  │
│  │                                                                       │  │
│  │  5. Decode token (client-side, just for display)                  │  │
│  │     const decoded = JSON.parse(atob(token.split('.')[1]))         │  │
│  │                                                                       │  │
│  │     Token now contains:                                            │  │
│  │     {                                                               │  │
│  │       id: 'uuid-123',                                             │  │
│  │       email: 'user@example.com',                                  │  │
│  │       role: 'admin',       ← User's role available here!         │  │
│  │       status: 'active',    ← User's status available here!       │  │
│  │       googleId: 'google-id-123',                                 │  │
│  │       displayName: 'John Doe',                                   │  │
│  │       picture: 'https://...'                                     │  │
│  │     }                                                               │  │
│  │                                                                       │  │
│  │  6. Set user state                                                 │  │
│  │     setUser(decoded)                                               │  │
│  │                                                                       │  │
│  │  7. Display App Switchboard                                        │  │
│  │     (Meal Planner, Nutrition, Fitness, Admin, etc.)              │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

## Part 5a: User Clicks on MEAL PLANNER

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  STEP 5A: User Selects MEAL PLANNER App                                    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ VERCEL (Frontend) - AppSwitchboard.js                               │  │
│  │                                                                       │  │
│  │  User clicks on Meal Planner tile                                  │  │
│  │           ↓                                                         │  │
│  │  onSelectApp('meal-planner')                                       │  │
│  │           ↓                                                         │  │
│  │  currentView = 'meal-planner'                                      │  │
│  │           ↓                                                         │  │
│  │  Load MealPlanView component                                       │  │
│  │                                                                       │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │ MealPlanView Component                                      │   │  │
│  │  │                                                             │   │  │
│  │  │  Uses Session-based Authentication:                       │   │  │
│  │  │  ├─ req.session.user (from server-side session)           │   │  │
│  │  │  ├─ Has access to role & status (from session)            │   │  │
│  │  │  ├─ User state comes from App.js (decoded JWT)            │   │  │
│  │  │  └─ Can check: if (user.role === 'admin')  ✅ WORKS       │   │  │
│  │  │                                                             │   │  │
│  │  │  Makes API calls to:                                       │   │  │
│  │  │  ├─ GET /api/meals (fetch meal plans)                     │   │  │
│  │  │  ├─ GET /api/profile (get user profile)                   │   │  │
│  │  │  └─ Headers: { Authorization: 'Bearer ' + token }         │   │  │
│  │  │                                                             │   │  │
│  │  └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │ RENDER (Backend) - server.js                               │  │  │
│  │  │                                                             │  │  │
│  │  │  GET /api/meals (requireAuth middleware)                 │  │  │
│  │  │                                                             │  │  │
│  │  │  1. Extract JWT token from Authorization header          │  │  │
│  │  │     const token = req.headers.authorization.substring(7) │  │  │
│  │  │                                                             │  │  │
│  │  │  2. Verify token using JWT_SECRET                         │  │  │
│  │  │     const decoded = jwt.verify(token, JWT_SECRET)        │  │  │
│  │  │                                                             │  │  │
│  │  │  3. Set req.user from decoded token                       │  │  │
│  │  │     req.user = {                                           │  │  │
│  │  │       id: 'uuid-123',                                     │  │  │
│  │  │       email: 'user@example.com',                          │  │  │
│  │  │       role: 'admin',      ← Available from token         │  │  │
│  │  │       status: 'active',   ← Available from token         │  │  │
│  │  │       ...                                                  │  │  │
│  │  │     }                                                       │  │  │
│  │  │                                                             │  │  │
│  │  │  4. Query Render PostgreSQL                               │  │  │
│  │  │     SELECT * FROM meals WHERE user_id = $1               │  │  │
│  │  │                                                             │  │  │
│  │  │  5. Return meals to frontend                              │  │  │
│  │  │                                                             │  │  │
│  │  │  6. Admin checks (if needed):                             │  │  │
│  │  │     if (req.user.role === 'admin') {                      │  │  │
│  │  │       Show admin options  ← Works! ✅                     │  │  │
│  │  │     }                                                       │  │  │
│  │  │                                                             │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │ DATABASE: Render PostgreSQL                                │   │  │
│  │  │                                                             │   │  │
│  │  │ users table                                                │   │  │
│  │  │ ├─ id: 'uuid-123'                                         │   │  │
│  │  │ ├─ email: 'user@example.com'                              │   │  │
│  │  │ ├─ role: 'admin'      ← STORED HERE                       │   │  │
│  │  │ ├─ status: 'active'   ← STORED HERE                       │   │  │
│  │  │ └─ google_id: 'google-id-123'                             │   │  │
│  │  │                                                             │   │  │
│  │  │ meals table                                                │   │  │
│  │  │ ├─ id: 'meal-1'                                           │   │  │
│  │  │ ├─ user_id: 'uuid-123'  ← Foreign key to users           │   │  │
│  │  │ ├─ meal_data: { ... }                                     │   │  │
│  │  │ └─ ...                                                     │   │  │
│  │  │                                                             │   │  │
│  │  └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

## Part 5b: User Clicks on FITNESS

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  STEP 5B: User Selects FITNESS App                                         │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ VERCEL (Frontend) - AppSwitchboard.js                               │  │
│  │                                                                       │  │
│  │  User clicks on Fitness tile                                       │  │
│  │           ↓                                                         │  │
│  │  onSelectApp('fitness')                                            │  │
│  │           ↓                                                         │  │
│  │  currentView = 'fitness'                                           │  │
│  │           ↓                                                         │  │
│  │  Load FitnessApp component                                         │  │
│  │                                                                       │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │ FitnessApp Component                                        │   │  │
│  │  │                                                             │   │  │
│  │  │  Uses JWT Token-based Authentication:                     │   │  │
│  │  │  ├─ Retrieves token from localStorage                     │   │  │
│  │  │  ├─ Sends token in Authorization header                  │   │  │
│  │  │  ├─ User state from App.js (decoded JWT)                 │   │  │
│  │  │  └─ Can check: if (user.role === 'admin')  ✅ NOW WORKS  │   │  │
│  │  │     (Previously failed because token was missing role)   │   │  │
│  │  │                                                             │   │  │
│  │  │  Makes API calls to:                                       │   │  │
│  │  │  ├─ GET /api/fitness/profile (user's fitness profile)     │   │  │
│  │  │  ├─ GET /api/fitness/workouts (workouts)                 │   │  │
│  │  │  ├─ POST /api/fitness/ai-interview (AI Coach)            │   │  │
│  │  │  └─ Headers: { Authorization: 'Bearer ' + token }        │   │  │
│  │  │                                                             │   │  │
│  │  └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │ RENDER (Backend) - fitness/backend/routes/fitness.js       │  │  │
│  │  │                                                             │  │  │
│  │  │  GET /api/fitness/profile (requireAuth middleware)        │  │  │
│  │  │                                                             │  │  │
│  │  │  1. Extract JWT token from Authorization header          │  │  │
│  │  │     const token = req.headers.authorization.substring(7) │  │  │
│  │  │                                                             │  │  │
│  │  │  2. Verify token using JWT_SECRET                         │  │  │
│  │  │     const decoded = jwt.verify(token, JWT_SECRET)        │  │  │
│  │  │                                                             │  │  │
│  │  │  3. Set req.user from decoded token                       │  │  │
│  │  │     req.user = {                                           │  │  │
│  │  │       id: 'uuid-123',                                     │  │  │
│  │  │       email: 'user@example.com',                          │  │  │
│  │  │       role: 'admin',      ← Available from token ✅       │  │  │
│  │  │       status: 'active',   ← Available from token ✅       │  │  │
│  │  │       ...                                                  │  │  │
│  │  │     }                                                       │  │  │
│  │  │                                                             │  │  │
│  │  │  4. Query Render PostgreSQL (using DATABASE_URL)          │  │  │
│  │  │     SELECT * FROM fitness_profiles                        │  │  │
│  │  │     WHERE user_id = $1                                    │  │  │
│  │  │                                                             │  │  │
│  │  │  5. Return profile to frontend                            │  │  │
│  │  │                                                             │  │  │
│  │  │  6. Admin checks (if needed):                             │  │  │
│  │  │     if (req.user.role === 'admin') {                      │  │  │
│  │  │       Show admin interview questions  ← Works! ✅         │  │  │
│  │  │     }                                                       │  │  │
│  │  │                                                             │  │  │
│  │  │  7. AI Interview endpoint:                                │  │  │
│  │  │     POST /api/fitness/ai-interview                        │  │  │
│  │  │                                                             │  │  │
│  │  │     Uses OpenAI API (initialized in server.js)           │  │  │
│  │  │     └─ Generates personalized workouts                   │  │  │
│  │  │                                                             │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │ DATABASE: Render PostgreSQL (same as main app!)           │   │  │
│  │  │                                                             │   │  │
│  │  │ Note: FITNESS DOES NOT USE NEON                            │   │  │
│  │  │ Both main app and fitness use DATABASE_URL (Render)       │   │  │
│  │  │                                                             │   │  │
│  │  │ users table                                                │   │  │
│  │  │ ├─ id: 'uuid-123'                                         │   │  │
│  │  │ ├─ email: 'user@example.com'                              │   │  │
│  │  │ ├─ role: 'admin'      ← SAME RECORD                       │   │  │
│  │  │ ├─ status: 'active'   ← SAME RECORD                       │   │  │
│  │  │ └─ google_id: 'google-id-123'                             │   │  │
│  │  │                                                             │   │  │
│  │  │ fitness_profiles table                                     │   │  │
│  │  │ ├─ id: 'fitness-prof-1'                                   │   │  │
│  │  │ ├─ user_id: 'uuid-123'  ← Foreign key to users           │   │  │
│  │  │ ├─ height_cm: 180                                         │   │  │
│  │  │ ├─ weight_kg: 80                                          │   │  │
│  │  │ └─ ...                                                     │   │  │
│  │  │                                                             │   │  │
│  │  │ fitness_workouts table                                     │   │  │
│  │  │ ├─ id: 'workout-1'                                        │   │  │
│  │  │ ├─ user_id: 'uuid-123'  ← Foreign key to users           │   │  │
│  │  │ ├─ workout_data: { ... }                                  │   │  │
│  │  │ └─ ...                                                     │   │  │
│  │  │                                                             │   │  │
│  │  └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

## Part 6: System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  COMPLETE ARCHITECTURE DIAGRAM                                              │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         VERCEL (Frontend)                            │   │
│  │                  https://meal-planner-gold-one.vercel.app           │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │   │
│  │  │  Login Page     │  │ AppSwitchboard  │  │  Other Apps     │   │   │
│  │  │                 │  │                 │  │                 │   │   │
│  │  │  Google OAuth   │  │ ├─ Meal Planner │  │ ├─ Nutrition    │   │   │
│  │  │  Button         │  │ ├─ Fitness      │  │ ├─ AI Coach     │   │   │
│  │  │                 │  │ ├─ Admin        │  │ └─ Progress     │   │   │
│  │  │                 │  │ └─ Logout       │  │                 │   │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘   │   │
│  │         │                      │                     │             │   │
│  │         └──────────────────────┼─────────────────────┘             │   │
│  │                                │                                    │   │
│  │                         localStorage                               │   │
│  │                         auth_token (JWT)                           │   │
│  │                                │                                    │   │
│  │                    Contains: id, email, role,                     │   │
│  │                    status, googleId, displayName                  │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│                    API Calls with JWT in Authorization Header              │
│                    │                                                       │
│                    ▼                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                    RENDER (Backend)                                  │ │
│  │         https://meal-planner-app-mve2.onrender.com                  │ │
│  │                                                                       │ │
│  │  ┌────────────────────────────────────────────────────────────────┐ │ │
│  │  │ server.js (Express Server)                                     │ │ │
│  │  │                                                                 │ │ │
│  │  │ ├─ /auth/google (Google OAuth)                                │ │ │
│  │  │ │  └─ Authenticates with Google                             │ │ │
│  │  │ │                                                             │ │ │
│  │  │ ├─ /auth/google/callback                                     │ │ │
│  │  │ │  ├─ Receives OAuth code                                   │ │ │
│  │  │ │  ├─ Queries Render DB for user                           │ │ │
│  │  │ │  ├─ Generates JWT token (now with role & status)         │ │ │
│  │  │ │  └─ Returns token to frontend                             │ │ │
│  │  │ │                                                             │ │ │
│  │  │ ├─ /api/meals/* (Session-based)                            │ │ │
│  │  │ │  ├─ Uses req.session.user                                │ │ │
│  │  │ │  └─ Queries Render DB                                    │ │ │
│  │  │ │                                                             │ │ │
│  │  │ ├─ /api/profile (JWT-based)                                │ │ │
│  │  │ │  ├─ Verifies JWT token                                   │ │ │
│  │  │ │  ├─ Returns user profile with role                      │ │ │
│  │  │ │  └─ Queries Render DB                                    │ │ │
│  │  │ │                                                             │ │ │
│  │  │ └─ /api/admin/* (JWT-based, requires role='admin')         │ │ │
│  │  │    ├─ Verifies JWT token                                   │ │ │
│  │  │    ├─ Checks req.user.role === 'admin'                    │ │ │
│  │  │    └─ Queries Render DB                                    │ │ │
│  │  │                                                                 │ │ │
│  │  └────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ┌────────────────────────────────────────────────────────────────┐ │ │
│  │  │ fitness/backend/routes/fitness.js (Express Routes)            │ │ │
│  │  │                                                                 │ │ │
│  │  │ ├─ /api/fitness/profile (JWT-based)                           │ │ │
│  │  │ │  ├─ Verifies JWT token                                     │ │ │
│  │  │ │  ├─ Uses req.user from JWT                                │ │ │
│  │  │ │  ├─ req.user.role available ✅                           │ │ │
│  │  │ │  └─ Queries Render DB                                     │ │ │
│  │  │ │                                                             │ │ │
│  │  │ ├─ /api/fitness/workouts (JWT-based)                        │ │ │
│  │  │ │  └─ Same as above                                         │ │ │
│  │  │ │                                                             │ │ │
│  │  │ ├─ /api/fitness/ai-interview (JWT-based)                    │ │ │
│  │  │ │  ├─ Verifies JWT token                                   │ │ │
│  │  │ │  ├─ Uses OpenAI API (gpt-3.5-turbo)                     │ │ │
│  │  │ │  ├─ Generates workout plans                              │ │ │
│  │  │ │  └─ Queries Render DB to save workouts                  │ │ │
│  │  │ │                                                             │ │ │
│  │  │ └─ Other fitness endpoints...                                │ │ │
│  │  │                                                                 │ │ │
│  │  └────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ┌────────────────────────────────────────────────────────────────┐ │ │
│  │  │ routes/admin.js (Express Routes)                              │ │ │
│  │  │                                                                 │ │ │
│  │  │ ├─ GET /api/admin/users (Admin only)                         │ │ │
│  │  │ │  └─ Checks req.user.role === 'admin'                      │ │ │
│  │  │ │                                                             │ │ │
│  │  │ ├─ PATCH /api/admin/users/:id (Admin only)                  │ │ │
│  │  │ │  └─ Updates user roles & permissions                      │ │ │
│  │  │ │                                                             │ │ │
│  │  │ └─ Other admin endpoints...                                  │ │ │
│  │  │                                                                 │ │ │
│  │  └────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ┌────────────────────────────────────────────────────────────────┐ │ │
│  │  │ External Services Integration                                 │ │ │
│  │  │                                                                 │ │ │
│  │  │ ├─ OpenAI API                                                 │ │ │
│  │  │ │  └─ For AI Coach (fitness workout generation)             │ │ │
│  │  │ │                                                             │ │ │
│  │  │ ├─ Google OAuth                                              │ │ │
│  │  │ │  └─ User authentication & profile                         │ │ │
│  │  │ │                                                             │ │ │
│  │  │ └─ Stripe (if payment enabled)                              │ │ │
│  │  │    └─ For premium features                                   │ │ │
│  │  │                                                                 │ │ │
│  │  └────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                      │                                    │
│                              DATABASE_URL                               │
│                          (PostgreSQL Connection)                        │
│                                      │                                    │
│                                      ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │           RENDER POSTGRESQL DATABASE (Primary)                      │ │
│  │                                                                      │ │
│  │  Tables:                                                             │ │
│  │  ├─ users (id, email, role, status, google_id, ...)               │ │
│  │  ├─ meals (id, user_id, meal_data, ...)                           │ │
│  │  ├─ fitness_profiles (id, user_id, height, weight, ...)           │ │
│  │  ├─ fitness_workouts (id, user_id, workout_data, ...)             │ │
│  │  ├─ fitness_goals (id, user_id, goal_data, ...)                   │ │
│  │  ├─ admin_interview_questions (id, question, ...)                 │ │
│  │  └─ ... other tables                                               │ │
│  │                                                                      │ │
│  │  Key Point: BOTH main app and fitness app query this               │ │
│  │  single database using DATABASE_URL                                │ │
│  │                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │           NEON POSTGRESQL DATABASE (Unused)                         │ │
│  │                                                                      │ │
│  │  Status: ↯ NOT USED BY ANY APPLICATION                            │ │
│  │                                                                      │ │
│  │  Why:                                                                │ │
│  │  ├─ Never integrated into code                                      │ │
│  │  ├─ No database URL references in routes                           │ │
│  │  ├─ All apps use DATABASE_URL (Render)                            │ │
│  │  └─ Recommendation: Delete or ignore                               │ │
│  │                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Part 7: Authentication Flow Comparison - Meal Planner vs Fitness

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  MEAL PLANNER vs FITNESS APP - AUTHENTICATION COMPARISON                    │
│                                                                              │
│  ┌──────────────────────────────┬──────────────────────────────┐           │
│  │      MEAL PLANNER            │         FITNESS APP            │           │
│  ├──────────────────────────────┼──────────────────────────────┤           │
│  │ Frontend: MealPlanView.js    │ Frontend: FitnessApp.js      │           │
│  │                              │                              │           │
│  │ Auth Method: Session         │ Auth Method: JWT Token       │           │
│  │ (req.session.user)           │ (JWT in localStorage)        │           │
│  │                              │                              │           │
│  │ Token Source: URL hash       │ Token Source: localStorage   │           │
│  │ User state from: Session     │ User state from: Decoded JWT │           │
│  │                              │                              │           │
│  │ User data available:         │ User data available:         │           │
│  │ ├─ id ✅                    │ ├─ id ✅                    │           │
│  │ ├─ email ✅                │ ├─ email ✅                │           │
│  │ ├─ displayName ✅          │ ├─ displayName ✅          │           │
│  │ ├─ picture ✅              │ ├─ picture ✅              │           │
│  │ ├─ role ✅                 │ ├─ role ✅ (NOW!)          │           │
│  │ └─ status ✅               │ └─ status ✅ (NOW!)        │           │
│  │                              │                              │           │
│  │ API Call Example:            │ API Call Example:            │           │
│  │ GET /api/meals               │ GET /api/fitness/profile     │           │
│  │ (Uses session)               │ Authorization: Bearer + JWT  │           │
│  │                              │                              │           │
│  │ Admin Check:                 │ Admin Check:                 │           │
│  │ if (user.role === 'admin')   │ if (req.user.role === 'admin')           │
│  │ ✅ Works (from session)      │ ✅ Works (from JWT now!)     │           │
│  │                              │                              │           │
│  │ Database: Render PostgreSQL  │ Database: Render PostgreSQL  │           │
│  │ Same data as Fitness!        │ Same data as Meal Planner!   │           │
│  │                              │                              │           │
│  │ Neon Usage: None             │ Neon Usage: None             │           │
│  │                              │                              │           │
│  └──────────────────────────────┴──────────────────────────────┘           │
│                                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

## Part 8: Key Points & Validation Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  KEY VALIDATION POINTS                                                      │
│                                                                              │
│  1. INITIAL LOGIN (Google OAuth)                                           │
│     ────────────────────────────────────────────────────────────────────   │
│     Frontend                  Backend                    Database           │
│     ┌─────────────┐          ┌──────────────────┐       ┌──────────────┐  │
│     │ Click Login │          │ /auth/google/    │       │ Render DB    │  │
│     │ with Google │──────→   │ callback         │──────→│              │  │
│     │             │          │                  │       │ Look up user │  │
│     │             │          │ Exchange code    │       │ by google_id │  │
│     │             │          │ for profile      │       │              │  │
│     │             │          │                  │       │ Return role  │  │
│     │             │          │ Generate JWT     │←──────│ & status     │  │
│     │             │          │ with role        │       │              │  │
│     │             │←─────────│ & status         │       └──────────────┘  │
│     │ Store token │          │                  │                         │
│     │ in storage  │          │ Return token     │                         │
│     │             │          │ in URL hash      │                         │
│     └─────────────┘          └──────────────────┘                         │
│                                                                             │
│  2. ACCESSING MEAL PLANNER                                                │
│     ────────────────────────────────────────────────────────────────────  │
│     ┌──────────────┐         ┌────────────┐        ┌─────────────────┐  │
│     │ User chooses │         │ /api/meals │        │ Render DB       │  │
│     │ Meal Planner │──Token──│            │───────→│                 │  │
│     │              │         │ Verify JWT │        │ Query meals     │  │
│     │ Session used │←────────│ Check role │←───────│ by user_id      │  │
│     │ for auth     │         │ from token │        │                 │  │
│     │              │         │            │        │ Return meals    │  │
│     └──────────────┘         └────────────┘        └─────────────────┘  │
│                                                                             │
│  3. ACCESSING FITNESS APP                                                 │
│     ────────────────────────────────────────────────────────────────────  │
│     ┌──────────────┐    ┌─────────────────┐      ┌─────────────────┐   │
│     │ User chooses │    │ /api/fitness/   │      │ Render DB       │   │
│     │ Fitness      │───→│ profile         │─────→│                 │   │
│     │              │JWT │ Verify JWT      │      │ Query fitness   │   │
│     │ localStorage │    │ Extract role    │←─────│ data by         │   │
│     │ has role ✅  │←───│ from token      │      │ user_id         │   │
│     │              │    │ (NOW WORKS!)    │      │                 │   │
│     └──────────────┘    └─────────────────┘      │ Return fitness  │   │
│                                                   │ profile         │   │
│                                                   └─────────────────┘   │
│                                                                             │
│  4. ADMIN FEATURES                                                        │
│     ────────────────────────────────────────────────────────────────────  │
│     For both Meal Planner and Fitness:                                   │
│                                                                             │
│     if (user.role === 'admin') {                                          │
│       ├─ Show admin button on switchboard  ✅ Works                       │
│       ├─ Access admin panel  ✅ Works                                     │
│       ├─ Manage users  ✅ Works                                           │
│       ├─ View admin interview questions  ✅ Works (now)                  │
│       └─ Manage AI Coach questions  ✅ Works (now)                        │
│     }                                                                       │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

## Part 9: What Was Fixed

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  BEFORE THE JWT FIX                    │  AFTER THE JWT FIX                │
│  ════════════════════════════════════════════════════════════════════════  │
│                                        │                                    │
│  JWT Token Contains:                   │  JWT Token Contains:              │
│  ├─ id ✅                              │  ├─ id ✅                         │
│  ├─ email ✅                           │  ├─ email ✅                      │
│  ├─ googleId ✅                        │  ├─ googleId ✅                   │
│  ├─ displayName ✅                     │  ├─ displayName ✅                │
│  ├─ picture ✅                         │  ├─ picture ✅                    │
│  ├─ role ❌ MISSING!                  │  ├─ role ✅ ADDED!               │
│  └─ status ❌ MISSING!                │  └─ status ✅ ADDED!             │
│                                        │                                    │
│  Fitness App Admin Check:              │  Fitness App Admin Check:         │
│  if (req.user.role === 'admin')       │  if (req.user.role === 'admin')   │
│  └─ FAILS! ❌                          │  └─ WORKS! ✅                     │
│     (role = undefined)                 │     (role = 'admin')              │
│                                        │                                    │
│  Admin Button in Fitness:              │  Admin Button in Fitness:         │
│  └─ Doesn't appear ❌                 │  └─ Appears ✅                    │
│                                        │                                    │
│  AI Coach in Fitness:                  │  AI Coach in Fitness:             │
│  └─ May fail permission check ⚠️       │  └─ Works properly ✅             │
│                                        │                                    │
│  Result:                               │  Result:                          │
│  └─ Admin users lose privileges       │  └─ Admin users maintain          │
│     in fitness module                 │     privileges everywhere          │
│                                        │                                    │
└────────────────────────────────────────────────────────────────────────────┘
```

## Part 10: Summary - How Everything Connects

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  THE COMPLETE STORY                                                         │
│                                                                              │
│  1️⃣  USER VISITS: https://meal-planner-gold-one.vercel.app/               │
│      └─> Vercel serves React app (frontend)                               │
│                                                                              │
│  2️⃣  USER LOGS IN: Clicks "Sign in with Google"                           │
│      ├─> Frontend redirects to backend: /auth/google                       │
│      ├─> Backend redirects to Google OAuth                                │
│      ├─> User enters credentials at Google                                │
│      └─> Google redirects back with OAuth code                            │
│                                                                              │
│  3️⃣  BACKEND PROCESSES LOGIN:                                              │
│      ├─> Render backend receives OAuth code                               │
│      ├─> Exchanges code for user profile                                  │
│      ├─> Queries Render PostgreSQL to find/create user                    │
│      ├─> Database returns user with role='admin' (or 'user')              │
│      ├─> Backend generates JWT with role & status (NOW!)                  │
│      └─> Returns JWT to frontend via URL hash                             │
│                                                                              │
│  4️⃣  FRONTEND RECEIVES TOKEN:                                              │
│      ├─> Extracts JWT from URL                                            │
│      ├─> Stores in localStorage (auth_token)                              │
│      ├─> Decodes JWT to get user data                                     │
│      ├─> Sets user state (with role & status!)                            │
│      └─> Displays App Switchboard                                         │
│                                                                              │
│  5️⃣  USER SELECTS MEAL PLANNER:                                            │
│      ├─> Frontend loads MealPlanView                                       │
│      ├─> Makes API calls with JWT token                                   │
│      ├─> Backend verifies JWT and sets req.user                           │
│      ├─> Queries Render DB for meal data                                  │
│      └─> Returns meals to frontend ✅                                     │
│                                                                              │
│  6️⃣  USER SELECTS FITNESS:                                                 │
│      ├─> Frontend loads FitnessApp                                         │
│      ├─> Makes API calls with JWT token                                   │
│      ├─> Backend verifies JWT and sets req.user (with role!)              │
│      ├─> Queries Render DB for fitness data                               │
│      ├─> Checks if req.user.role === 'admin' ✅ WORKS NOW!               │
│      └─> Returns fitness data & admin features if applicable              │
│                                                                              │
│  7️⃣  ADMIN FEATURES:                                                       │
│      ├─ Meal Planner admin: Shows because session.role available          │
│      ├─ Fitness admin: Shows because JWT now has role ✅                  │
│      ├─ AI Coach: Works because user permissions are valid                │
│      └─ Admin panel: Full access for managing users                       │
│                                                                              │
│  8️⃣  DATABASES:                                                            │
│      ├─ Render PostgreSQL: ✅ PRIMARY (used by both apps)                 │
│      └─ Neon PostgreSQL: ↯ UNUSED (can be ignored)                       │
│                                                                              │
│  9️⃣  LOGOUT:                                                               │
│      ├─> User clicks logout button (in switchboard header)                │
│      ├─> Frontend removes auth_token from localStorage                    │
│      └─> User redirected to login page                                    │
│                                                                              │
│  RESULT: ✅ Seamless authentication across all modules                     │
│                                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## File References for Each Step

| Step | Component | File | Key Code |
|------|-----------|------|----------|
| 1 | Login | `client/src/components/LoginPage.js` | Google OAuth button |
| 2 | OAuth | `server.js` lines 450-480 | `/auth/google` and `/auth/google/callback` |
| 3 | Token Generation | `server.js` lines 396-404 | `generateToken()` function |
| 3 | DB Lookup | `server.js` lines 316-390 | Google Passport Strategy |
| 4 | Token Storage | `client/src/App.js` lines 48-50, 104-130 | `localStorage.setItem()`, URL parsing |
| 5 | Meal Planner | `client/src/components/MealPlanView.js` | API calls to `/api/meals` |
| 6 | Fitness App | `client/src/modules/fitness/FitnessApp.js` | API calls to `/api/fitness/*` |
| 6 | Fitness Routes | `fitness/backend/routes/fitness.js` lines 80-140 | `requireAuth()` middleware |
| 7 | Admin Routes | `routes/admin.js` | Admin endpoints |
| 9 | Logout | `client/src/App.js` lines 374-376 | `handleLogout()` function |

---

**This diagram shows the complete flow of user authentication, validation, and access control across your entire application architecture!**
