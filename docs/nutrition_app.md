# Nutrition App Module

## Overview

The Nutrition App provides **READ-ONLY** access to meal plan nutrition data with three drill-down views:
- Weekly Summary
- Per-Day Breakdown
- Per-Meal Drill-down

## Architecture

```
modules/nutrition/
├── NutritionApp.js              # Main component with all views
├── index.js                     # Module exports
├── services/
│   └── NutritionSnapshotService.js  # Caching service
├── components/
│   ├── NutritionDashboard.js    # Legacy dashboard (not used)
│   ├── CalorieTracker.js        # Calorie ring component
│   └── MacroBreakdown.js        # Macro chart component
└── styles/
    └── NutritionApp.css         # All styles with ASR theme
```

## Features

### 1. Weekly Summary View
- Total weekly calories, protein, carbs, fat
- Daily averages
- Macro distribution chart (percentage)
- Clickable day cards for drill-down

### 2. Daily Breakdown View
- Day totals (calories, protein, carbs, fat)
- List of all meals for that day
- Clickable meal cards for drill-down

### 3. Meal Drill-Down View
- Full nutrition facts for single meal
- Macro percentage breakdown
- Visual macro chart

## Data Flow

```
User opens Nutrition App
        ↓
fetchWithAuth('/api/nutrition/meal-plan-summary')
        ↓
NutritionSnapshotService.getSnapshot()
        ↓
  ┌─────────────┐
  │ Cache hit?  │
  └─────┬───────┘
        │
   Yes / No
   ↓      ↓
Return   Compute
cached   snapshot
data     & cache
```

## API Endpoints (READ-ONLY)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nutrition/meal-plan-summary` | GET | Get meal plan with nutrition |
| `/api/nutrition/daily/:date` | GET | Get specific day nutrition |
| `/api/nutrition/weekly` | GET | Get weekly summary |

**Important:** These endpoints are READ-ONLY and do not modify meal plan data.

## Snapshot Caching

The `NutritionSnapshotService` provides performance optimization:

### Cache Key Generation
```javascript
// Hash based on plan ID + meal count + first/last meal
const hashData = {
  id: mealPlanData.id,
  mealCount: meals.length,
  firstMeal: meals[0]?.name,
  lastMeal: meals[meals.length - 1]?.name,
  createdAt: mealPlanData.createdAt
};
```

### Cache Invalidation
- Cache is invalidated when meal plan hash changes
- Old snapshots cleaned (keeps last 3 per user)
- Manual clear available via `clearCache()`

## Nutrition Calculations

### Per-Meal
```javascript
{
  calories: parseInt(meal.calories) || 0,
  protein_g: parseInt(meal.protein) || 0,
  carbs_g: parseInt(meal.carbs) || 0,
  fat_g: parseInt(meal.fat) || 0,
  fiber_g: parseInt(meal.fiber) || 0,
  sodium_mg: parseInt(meal.sodium) || 0
}
```

### Per-Day
Sum of all meals for that day.

### Weekly
Sum of all days, with averages divided by days with meals.

### Macro Percentages
```javascript
// Calories from each macro:
// Protein: 4 cal/g
// Carbs: 4 cal/g
// Fat: 9 cal/g

const totalMacroCalories = (protein * 4) + (carbs * 4) + (fat * 9);
const proteinPercent = (protein * 4 / totalMacroCalories) * 100;
```

## Switchboard Integration

The Nutrition tile is pre-configured in `AppSwitchboard.js`:

```javascript
{
  id: 'nutrition',
  name: 'Nutrition',
  description: 'Calorie counting and nutritional insights',
  emoji: '🥗',
  color: '#22c55e'
}
```

## ASR Theme Colors Used

| Element | Variable |
|---------|----------|
| Header gradient | `var(--asr-purple-600)` → `var(--asr-purple-800)` |
| Day cards | `var(--asr-purple-50)` |
| Active states | `var(--asr-purple-700)` |
| Calorie accent | `var(--asr-orange-600)` |
| Protein | `#fee2e2` (red) |
| Carbs | `#d1fae5` (green) |
| Fat | `#e0e7ff` (indigo) |

## Usage

```jsx
import { NutritionApp } from './modules/nutrition';

<NutritionApp 
  user={currentUser}
  onBack={() => setCurrentApp('switchboard')}
  onLogout={handleLogout}
/>
```

## Testing

```bash
# Run sanity tests
node client/src/modules/nutrition/__tests__/sanity.test.js

# Run integration tests
node client/src/modules/nutrition/__tests__/integration.test.js
```

## STOP Conditions (Verified)

1. ✅ **Nutrition writes to Meal Plan tables** - NO WRITES, read-only only
2. ✅ **Nutrition breaks Meal Plan routing** - Separate module, no shared routing
3. ✅ **Calculations inconsistent across reloads** - Snapshot caching ensures consistency
