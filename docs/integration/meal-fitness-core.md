# Meal + Fitness Integration with CORE DB

**Version:** 1.0
**Last Updated:** December 28, 2025

---

## Overview

This document describes how Meal Planner and Fitness Coach integrate with the CORE DB spine while keeping meal-heavy data in the Render DB.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MEAL/FITNESS GENERATION                      │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   CORE DB     │     │   MEAL DB     │     │  FITNESS DB   │
│   (Neon)      │     │   (Render)    │     │   (Neon)      │
│               │     │               │     │               │
│ • guardrails  │     │ • generations │     │ • workouts    │
│ • plans       │     │ • recipes     │     │ • exercises   │
│ • plan_items  │     │ • shopping    │     │ • goals       │
│ • checkins    │     │ • prices      │     │ • sets        │
└───────────────┘     └───────────────┘     └───────────────┘
```

---

## Data Flow

### Meal Generation

```
1. User requests meal plan
   └─ Frontend: POST /api/generate-meals

2. Backend fetches guardrails from CORE DB
   └─ GET /api/core/medical/guardrails?user_id=xxx
   └─ Returns: { constraints: [...], restrictions: [...] }

3. AI generates meal plan with constraints
   └─ OpenAI prompt includes guardrails
   └─ e.g., "User has diabetes - limit sugar to 25g/day"

4. Save meal outputs to MEAL DB (Render)
   └─ meal_generations table
   └─ Includes: user_id, household_id (from CORE DB)

5. Create compliance entries in CORE DB
   └─ plans table: new plan record
   └─ plan_items table: one per meal
   └─ Links: meal_generation_id points to MEAL DB record

6. Return meal plan to frontend
```

### Fitness Generation

```
1. User requests workout plan
   └─ Frontend: POST /api/fitness/generate-workout

2. Backend fetches guardrails from CORE DB
   └─ GET /api/core/medical/guardrails?user_id=xxx
   └─ Returns: { constraints: [...], medical_conditions: [...] }

3. AI generates workout with constraints
   └─ OpenAI prompt includes medical limitations
   └─ e.g., "User has knee injury - avoid high-impact exercises"

4. Save workout to FITNESS DB
   └─ workouts, workout_exercises, etc.
   └─ Includes: user_id (from CORE DB)

5. Create compliance entries in CORE DB
   └─ plans table: new plan record
   └─ plan_items table: one per workout
   └─ Links: workout_id points to FITNESS DB record

6. Return workout plan to frontend
```

---

## Guardrails API Contract

### GET /api/core/medical/guardrails

Fetch user's medical constraints for meal/fitness generation.

**Headers:**
- `Authorization: Bearer <token>`

**Query:**
- `user_id` (optional, defaults to authenticated user)

**Response:**
```json
{
  "user_id": "uuid",
  "constraints": [
    {
      "constraint_key": "no_gluten",
      "constraint_type": "dietary",
      "value": null,
      "source": "condition:celiac"
    },
    {
      "constraint_key": "low_sugar",
      "constraint_type": "medical",
      "value": "25g",
      "source": "condition:diabetes"
    }
  ],
  "allergies": [
    { "allergen": "peanuts", "severity": "severe" },
    { "allergen": "shellfish", "severity": "life-threatening" }
  ],
  "conditions": [
    { "condition": "diabetes", "status": "active" },
    { "condition": "hypertension", "status": "managed" }
  ],
  "restriction_rules": [
    { "rule_key": "diabetes_sugar", "restriction": "sugar", "max_daily_value": 25, "unit": "g" },
    { "rule_key": "hypertension_sodium", "restriction": "sodium", "max_daily_value": 1500, "unit": "mg" }
  ]
}
```

---

## Database Migrations

### MEAL DB (Render) - Add CORE DB References

```sql
-- Add user_id and household_id to meal_generations
ALTER TABLE meal_generations
ADD COLUMN user_id UUID,
ADD COLUMN household_id UUID;

-- Add to shopping_lists
ALTER TABLE shopping_lists
ADD COLUMN user_id UUID,
ADD COLUMN household_id UUID;

-- Index for queries by household
CREATE INDEX idx_meal_generations_household ON meal_generations(household_id);
CREATE INDEX idx_shopping_lists_household ON shopping_lists(household_id);
```

### FITNESS DB - Already has user_id

Fitness DB already stores `user_id` in workouts, goals, etc. No migration needed.

---

## No Cross-DB Joins Rule

### Correct Pattern

```javascript
// 1. Get user from CORE DB
const user = await coreDb.users.findUnique({ where: { id: userId } });

// 2. Get guardrails from CORE DB
const guardrails = await coreDb.user_constraints.findMany({
  where: { user_id: userId, is_active: true }
});

// 3. Generate meal (AI)
const mealPlan = await generateWithAI(preferences, guardrails);

// 4. Save to MEAL DB with user reference
const generation = await mealDb.meal_generations.create({
  data: {
    user_id: userId,  // Reference only, not a join
    household_id: householdId,
    meal_plan: mealPlan,
    // ...
  }
});

// 5. Create compliance in CORE DB
await coreDb.plans.create({
  data: {
    household_id: householdId,
    name: 'Weekly Meal Plan',
    plan_type: 'meal',
    // ...
  }
});
```

### Incorrect Pattern (Never Do This)

```javascript
// WRONG - Cross-DB join
const mealsWithUser = await db.$queryRaw`
  SELECT m.*, u.email
  FROM meal_db.meal_generations m
  JOIN core_db.users u ON m.user_id = u.id
`;
```

---

## Compliance Integration

When meals/workouts are generated, plan_items are created in CORE DB:

```javascript
// After meal generation
for (const meal of generatedMeals) {
  await coreDb.plan_items.create({
    data: {
      plan_id: plan.id,
      item_type: 'meal',
      scheduled_at: meal.scheduled_date,
      title: meal.name,
      metadata: {
        meal_generation_id: generation.id,  // Reference to MEAL DB
        meal_type: meal.type,  // breakfast, lunch, dinner
        calories: meal.calories
      },
      status: 'pending'
    }
  });
}

// After workout generation
for (const workout of generatedWorkouts) {
  await coreDb.plan_items.create({
    data: {
      plan_id: plan.id,
      item_type: 'workout',
      scheduled_at: workout.scheduled_date,
      title: workout.name,
      metadata: {
        workout_id: workout.id,  // Reference to FITNESS DB
        duration_minutes: workout.duration,
        exercise_count: workout.exercises.length
      },
      status: 'pending'
    }
  });
}
```

---

## Environment Variables

```env
# CORE DB (Neon) - System of record
CORE_DATABASE_URL=postgresql://...@neon.tech/core_db_next

# MEAL DB (Render) - Meal-heavy data
MEAL_DATABASE_URL=postgresql://...@render.com/meal_db_next

# FITNESS DB (Neon) - Fitness-specific
FITNESS_DATABASE_URL=postgresql://...@neon.tech/fitness_db
```

---

## Implementation Checklist

- [ ] Add guardrails API route: `/api/core/medical/guardrails`
- [ ] Update meal generation to fetch guardrails before AI call
- [ ] Update fitness generation to fetch guardrails before AI call
- [ ] Add user_id/household_id to MEAL DB tables
- [ ] Create plan_items for generated meals
- [ ] Create plan_items for generated workouts
- [ ] Add compliance check-in endpoints
- [ ] Update frontend to show compliance status

---

**Version:** 1.0
**Maintained By:** Development Team
