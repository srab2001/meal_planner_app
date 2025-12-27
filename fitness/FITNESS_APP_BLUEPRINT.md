# ASR Fitness Coach - Complete Blueprint

> **Version:** 2.0 | **Last Updated:** December 2024
> **Status:** Production Ready | **Demo Mode:** Fully Functional

---

## Table of Contents

1. [Purpose & Overview](#1-purpose--overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [User Flows](#4-user-flows)
5. [Component Reference](#5-component-reference)
6. [API Endpoints](#6-api-endpoints)
7. [Authentication](#7-authentication)
8. [Demo Mode](#8-demo-mode)
9. [Deployment](#9-deployment)
10. [Lessons Learned & Errors](#10-lessons-learned--errors)
11. [File Structure](#11-file-structure)

---

## 1. Purpose & Overview

### What It Does
ASR Fitness Coach is an AI-powered workout planning application that:
- Creates personalized workout plans based on user goals and preferences
- Supports gym workouts, pool/swimming workouts, or combined training
- Allows users to edit, save, and export workout plans as PDF
- Provides a 3-screen simplified flow: Goal → Questionnaire → Workout Plan

### Target Users
- Fitness enthusiasts wanting personalized workout plans
- People who work out at gyms, pools, or both
- Users who want AI-generated training recommendations

### Core Value Proposition
- **Personalization:** 7-question interview feeds into AI for tailored workouts
- **Flexibility:** Edit workouts inline, regenerate with tweaks
- **Export:** Save to history or export as PDF
- **Demo Mode:** Full functionality without requiring account/backend

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vercel)                        │
│                    React 18 + Vite + React Router                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Login     │→ │ CreateGoal  │→ │  AICoachQuestionnaire   │  │
│  │  (Screen 0) │  │ (Screen A)  │  │      (Screen B)         │  │
│  └─────────────┘  └─────────────┘  └───────────┬─────────────┘  │
│                                                 ↓                 │
│                                    ┌─────────────────────────┐   │
│                                    │  WorkoutPlanResult      │   │
│                                    │      (Screen C)         │   │
│                                    │  - Table display        │   │
│                                    │  - Edit inline          │   │
│                                    │  - Save / Export PDF    │   │
│                                    └─────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ API Calls (Real users only)
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (Render)                          │
│                    Express.js + OpenAI API                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Routes:                                                 │    │
│  │  - POST /api/goals         (Create fitness goal)        │    │
│  │  - POST /api/ai-interview  (Generate workout via GPT)   │    │
│  │  - POST /api/workouts      (Save workout to history)    │    │
│  │  - GET  /auth/google       (Google OAuth)               │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE (Neon PostgreSQL)                 │
│  Tables: users, goals, workouts, sessions                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| React Router v6 | Client-side routing |
| CSS Modules | Component styling |
| localStorage | Demo mode data persistence |

### Backend
| Technology | Purpose |
|------------|---------|
| Express.js | REST API server |
| OpenAI API | AI workout generation |
| JWT | Authentication tokens |
| Passport.js | Google OAuth |
| CORS | Cross-origin requests |

### Infrastructure
| Service | Purpose | URL |
|---------|---------|-----|
| Vercel | Frontend hosting | `frontend-*.vercel.app` |
| Render | Backend hosting | `meal-planner-app-mve2.onrender.com` |
| Neon | PostgreSQL database | Serverless Postgres |

---

## 4. User Flows

### Flow A: Demo User (No Backend Required)
```
Login Page
    │
    ├── Click "Demo Login" (orange button)
    │       └── Creates local session (demo-token-*)
    │
    ↓
Create Goal (Screen A)
    │
    ├── Enter goal name & description
    ├── Click "Continue to AI Coach"
    │       └── Bypasses backend (demo user detected)
    │
    ↓
AI Coach Questionnaire (Screen B)
    │
    ├── Answer 7 questions (min 3 required)
    │   1. Fitness objective
    │   2. Workout location (Gym/Pool/Both) ← LOCATION AWARE
    │   3. Intensity level
    │   4. Days per week
    │   5. Overall goal
    │   6. Injuries/limitations
    │   7. Focus type
    │
    ├── Click "Generate My Workout Plan"
    │       └── Generates demo workout based on answers
    │
    ↓
Workout Plan Result (Screen C)
    │
    ├── View workout table (Day/Location/Exercise/Sets/Reps/Weight)
    ├── Edit Workout → Inline editing
    ├── Save Workout → Saves to localStorage
    ├── Export PDF → Opens print dialog
    ├── Regenerate with Tweaks → Back to questionnaire
    └── New Goal → Start over
```

### Flow B: Authenticated User (Google OAuth)
```
Login Page
    │
    ├── Click "Continue with Google"
    │       └── Redirects to /auth/google on backend
    │       └── Google OAuth flow
    │       └── Returns JWT token
    │
    ↓
[Same flow as Demo, but API calls go to real backend]
    │
    └── Workouts saved to Neon PostgreSQL database
```

---

## 5. Component Reference

### Login.jsx
**Purpose:** Authentication entry point
**Location:** `frontend/src/components/Login.jsx`

| Function | Description |
|----------|-------------|
| `handleGoogleLogin()` | Redirects to backend Google OAuth |
| `handleDemoLogin()` | Creates local demo session |
| `handleEmailLogin()` | Email/password authentication |

**Features:**
- Google OAuth button (primary)
- Demo Login button (orange, no password)
- Email/password form (expandable)
- ASR purple gradient branding

---

### CreateGoal.jsx
**Purpose:** Screen A - Define fitness goal
**Location:** `frontend/src/components/CreateGoal.jsx`

| Function | Description |
|----------|-------------|
| `handleSubmit()` | Creates goal (backend or demo) |

**Demo Mode Logic:**
```javascript
const isDemoUser = token && token.startsWith('demo-token-');
if (isDemoUser) {
  // Skip backend, navigate directly to AI Coach
  navigate('/ai-coach', { state: { goalId, goalName, goalDescription } });
}
```

---

### AICoachQuestionnaire.jsx
**Purpose:** Screen B - 7-question interview
**Location:** `frontend/src/components/AICoachQuestionnaire.jsx`

| Function | Description |
|----------|-------------|
| `handleSubmit()` | Generates workout plan |
| `handleChange()` | Updates answer state |

**Location-Aware Demo Workouts:**
```javascript
const locationAnswer = answers.workout_location.toLowerCase();
const includePool = locationAnswer.includes('pool') || locationAnswer.includes('both');
const includeGym = locationAnswer.includes('gym') || locationAnswer.includes('both');

// Generates appropriate workout:
// - Gym only: Mon/Wed/Fri strength training
// - Pool only: Mon/Wed/Fri swimming
// - Both: Mon/Wed/Fri gym + Tue/Thu pool
```

---

### WorkoutPlanResult.jsx
**Purpose:** Screen C - Display and manage workout
**Location:** `frontend/src/components/WorkoutPlanResult.jsx`

| Function | Description |
|----------|-------------|
| `parseWorkoutToRows()` | Converts workout data to table rows |
| `toggleEditMode()` | Enable/disable inline editing |
| `handleCellEdit()` | Update cell value |
| `saveWorkout()` | Save to backend or localStorage |
| `exportToPDF()` | Generate printable PDF |
| `handleRegenerate()` | Open tweak modal |

**Supported Workout Formats:**
1. `{ days: [{ day, location, exercises }] }` - Primary format
2. `{ weekly_plan: [...] }` - Alternative format
3. `{ warm_up, strength, cardio }` - Legacy section format

---

## 6. API Endpoints

### Backend Routes (Render)

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/goals` | Create fitness goal | Yes |
| GET | `/api/goals` | List user goals | Yes |
| POST | `/api/ai-interview` | Generate AI workout | Yes |
| POST | `/api/workouts` | Save workout | Yes |
| GET | `/api/workouts` | List saved workouts | Yes |
| GET | `/auth/google` | Initiate Google OAuth | No |
| GET | `/auth/google/callback` | OAuth callback | No |
| POST | `/api/demo-login` | Demo login endpoint | No |

### Request/Response Examples

**POST /api/ai-interview**
```json
// Request
{
  "interview_answers": {
    "fitness_objective": "Build strength",
    "workout_location": "Gym and pool",
    "intensity": "High",
    "days_per_week": "5",
    "overall_goal": "Get stronger",
    "injuries": "None",
    "focus_type": "Strength"
  },
  "goal_id": "goal-123",
  "goal_name": "Strength Training",
  "tweak_request": null
}

// Response
{
  "workout": {
    "days": [...],
    "summary": { "total_duration": "60 minutes", ... },
    "closeout": { "notes": "..." }
  },
  "message": "Workout generated successfully"
}
```

---

## 7. Authentication

### Token Types

| Token Type | Format | Storage | Validation |
|------------|--------|---------|------------|
| Demo Token | `demo-token-{timestamp}` | localStorage | Frontend only |
| JWT Token | `eyJhbG...` | localStorage | Backend validates |
| Google OAuth | Via Passport.js | Session + JWT | Backend handles |

### Demo User Detection
```javascript
const isDemoUser = token && token.startsWith('demo-token-');
```

All components check for demo users and bypass backend calls accordingly.

---

## 8. Demo Mode

### How It Works
Demo mode provides **full app functionality without requiring a backend connection**.

| Feature | Demo Behavior |
|---------|---------------|
| Login | Creates local session instantly |
| Create Goal | Skips backend, navigates directly |
| AI Questionnaire | Generates pre-built workout based on answers |
| Save Workout | Saves to `localStorage.demoWorkouts` |
| Export PDF | Works normally (browser print) |
| Regenerate | Returns to questionnaire with answers pre-filled |

### Demo Workout Logic

**Gym Only:**
- Monday: Squats, Leg Press, Lunges
- Wednesday: Bench Press, Incline Press, Cable Flyes
- Friday: Deadlifts, Barbell Rows, Lat Pulldowns

**Pool Only:**
- Monday: Freestyle Laps, Backstroke, Treading Water
- Wednesday: Breaststroke, Water Jogging, Flutter Kicks
- Friday: Butterfly Drills, Mixed Stroke, Cool Down

**Gym + Pool:**
- Monday: Gym (Legs)
- Tuesday: Pool (Cardio)
- Wednesday: Gym (Chest)
- Thursday: Pool (Cardio)
- Friday: Gym (Back)

---

## 9. Deployment

### URLs
| Environment | Frontend | Backend |
|-------------|----------|---------|
| Production | `https://frontend-*.vercel.app` | `https://meal-planner-app-mve2.onrender.com` |

### Deploy Commands

**Frontend (from local Mac):**
```bash
cd fitness/frontend
git pull origin claude/review-app-documents-gyEij
vercel --prod
```

**Backend (Render):**
- Auto-deploys from GitHub main branch
- Manual deploy via Render dashboard

### Environment Variables

**Frontend (Vercel):**
```
VITE_API_BASE_URL=https://meal-planner-app-mve2.onrender.com
```

**Backend (Render):**
```
DATABASE_URL=postgresql://neondb_owner:***@ep-xxx.us-east-2.aws.neon.tech/neondb
OPENAI_API_KEY=sk-***
JWT_SECRET=***
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***
GOOGLE_CALLBACK_URL=https://meal-planner-app-mve2.onrender.com/auth/google/callback
FRONTEND_BASE=https://frontend-*.vercel.app
```

---

## 10. Lessons Learned & Errors

### Error 1: "Invalid or expired token"
**Cause:** Demo users calling backend endpoints that validate JWT tokens
**Solution:** Added `isDemoUser` check to bypass backend for demo tokens
```javascript
const isDemoUser = token && token.startsWith('demo-token-');
if (isDemoUser) {
  // Handle locally, don't call backend
}
```

### Error 2: Empty workout table
**Cause:** Demo workout format didn't match parser expectations
**Solution:** Changed from flat array to nested `{ days: [{ exercises }] }` format

### Error 3: "password authentication failed for user"
**Cause:** Missing or incorrect DATABASE_URL in .env
**Solution:** Use Neon connection string, not local PostgreSQL

### Error 4: Vercel deploying old code
**Cause:** `vercel --prod` deploys local files, not git repo
**Solution:** Always `git pull` before `vercel --prod`

### Error 5: Google OAuth redirect issues
**Cause:** Missing redirect URL parameter
**Solution:** Pass `?redirect=${window.location.origin}` to OAuth endpoint

### Best Practices Established
1. **Always check for demo users** before making API calls
2. **Pull latest git changes** before deploying to Vercel
3. **Use proper data formats** that match component parsers
4. **Test demo mode separately** - it should work without backend
5. **Location-aware logic** - parse user answers to customize output

---

## 11. File Structure

```
fitness/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx           # Auth: Google, Demo, Email
│   │   │   ├── Login.css
│   │   │   ├── CreateGoal.jsx      # Screen A: Goal definition
│   │   │   ├── CreateGoal.css
│   │   │   ├── AICoachQuestionnaire.jsx  # Screen B: 7 questions
│   │   │   ├── AICoachQuestionnaire.css
│   │   │   ├── WorkoutPlanResult.jsx     # Screen C: Workout table
│   │   │   ├── WorkoutPlanResult.css
│   │   │   └── GoalsTracker.jsx    # Goals list view
│   │   ├── hooks/
│   │   │   └── useAuth.js          # Auth state management
│   │   ├── config/
│   │   │   └── api.js              # API base URL & endpoints
│   │   ├── styles/
│   │   │   └── asr-theme.css       # ASR branding (purple/orange)
│   │   ├── App.jsx                 # Router & layout
│   │   ├── App.css
│   │   └── main.jsx                # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── routes/
│   │   ├── fitness.js              # AI interview, goals, workouts
│   │   └── auth.js                 # Google OAuth
│   ├── middleware/
│   │   └── auth.js                 # JWT validation
│   ├── server.js                   # Express app
│   └── package.json
│
├── docs/                           # Legacy documentation
└── FITNESS_APP_BLUEPRINT.md        # THIS FILE
```

---

## Quick Reference

### Demo Login Flow
1. Click orange "Demo Login" button
2. No password needed - instant access
3. All features work locally

### Key Files to Modify
- **Login options:** `Login.jsx`
- **Goal creation:** `CreateGoal.jsx`
- **Questionnaire/Demo workouts:** `AICoachQuestionnaire.jsx`
- **Workout display/save:** `WorkoutPlanResult.jsx`

### Deploy Checklist
1. `git pull origin claude/review-app-documents-gyEij`
2. `cd fitness/frontend`
3. `vercel --prod`
4. Test at new Vercel URL

---

*Document maintained as single source of truth for ASR Fitness Coach application.*
