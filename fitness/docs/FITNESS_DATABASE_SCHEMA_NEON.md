# FITNESS MODULE - DATABASE SCHEMA FOR NEON

**Status:** ✅ Ready for Migration
**Date:** 2025-12-21
**Database:** PostgreSQL (Neon)

---

## DEPLOYMENT INSTRUCTIONS

### Step 1: Update Prisma Schema
✅ **DONE:** Updated `prisma/schema.prisma`
- Added 7 fitness models
- Added relations to users model
- All cascade deletes configured

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```

### Step 3: Deploy Migration to Neon
```bash
# Option A: Via Prisma (automatic migration)
npx prisma migrate deploy

# Option B: Direct SQL execution (if needed)
# Copy SQL from prisma/migrations/fitness_module_init/migration.sql
# Execute in Neon SQL Editor
```

### Step 4: Verify Tables Created
```bash
npx prisma studio
# or SQL query:
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' AND table_name LIKE 'fitness_%';
```

---

## SCHEMA OVERVIEW

### 7 Tables Created

#### 1. `fitness_profiles` (User Fitness Data)
- **PK:** `id` (UUID)
- **FK:** `user_id` (users.id) - UNIQUE, CASCADE DELETE
- **Fields:** age, gender, height_cm, weight_kg, experience_level, primary_goal, weekly_goal_hours
- **Indexes:** user_id
- **Purpose:** Store user fitness profile information (one per user)

#### 2. `fitness_exercises` (Reference Data)
- **PK:** `id` (UUID)
- **Fields:** name (UNIQUE), description, category, equipment, primary_muscle_group, secondary_muscle_groups[], difficulty_level, instruction_url, image_url
- **Indexes:** category, equipment, primary_muscle_group
- **Purpose:** Exercise definitions (seeded, not user-specific)

#### 3. `fitness_workouts` (Strength Training Sessions)
- **PK:** `id` (UUID)
- **FK:** `user_id` (users.id) - CASCADE DELETE
- **Fields:** workout_date, name, description, duration_minutes, total_volume_kg, total_reps, notes, status (default: 'completed'), deleted_at (soft delete)
- **Indexes:** user_id, workout_date, status, (user_id, workout_date DESC)
- **Relationships:** → workout_exercises (1:N), → goals (1:N)
- **Purpose:** Log strength training workouts

#### 4. `fitness_workout_exercises` (Junction Table)
- **PK:** `id` (UUID)
- **FK:** `workout_id` (fitness_workouts.id) - CASCADE DELETE
- **FK:** `exercise_id` (fitness_exercises.id) - CASCADE DELETE
- **Fields:** order_position, notes, deleted_at (soft delete)
- **Unique:** (workout_id, exercise_id)
- **Indexes:** workout_id, exercise_id
- **Relationships:** ← workouts, → exercises, → workout_sets (1:N)
- **Purpose:** Link exercises to workouts with order

#### 5. `fitness_workout_sets` (Individual Sets/Reps)
- **PK:** `id` (UUID)
- **FK:** `workout_exercise_id` (fitness_workout_exercises.id) - CASCADE DELETE
- **Fields:** set_number, reps, weight_kg, weight_lbs, rpe (rate of perceived exertion), notes, deleted_at (soft delete)
- **Indexes:** workout_exercise_id
- **Purpose:** Store individual sets/reps data for each exercise

#### 6. `fitness_cardio_sessions` (Running, Cycling, etc.)
- **PK:** `id` (UUID)
- **FK:** `user_id` (users.id) - CASCADE DELETE
- **Fields:** session_date, activity_type, duration_minutes, distance_km, distance_miles, avg_heart_rate, max_heart_rate, elevation_gain_m, calories_burned, notes, status (default: 'completed'), deleted_at (soft delete)
- **Indexes:** user_id, session_date, activity_type, (user_id, session_date DESC)
- **Purpose:** Log cardio activities separately from strength workouts

#### 7. `fitness_goals` (User Goals/Targets)
- **PK:** `id` (UUID)
- **FK:** `user_id` (users.id) - CASCADE DELETE
- **FK:** `workout_id` (fitness_workouts.id) - SET NULL on delete
- **Fields:** goal_type, target_value, current_value, unit, target_date, status (default: 'active'), completed_at, deleted_at (soft delete)
- **Indexes:** user_id, status, (user_id, status)
- **Purpose:** Track user fitness goals and progress

---

## FOREIGN KEY RELATIONSHIPS

```
users (1) ──→ (N) fitness_profiles
users (1) ──→ (N) fitness_workouts
users (1) ──→ (N) fitness_cardio_sessions
users (1) ──→ (N) fitness_goals

fitness_workouts (1) ──→ (N) fitness_workout_exercises
fitness_workout_exercises (1) ──→ (N) fitness_workout_sets

fitness_exercises (1) ←── (N) fitness_workout_exercises

fitness_workouts (1) ←── (N) fitness_goals
```

---

## CASCADE DELETE BEHAVIOR

### Delete User → Cascading Deletes
1. User deleted
2. → fitness_profiles deleted
3. → fitness_workouts deleted
4. → fitness_workout_exercises deleted
5. → fitness_workout_sets deleted
6. → fitness_cardio_sessions deleted
7. → fitness_goals (workout_id = NULL)

### Delete Workout Exercise → Cascading Deletes
1. Workout exercise deleted
2. → fitness_workout_sets deleted

### Delete Workout → Goal Reference
1. Workout deleted
2. → fitness_goals.workout_id = NULL (SET NULL, not cascade)

---

## INDEXES (20 Total)

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| fitness_profiles | idx_fitness_profiles_user_id | user_id | User lookups |
| fitness_exercises | idx_fitness_exercises_category | category | Filter by exercise category |
| fitness_exercises | idx_fitness_exercises_equipment | equipment | Filter by equipment |
| fitness_exercises | idx_fitness_exercises_muscle_group | primary_muscle_group | Filter by muscle group |
| fitness_workouts | idx_fitness_workouts_user_id | user_id | User's workouts |
| fitness_workouts | idx_fitness_workouts_date | workout_date | Date range queries |
| fitness_workouts | idx_fitness_workouts_status | status | Filter by status |
| fitness_workouts | idx_fitness_workouts_user_recent | user_id, workout_date DESC | Recent user workouts |
| fitness_workout_exercises | idx_fitness_workout_exercises_workout_id | workout_id | Exercises in workout |
| fitness_workout_exercises | idx_fitness_workout_exercises_exercise_id | exercise_id | Exercise usage stats |
| fitness_workout_sets | idx_fitness_workout_sets_exercise_id | workout_exercise_id | Sets for exercise |
| fitness_cardio_sessions | idx_fitness_cardio_sessions_user_id | user_id | User's cardio sessions |
| fitness_cardio_sessions | idx_fitness_cardio_sessions_date | session_date | Date range queries |
| fitness_cardio_sessions | idx_fitness_cardio_sessions_activity | activity_type | Filter by activity |
| fitness_cardio_sessions | idx_fitness_cardio_sessions_user_recent | user_id, session_date DESC | Recent user cardio |
| fitness_goals | idx_fitness_goals_user_id | user_id | User's goals |
| fitness_goals | idx_fitness_goals_status | status | Filter by goal status |
| fitness_goals | idx_fitness_goals_user_status | user_id, status | User active goals |

---

## DATA TYPES & CONSTRAINTS

### UUID Primary Keys
All tables use PostgreSQL `uuid_generate_v4()` for distributed, collision-free IDs.

### Timestamps
- `created_at`: Immutable, defaults to CURRENT_TIMESTAMP
- `updated_at`: Updated on every modification
- Format: TIMESTAMP(6) with 6 decimal precision (microseconds)

### Soft Deletes
Tables with user-generated data include `deleted_at` (nullable) for audit trails:
- fitness_workouts
- fitness_workout_exercises
- fitness_workout_sets
- fitness_cardio_sessions
- fitness_goals

Query excludes soft-deleted: `WHERE deleted_at IS NULL`

### Decimal Precision
- Weights/distances: DECIMAL(8,2) - up to 999,999.99
- Heart rates: INTEGER (0-300 BPM range)
- RPE (Rate of Perceived Exertion): DECIMAL(3,1) - 0-10 scale
- Heights: DECIMAL(5,2) - 0-999.99 cm
- Body weight: DECIMAL(6,2) - 0-9,999.99 kg

### Text Arrays (PostgreSQL)
- `fitness_exercises.secondary_muscle_groups` - TEXT[] for multiple muscle groups

---

## SAMPLE QUERIES

### Get User's Recent Workouts (7 days)
```sql
SELECT * FROM fitness_workouts
WHERE user_id = $1
  AND workout_date >= NOW() - INTERVAL '7 days'
  AND deleted_at IS NULL
ORDER BY workout_date DESC;
```

### Get Workout with All Exercises & Sets
```sql
SELECT 
  w.id, w.name, w.workout_date,
  we.exercise_id, e.name as exercise_name, we.order_position,
  fs.set_number, fs.reps, fs.weight_kg, fs.rpe
FROM fitness_workouts w
LEFT JOIN fitness_workout_exercises we ON w.id = we.workout_id AND we.deleted_at IS NULL
LEFT JOIN fitness_exercises e ON we.exercise_id = e.id
LEFT JOIN fitness_workout_sets fs ON we.id = fs.workout_exercise_id AND fs.deleted_at IS NULL
WHERE w.id = $1 AND w.deleted_at IS NULL
ORDER BY we.order_position, fs.set_number;
```

### Get User's Active Goals
```sql
SELECT * FROM fitness_goals
WHERE user_id = $1 AND status = 'active'
ORDER BY target_date ASC;
```

### Get Cardio Sessions in Date Range
```sql
SELECT 
  activity_type,
  COUNT(*) as count,
  SUM(duration_minutes) as total_duration,
  SUM(distance_km) as total_distance,
  AVG(avg_heart_rate) as avg_heart_rate
FROM fitness_cardio_sessions
WHERE user_id = $1
  AND session_date >= $2
  AND session_date <= $3
  AND deleted_at IS NULL
GROUP BY activity_type;
```

### Get Exercise Usage Stats
```sql
SELECT 
  e.name,
  COUNT(DISTINCT we.workout_id) as workout_count,
  COUNT(fs.id) as total_sets,
  AVG(fs.reps) as avg_reps,
  AVG(fs.weight_kg) as avg_weight
FROM fitness_exercises e
LEFT JOIN fitness_workout_exercises we ON e.id = we.exercise_id
LEFT JOIN fitness_workout_sets fs ON we.id = fs.workout_exercise_id
WHERE we.workout_id IN (
  SELECT id FROM fitness_workouts WHERE user_id = $1 AND deleted_at IS NULL
)
GROUP BY e.name;
```

---

## MIGRATION STATUS

| Step | Status | Details |
|------|--------|---------|
| Prisma Schema Updated | ✅ | 7 fitness models + user relations |
| Migration File Created | ✅ | `prisma/migrations/fitness_module_init/migration.sql` |
| Ready to Deploy | ✅ | Run `npx prisma migrate deploy` |
| Tables in Neon | ⏳ | Awaiting migration deployment |
| Seed Data (Exercises) | ❌ | Create separate seed script |
| API Endpoints Ready | ❌ | FIT-005 to FIT-021 in build sequence |
| Frontend Components Ready | ❌ | FIT-017 to FIT-065 in build sequence |

---

## NEXT STEPS

1. **Deploy Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed Exercise Definitions**
   ```bash
   node scripts/seed-exercises.js
   ```

3. **Verify Tables**
   ```bash
   npx prisma studio
   ```

4. **Begin API Implementation (FIT-005 onwards)**
   - Implement 21 endpoints
   - Reference FITNESS_API_SPECIFICATION.md

5. **Begin Frontend Implementation (FIT-017 onwards)**
   - Create hooks and context
   - Implement components
   - Reference FITNESS_COMPONENT_ARCHITECTURE.md

---

## ROLLBACK

If migration fails:
```bash
# Reset Prisma (local dev only - NOT production)
npx prisma migrate reset

# Or manually rollback in Neon:
# DELETE FROM fitness_*; (in dependency order)
```

---

## VERIFICATION CHECKLIST

After migration:
- [ ] All 7 tables created in Neon
- [ ] All 20 indexes created
- [ ] All foreign keys enforced
- [ ] Cascade deletes working
- [ ] UUID generation working
- [ ] Timestamps defaulting correctly
- [ ] Soft deletes configured (deleted_at nullable)
- [ ] Prisma client updated
- [ ] Relations accessible via Prisma
- [ ] Sample queries executable
