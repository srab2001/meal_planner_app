# 🚀 Run Fitness Migrations on Render

**Problem:** Local database credentials are outdated
**Solution:** Run migrations directly from Render service
**Time:** 5 minutes

---

## ✅ Option 1: Run from Render Shell (Easiest)

### Step 1: Access Render Shell

1. Go to: https://dashboard.render.com
2. Click on service: `meal-planner-app-mve2`
3. Click the "Shell" tab in the top navigation
4. Wait for shell to connect (shows `$` prompt)

### Step 2: Run Migration Commands

Copy and paste these commands into the Render shell:

```bash
# Navigate to project root
cd /opt/render/project/src

# Navigate to fitness directory
cd fitness

# Run Prisma migrations
npx prisma migrate deploy
```

### Step 3: Verify Success

**Expected Output:**
```
✓ Prisma schema loaded from prisma/schema.prisma
✓ Datasource "db": PostgreSQL database
✓ 3 migrations found in prisma/migrations

Applying migration `001_init`
Applying migration `002_add_fitness_goals`
Applying migration `003_add_exercise_library`

The following migrations have been applied:

migrations/
  └─ 001_init/
  └─ 002_add_fitness_goals/
  └─ 003_add_exercise_library/
      └─ migration.sql

All migrations have been successfully applied.
```

### Step 4: Verify Exercise Count

Still in Render shell:

```bash
npx prisma db execute --stdin <<'EOF'
SELECT COUNT(*) FROM exercise_definitions;
EOF
```

**Expected:** 40

---

## ✅ Option 2: Add Build Command (Automatic)

### Update Render Build Command

1. Go to Render dashboard → `meal-planner-app-mve2`
2. Click "Settings" tab
3. Find "Build Command"
4. Update to include migration:

**Current:**
```bash
npm install
```

**Update to:**
```bash
npm install && cd fitness && npx prisma migrate deploy && cd ..
```

5. Click "Save Changes"
6. Render will rebuild and apply migrations automatically

---

## ✅ Option 3: Manual Deploy Command

### Add Deploy Script to package.json

Create or update `package.json` in project root:

```json
{
  "scripts": {
    "deploy": "cd fitness && npx prisma migrate deploy"
  }
}
```

Then in Render Shell:

```bash
npm run deploy
```

---

## 🔍 Verification Steps

After running migrations (any option):

### 1. Check Tables Exist

In Render Shell:

```bash
npx prisma db execute --stdin <<'EOF'
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE 'fitness%' OR table_name = 'exercise_definitions')
ORDER BY table_name;
EOF
```

**Expected Output:**
```
exercise_definitions
fitness_goals
fitness_profiles
fitness_workout_exercises
fitness_workout_sets
fitness_workouts
```

### 2. Check Exercise Count

```bash
npx prisma db execute --stdin <<'EOF'
SELECT COUNT(*) as exercise_count FROM exercise_definitions;
EOF
```

**Expected:** 40

### 3. Check Sample Exercises

```bash
npx prisma db execute --stdin <<'EOF'
SELECT name, category, difficulty_level
FROM exercise_definitions
LIMIT 5;
EOF
```

**Expected Output:**
```
Bench Press | chest | beginner
Squat | legs | intermediate
...
```

---

## 🎯 After Migrations Complete

### Update Environment Variables

1. Go to Render dashboard → Environment tab
2. **Remove** `FITNESS_DATABASE_URL` (if it exists)
3. **Keep** `DATABASE_URL` (already points to Render DB)

### Verify Other Environment Variables

Make sure these exist:
```
DATABASE_URL=[automatically set by Render]
OPENAI_API_KEY=[your key]
SESSION_SECRET=d8daa69d6b1d30c89a171dccf97ea700fdf285f139affcc2b37c1a45294f7302
NODE_ENV=production
```

### Redeploy

- If using Option 1 or 3: Manually redeploy latest commit
- If using Option 2: Automatic redeploy happens after build command change

---

## 🧪 Test Fitness Endpoints

Once redeployed:

```bash
export JWT_TOKEN="your-token"

# Test 1: Exercise library
curl https://meal-planner-app-mve2.onrender.com/api/fitness/exercise-definitions \
  -H "Authorization: Bearer $JWT_TOKEN"

# Should return 40 exercises
```

**Frontend Test:**
1. Visit: https://meal-planner-gold-one.vercel.app
2. Navigate to "AI Coach" - should load
3. Navigate to "Log Workout" → "Add Exercise" - should show 40 exercises

---

## 🚨 Troubleshooting

### Issue: "npx: command not found"

**Cause:** Node.js not in PATH in shell

**Fix:**
```bash
# Use full path to npx
/opt/render/project/.bin/npx prisma migrate deploy
```

### Issue: "Cannot find module '@prisma/client'"

**Cause:** Dependencies not installed in fitness directory

**Fix:**
```bash
cd fitness
npm install
npx prisma generate
npx prisma migrate deploy
```

### Issue: "Migrations already applied"

**Check if tables actually exist:**
```bash
npx prisma db execute --stdin <<'EOF'
SELECT COUNT(*) FROM exercise_definitions;
EOF
```

If tables don't exist but migration tracking says they do:
```bash
# Force re-run migration 003
npx prisma db execute --file prisma/migrations/003_add_exercise_library/migration.sql
```

---

## 📊 Final Architecture

After migrations complete:

```
Backend (Render)
    ↓
DATABASE_URL
    ↓
Render PostgreSQL (meal_planner_vo27)
    ├─ Main App Tables
    │  - users
    │  - recipes
    │  - sessions
    │
    └─ Fitness Tables
       - fitness_profiles
       - fitness_goals
       - fitness_workouts
       - fitness_workout_exercises
       - fitness_workout_sets
       - exercise_definitions (40 exercises)
```

**One database, everything together!**

---

## ✅ Success Checklist

- [ ] Opened Render Shell
- [ ] Ran `npx prisma migrate deploy` in fitness directory
- [ ] Saw "All migrations have been successfully applied"
- [ ] Verified 6 fitness tables exist
- [ ] Verified 40 exercises in exercise_definitions table
- [ ] Removed `FITNESS_DATABASE_URL` from Render environment
- [ ] Redeployed backend
- [ ] Tested exercise library API (returns 40 exercises)
- [ ] Tested AI Coach in frontend (loads questions)
- [ ] Tested Log Workout in frontend (shows 40 exercises)

---

**Recommended:** Option 1 (Render Shell) - fastest and most direct

**Time:** 5 minutes
**Risk:** Low (migrations are idempotent)
**Benefit:** Single consolidated database

---

**Created:** December 25, 2025
**Purpose:** Apply fitness migrations to Render database
**Method:** Run from Render Shell
