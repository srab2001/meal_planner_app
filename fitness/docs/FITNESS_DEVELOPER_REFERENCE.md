# FITNESS MODULE - DEVELOPER QUICK REFERENCE

**Status:** 0% Implemented (Documentation Only)  
**Date:** December 21, 2025

---

## 🚀 TL;DR

**Fitness Module = Does Not Exist**

- ❌ No component (`FitnessApp.js`)
- ❌ No API endpoints
- ❌ No database tables
- ❌ Only UI placeholder + docs

**Use these as references when building:**
- Nutrition Module → Frontend structure
- Coaching Module → Complex features
- Integrations Module → Cross-module data

---

## WHERE EVERYTHING SHOULD GO

### Frontend Architecture
```
client/src/modules/fitness/
├── index.js                          # export { default as FitnessApp } from './FitnessApp';
├── FitnessApp.js                     # Main component (routing, state)
│
├── components/
│   ├── WorkoutDashboard.js           # Main dashboard view
│   ├── WorkoutDashboard.css
│   ├── WorkoutPlan.js                # Plan creation/management
│   ├── WorkoutPlan.css
│   ├── ExerciseLibrary.js            # Exercise search/browse
│   ├── ExerciseLibrary.css
│   ├── ProgressTracker.js            # Stats/charts
│   ├── ProgressTracker.css
│   ├── RecoveryGuide.js              # Recovery recommendations
│   └── RecoveryGuide.css
│
├── services/
│   ├── FitnessService.js             # API calls
│   └── WorkoutCalculator.js          # Calorie/effort math
│
├── styles/
│   └── FitnessApp.css                # Global module styles
│
└── __tests__/
    ├── sanity.test.js                # Module isolation
    └── integration.test.js           # Cross-module tests
```

### Backend Architecture
```
server.js (add new sections):

// ============================================
// FITNESS MODULE ROUTES
// ============================================

// Workout Plans
GET    /api/fitness/plans              # List user plans
POST   /api/fitness/plans              # Create plan
PUT    /api/fitness/plans/:planId      # Update plan
DELETE /api/fitness/plans/:planId      # Delete plan

// Workouts (Log)
GET    /api/fitness/workouts           # History
POST   /api/fitness/workouts/:id/log   # Log completion
GET    /api/fitness/workouts/:id       # Details

// Exercises
GET    /api/fitness/exercises          # Library
GET    /api/fitness/exercises/:id      # Details
GET    /api/fitness/exercises?type=strength # Filtered

// Progress/Stats
GET    /api/fitness/stats              # Overall stats
GET    /api/fitness/progress/:date     # Daily
POST   /api/fitness/sync-with-nutrition # Update meal targets
```

### Database Tables
```sql
-- Prisma Models (add to prisma/schema.prisma):

model fitness_plans {
  id              String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  user_id         String    @db.Uuid
  name            String
  goal            String    // "strength", "endurance", "weight_loss", "muscle_gain"
  difficulty      String    // "beginner", "intermediate", "advanced"
  duration_weeks  Int
  frequency       Int       // workouts per week
  
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  
  user            users     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  workouts        fitness_workouts[]
  
  @@index([user_id])
}

model fitness_workouts {
  id              String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  plan_id         String    @db.Uuid
  name            String
  type            String    // "strength", "cardio", "flexibility"
  duration_min    Int
  difficulty      String
  
  exercises       workout_exercises[]
  
  @@index([plan_id])
}

model fitness_exercises {
  id              String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  name            String    @unique
  type            String    // "strength", "cardio", "flexibility"
  muscle_groups   String[]
  difficulty      String
  description     String
  video_url       String?
  form_tips       String[]
  calories_per_rep Decimal?
  
  @@index([type])
  @@index([difficulty])
}

model workout_exercises {
  id              String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  workout_id      String    @db.Uuid
  exercise_id     String    @db.Uuid
  sets            Int
  reps            Int
  weight_lbs      Decimal?
  
  workout         fitness_workouts @relation(fields: [workout_id], references: [id], onDelete: Cascade)
  exercise        fitness_exercises @relation(fields: [exercise_id], references: [id])
  
  @@index([workout_id])
}

model fitness_progress {
  id              String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  user_id         String    @db.Uuid
  workout_id      String    @db.Uuid
  completed_at    DateTime
  calories_burned Int
  duration_min    Int
  notes           String?
  
  created_at      DateTime  @default(now())
  
  user            users     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id])
  @@index([completed_at])
}
```

---

## INTEGRATION CHECKLIST

### With Nutrition Module
- [ ] Get macros from Nutrition API
- [ ] Adjust calorie targets based on workout type
- [ ] POST to `/api/fitness/sync-with-nutrition`
- [ ] Receive updated meal plan from `/api/nutrition/meal-plan-summary`
- [ ] Display "Post-Workout Meal" recommendation

### With Coaching Module
- [ ] Expose workout data to coaching (read-only)
- [ ] Include "Movement" in health score calculation
- [ ] Get workout recommendations from coaching AI
- [ ] Display recovery guidance
- [ ] Track workout compliance in goals

### With Integrations Module
- [ ] Import activity data from wearables
- [ ] Sync steps → activity level
- [ ] Sync sleep quality → recovery score
- [ ] Send workout completion back to wearable (if supported)

### With Progress Module
- [ ] Register workout badges
- [ ] Track workout streaks
- [ ] Leaderboard for PR achievements
- [ ] Share workout milestone notifications

---

## DATA RELATIONSHIPS

```
users (already exists)
  ↓
fitness_plans (create new)
  ├── user_id (foreign key)
  └── ↓
fitness_workouts (create new)
    ├── plan_id (foreign key)
    └── ↓
workout_exercises (create new)
    ├── workout_id (foreign key)
    └── exercise_id (foreign key)
      ↓
fitness_exercises (create new - shared library)

fitness_progress (create new)
  ├── user_id (foreign key)
  ├── workout_id (foreign key)
  └── References completed workouts

user_preferences (existing)
  └── Add: activity_level, fitness_goal
```

---

## API RESPONSE EXAMPLES

### GET /api/fitness/plans
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Strength Building",
      "goal": "muscle_gain",
      "difficulty": "intermediate",
      "frequency": 4,
      "createdAt": "2025-12-21T10:00:00Z"
    }
  ]
}
```

### POST /api/fitness/plans
```json
Request:
{
  "name": "Weight Loss",
  "goal": "weight_loss",
  "difficulty": "intermediate",
  "duration_weeks": 12,
  "frequency": 5
}

Response:
{
  "id": "uuid",
  "name": "Weight Loss",
  ...
}
```

### GET /api/fitness/exercises
```json
{
  "exercises": [
    {
      "id": "uuid",
      "name": "Barbell Bench Press",
      "type": "strength",
      "muscleGroups": ["chest", "triceps"],
      "difficulty": "intermediate",
      "caloriesPerRep": 0.5,
      "videoUrl": "https://..."
    }
  ]
}
```

### POST /api/fitness/sync-with-nutrition
```json
Request:
{
  "lastWorkoutType": "strength",
  "lastWorkoutDuration": 60,
  "caloriesBurned": 450
}

Response:
{
  "updatedCalorieTarget": 2500,
  "macros": {
    "protein": 180,
    "carbs": 250,
    "fats": 83
  },
  "postWorkoutMealSuggestion": "Chicken + Brown Rice"
}
```

---

## KEY IMPLEMENTATION NOTES

### Authentication
```javascript
// All endpoints require auth
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // Verify token and attach user_id to req
};

app.get('/api/fitness/plans', requireAuth, async (req, res) => {
  const plans = await prisma.fitness_plans.findMany({
    where: { user_id: req.user.id }  // Critical: filter by user
  });
});
```

### Calorie Calculations
```javascript
// Reference: How to calculate
const calculateCalories = (exercise, sets, reps, weight) => {
  // Formula varies by exercise type
  // Strength: weight × reps × sets × muscle_group_factor
  // Cardio: duration × intensity × user_weight
  // Flexibility: duration × 2
};
```

### Nutrition Sync
```javascript
// When workout logged:
// 1. Calculate calories burned
// 2. Determine workout type (strength/cardio)
// 3. Adjust macro ratios
// 4. Update meal plan via Nutrition Module
// 5. Notify coaching module
```

### Wearable Sync (from Integrations Module)
```javascript
// Data flow:
// Apple Health → Integrations Module → fitness_progress table
// Steps → Activity Level
// Sleep → Recovery Score
// Workouts → Manual override if different
```

---

## TESTING STRATEGY

### Unit Tests (Component Level)
```javascript
// WorkoutDashboard.test.js
describe('WorkoutDashboard', () => {
  test('renders workout plan', () => { });
  test('calls API to fetch workouts', () => { });
  test('displays calorie burn correctly', () => { });
});
```

### Integration Tests (Cross-Module)
```javascript
// integration.test.js
describe('Fitness ↔ Nutrition', () => {
  test('workout updates nutrition targets', () => {
    // 1. Log workout
    // 2. Verify Nutrition API called
    // 3. Check meal plan updated
  });
});
```

### API Tests (Backend)
```javascript
// server.test.js
describe('GET /api/fitness/plans', () => {
  test('returns user plans', () => { });
  test('filters by user_id', () => { });
  test('requires authentication', () => { });
});
```

---

## FEATURE FLAG

### Enable When Ready
```javascript
// In FeatureFlags.js, add:
{
  name: 'fitness_module',
  enabled: false,              // Start false
  rolloutPercent: 0,
  allowedCohorts: ['beta'],
  metadata: {
    description: 'Fitness tracking and workout planning',
    category: 'health',
    version: '1.0.0'
  }
}

// In App.js, conditionally render:
{featureFlags.isEnabled('fitness_module') && (
  <button onClick={() => handleSelectApp('fitness')}>
    Fitness
  </button>
)}
```

---

## COMMON PITFALLS TO AVOID

### ❌ DON'T
- Make fitness data globally mutable (affects nutrition)
- Forget to check user_id on every query
- Hardcode calorie calculations (make them configurable)
- Skip error handling on wearable sync
- Assume all users have premium features
- Create circular dependencies with Nutrition module

### ✅ DO
- Use transactions for multi-table updates
- Filter all queries by user_id
- Make calculations testable and documented
- Handle API failures gracefully
- Gate features appropriately
- Use read-only access to other modules

---

## DEPLOYMENT PLAN

### 1. Test Environment
```bash
# Feature flag disabled by default
npm test               # All tests pass
npm run lint          # No lint errors
npm run build         # No build errors
```

### 2. Staging
```bash
# Feature flag enabled for 5% of beta users
# Monitor: error rate, API latency, database load
# Watch: user feedback, crash reports
```

### 3. Production Rollout
```
Week 1: 5% beta users (monitor 48 hours)
Week 2: 25% all users (monitor 48 hours)
Week 3: 100% production launch
```

---

## PERFORMANCE TARGETS

- API response time: <500ms
- Database query: <100ms
- UI interaction: <200ms
- Exercise video load: <2s
- Wearable sync: every 5 minutes

---

## MONITORING & ALERTS

### Metrics to Track
- API response times
- Error rates (by endpoint)
- Database query times
- Wearable sync success rate
- Feature adoption
- User engagement

### Alerts to Set
- Error rate > 1%
- API latency > 1s
- Wearable sync failures > 10%
- Database load > 80%

---

## USEFUL REFERENCES

**When building, copy patterns from:**
- `client/src/modules/nutrition/NutritionApp.js` - Component structure
- `client/src/modules/coaching/CoachingApp.js` - Complex features
- `client/src/modules/integrations/services/HealthDataService.js` - API integration
- `server.js` - API pattern (search "NUTRITION MODULE ROUTES")
- Tests in each module - Test structure

**Don't invent new patterns. Follow existing code style.**

---

## Questions?

See detailed docs:
1. `FITNESS_MODULE_VERIFICATION_REPORT.md` - Full audit
2. `FITNESS_MODULE_CHECKLIST.md` - Implementation checklist
3. `FITNESS_AUDIT_EXECUTIVE_SUMMARY.md` - High-level overview
4. `HEALTH_PORTAL_EXPANSION_STRATEGY.md` - Product requirements

---

**Ready to build? Start with Planning Phase → then follow the checklist!**
