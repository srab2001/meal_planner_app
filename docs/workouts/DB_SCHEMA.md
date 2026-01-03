# Workout Tracking - Database Schema

## Tables

### workout_templates

Saved workout plans that can be reused.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | NO | - | Foreign key to users |
| name | VARCHAR(200) | NO | - | Template name |
| notes | TEXT | YES | NULL | Optional description |
| created_at | TIMESTAMPTZ | NO | now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | now() | Last update timestamp |

**Indexes:**
- `idx_workout_templates_user` on `user_id`

**Relations:**
- `users` (many-to-one)
- `workout_template_exercises` (one-to-many)
- `workout_sessions` (one-to-many)

---

### workout_template_exercises

Exercises within a template.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| workout_template_id | UUID | NO | - | Foreign key to template |
| sort_order | INT | NO | 0 | Display order |
| name | VARCHAR(200) | NO | - | Exercise name |
| prescription_type | VARCHAR(20) | NO | 'reps' | 'reps' or 'time' |
| sets | INT | YES | NULL | Number of sets (reps type) |
| reps | INT | YES | NULL | Reps per set (reps type) |
| seconds | INT | YES | NULL | Duration in seconds (time type) |
| rest_seconds | INT | YES | NULL | Rest between sets |
| created_at | TIMESTAMPTZ | NO | now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | now() | Last update timestamp |

**Indexes:**
- `idx_workout_template_exercises_template` on `workout_template_id`

---

### workout_sessions

One run of a workout template.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | NO | - | Foreign key to users |
| workout_template_id | UUID | NO | - | Foreign key to template |
| status | VARCHAR(20) | NO | 'not_started' | Session status |
| started_at | TIMESTAMPTZ | YES | NULL | When session started |
| finished_at | TIMESTAMPTZ | YES | NULL | When session finished |
| completion_percent | INT | NO | 0 | Derived from exercises |
| day_note | TEXT | YES | NULL | User note for the day |
| created_at | TIMESTAMPTZ | NO | now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | now() | Last update timestamp |

**Indexes:**
- `idx_workout_sessions_user_finished` on `(user_id, finished_at)`
- `idx_workout_sessions_user_status` on `(user_id, status)`

**Status Values:**
- `not_started` - Created but not begun
- `in_progress` - Started, exercises being checked
- `finished` - Workout completed

---

### workout_session_exercises

Completion tracking per exercise in a session.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| workout_session_id | UUID | NO | - | Foreign key to session |
| workout_template_exercise_id | UUID | NO | - | Foreign key to template exercise |
| name_snapshot | VARCHAR(200) | NO | - | Exercise name at session creation |
| sort_order_snapshot | INT | NO | 0 | Sort order at session creation |
| prescription_snapshot | JSON | NO | - | Sets/reps/seconds at session creation |
| is_completed | BOOLEAN | NO | false | Whether exercise is done |
| completed_at | TIMESTAMPTZ | YES | NULL | When exercise was checked |
| notes | TEXT | YES | NULL | User notes for this exercise |
| created_at | TIMESTAMPTZ | NO | now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | now() | Last update timestamp |

**Indexes:**
- `idx_workout_session_exercises_session` on `workout_session_id`

**prescription_snapshot format:**
```json
{
  "prescription_type": "reps",
  "sets": 3,
  "reps": 10,
  "seconds": null,
  "rest_seconds": 60
}
```

---

## Derivation Rules

### completion_percent

Calculated when any exercise is toggled:

```sql
completion_percent = ROUND(
  (COUNT(*) FILTER (WHERE is_completed = true) * 100.0) /
  COUNT(*)
) FROM workout_session_exercises WHERE workout_session_id = ?
```

**Example:**
- 5 exercises total, 3 completed → `60%`
- 5 exercises total, 5 completed → `100%`

### last_completed_at (derived in API)

```sql
SELECT MAX(finished_at)
FROM workout_sessions
WHERE workout_template_id = ? AND user_id = ? AND status = 'finished'
```

### Template Status (derived in API)

```javascript
if (sessions.find(s => s.status === 'in_progress')) {
  status = 'in_progress';
} else if (sessions.some(s => s.status === 'finished')) {
  status = 'done';
} else {
  status = 'not_started';
}
```

---

## Cascade Behavior

| Parent | Child | On Delete |
|--------|-------|-----------|
| users | workout_templates | CASCADE |
| users | workout_sessions | CASCADE |
| workout_templates | workout_template_exercises | CASCADE |
| workout_templates | workout_sessions | CASCADE |
| workout_sessions | workout_session_exercises | CASCADE |
| workout_template_exercises | workout_session_exercises | CASCADE |

---

## Example Data

### Template

```json
{
  "id": "a1b2c3d4-...",
  "user_id": "user-uuid-...",
  "name": "Full Body Strength",
  "notes": "Monday/Wednesday/Friday routine",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

### Template Exercise

```json
{
  "id": "e1f2g3h4-...",
  "workout_template_id": "a1b2c3d4-...",
  "sort_order": 1,
  "name": "Barbell Squat",
  "prescription_type": "reps",
  "sets": 3,
  "reps": 10,
  "seconds": null,
  "rest_seconds": 90
}
```

### Session

```json
{
  "id": "s1t2u3v4-...",
  "user_id": "user-uuid-...",
  "workout_template_id": "a1b2c3d4-...",
  "status": "finished",
  "started_at": "2025-01-20T08:00:00Z",
  "finished_at": "2025-01-20T08:45:00Z",
  "completion_percent": 100,
  "day_note": "Felt strong today"
}
```

### Session Exercise

```json
{
  "id": "x1y2z3w4-...",
  "workout_session_id": "s1t2u3v4-...",
  "workout_template_exercise_id": "e1f2g3h4-...",
  "name_snapshot": "Barbell Squat",
  "sort_order_snapshot": 1,
  "prescription_snapshot": {
    "prescription_type": "reps",
    "sets": 3,
    "reps": 10,
    "rest_seconds": 90
  },
  "is_completed": true,
  "completed_at": "2025-01-20T08:15:00Z",
  "notes": "Increased weight to 185 lbs"
}
```
