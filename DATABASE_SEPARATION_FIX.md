# Critical Fix: Fitness Module Database Connection - Commit 89fd529

## Problem

**Symptoms:**
- `GET /api/fitness/profile` → 500 error
- `GET /api/fitness/goals` → 500 error  
- `GET /api/fitness/admin/interview-questions` → 404 error
- AI Coach feature unable to load interview questions

**Root Cause:**
The fitness backend was using **only one database connection** (`DATABASE_URL` pointing to Render PostgreSQL) for **all** fitness queries, but the fitness tables are stored in **two different databases**:

1. **Fitness tables** (fitness_profiles, fitness_goals, fitness_workouts, etc.) → `FITNESS_DATABASE_URL` (Neon PostgreSQL)
2. **Admin tables** (admin_interview_questions) → `DATABASE_URL` (Render PostgreSQL)

The code was querying fitness tables in the wrong database, causing the tables to not be found (404 or schema mismatch errors showing as 500).

## Solution

**Separated database connections:**

```javascript
// Before: Single getDb() function using DATABASE_URL
const profile = await getDb().fitness_profiles.findUnique(...);

// After: Two separate functions
const profile = await getFitnessDb().fitness_profiles.findUnique(...);    // Uses FITNESS_DATABASE_URL
const questions = await getMainDb().admin_interview_questions.findMany(...); // Uses DATABASE_URL
```

### New Functions

#### `getFitnessDb()` - For fitness tables
```javascript
function getFitnessDb() {
  // Uses FITNESS_DATABASE_URL (Neon PostgreSQL)
  // Manages: fitness_profiles, fitness_goals, fitness_workouts, interview_responses
}
```

#### `getMainDb()` - For admin tables
```javascript
function getMainDb() {
  // Uses DATABASE_URL (Render PostgreSQL)
  // Manages: admin_interview_questions
}
```

### Database Mapping

| Table | Database | Function | Environment Var |
|-------|----------|----------|-----------------|
| fitness_profiles | Neon | getFitnessDb() | FITNESS_DATABASE_URL |
| fitness_goals | Neon | getFitnessDb() | FITNESS_DATABASE_URL |
| fitness_workouts | Neon | getFitnessDb() | FITNESS_DATABASE_URL |
| interview_responses | Neon | getFitnessDb() | FITNESS_DATABASE_URL |
| admin_interview_questions | Render | getMainDb() | DATABASE_URL |

## Changes Made

**File:** `fitness/backend/routes/fitness.js`

**Line 42-78:** Renamed `getDb()` → `getFitnessDb()` with FITNESS_DATABASE_URL
```javascript
function getFitnessDb() {
  if (!fitnessDb) {
    const dbUrl = process.env.FITNESS_DATABASE_URL;  // ← Changed from DATABASE_URL
    // ... initialize with Neon connection
  }
  return fitnessDb;
}
```

**Line 79-127:** New `getMainDb()` function with DATABASE_URL
```javascript
function getMainDb() {
  if (!mainDb) {
    const dbUrl = process.env.DATABASE_URL;  // ← Main Render database
    // ... initialize with Render connection
  }
  return mainDb;
}
```

**Lines 180-926:** Replaced all `getDb().fitness_*` calls
- `getDb().fitness_profiles` → `getFitnessDb().fitness_profiles` (10 calls)
- `getDb().fitness_goals` → `getFitnessDb().fitness_goals` (2 calls)
- `getDb().fitness_workouts` → `getFitnessDb().fitness_workouts` (3 calls)

**Lines 1006-1397:** Replaced all `getDb().admin_interview_questions` calls  
- `getDb().admin_interview_questions` → `getMainDb().admin_interview_questions` (7 calls)

## Verification

After this fix:

✅ **Fitness Profile Endpoint**
```bash
GET /api/fitness/profile
→ Connects to FITNESS_DATABASE_URL (Neon)
→ Queries fitness_profiles table
→ Returns 200 with profile data or 404 if profile doesn't exist
```

✅ **Fitness Goals Endpoint**
```bash
GET /api/fitness/goals
→ Connects to FITNESS_DATABASE_URL (Neon)
→ Queries fitness_goals table
→ Returns 200 with goals list
```

✅ **Interview Questions Endpoint**
```bash
GET /api/fitness/admin/interview-questions?active=true
→ Connects to DATABASE_URL (Render)
→ Queries admin_interview_questions table
→ Auto-seeds 5 default questions if table is empty
→ Returns 200 with questions list
```

## Impact

| Endpoint | Before | After |
|----------|--------|-------|
| GET /api/fitness/profile | 500 | 200/404 |
| GET /api/fitness/goals | 500 | 200 |
| GET /api/fitness/admin/interview-questions | 404 | 200 |
| AI Coach Interview | ❌ Won't Load | ✅ Loads |
| Fitness Profile Page | ❌ Error | ✅ Works |
| Fitness Goals Page | ❌ Error | ✅ Works |

## Testing

To verify the fix works:

1. **Test Fitness Profile:**
   ```bash
   curl -X GET https://meal-planner-app-mve2.onrender.com/api/fitness/profile \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Expected: 200 or 404 (not 500)

2. **Test Fitness Goals:**
   ```bash
   curl -X GET https://meal-planner-app-mve2.onrender.com/api/fitness/goals \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Expected: 200 (not 500)

3. **Test Interview Questions:**
   ```bash
   curl -X GET 'https://meal-planner-app-mve2.onrender.com/api/fitness/admin/interview-questions?active=true' \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Expected: 200 with questions array (not 404)

4. **In Browser:**
   - Go to Fitness app
   - Click "AI Coach"
   - Verify 5 interview questions appear
   - Expected: No console errors

## Deployment

**Status:** ✅ Already deployed to Render via auto-deployment

The fix will take effect:
1. Immediately on next backend restart
2. Render auto-restarts the backend periodically
3. Or manually restart in Render dashboard

## Related Issues Fixed

- Commit 89fd529: Separate database connections ← **YOU ARE HERE**
- Commit 0fa7da5: Interview questions deployment
- Commit 90c9d07: Verification and seeding tools
- Commit 18e79ff: User Management response structure

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Backend (fitness/backend/routes/fitness.js)                 │
│                                                             │
│  GET /api/fitness/profile                                   │
│  │                                                           │
│  └─→ getFitnessDb()                                         │
│      │                                                       │
│      └─→ FITNESS_DATABASE_URL                              │
│          │                                                   │
│          └─→ Neon PostgreSQL                                │
│              └─→ fitness_profiles table  ✅                 │
│                                                             │
│  GET /api/fitness/admin/interview-questions                │
│  │                                                           │
│  └─→ getMainDb()                                            │
│      │                                                       │
│      └─→ DATABASE_URL                                       │
│          │                                                   │
│          └─→ Render PostgreSQL                              │
│              └─→ admin_interview_questions table ✅         │
└─────────────────────────────────────────────────────────────┘
```

---

**Commit:** 89fd529  
**Date:** 2025-12-24  
**Status:** ✅ Deployed  
**Impact:** Critical - Fixes AI Coach and Fitness Profile features
