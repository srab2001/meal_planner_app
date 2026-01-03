# Workout Tracking - End-to-End Validation Plan

## Developer Checklist

### 0. Environment Setup

Before running any database commands, ensure DATABASE_URL is set:

```bash
# Option 1: Create .env file in project root
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/meal_planner"' > .env

# Option 2: Export directly in terminal
export DATABASE_URL="postgresql://user:password@localhost:5432/meal_planner"

# Option 3: Use Render/Neon connection string
export DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Verify it's set
echo $DATABASE_URL
```

**Common Error:**
```
Error: Environment variable not found: DATABASE_URL.
```
**Fix:** Set DATABASE_URL using one of the options above.

### 1. Database Setup

```bash
# Run migrations (requires DATABASE_URL)
npx prisma migrate dev --name workout_tracking

# Verify tables exist
npx prisma db pull
npx prisma studio  # Open browser to inspect tables

# Seed test data
node scripts/seed-workout-templates.js
```

**Verify in Prisma Studio:**
- [ ] `workout_templates` table exists with columns
- [ ] `workout_template_exercises` table exists
- [ ] `workout_sessions` table exists
- [ ] `workout_session_exercises` table exists
- [ ] Seed data: 2 templates, 1 session visible

### 2. API Health Check

```bash
# Start server
npm run dev

# Test auth (replace TOKEN with valid JWT)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/workouts/templates
```

**Expected:** `{ "ok": true, "templates": [...] }`

### 3. Click Path Validation

#### Path A: Start New Workout

| Step | Action | Expected |
|------|--------|----------|
| 1 | Navigate to `/fitness/workouts` | See template list |
| 2 | Click "Start" on a template | New session created, redirect to checkoff |
| 3 | Check first exercise | Checkbox checked, green background |
| 4 | Refresh page | Exercise still checked |
| 5 | Check all exercises | 100% shown |
| 6 | Click "Finish Workout" | Status changes to "Completed" |
| 7 | Navigate to Calendar | See dot on today |
| 8 | Click today | See finished session |
| 9 | Click "Review" | See checkoff view (read-only) |

#### Path B: Continue In-Progress Workout

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start a workout (don't finish) | Session in progress |
| 2 | Close browser, reopen | - |
| 3 | Navigate to Saved Workouts | Template shows "In Progress" |
| 4 | Click "Continue" | Resume at checkoff screen |
| 5 | Verify checked exercises persist | Previously checked still checked |

#### Path C: Calendar Navigation

| Step | Action | Expected |
|------|--------|----------|
| 1 | Navigate to Calendar | See current month |
| 2 | Click left arrow | Previous month shown |
| 3 | Click right arrow | Back to current |
| 4 | Click day with workout | Day detail opens |
| 5 | Click "Back" | Return to calendar |

---

## Automated Test Suites

### Unit Tests

**File:** `tests/workouts/completion.test.js`

| Test | Input | Expected |
|------|-------|----------|
| calculates 0% when none completed | 5 exercises, 0 completed | 0 |
| calculates 100% when all completed | 5 exercises, 5 completed | 100 |
| calculates 60% correctly | 5 exercises, 3 completed | 60 |
| rounds down to nearest integer | 3 exercises, 1 completed | 33 |
| handles single exercise | 1 exercise, 1 completed | 100 |

### Integration Tests

**File:** `tests/workouts/api.test.js`

| Test | Action | Assertion |
|------|--------|-----------|
| requires auth for templates | GET /templates without token | 401 |
| requires auth for session | GET /session/:id without token | 401 |
| lists templates for user | GET /templates | 200 + templates array |
| creates template | POST /templates | 201 + template object |
| prevents other user's session | GET /session/:id wrong user | 404 |
| starts session | POST /session/start | 201 + session object |
| prevents duplicate session | POST /session/start twice | 409 |
| toggles exercise | PATCH exercise is_completed=true | completed_at set |
| untoggle clears timestamp | PATCH exercise is_completed=false | completed_at null |
| finishes session | PATCH /finish | status=finished |
| prevents double finish | PATCH /finish twice | no error, idempotent |
| resets session | PATCH /reset | all exercises unchecked |
| validates month format | GET /calendar?month=invalid | 400 |
| validates date format | GET /calendar/day?date=invalid | 400 |

### Playwright E2E Tests

**File:** `tests/e2e/workout-tracking.spec.js`

| Test | Steps | Assertion |
|------|-------|-----------|
| start workout | login → list → click Start | session detail visible |
| check exercise persists | check → refresh → verify | still checked |
| finish shows on calendar | finish → calendar | dot visible |
| day detail shows session | calendar → click day | session card visible |
| review opens detail | day detail → Review | checkoff view |
| cannot check finished | finish → try check | checkbox disabled |

---

## Error Case Tests

### 1. User Not Logged In

**Action:** Access any `/api/workouts/*` endpoint without token

**Expected:**
- HTTP 401
- `{ "ok": false, "error_code": "missing_token" }`
- UI redirects to login

### 2. Wrong User's Session

**Action:** User A tries to access User B's session

**DB State Before:**
```sql
-- Session belongs to User B
SELECT * FROM workout_sessions WHERE id = 'session-id';
-- user_id = 'user-b-id'
```

**Expected:**
- HTTP 404
- `{ "ok": false, "error_code": "not_found" }`
- No data leaked about session existence

### 3. Invalid Date Parameter

**Action:** GET `/api/workouts/calendar/day?date=not-a-date`

**Expected:**
- HTTP 400
- `{ "ok": false, "error_code": "invalid_date" }`

**Action:** GET `/api/workouts/calendar/day?date=2025-13-45`

**Expected:**
- HTTP 400
- `{ "ok": false, "error_code": "invalid_date" }`

### 4. Double Finish Calls

**Action:** PATCH `/session/:id/finish` twice

**DB State After First Call:**
```sql
status = 'finished'
finished_at = '2025-01-20T08:45:00Z'
```

**DB State After Second Call:**
```sql
-- Same values, idempotent
status = 'finished'
finished_at = '2025-01-20T08:45:00Z'  -- NOT updated
```

**Expected:**
- HTTP 200 both times
- No error
- Timestamp unchanged on second call

### 5. Uncheck Exercise Clears completed_at

**Action:** Toggle exercise from checked to unchecked

**DB State Before:**
```sql
is_completed = true
completed_at = '2025-01-20T08:15:00Z'
```

**DB State After:**
```sql
is_completed = false
completed_at = NULL
```

**Verification Query:**
```sql
SELECT is_completed, completed_at
FROM workout_session_exercises
WHERE id = 'exercise-id';
```

---

## Expected Results Matrix

### Start Workout

| Action | DB Table | Field Changes |
|--------|----------|---------------|
| Click "Start" | workout_sessions | INSERT: status='in_progress', started_at=now() |
| | workout_session_exercises | INSERT: one row per template exercise |

**UI State:** Checkoff screen visible, 0% complete

### Check Exercise

| Action | DB Table | Field Changes |
|--------|----------|---------------|
| Check checkbox | workout_session_exercises | UPDATE: is_completed=true, completed_at=now() |
| | workout_sessions | UPDATE: completion_percent recalculated |

**UI State:** Row turns green, completion % increases

### Uncheck Exercise

| Action | DB Table | Field Changes |
|--------|----------|---------------|
| Uncheck checkbox | workout_session_exercises | UPDATE: is_completed=false, completed_at=NULL |
| | workout_sessions | UPDATE: completion_percent recalculated |

**UI State:** Row turns white, completion % decreases

### Finish Workout

| Action | DB Table | Field Changes |
|--------|----------|---------------|
| Click "Finish" | workout_sessions | UPDATE: status='finished', finished_at=now() |

**UI State:** Status badge shows "Completed", checkboxes disabled

### Reset Session

| Action | DB Table | Field Changes |
|--------|----------|---------------|
| Click "Reset" | workout_sessions | UPDATE: status='in_progress', finished_at=NULL, completion_percent=0 |
| | workout_session_exercises | UPDATE ALL: is_completed=false, completed_at=NULL |

**UI State:** All exercises unchecked, 0% complete

---

## Prisma Verification Queries

```javascript
// Verify session created
const session = await prisma.workout_sessions.findFirst({
  where: { id: sessionId },
  include: { exercises: true }
});
expect(session.status).toBe('in_progress');
expect(session.exercises.length).toBe(templateExerciseCount);

// Verify exercise toggled
const exercise = await prisma.workout_session_exercises.findFirst({
  where: { id: exerciseId }
});
expect(exercise.is_completed).toBe(true);
expect(exercise.completed_at).not.toBeNull();

// Verify completion percent
const updatedSession = await prisma.workout_sessions.findFirst({
  where: { id: sessionId }
});
expect(updatedSession.completion_percent).toBe(20); // 1 of 5 = 20%

// Verify finished session appears in calendar
const calendarData = await prisma.workout_sessions.findMany({
  where: {
    user_id: userId,
    status: 'finished',
    finished_at: {
      gte: new Date('2025-01-20T00:00:00Z'),
      lte: new Date('2025-01-20T23:59:59Z')
    }
  }
});
expect(calendarData.length).toBeGreaterThan(0);
```
