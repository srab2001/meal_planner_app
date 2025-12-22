/**
 * Nutrition Integration Routes
 * 
 * One-way read-only integration between Fitness Module and Meal Planner
 * Fitness module can READ nutrition data but CANNOT modify meal plans
 * 
 * These endpoints provide nutrition summary data for the Fitness Dashboard
 * to help users correlate workouts with caloric intake
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Authentication middleware - ensures user is logged in
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ============================================================================
// GET /api/nutrition/summary
// ============================================================================
/**
 * Get nutrition summary for today or specified date
 * 
 * Query Parameters:
 *   - date: ISO format date (YYYY-MM-DD), defaults to today
 * 
 * Response:
 *   {
 *     date: "2025-12-21",
 *     totalCalories: 2100,
 *     protein: 150,
 *     carbs: 250,
 *     fats: 70,
 *     meals: [
 *       { type: "breakfast", name: "...", calories: 400, protein: 15 },
 *       { type: "lunch", name: "...", calories: 700, protein: 50 },
 *       { type: "dinner", name: "...", calories: 800, protein: 65 },
 *       { type: "snacks", name: "...", calories: 200, protein: 10 }
 *     ]
 *   }
 */
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Get the most recent meal plan from history
    const mealPlanResult = await db.query(
      `SELECT 
        meal_plan,
        created_at
      FROM meal_plan_history
      WHERE user_id = $1
      AND DATE(created_at) <= $2
      ORDER BY created_at DESC
      LIMIT 1`,
      [req.user.id, dateStr]
    );

    if (mealPlanResult.rows.length === 0) {
      return res.json({
        date: dateStr,
        totalCalories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        meals: [],
        message: 'No meal plan found for this date'
      });
    }

    const mealPlan = mealPlanResult.rows[0].meal_plan;
    
    // Parse the meal plan and calculate totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    const meals = [];

    // Iterate through meal types (breakfast, lunch, dinner, snacks)
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
    
    for (const mealType of mealTypes) {
      if (mealPlan[mealType]) {
        const meal = mealPlan[mealType];
        
        // Calculate nutrition for this meal
        let mealCalories = 0;
        let mealProtein = 0;
        let mealCarbs = 0;
        let mealFats = 0;

        // If meal is an array of items
        if (Array.isArray(meal)) {
          meal.forEach(item => {
            if (item.nutrition) {
              mealCalories += item.nutrition.calories || 0;
              mealProtein += item.nutrition.protein || 0;
              mealCarbs += item.nutrition.carbs || 0;
              mealFats += item.nutrition.fats || 0;
            }
          });
        } else if (meal.nutrition) {
          // If meal is a single object with nutrition
          mealCalories = meal.nutrition.calories || 0;
          mealProtein = meal.nutrition.protein || 0;
          mealCarbs = meal.nutrition.carbs || 0;
          mealFats = meal.nutrition.fats || 0;
        }

        totalCalories += mealCalories;
        totalProtein += mealProtein;
        totalCarbs += mealCarbs;
        totalFats += mealFats;

        // Get meal name(s)
        let mealName = 'No meal planned';
        if (Array.isArray(meal) && meal.length > 0) {
          mealName = meal.map(item => item.name || item.title).join(', ');
          if (mealName.length > 50) {
            mealName = mealName.substring(0, 50) + '...';
          }
        } else if (meal.name || meal.title) {
          mealName = meal.name || meal.title;
        }

        meals.push({
          type: mealType,
          name: mealName,
          calories: Math.round(mealCalories),
          protein: Math.round(mealProtein),
          carbs: Math.round(mealCarbs),
          fats: Math.round(mealFats)
        });
      }
    }

    res.json({
      date: dateStr,
      totalCalories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fats: Math.round(totalFats),
      meals: meals,
      timestamp: mealPlanResult.rows[0].created_at
    });

  } catch (error) {
    console.error('[GET /api/nutrition/summary] Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to retrieve nutrition summary',
      details: error.message 
    });
  }
});

// ============================================================================
// GET /api/nutrition/weekly
// ============================================================================
/**
 * Get nutrition summary for the past 7 days
 * Aggregates daily totals for trend analysis
 * 
 * Response:
 *   {
 *     days: [
 *       { date: "2025-12-21", calories: 2100, protein: 150 },
 *       { date: "2025-12-20", calories: 1900, protein: 145 },
 *       ...
 *     ],
 *     averageCalories: 2050,
 *     averageProtein: 148
 *   }
 */
router.get('/weekly', requireAuth, async (req, res) => {
  try {
    // Get all meal plans from the past 7 days
    const result = await db.query(
      `SELECT 
        meal_plan,
        DATE(created_at) as plan_date,
        created_at
      FROM meal_plan_history
      WHERE user_id = $1
      AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
      ORDER BY created_at DESC`,
      [req.user.id]
    );

    const dayMap = {};

    // Group by date and calculate totals
    result.rows.forEach(row => {
      const dateStr = row.plan_date.toISOString().split('T')[0];
      
      if (!dayMap[dateStr]) {
        dayMap[dateStr] = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          mealCount: 0
        };
      }

      const mealPlan = row.meal_plan;
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];

      mealTypes.forEach(mealType => {
        if (mealPlan[mealType]) {
          const meal = mealPlan[mealType];

          if (Array.isArray(meal)) {
            meal.forEach(item => {
              if (item.nutrition) {
                dayMap[dateStr].calories += item.nutrition.calories || 0;
                dayMap[dateStr].protein += item.nutrition.protein || 0;
                dayMap[dateStr].carbs += item.nutrition.carbs || 0;
                dayMap[dateStr].fats += item.nutrition.fats || 0;
              }
            });
          } else if (meal.nutrition) {
            dayMap[dateStr].calories += meal.nutrition.calories || 0;
            dayMap[dateStr].protein += meal.nutrition.protein || 0;
            dayMap[dateStr].carbs += meal.nutrition.carbs || 0;
            dayMap[dateStr].fats += meal.nutrition.fats || 0;
          }
        }
      });
    });

    // Convert to array and calculate averages
    const days = Object.keys(dayMap)
      .sort()
      .map(date => ({
        date,
        calories: Math.round(dayMap[date].calories),
        protein: Math.round(dayMap[date].protein),
        carbs: Math.round(dayMap[date].carbs),
        fats: Math.round(dayMap[date].fats)
      }));

    const totalDays = days.length || 1;
    const averageCalories = days.reduce((sum, day) => sum + day.calories, 0) / totalDays;
    const averageProtein = days.reduce((sum, day) => sum + day.protein, 0) / totalDays;

    res.json({
      period: 'past_7_days',
      days,
      averageCalories: Math.round(averageCalories),
      averageProtein: Math.round(averageProtein),
      totalDaysPlanned: days.length
    });

  } catch (error) {
    console.error('[GET /api/nutrition/weekly] Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to retrieve weekly nutrition data',
      details: error.message 
    });
  }
});

// ============================================================================
// GET /api/nutrition/macro-targets
// ============================================================================
/**
 * Get recommended macro targets for the user based on their profile
 * Read from user_preferences if available
 * 
 * Response:
 *   {
 *     dailyCalories: 2200,
 *     proteinGrams: 150,
 *     carbGrams: 275,
 *     fatGrams: 73,
 *     proteinPercent: 27,
 *     carbPercent: 50,
 *     fatPercent: 30
 *   }
 */
router.get('/macro-targets', requireAuth, async (req, res) => {
  try {
    // Try to get user's fitness profile if it exists
    const fitnessResult = await db.query(
      `SELECT age, weight, height FROM fitness_profiles WHERE user_id = $1`,
      [req.user.id]
    );

    // Basic calculation - can be customized based on fitness goals
    // Using Mifflin-St Jeor equation for BMR estimation
    let dailyCalories = 2200; // Default
    let proteinPercent = 30;
    let carbPercent = 40;
    let fatPercent = 30;

    // If we have fitness data, adjust recommendations
    if (fitnessResult.rows.length > 0) {
      const { age, weight, height } = fitnessResult.rows[0];
      
      if (weight && height) {
        // Simplified calorie calculation (1.5x BMR for moderate activity)
        // Formula: (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5 (for males)
        const bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        dailyCalories = Math.round(bmr * 1.5); // Moderate activity
      }
    }

    const proteinGrams = Math.round((dailyCalories * proteinPercent / 100) / 4); // 4 cal per gram
    const carbGrams = Math.round((dailyCalories * carbPercent / 100) / 4); // 4 cal per gram
    const fatGrams = Math.round((dailyCalories * fatPercent / 100) / 9); // 9 cal per gram

    res.json({
      dailyCalories,
      proteinGrams,
      carbGrams,
      fatGrams,
      macroPercent: {
        protein: proteinPercent,
        carbs: carbPercent,
        fats: fatPercent
      },
      note: 'Recommendations based on activity level. Adjust as needed for your goals.'
    });

  } catch (error) {
    console.error('[GET /api/nutrition/macro-targets] Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to retrieve macro targets',
      details: error.message 
    });
  }
});

module.exports = router;
