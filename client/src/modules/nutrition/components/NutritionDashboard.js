import React from 'react';
import CalorieTracker from './CalorieTracker';
import MacroBreakdown from './MacroBreakdown';
import './NutritionDashboard.css';

/**
 * NutritionDashboard - Main dashboard view for Nutrition module
 * 
 * Displays:
 * - Today's calorie progress
 * - Macro breakdown (protein/carbs/fat)
 * - Quick stats from meal plan
 * 
 * Uses READ-ONLY meal plan data
 */
export default function NutritionDashboard({ mealPlanData, nutritionSummary, user }) {
  // Calculate today's totals from meal plan
  const todaysTotals = calculateTodaysTotals(mealPlanData);
  const goals = getDefaultGoals();

  return (
    <div className="nutrition-dashboard">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <h2>Good {getTimeOfDay()}, {user?.name?.split(' ')[0] || 'there'}!</h2>
        <p>Here's your nutrition overview for today</p>
      </div>

      {/* Main Stats Row */}
      <div className="dashboard-stats-row">
        {/* Calorie Tracker */}
        <div className="stat-card calorie-card">
          <CalorieTracker 
            consumed={todaysTotals.calories}
            goal={goals.calories}
          />
        </div>

        {/* Macro Breakdown */}
        <div className="stat-card macro-card">
          <MacroBreakdown 
            protein={todaysTotals.protein}
            carbs={todaysTotals.carbs}
            fat={todaysTotals.fat}
            goals={goals}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <h3>📊 Quick Stats</h3>
        <div className="quick-stats-grid">
          <div className="quick-stat">
            <span className="stat-icon">🍽️</span>
            <span className="stat-value">{todaysTotals.mealCount}</span>
            <span className="stat-label">Meals Planned</span>
          </div>
          <div className="quick-stat">
            <span className="stat-icon">🥩</span>
            <span className="stat-value">{todaysTotals.protein}g</span>
            <span className="stat-label">Protein</span>
          </div>
          <div className="quick-stat">
            <span className="stat-icon">🍞</span>
            <span className="stat-value">{todaysTotals.carbs}g</span>
            <span className="stat-label">Carbs</span>
          </div>
          <div className="quick-stat">
            <span className="stat-icon">🥑</span>
            <span className="stat-value">{todaysTotals.fat}g</span>
            <span className="stat-label">Fat</span>
          </div>
          <div className="quick-stat">
            <span className="stat-icon">🌾</span>
            <span className="stat-value">{todaysTotals.fiber}g</span>
            <span className="stat-label">Fiber</span>
          </div>
          <div className="quick-stat">
            <span className="stat-icon">🧂</span>
            <span className="stat-value">{todaysTotals.sodium}mg</span>
            <span className="stat-label">Sodium</span>
          </div>
        </div>
      </div>

      {/* Meal Plan Status */}
      <div className="meal-plan-status">
        {mealPlanData ? (
          <div className="status-card success">
            <span className="status-icon">✅</span>
            <div className="status-text">
              <h4>Meal Plan Active</h4>
              <p>You have an active meal plan with {mealPlanData.meals?.length || 0} meals</p>
            </div>
          </div>
        ) : (
          <div className="status-card info">
            <span className="status-icon">📋</span>
            <div className="status-text">
              <h4>No Meal Plan</h4>
              <p>Create a meal plan in the Meal Planner app to track nutrition</p>
            </div>
          </div>
        )}
      </div>

      {/* Daily Tips */}
      <div className="daily-tips">
        <h3>💡 Nutrition Tips</h3>
        <div className="tips-list">
          {getNutritionTips(todaysTotals, goals).map((tip, index) => (
            <div key={index} className={`tip-item ${tip.type}`}>
              <span className="tip-icon">{tip.icon}</span>
              <p>{tip.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate today's nutrition totals from meal plan
 * READ-ONLY - does not modify meal plan data
 */
function calculateTodaysTotals(mealPlanData) {
  const defaults = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0,
    mealCount: 0
  };

  if (!mealPlanData || !mealPlanData.meals) {
    return defaults;
  }

  // Get today's day name
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  // Filter meals for today (or use first day if no match)
  const todaysMeals = mealPlanData.meals.filter(meal => 
    meal.day?.toLowerCase() === today.toLowerCase()
  );

  // If no meals for today, use all meals as average
  const mealsToCount = todaysMeals.length > 0 ? todaysMeals : mealPlanData.meals.slice(0, 3);

  return mealsToCount.reduce((totals, meal) => ({
    calories: totals.calories + (parseInt(meal.calories) || 0),
    protein: totals.protein + (parseInt(meal.protein) || 0),
    carbs: totals.carbs + (parseInt(meal.carbs) || 0),
    fat: totals.fat + (parseInt(meal.fat) || 0),
    fiber: totals.fiber + (parseInt(meal.fiber) || 0),
    sodium: totals.sodium + (parseInt(meal.sodium) || 0),
    mealCount: totals.mealCount + 1
  }), defaults);
}

/**
 * Get default nutrition goals
 */
function getDefaultGoals() {
  return {
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65,
    fiber: 25,
    sodium: 2300
  };
}

/**
 * Get time of day for greeting
 */
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/**
 * Generate nutrition tips based on current stats
 */
function getNutritionTips(totals, goals) {
  const tips = [];

  // Calorie tip
  const caloriePercentage = (totals.calories / goals.calories) * 100;
  if (caloriePercentage < 50) {
    tips.push({
      type: 'info',
      icon: '🍽️',
      message: "You're under half your calorie goal. Make sure to eat enough to fuel your day!"
    });
  } else if (caloriePercentage > 100) {
    tips.push({
      type: 'warning',
      icon: '⚠️',
      message: "You've exceeded your calorie goal. Consider lighter options for remaining meals."
    });
  }

  // Protein tip
  if (totals.protein < goals.protein * 0.5) {
    tips.push({
      type: 'info',
      icon: '🥩',
      message: 'Add more protein-rich foods like chicken, fish, beans, or tofu to your meals.'
    });
  }

  // Fiber tip
  if (totals.fiber < goals.fiber * 0.5) {
    tips.push({
      type: 'info',
      icon: '🥬',
      message: 'Boost your fiber intake with vegetables, whole grains, and legumes.'
    });
  }

  // Hydration reminder (always show)
  tips.push({
    type: 'success',
    icon: '💧',
    message: "Don't forget to stay hydrated! Aim for 8 glasses of water throughout the day."
  });

  return tips.slice(0, 3); // Max 3 tips
}
