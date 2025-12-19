# Nutrition Module Documentation

**Module:** Nutrition Tracker  
**Location:** `client/src/modules/nutrition/`  
**Version:** 1.0  
**Status:** ✅ Active

---

## Overview

The Nutrition Module is a standalone app within the ASR Health Portal that provides calorie tracking, macro breakdown, and nutritional insights. It has **READ-ONLY** access to Meal Plan data from the Meal Planner app.

### Key Features

1. **Calorie Tracking** - Daily calorie intake visualization
2. **Macro Breakdown** - Protein, carbs, fat analysis
3. **Meal Plan Integration** - Reads nutrition data from active meal plans
4. **Trend Analysis** - Weekly/monthly nutrition trends
5. **Daily Tips** - Personalized nutrition recommendations

---

## Architecture

```
modules/nutrition/
├── NutritionApp.js          # Main app component and routing
├── index.js                 # Module exports
├── components/
│   ├── NutritionDashboard.js    # Main dashboard view
│   ├── NutritionDashboard.css
│   ├── CalorieTracker.js        # Circular calorie progress
│   ├── CalorieTracker.css
│   ├── MacroBreakdown.js        # Macro pie chart/bars
│   └── MacroBreakdown.css
├── styles/
│   └── NutritionApp.css     # Global module styles
└── __tests__/
    ├── sanity.test.js       # Module isolation tests
    └── integration.test.js  # App integration tests
```

---

## Data Flow

```
┌─────────────────┐     READ-ONLY     ┌──────────────────┐
│  Meal Planner   │ ───────────────► │  Nutrition App   │
│  (meal plans)   │                   │  (analysis only) │
└─────────────────┘                   └──────────────────┘
         │                                     │
         ▼                                     ▼
┌─────────────────┐                   ┌──────────────────┐
│   meal_plans    │                   │ nutrition_cache  │
│   (database)    │                   │   (snapshots)    │
└─────────────────┘                   └──────────────────┘
```

### API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/nutrition/meal-plan-summary` | GET | Fetch meal plan with nutrition data |
| `/api/nutrition/daily-totals` | GET | Get daily nutrition totals |
| `/api/nutrition/weekly-trends` | GET | Get weekly trend data |

**Note:** All endpoints are READ-ONLY. The Nutrition module does not modify meal plan data.

---

## Components

### NutritionApp.js

Main entry point for the module. Handles:
- Module routing (dashboard, meals, trends views)
- Data fetching from Meal Planner
- Loading and error states
- Authentication integration

```javascript
import { NutritionApp } from './modules/nutrition';

// Usage in App.js
{currentView === 'nutrition' && (
  <NutritionApp
    user={user}
    onBack={() => setCurrentView('switchboard')}
    onLogout={handleLogout}
  />
)}
```

### NutritionDashboard.js

Main dashboard showing:
- Welcome message with time-of-day greeting
- Calorie tracker (circular progress)
- Macro breakdown (protein/carbs/fat)
- Quick stats grid
- Meal plan status
- Daily nutrition tips

### CalorieTracker.js

Circular progress indicator showing:
- Current calories consumed
- Daily calorie goal
- Percentage complete
- Color-coded status (green/yellow/red)

### MacroBreakdown.js

Macro nutrient visualization:
- Protein, carbs, fat percentages
- Progress bars toward goals
- Total gram counts
- Color-coded by macro type

---

## Switchboard Integration

The Nutrition module is accessible from the App Switchboard:

```javascript
// In AppSwitchboard.js
{
  id: 'nutrition',
  name: 'Nutrition',
  description: 'Calorie counting and nutritional insights',
  icon: '🥗',
  color: 'var(--asr-orange-600)',
  available: true
}
```

### Navigation Flow

1. User clicks "Nutrition" tile on switchboard
2. App checks authentication (redirects to login if needed)
3. NutritionApp loads and fetches meal plan data
4. Dashboard displays nutrition summary
5. User can navigate between views (dashboard/meals/trends)
6. "Back to Portal" returns to switchboard

---

## Nutrition Calculations

### Daily Totals

```javascript
function calculateTodaysTotals(mealPlanData) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysMeals = mealPlanData.meals.filter(meal => 
    meal.day?.toLowerCase() === today.toLowerCase()
  );
  
  return todaysMeals.reduce((totals, meal) => ({
    calories: totals.calories + (meal.calories || 0),
    protein: totals.protein + (meal.protein || 0),
    carbs: totals.carbs + (meal.carbs || 0),
    fat: totals.fat + (meal.fat || 0),
    fiber: totals.fiber + (meal.fiber || 0),
    sodium: totals.sodium + (meal.sodium || 0),
    mealCount: totals.mealCount + 1
  }), defaults);
}
```

### Default Goals

| Nutrient | Default Goal |
|----------|--------------|
| Calories | 2000 |
| Protein | 50g |
| Carbs | 250g |
| Fat | 65g |
| Fiber | 25g |
| Sodium | 2300mg |

---

## Styling

Uses ASR brand theme variables:

```css
/* Primary colors */
--asr-orange-600: #ea580c;    /* Accent for nutrition */
--asr-purple-600: #7c3aed;    /* Primary actions */

/* Nutrition-specific */
--nutrition-protein: #ef4444;  /* Red for protein */
--nutrition-carbs: #f97316;    /* Orange for carbs */
--nutrition-fat: #eab308;      /* Yellow for fat */
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No meal plan | Shows "No Meal Plan" message with CTA |
| API error | Shows error banner with retry button |
| Loading | Shows spinner with "Loading..." message |
| Auth expired | Redirects to login |

---

## Future Enhancements

1. **Manual Food Logging** - Add foods not in meal plan
2. **Barcode Scanning** - Scan packaged foods
3. **Goal Setting** - Custom nutrition goals
4. **Water Tracking** - Daily hydration
5. **Meal Photos** - Visual food diary
6. **Export Data** - Download nutrition reports

---

## Testing

### Run Tests

```bash
# Sanity tests (module isolation)
node client/src/modules/nutrition/__tests__/sanity.test.js

# Integration tests
node client/src/modules/nutrition/__tests__/integration.test.js
```

### Test Coverage

- ✅ Module exports correctly
- ✅ Components render without errors
- ✅ API calls use correct endpoints
- ✅ Calculations are accurate
- ✅ Navigation works correctly

---

## Changelog

### v1.0 (December 2025)
- Initial release
- Dashboard with calorie/macro tracking
- Meal plan integration (READ-ONLY)
- Three views: Dashboard, Meals, Trends
- ASR brand styling

---

**Last Updated:** December 18, 2025  
**Maintained By:** ASR Digital Services
