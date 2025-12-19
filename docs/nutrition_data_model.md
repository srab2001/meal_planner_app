# Nutrition Data Model

## Overview

The Nutrition module uses a **READ-ONLY** data model that derives nutrition information from existing meal plan data without creating separate tables.

## Source Data

Nutrition data is sourced from the `meal_plans` table:

```sql
-- Existing table (READ-ONLY access)
SELECT id, meals, shopping_list, total_cost, created_at
FROM meal_plans
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 1
```

## Meal Structure (from AI generation)

Each meal in the `meals` JSON array contains:

```json
{
  "name": "Grilled Chicken Salad",
  "day": "Monday",
  "mealType": "lunch",
  "calories": 450,
  "protein": 35,
  "carbs": 25,
  "fat": 22,
  "fiber": 8,
  "sodium": 680,
  "ingredients": [...],
  "instructions": [...]
}
```

## Computed Snapshot Structure

The `NutritionSnapshotService` computes and caches:

```javascript
{
  planId: "uuid",
  computedAt: "2025-12-18T12:00:00Z",
  totalMeals: 21,
  daysWithMeals: 7,
  
  // Weekly aggregates
  weekly: {
    totals: {
      calories: 14000,
      protein_g: 700,
      carbs_g: 1400,
      fat_g: 490,
      fiber_g: 175,
      sodium_mg: 16800
    },
    averages: {
      calories: 2000,
      protein_g: 100,
      carbs_g: 200,
      fat_g: 70,
      fiber_g: 25,
      sodium_mg: 2400
    },
    macroPercentages: {
      protein: 25,  // % of calories from protein
      carbs: 50,    // % of calories from carbs
      fat: 25       // % of calories from fat
    }
  },
  
  // Per-day breakdown
  daily: [
    {
      day: "Monday",
      meals: [...],
      mealCount: 3,
      totals: {
        calories: 2000,
        protein_g: 100,
        carbs_g: 200,
        fat_g: 70,
        fiber_g: 25,
        sodium_mg: 2400
      }
    },
    // ... other days
  ],
  
  // Per-meal data
  meals: [
    {
      id: "meal_0",
      name: "Grilled Chicken Salad",
      day: "Monday",
      mealType: "lunch",
      calories: 450,
      protein_g: 35,
      carbs_g: 25,
      fat_g: 22,
      fiber_g: 8,
      sodium_mg: 680
    },
    // ... other meals
  ]
}
```

## Cache Storage

Snapshots are stored in localStorage:

```javascript
// Storage key
const CACHE_KEY = 'nutrition_snapshot_cache';

// Structure
{
  version: "1.0",
  snapshots: {
    "userId_planHash": { ...snapshot }
  },
  lastUpdated: "2025-12-18T12:00:00Z"
}
```

## Cache Key Generation

```javascript
_generatePlanHash(mealPlanData) {
  const meals = mealPlanData.meals || [];
  const hashData = {
    id: mealPlanData.id,
    mealCount: meals.length,
    firstMeal: meals[0]?.name || '',
    lastMeal: meals[meals.length - 1]?.name || '',
    createdAt: mealPlanData.createdAt
  };
  return btoa(JSON.stringify(hashData)).substring(0, 32);
}
```

## Calculation Formulas

### Macro Calories
```
Protein: 4 calories per gram
Carbs: 4 calories per gram
Fat: 9 calories per gram
```

### Macro Percentages
```javascript
const totalMacroCalories = (protein * 4) + (carbs * 4) + (fat * 9);
const proteinPercent = Math.round((protein * 4 / totalMacroCalories) * 100);
const carbsPercent = Math.round((carbs * 4 / totalMacroCalories) * 100);
const fatPercent = Math.round((fat * 9 / totalMacroCalories) * 100);
```

### Daily Averages
```javascript
const daysWithMeals = perDayBreakdown.filter(d => d.mealCount > 0).length || 1;
const avgCalories = Math.round(weeklyTotals.calories / daysWithMeals);
```

## Data Integrity

### Read-Only Enforcement
- No POST, PUT, DELETE operations on meal plan data
- All API endpoints use GET method only
- Snapshot service never modifies source data

### Cache Invalidation
- Hash includes meal count, first/last meal names
- Any change to meal plan invalidates cache
- Fresh computation triggered automatically

### Consistency Guarantee
- Same input always produces same output
- Reload does not recompute if data unchanged
- Verified via `cacheHit` status indicator

## API Response Formats

### GET /api/nutrition/meal-plan-summary
```json
{
  "mealPlan": {
    "id": "uuid",
    "meals": [...],
    "createdAt": "2025-12-18T00:00:00Z"
  },
  "summary": {
    "totalCalories": 14000,
    "dailyAverages": {...},
    "weeklyTotals": [...]
  },
  "hasMealPlan": true
}
```

### GET /api/nutrition/daily/:date
```json
{
  "date": "2025-12-18",
  "dayOfWeek": "Wednesday",
  "meals": [...],
  "totals": {
    "calories": 2000,
    "protein": 100,
    "carbs": 200,
    "fat": 70
  },
  "mealCount": 3
}
```

### GET /api/nutrition/weekly
```json
{
  "weeklyData": [
    { "day": "Monday", "calories": 2000, "protein": 100, ... },
    ...
  ],
  "weeklyTotals": { "calories": 14000, ... },
  "weeklyAverages": { "calories": 2000, ... }
}
```

## No Database Writes

The Nutrition module **NEVER** writes to any database tables:
- ❌ No INSERT statements
- ❌ No UPDATE statements  
- ❌ No DELETE statements
- ✅ SELECT only (read-only)

All computed data is stored in client-side localStorage cache.
