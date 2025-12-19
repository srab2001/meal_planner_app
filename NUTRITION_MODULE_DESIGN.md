# Nutrition Module - Architecture Design

## Overview

The Nutrition Module is a **new standalone app** within the ASR Health Portal ecosystem. It provides calorie counting, macronutrient tracking, and nutritional insights while integrating with (but not owning) Meal Plan data.

---

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Separation of Concerns** | Own module folder, isolated state, dedicated routes |
| **Shared Infrastructure** | Reuse auth, theme, layout from shared/ folder |
| **Read-Only Integration** | Can READ Meal Plan data via API, cannot WRITE to it |
| **Progressive Enhancement** | Works standalone; enhanced when Meal Plan data exists |

---

## Folder Structure

```
meal_planner_app/
├── client/
│   └── src/
│       ├── App.js                    # Root - routes to modules
│       ├── App.css                   # ASR Theme tokens (shared)
│       │
│       ├── shared/                   # ⭐ NEW: Shared infrastructure
│       │   ├── components/
│       │   │   ├── AppShell.js       # Common layout wrapper
│       │   │   ├── AppShell.css
│       │   │   ├── Header.js         # Unified header with nav
│       │   │   ├── Header.css
│       │   │   ├── Sidebar.js        # Optional sidebar nav
│       │   │   ├── LoadingSpinner.js
│       │   │   ├── ErrorBoundary.js
│       │   │   └── ProtectedRoute.js # Auth guard component
│       │   ├── hooks/
│       │   │   ├── useAuth.js        # Auth state & methods
│       │   │   ├── useApi.js         # fetchWithAuth wrapper
│       │   │   └── useTheme.js       # Theme context access
│       │   ├── context/
│       │   │   ├── AuthContext.js    # Global auth provider
│       │   │   └── ThemeContext.js   # Theme provider
│       │   └── utils/
│       │       ├── api.js            # API_BASE, fetchWithAuth
│       │       ├── formatters.js     # Date, currency, number formatters
│       │       └── validators.js     # Input validation
│       │
│       ├── modules/                  # ⭐ NEW: Module-based organization
│       │   │
│       │   ├── meal-planner/         # Existing Meal Plan App (refactored)
│       │   │   ├── index.js          # Module entry point
│       │   │   ├── MealPlannerApp.js # Module root component
│       │   │   ├── components/
│       │   │   │   ├── ZIPCodeInput.js
│       │   │   │   ├── StoreSelection.js
│       │   │   │   ├── Questionnaire.js
│       │   │   │   ├── MealPlanView.js
│       │   │   │   ├── ShoppingList.js
│       │   │   │   └── PaymentPage.js
│       │   │   ├── hooks/
│       │   │   │   └── useMealPlan.js
│       │   │   └── styles/
│       │   │       └── *.css
│       │   │
│       │   └── nutrition/            # ⭐ NEW: Nutrition Module
│       │       ├── index.js          # Module entry point & exports
│       │       ├── NutritionApp.js   # Module root component
│       │       ├── components/
│       │       │   ├── NutritionDashboard.js
│       │       │   ├── NutritionDashboard.css
│       │       │   ├── CalorieTracker.js
│       │       │   ├── CalorieTracker.css
│       │       │   ├── MacroBreakdown.js
│       │       │   ├── MacroBreakdown.css
│       │       │   ├── FoodLogger.js
│       │       │   ├── FoodLogger.css
│       │       │   ├── FoodSearch.js
│       │       │   ├── FoodSearch.css
│       │       │   ├── NutritionGoals.js
│       │       │   ├── NutritionGoals.css
│       │       │   ├── DailyLog.js
│       │       │   ├── DailyLog.css
│       │       │   ├── WeeklyReport.js
│       │       │   ├── WeeklyReport.css
│       │       │   ├── MealPlanImport.js   # Read-only Meal Plan integration
│       │       │   └── MealPlanImport.css
│       │       ├── hooks/
│       │       │   ├── useNutrition.js     # Nutrition state management
│       │       │   ├── useFoodLog.js       # Food logging operations
│       │       │   └── useMealPlanData.js  # READ meal plan (not write)
│       │       ├── utils/
│       │       │   ├── nutritionCalculations.js
│       │       │   └── foodDatabase.js
│       │       └── styles/
│       │           └── nutrition-theme.css  # Module-specific overrides
│       │
│       └── components/               # Legacy location (during migration)
│           ├── AppSwitchboard.js     # Remains here - portal entry
│           ├── SplashScreenOverlay.js
│           ├── LoginPage.js
│           ├── Profile.js
│           └── Admin.js
│
├── server.js                         # Backend (add nutrition routes)
└── migrations/
    └── 010_nutrition_tables.sql      # Nutrition-specific tables
```

---

## Routes Architecture

### Frontend Routes (View States)

```javascript
// App.js - currentView states

// Portal-level
'switchboard'      // App selection hub
'login'            // Authentication
'profile'          // User profile (shared)

// Meal Planner Module
'meal-planner'     // Module root → delegates to internal views
'mp-zip'           // ZIP code input
'mp-store'         // Store selection
'mp-questionnaire' // Preferences
'mp-payment'       // Payment
'mp-plan'          // View meal plan

// Nutrition Module (NEW)
'nutrition'        // Module root → NutritionDashboard
'nt-log'           // Daily food log
'nt-goals'         // Set nutrition goals
'nt-report'        // Weekly/monthly reports
'nt-import'        // Import from meal plan
```

### Backend API Routes

```javascript
// ============================================
// EXISTING ROUTES (Meal Planner owns these)
// ============================================
GET    /api/meal-plan              // Get user's meal plan
POST   /api/generate-meal-plan     // Create new plan
GET    /api/favorites              // User's saved recipes
POST   /api/favorites              // Save a recipe

// ============================================
// NEW ROUTES (Nutrition Module owns these)
// ============================================

// --- Nutrition Goals ---
GET    /api/nutrition/goals                // Get user's nutrition goals
POST   /api/nutrition/goals                // Set/update goals
PUT    /api/nutrition/goals                // Update goals

// --- Food Logging ---
GET    /api/nutrition/log/:date            // Get food log for date
POST   /api/nutrition/log                  // Add food entry
PUT    /api/nutrition/log/:entryId         // Update entry
DELETE /api/nutrition/log/:entryId         // Delete entry

// --- Daily Summary ---
GET    /api/nutrition/summary/:date        // Daily nutrition summary
GET    /api/nutrition/summary/week/:startDate  // Weekly summary

// --- Food Database ---
GET    /api/nutrition/foods/search?q=      // Search food database
GET    /api/nutrition/foods/:foodId        // Get food details
POST   /api/nutrition/foods/custom         // Add custom food

// --- Meal Plan Integration (READ-ONLY) ---
GET    /api/nutrition/meal-plan-meals      // Get meals from active plan
POST   /api/nutrition/import-meal/:mealId  // Import meal to log (copies data)

// --- Reports ---
GET    /api/nutrition/reports/weekly       // Weekly nutrition report
GET    /api/nutrition/reports/monthly      // Monthly trends
GET    /api/nutrition/reports/trends       // Long-term patterns
```

---

## Database Schema (New Tables)

```sql
-- migrations/010_nutrition_tables.sql

-- User nutrition goals
CREATE TABLE IF NOT EXISTS nutrition_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  daily_calories INTEGER DEFAULT 2000,
  protein_grams INTEGER DEFAULT 50,
  carbs_grams INTEGER DEFAULT 250,
  fat_grams INTEGER DEFAULT 65,
  fiber_grams INTEGER DEFAULT 25,
  sodium_mg INTEGER DEFAULT 2300,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Daily food log entries
CREATE TABLE IF NOT EXISTS food_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
  food_name VARCHAR(255) NOT NULL,
  serving_size VARCHAR(50),
  servings DECIMAL(5,2) DEFAULT 1,
  calories INTEGER,
  protein_grams DECIMAL(6,2),
  carbs_grams DECIMAL(6,2),
  fat_grams DECIMAL(6,2),
  fiber_grams DECIMAL(6,2),
  sodium_mg INTEGER,
  source VARCHAR(50), -- 'manual', 'meal-plan-import', 'food-db', 'custom'
  source_meal_id INTEGER, -- Reference if imported from meal plan
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_food_log_user_date (user_id, log_date)
);

-- Custom foods created by users
CREATE TABLE IF NOT EXISTS custom_foods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  food_name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  serving_size VARCHAR(50),
  calories INTEGER,
  protein_grams DECIMAL(6,2),
  carbs_grams DECIMAL(6,2),
  fat_grams DECIMAL(6,2),
  fiber_grams DECIMAL(6,2),
  sodium_mg INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily summaries (cached calculations)
CREATE TABLE IF NOT EXISTS nutrition_daily_summary (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  total_calories INTEGER DEFAULT 0,
  total_protein DECIMAL(6,2) DEFAULT 0,
  total_carbs DECIMAL(6,2) DEFAULT 0,
  total_fat DECIMAL(6,2) DEFAULT 0,
  total_fiber DECIMAL(6,2) DEFAULT 0,
  total_sodium INTEGER DEFAULT 0,
  meals_logged INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, summary_date)
);
```

---

## Component Specifications

### Shared Components (Reused)

| Component | Location | Used By |
|-----------|----------|---------|
| `AppShell` | `shared/components/` | All modules |
| `Header` | `shared/components/` | All modules |
| `LoadingSpinner` | `shared/components/` | All modules |
| `ProtectedRoute` | `shared/components/` | All modules |
| `useAuth` | `shared/hooks/` | All modules |
| `useApi` | `shared/hooks/` | All modules |
| ASR Theme CSS | `App.css` | All modules |

### Nutrition-Isolated Components

| Component | Purpose | Meal Plan Interaction |
|-----------|---------|----------------------|
| `NutritionDashboard` | Main overview, today's progress | None |
| `CalorieTracker` | Visual calorie ring/bar | None |
| `MacroBreakdown` | Pie/bar chart for macros | None |
| `FoodLogger` | Add food entries | None |
| `FoodSearch` | Search food database | None |
| `NutritionGoals` | Set calorie/macro targets | None |
| `DailyLog` | View/edit day's entries | None |
| `WeeklyReport` | 7-day summary charts | None |
| `MealPlanImport` | **READ** meals from plan | **READ-ONLY** - copies data |

---

## Meal Plan Integration (Read-Only)

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASR Health Portal                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐              ┌─────────────────┐           │
│  │  MEAL PLANNER   │              │   NUTRITION     │           │
│  │    MODULE       │              │    MODULE       │           │
│  │                 │              │                 │           │
│  │  - Owns meals   │  ──READ──▶  │  - Reads meals  │           │
│  │  - Owns recipes │              │  - Copies data  │           │
│  │  - Owns shopping│              │  - Owns log     │           │
│  │                 │              │  - Owns goals   │           │
│  └─────────────────┘              └─────────────────┘           │
│                                                                  │
│         ▲                                   ▲                    │
│         │                                   │                    │
│         └───────────┬───────────────────────┘                    │
│                     │                                            │
│              ┌──────┴──────┐                                     │
│              │   SHARED    │                                     │
│              │   - Auth    │                                     │
│              │   - Theme   │                                     │
│              │   - Layout  │                                     │
│              └─────────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Import Flow

```javascript
// MealPlanImport.js - READ-ONLY integration

// 1. Fetch available meals from Meal Plan (READ)
const { data: mealPlanMeals } = await fetchWithAuth('/api/nutrition/meal-plan-meals');

// 2. User selects a meal to log
const handleImportMeal = async (meal) => {
  // Creates a COPY in nutrition log - does NOT modify meal plan
  await fetchWithAuth('/api/nutrition/import-meal/' + meal.id, {
    method: 'POST',
    body: JSON.stringify({
      log_date: selectedDate,
      meal_type: 'lunch' // user selects
    })
  });
};

// 3. Meal data is COPIED to food_log table
// Original meal in meal_plans table is UNCHANGED
```

### Backend Implementation

```javascript
// server.js - Nutrition routes

// READ meals from meal plan (does not modify)
app.get('/api/nutrition/meal-plan-meals', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  // Read from meal_plans table (owned by Meal Planner)
  const result = await db.query(`
    SELECT mp.id, mp.meals, mp.created_at
    FROM meal_plans mp
    WHERE mp.user_id = $1
    ORDER BY mp.created_at DESC
    LIMIT 1
  `, [userId]);
  
  if (result.rows.length === 0) {
    return res.json({ meals: [], hasMealPlan: false });
  }
  
  // Return meal data for display (READ-ONLY)
  res.json({ 
    meals: result.rows[0].meals,
    hasMealPlan: true 
  });
});

// Import a meal to nutrition log (COPIES data, doesn't modify source)
app.post('/api/nutrition/import-meal/:mealId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { mealId } = req.params;
  const { log_date, meal_type } = req.body;
  
  // 1. Read meal from meal plan
  const mealPlan = await db.query(`
    SELECT meals FROM meal_plans WHERE user_id = $1
    ORDER BY created_at DESC LIMIT 1
  `, [userId]);
  
  const meal = findMealById(mealPlan.rows[0].meals, mealId);
  
  // 2. Create COPY in food_log (Nutrition owns this)
  await db.query(`
    INSERT INTO food_log 
    (user_id, log_date, meal_type, food_name, calories, protein_grams, 
     carbs_grams, fat_grams, source, source_meal_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'meal-plan-import', $9)
  `, [userId, log_date, meal_type, meal.name, meal.calories, 
      meal.protein, meal.carbs, meal.fat, mealId]);
  
  res.json({ success: true, message: 'Meal imported to log' });
});
```

---

## App.js Integration

### Updated handleSelectApp

```javascript
// App.js

const handleSelectApp = (appId) => {
  console.log('Selected app:', appId);
  switch (appId) {
    case 'meal-planner':
      if (user) {
        setCurrentView('mp-zip');
      } else {
        setCurrentView('login');
      }
      break;
      
    case 'nutrition':  // NEW
      if (user) {
        setCurrentView('nutrition');
      } else {
        setCurrentView('login');
      }
      break;
      
    case 'health-tracker':
    case 'fitness':
      alert(`${appId} is coming soon!`);
      break;
      
    default:
      setCurrentView('switchboard');
  }
};
```

### Render Nutrition Module

```javascript
// App.js - in return statement

{currentView === 'nutrition' && (
  <NutritionApp 
    user={user}
    onBack={() => setCurrentView('switchboard')}
    onLogout={handleLogout}
  />
)}

{currentView === 'nt-log' && (
  <DailyLog user={user} ... />
)}

// etc.
```

---

## AppSwitchboard Update

```javascript
// AppSwitchboard.js - Update nutrition tile

const apps = [
  {
    id: 'meal-planner',
    name: 'Meal Planner',
    description: 'AI-powered meal planning with price comparison',
    icon: '🍽️',
    color: 'var(--asr-purple-600)',  // Use theme token
    available: true
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    description: 'Calorie counting and nutritional insights',
    icon: '🥗',
    color: 'var(--asr-orange-600)',  // Use theme token
    available: true,  // NOW AVAILABLE
    comingSoon: false
  },
  // ... other apps
];
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create `shared/` folder structure
- [ ] Extract auth logic to `useAuth` hook
- [ ] Create `AppShell` layout component
- [ ] Create `modules/nutrition/` folder

### Phase 2: Core Features (Week 2)
- [ ] Implement `NutritionDashboard`
- [ ] Implement `FoodLogger` + `FoodSearch`
- [ ] Create database tables (migration)
- [ ] Build `/api/nutrition/*` endpoints

### Phase 3: Goals & Reports (Week 3)
- [ ] Implement `NutritionGoals`
- [ ] Implement `CalorieTracker` + `MacroBreakdown`
- [ ] Implement `DailyLog` view
- [ ] Implement `WeeklyReport`

### Phase 4: Integration (Week 4)
- [ ] Implement `MealPlanImport` (read-only)
- [ ] Build `/api/nutrition/meal-plan-meals` endpoint
- [ ] Build `/api/nutrition/import-meal` endpoint
- [ ] Enable nutrition tile in switchboard

### Phase 5: Polish (Week 5)
- [ ] Responsive design testing
- [ ] Error handling
- [ ] Loading states
- [ ] Documentation

---

## File Checklist

### New Files to Create

```
shared/
├── components/
│   ├── AppShell.js
│   ├── AppShell.css
│   ├── Header.js
│   ├── Header.css
│   ├── LoadingSpinner.js
│   ├── ErrorBoundary.js
│   └── ProtectedRoute.js
├── hooks/
│   ├── useAuth.js
│   ├── useApi.js
│   └── useTheme.js
├── context/
│   ├── AuthContext.js
│   └── ThemeContext.js
└── utils/
    ├── api.js
    ├── formatters.js
    └── validators.js

modules/nutrition/
├── index.js
├── NutritionApp.js
├── components/
│   ├── NutritionDashboard.js
│   ├── NutritionDashboard.css
│   ├── CalorieTracker.js
│   ├── CalorieTracker.css
│   ├── MacroBreakdown.js
│   ├── MacroBreakdown.css
│   ├── FoodLogger.js
│   ├── FoodLogger.css
│   ├── FoodSearch.js
│   ├── FoodSearch.css
│   ├── NutritionGoals.js
│   ├── NutritionGoals.css
│   ├── DailyLog.js
│   ├── DailyLog.css
│   ├── WeeklyReport.js
│   ├── WeeklyReport.css
│   ├── MealPlanImport.js
│   └── MealPlanImport.css
├── hooks/
│   ├── useNutrition.js
│   ├── useFoodLog.js
│   └── useMealPlanData.js
└── utils/
    ├── nutritionCalculations.js
    └── foodDatabase.js

migrations/
└── 010_nutrition_tables.sql
```

---

## Summary

| Aspect | Decision |
|--------|----------|
| **Module Location** | `client/src/modules/nutrition/` |
| **Shared Code** | `client/src/shared/` |
| **Theme** | Uses ASR tokens from `App.css` |
| **Auth** | Reuses `AuthContext` + `useAuth` |
| **Meal Plan Data** | READ-ONLY via `/api/nutrition/meal-plan-meals` |
| **Own Data** | `nutrition_goals`, `food_log`, `custom_foods`, `nutrition_daily_summary` |
| **Backend Routes** | `/api/nutrition/*` namespace |

---

*ASR Digital Services - Nutrition Module Design v1.0*
*Created: December 18, 2025*
