# 🚨 URGENT: Fix Fitness Database Connection

**Problem:** Fitness backend using wrong database
**Impact:** AI Coach fails, Exercise library unavailable
**Solution:** Update code + environment variables

---

## 🔍 Root Cause Analysis

### The Bug

**File:** `fitness/backend/routes/fitness.js` (Line 44)

**Current Code (WRONG):**
```javascript
function getFitnessDb() {
  if (!fitnessDb) {
    const dbUrl = process.env.DATABASE_URL;  // ← BUG: Uses main app DB
```

**This connects to:** Render PostgreSQL (meal_planner_vo27) - WRONG
**Should connect to:** Neon PostgreSQL (neondb) - CORRECT

---

## ✅ Fix 1: Update Code (Priority 1)

### Change Line 44 in fitness/backend/routes/fitness.js

**FROM:**
```javascript
const dbUrl = process.env.DATABASE_URL;
```

**TO:**
```javascript
const dbUrl = process.env.FITNESS_DATABASE_URL || process.env.DATABASE_URL;
```

This allows FITNESS_DATABASE_URL to take priority, falling back to DATABASE_URL if not set.

---

## ✅ Fix 2: Add Render Environment Variable

### In Render Dashboard

1. Go to: https://dashboard.render.com
2. Select: `meal-planner-app-mve2`
3. Click: "Environment" tab
4. Click: "+ Add Environment Variable"

**Add:**
```
Key: FITNESS_DATABASE_URL
Value: postgresql://neondb_owner:npg_CWXAK5daMiL8@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Keep existing:**
```
Key: DATABASE_URL
Value: postgresql://meal_planner_user:...@dpg-d4nj6demcj7s73dfvie0-a.oregon-postgres.render.com/meal_planner_vo27
```

---

## 📋 Complete Fix Steps

### Step 1: Fix the Code Locally

```bash
cd fitness/backend/routes
# Edit fitness.js line 44
```

Change:
```javascript
const dbUrl = process.env.DATABASE_URL;
```

To:
```javascript
const dbUrl = process.env.FITNESS_DATABASE_URL || process.env.DATABASE_URL;
```

### Step 2: Commit and Push

```bash
cd /path/to/meal_planner
git add fitness/backend/routes/fitness.js
git commit -m "🔧 Fix: Use FITNESS_DATABASE_URL for fitness database connection"
git push origin main
```

### Step 3: Add Environment Variable in Render

1. Visit Render dashboard
2. Add `FITNESS_DATABASE_URL` (see value above)
3. Save

Render will automatically redeploy after env var is added.

### Step 4: Wait for Redeploy

- Wait 5-10 minutes for Render to redeploy
- Monitor logs for "Connected to: neondb"

### Step 5: Test

```bash
# Test exercise library
export JWT_TOKEN="your-token"
curl https://meal-planner-app-mve2.onrender.com/api/fitness/exercise-definitions \
  -H "Authorization: Bearer $JWT_TOKEN"

# Should return 40 exercises
```

---

## 🎯 Why Both Databases Are Needed

### DATABASE_URL (Render PostgreSQL)
**Purpose:** Main meal planner app
**Tables:**
- users
- recipes
- meal_plans
- sessions
- user_preferences
- admin_interview_questions (for fitness AI coach)

### FITNESS_DATABASE_URL (Neon PostgreSQL)
**Purpose:** Fitness module
**Tables:**
- fitness_profiles
- fitness_goals
- fitness_workouts
- fitness_workout_exercises
- fitness_workout_sets
- exercise_definitions (40 exercises)

**Both databases are required!**

---

## 🔄 Alternative: Single Database Approach

If you want to use ONLY Render's database:

### Option A: Migrate Fitness Tables to Render DB

```bash
# Apply fitness migrations to Render database
export DATABASE_URL="postgresql://meal_planner_user:...@dpg-d4nj6demcj7s73dfvie0-a.oregon-postgres.render.com/meal_planner_vo27"

cd fitness
npx prisma migrate deploy

# This will:
# - Create 6 fitness tables in Render DB
# - Seed 40 exercises
```

**Then remove FITNESS_DATABASE_URL** from Render environment.

### Option B: Keep Separate Databases (Recommended)

**Pros:**
- Fitness data isolated
- Can scale independently
- Already set up in Neon
- Neon has better performance for fitness queries

**Cons:**
- Two databases to maintain
- Slightly more complex

**Recommendation:** Keep separate databases (easier, already set up)

---

## 🚨 Additional Issue: Main App Migration Failure

Your logs also show:

```
ERROR in 003_user_preferences.sql: column "default_cuisines" does not exist
```

This is a **separate issue** with the main app's migrations. This needs to be fixed independently.

### Quick Fix for Main App Migration

The migration file is trying to create an index on a column that doesn't exist yet.

**Check:** `migrations/003_user_preferences.sql`

**Common causes:**
1. Migrations running out of order
2. Column name typo
3. Migration trying to index before creating column

**Fix:** Review migration file and ensure columns are created before indexes.

---

## ✅ Verification Checklist

After applying fixes:

- [ ] Code updated (line 44 uses FITNESS_DATABASE_URL)
- [ ] Committed and pushed to GitHub
- [ ] FITNESS_DATABASE_URL added in Render
- [ ] Render redeployed successfully
- [ ] Logs show "Connected to: neondb"
- [ ] Exercise library API returns 40 exercises
- [ ] Frontend AI Coach works (no 404 error)
- [ ] Frontend Exercise Selector shows 40 exercises
- [ ] No "relation does not exist" errors

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────┐
│         Frontend (Vercel)                   │
│    meal-planner-gold-one.vercel.app         │
└──────────────┬──────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────┐
│      Backend API (Render)                   │
│   meal-planner-app-mve2.onrender.com        │
│                                              │
│   ┌──────────────────────────────────────┐  │
│   │  Fitness Routes (/api/fitness/*)     │  │
│   │  Uses: FITNESS_DATABASE_URL          │  │
│   └───────────┬──────────────────────────┘  │
│               │                              │
│   ┌───────────┴──────────────────────────┐  │
│   │  Main Routes (/api/*)                │  │
│   │  Uses: DATABASE_URL                  │  │
│   └───────────┬──────────────────────────┘  │
└───────────────┼──────────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
        ↓                ↓
┌──────────────┐  ┌──────────────────┐
│  Render DB   │  │   Neon DB        │
│  Main App    │  │   Fitness Only   │
│  Tables      │  │   6 Tables       │
│              │  │   40 Exercises   │
└──────────────┘  └──────────────────┘
```

---

**Status:** Awaiting code fix and environment variable update
**ETA:** 15-20 minutes (5 min code fix + 10 min deploy)
**Priority:** CRITICAL

---

**Created:** December 25, 2025
**Issue:** Wrong database URL in fitness routes
**Fix:** Use FITNESS_DATABASE_URL with fallback
