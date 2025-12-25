# CRITICAL: Render Environment Configuration Required

## Issue

The fitness backend needs access to **TWO databases**:
1. **FITNESS DATABASE (Neon)** - for fitness_profiles, fitness_goals, fitness_workouts
2. **MAIN DATABASE (Render)** - for admin_interview_questions

Currently, only the fitness database URL is being used, causing the admin_interview_questions endpoint to fail.

## Fix Applied (Commit 12c6fbf)

Updated the code to use:
- `DATABASE_URL` → Neon (fitness tables)
- `MAIN_DATABASE_URL` → Render (admin tables)

## What You Must Do Manually on Render

### Step 1: Add MAIN_DATABASE_URL to Render Environment

Go to: **Render Dashboard → Your App → Environment**

Add this new variable:
```
MAIN_DATABASE_URL=postgresql://meal_planner_user:VJaFF2BeiisVJm7Fip4IHwL4q5gObQ4@dpg-d4nj6demcj7s73dfvie0-a.oregon-postgres.render.com:5432/meal_planner_vo27?sslmode=require
```

**Note:** You'll need to get the actual connection string from your Render database dashboard.

### Step 2: Verify Existing Variables

Ensure these are also set:
- `DATABASE_URL` → Should point to Neon (fitness database)
- `JWT_SECRET` → Your JWT signing secret
- `SESSION_SECRET` → Your session signing secret

## How It Works Now

```
GET /api/fitness/profile
  ↓ requireAuth middleware
  ↓ getFitnessDb()
  ↓ DATABASE_URL (Neon)
  ↓ fitness_profiles table ✅

GET /api/fitness/admin/interview-questions
  ↓ requireAuth middleware
  ↓ getMainDb()
  ↓ MAIN_DATABASE_URL (Render)
  ↓ admin_interview_questions table ✅
```

## Testing

After adding `MAIN_DATABASE_URL` to Render:

1. Go to Fitness app
2. Check if profile/goals load (no more 500 errors)
3. Click "AI Coach"
4. Verify 5 interview questions appear (no more 404 errors)

## Files Changed

- `fitness/backend/routes/fitness.js` - Updated getFitnessDb() and getMainDb()
- `fitness/backend/.env.example` - Added MAIN_DATABASE_URL documentation

## Database Mapping

| Component | Database | URL Variable | Tables |
|-----------|----------|--------------|--------|
| Fitness Backend (fitness tables) | Neon | `DATABASE_URL` | fitness_profiles, fitness_goals, fitness_workouts, interview_responses |
| Fitness Backend (admin tables) | Render | `MAIN_DATABASE_URL` | admin_interview_questions |
| Main Server | Render | `DATABASE_URL` | users, meals, preferences, admin_interview_questions, etc. |

## Environment Variable Cheat Sheet

**Local Development** (already configured in .env):
```
DATABASE_URL=postgresql://neondb_owner:...@neon.tech/neondb?...
MAIN_DATABASE_URL=postgresql://meal_planner_user:...@render.com/meal_planner_vo27?...
```

**Render Production** (you need to add MAIN_DATABASE_URL):
```
DATABASE_URL=postgresql://neondb_owner:...@neon.tech/neondb?...          ← Already exists
MAIN_DATABASE_URL=postgresql://meal_planner_user:...@render.com/...      ← ADD THIS
JWT_SECRET=...                                                             ← Should exist
SESSION_SECRET=...                                                         ← Should exist
```

## Critical: Order of Environment Setup

1. ✅ DATABASE_URL (Neon) - Already configured
2. ❌ MAIN_DATABASE_URL (Render) - **YOU MUST ADD THIS**
3. ✅ JWT_SECRET - Already configured
4. ✅ SESSION_SECRET - Already configured

Without MAIN_DATABASE_URL, the admin interview questions endpoint will fail with getMainDb() throwing an error.

---

**Commit:** 12c6fbf  
**Status:** Code deployed, but **REQUIRES Render environment update**  
**Action Required:** Add MAIN_DATABASE_URL to Render dashboard  
**Estimated Time:** 2 minutes  

After adding the variable to Render:
1. Render will auto-restart the backend
2. All fitness endpoints will work
3. AI Coach will be fully functional
