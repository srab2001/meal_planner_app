# Nutrition Integration Guide

**Date:** December 21, 2025  
**Status:** ✅ Implemented  
**Integration Type:** One-way read-only  
**Location:** `/api/nutrition/*`  

---

## 📋 Overview

The Fitness Module has **read-only access** to nutrition data from the Meal Planner. This allows the fitness dashboard to display daily calorie intake and macro breakdown, helping users correlate their workouts with nutrition.

### Key Principle
> **Fitness reads, never writes.** The Fitness Module can display meal data but cannot create, modify, or delete meals.

---

## 🔌 API Endpoints

### 1. GET /api/nutrition/summary

Get nutrition totals for a specific date (defaults to today)

**Authentication:** ✅ Required (JWT Bearer token)

**Query Parameters:**
```javascript
{
  date: "2025-12-21"  // Optional, ISO format (YYYY-MM-DD)
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:3001/api/nutrition/summary?date=2025-12-21" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```javascript
{
  date: "2025-12-21",
  totalCalories: 2100,
  protein: 150,
  carbs: 250,
  fats: 70,
  meals: [
    {
      type: "breakfast",
      name: "Oatmeal with berries",
      calories: 400,
      protein: 15,
      carbs: 65,
      fats: 10
    },
    {
      type: "lunch",
      name: "Grilled chicken, rice, broccoli",
      calories: 700,
      protein: 50,
      carbs: 85,
      fats: 15
    },
    {
      type: "dinner",
      name: "Salmon, sweet potato, green beans",
      calories: 800,
      protein: 65,
      carbs: 80,
      fats: 30
    },
    {
      type: "snacks",
      name: "Greek yogurt with granola",
      calories: 200,
      protein: 20,
      carbs: 20,
      fats: 5
    }
  ],
  timestamp: "2025-12-21T10:30:00Z"
}
```

**No meal plan found (200 OK):**
```javascript
{
  date: "2025-12-21",
  totalCalories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  meals: [],
  message: "No meal plan found for this date"
}
```

---

### 2. GET /api/nutrition/weekly

Get nutrition data for the past 7 days with daily breakdowns and averages

**Authentication:** ✅ Required (JWT Bearer token)

**Example Request:**
```bash
curl -X GET "http://localhost:3001/api/nutrition/weekly" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```javascript
{
  period: "past_7_days",
  days: [
    {
      date: "2025-12-21",
      calories: 2100,
      protein: 150,
      carbs: 250,
      fats: 70
    },
    {
      date: "2025-12-20",
      calories: 2050,
      protein: 148,
      carbs: 245,
      fats: 68
    },
    {
      date: "2025-12-19",
      calories: 1950,
      protein: 145,
      carbs: 230,
      fats: 65
    },
    // ... more days
  ],
  averageCalories: 2050,
  averageProtein: 148,
  totalDaysPlanned: 7
}
```

**Use Cases:**
- Show weekly calorie average on fitness dashboard
- Display trends over the past week
- Correlate workout frequency with nutrition

---

### 3. GET /api/nutrition/macro-targets

Get personalized daily macro targets based on user's fitness profile

**Authentication:** ✅ Required (JWT Bearer token)

**Example Request:**
```bash
curl -X GET "http://localhost:3001/api/nutrition/macro-targets" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```javascript
{
  dailyCalories: 2200,
  proteinGrams: 165,
  carbGrams: 275,
  fatGrams: 73,
  macroPercent: {
    protein: 30,
    carbs: 50,
    fats: 30
  },
  note: "Recommendations based on activity level. Adjust as needed for your goals."
}
```

**How It Works:**
- If user has fitness profile (height, weight, age): Uses Mifflin-St Jeor equation
- Assumes moderate activity level (1.5x BMR)
- Can be customized based on fitness goals (strength, endurance, etc.)

**Formula:**
```
BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
Daily Calories = BMR × 1.5 (moderate activity)
```

---

## 🎯 Frontend Integration

### Example: Display on Fitness Dashboard

```javascript
import { useEffect, useState } from 'react';

function FitnessDashboard() {
  const [nutrition, setNutrition] = useState(null);
  const [targets, setTargets] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNutrition = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Get today's nutrition
        const summaryRes = await fetch('/api/nutrition/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const summaryData = await summaryRes.json();
        setNutrition(summaryData);

        // Get targets
        const targetsRes = await fetch('/api/nutrition/macro-targets', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const targetsData = await targetsRes.json();
        setTargets(targetsData);
      } catch (error) {
        console.error('Failed to fetch nutrition:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNutrition();
  }, []);

  if (loading) return <div>Loading nutrition data...</div>;

  return (
    <div className="nutrition-summary">
      <h2>Today's Nutrition</h2>
      
      {/* Calorie Progress */}
      <div className="calorie-card">
        <div className="calorie-consumed">
          {nutrition?.totalCalories || 0} cal
        </div>
        <div className="calorie-target">
          Target: {targets?.dailyCalories} cal
        </div>
        <ProgressBar 
          current={nutrition?.totalCalories || 0}
          target={targets?.dailyCalories || 2200}
        />
      </div>

      {/* Macro Breakdown */}
      <div className="macros">
        <MacroItem
          label="Protein"
          actual={nutrition?.protein || 0}
          target={targets?.proteinGrams || 165}
          unit="g"
        />
        <MacroItem
          label="Carbs"
          actual={nutrition?.carbs || 0}
          target={targets?.carbGrams || 275}
          unit="g"
        />
        <MacroItem
          label="Fats"
          actual={nutrition?.fats || 0}
          target={targets?.fatGrams || 73}
          unit="g"
        />
      </div>

      {/* Meal List */}
      <div className="meals">
        <h3>Meals Today</h3>
        {nutrition?.meals?.map(meal => (
          <div key={meal.type} className="meal-item">
            <div className="meal-name">{meal.name}</div>
            <div className="meal-stats">
              {meal.calories} cal | {meal.protein}g protein
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FitnessDashboard;
```

---

## 🔐 Security & Privacy

### What's Allowed ✅
- READ meal plan data (calories, macros, ingredients)
- DISPLAY nutrition on fitness dashboard
- CALCULATE macro percentages
- SHOW weekly trends

### What's NOT Allowed ❌
- CREATE new meals
- MODIFY existing meals
- DELETE meals
- CHANGE meal preferences
- TRIGGER meal generation
- MODIFY meal plan history

### Data Access
- Users can only see their own nutrition data
- All requests require valid JWT token
- User ID is extracted from token, not from request

---

## 📊 Data Model

The nutrition endpoints read from existing meal planner tables:

```sql
-- Main table (already exists)
meal_plan_history
├── id (UUID)
├── user_id (UUID) - Foreign key to users.id
├── meal_plan (JSON) - Contains breakfast, lunch, dinner, snacks
│   └── Each meal contains nutrition info (calories, protein, carbs, fats)
├── preferences (JSON)
├── stores (JSON)
├── shopping_list (JSON)
├── total_cost (Decimal)
├── created_at (Timestamp)
└── updated_at (Timestamp)

-- Nutrition schema (inferred from meal_plan JSON):
meal_plan.breakfast[0]
├── name: "Oatmeal with berries"
├── nutrition
│   ├── calories: 400
│   ├── protein: 15
│   ├── carbs: 65
│   └── fats: 10
└── ...

meal_plan.lunch
├── name: "Grilled chicken with rice"
├── nutrition { calories, protein, carbs, fats }
└── ...
```

---

## 🧪 Testing

### Test Endpoints with cURL

```bash
# Test today's nutrition
curl -X GET "http://localhost:3001/api/nutrition/summary" \
  -H "Authorization: Bearer TEST_TOKEN"

# Test specific date
curl -X GET "http://localhost:3001/api/nutrition/summary?date=2025-12-20" \
  -H "Authorization: Bearer TEST_TOKEN"

# Test weekly summary
curl -X GET "http://localhost:3001/api/nutrition/weekly" \
  -H "Authorization: Bearer TEST_TOKEN"

# Test macro targets
curl -X GET "http://localhost:3001/api/nutrition/macro-targets" \
  -H "Authorization: Bearer TEST_TOKEN"
```

### Expected Behaviors

**Scenario 1: User with meal plan**
- ✅ Returns meal data with calories and macros
- ✅ Totals are calculated correctly
- ✅ Weekly data shows trends

**Scenario 2: User without meal plan**
- ✅ Returns empty arrays, zero totals
- ✅ Shows friendly "No meal plan" message
- ✅ Still returns macro targets

**Scenario 3: Invalid token**
- ✅ Returns 401 Unauthorized
- ✅ Prevents access to other users' data

---

## 🚀 Deployment Checklist

- [ ] Nutrition routes file created at `/routes/nutrition.js`
- [ ] Routes imported in `server.js`
- [ ] Routes mounted at `/api/nutrition`
- [ ] Authentication middleware applied
- [ ] Environment variables configured (uses existing DB_URL)
- [ ] Tested locally with curl/Postman
- [ ] Tested with valid JWT token
- [ ] Tested with invalid token (should return 401)
- [ ] Tested with no meal plan (should return empty)
- [ ] Deployed to Vercel/Render

---

## 📈 Future Enhancements (Out of Scope)

These features are planned but not included in Phase 1:

- 🔄 **Meal plan modifications** - Allow fitness app to suggest meal adjustments
- 📊 **Nutrition analytics** - Detailed breakdown by meal type, trends
- 🎯 **Goal-based recommendations** - Adjust targets based on fitness goals
- 📱 **Calorie burn offset** - Integrate workout calories burned with meal calories
- 📈 **Macro ratios** - Smart recommendations based on strength vs cardio
- 🔔 **Notifications** - Alert when nutrition goals are reached
- 📤 **Data export** - Export nutrition summary as PDF/CSV

---

## 🔗 Related Documentation

- [Fitness Module Documentation](./fitness/docs/DOCUMENTATION_INDEX.md)
- [API Integration Guide](./fitness/docs/API_INTEGRATION_GUIDE.md)
- [Fitness Dashboard Design](./fitness/docs/UI_COMPONENT_LIBRARY.md)
- [Meal Planner API Reference](./README.md)

---

## 📞 Support

### Common Issues

**Q: "Unauthorized" error when calling endpoints**
- A: Verify JWT token is valid and included in Authorization header

**Q: Getting empty nutrition data**
- A: Normal if user hasn't generated a meal plan yet

**Q: Calorie totals seem wrong**
- A: Check that meal plan JSON includes nutrition object in each meal

**Q: Can I modify meals from fitness module?**
- A: No, it's read-only by design. Meals are managed in Meal Planner.

---

**Status:** ✅ Ready for Production  
**Last Updated:** December 21, 2025  
**Version:** 1.0
