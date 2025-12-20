import React, { useState, useEffect } from 'react';
import { API_BASE, fetchWithAuth } from '../../shared/utils/api';
import { nutritionSnapshotService } from './services/NutritionSnapshotService';
import './styles/NutritionApp.css';

/**
 * NutritionApp - Main Nutrition Module Component
 * 
 * Provides access to meal plan nutrition data:
 * - Select from saved meal plans
 * - Analyze with GPT for nutrition information
 * - Weekly summary view
 * - Per-day breakdown view  
 * - Per-meal drill-down view
 */
export default function NutritionApp({ user, onBack, onLogout }) {
  const [currentView, setCurrentView] = useState('select'); // 'select', 'weekly', 'daily', 'meal'
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealPlanData, setMealPlanData] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [cacheHit, setCacheHit] = useState(false);
  const [savedPlans, setSavedPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // Fetch saved meal plans on mount
  useEffect(() => {
    const loadSavedPlans = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🥗 [Nutrition] Loading saved meal plans...');
        
        const response = await fetchWithAuth(`${API_BASE}/api/nutrition/saved-plans`, {
          method: 'GET'
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError('Please log in to view nutrition data');
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to load saved plans');
          }
        } else {
          const data = await response.json();
          console.log('🥗 [Nutrition] Found saved plans:', data.plans?.length);
          setSavedPlans(data.plans || []);
        }
      } catch (err) {
        console.error('🥗 [Nutrition] Error loading saved plans:', err);
        setError(err.message || 'Failed to load saved meal plans');
      } finally {
        setLoading(false);
      }
    };

    loadSavedPlans();
  }, []);

  // Analyze selected meal plan with GPT
  const handleAnalyzePlan = async (planId) => {
    setAnalyzing(true);
    setError(null);
    setSelectedPlanId(planId);

    try {
      console.log('🥗 [Nutrition] Analyzing plan:', planId);
      
      const response = await fetchWithAuth(`${API_BASE}/api/nutrition/analyze-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze meal plan');
      }

      const data = await response.json();
      console.log('🥗 [Nutrition] Analysis complete:', data);
      
      setMealPlanData(data.mealPlan);
      
      // Compute snapshot from analyzed data
      const nutritionSnapshot = nutritionSnapshotService.getSnapshot(
        user?.id || 'anonymous',
        data.mealPlan
      );
      setSnapshot(nutritionSnapshot);
      setCacheHit(false);
      setCurrentView('weekly');
      
    } catch (err) {
      console.error('🥗 [Nutrition] Analysis error:', err);
      setError(err.message || 'Failed to analyze meal plan');
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle navigation
  const handleViewChange = (view, dayOrMeal = null) => {
    setCurrentView(view);
    if (view === 'daily' && dayOrMeal) {
      setSelectedDay(dayOrMeal);
      setSelectedMeal(null);
    } else if (view === 'meal' && dayOrMeal) {
      setSelectedMeal(dayOrMeal);
    } else if (view === 'weekly') {
      setSelectedDay(null);
      setSelectedMeal(null);
    } else if (view === 'select') {
      setSelectedDay(null);
      setSelectedMeal(null);
      setMealPlanData(null);
      setSnapshot(null);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="nutrition-app">
        <div className="nutrition-loading">
          <div className="nutrition-spinner"></div>
          <p>Loading your saved meal plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nutrition-app">
      {/* Header */}
      <header className="nutrition-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Portal
        </button>
        <div className="header-title">
          <h1>🥗 Nutrition Tracker</h1>
          <p>Analyze nutrition from your meal plans</p>
        </div>
        <div className="header-actions">
          {user && (
            <span className="user-name">{user.name || user.email}</span>
          )}
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Breadcrumb */}
      <nav className="nutrition-breadcrumb">
        <button 
          className={`breadcrumb-item ${currentView === 'select' ? 'active' : ''}`}
          onClick={() => handleViewChange('select')}
        >
          📋 Select Plan
        </button>
        {mealPlanData && (
          <>
            <span className="breadcrumb-separator">›</span>
            <button 
              className={`breadcrumb-item ${currentView === 'weekly' ? 'active' : ''}`}
              onClick={() => handleViewChange('weekly')}
            >
              📊 Weekly Summary
            </button>
          </>
        )}
        {selectedDay && (
          <>
            <span className="breadcrumb-separator">›</span>
            <button 
              className={`breadcrumb-item ${currentView === 'daily' ? 'active' : ''}`}
              onClick={() => handleViewChange('daily', selectedDay)}
            >
              📅 {selectedDay}
            </button>
          </>
        )}
        {selectedMeal && (
          <>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-item active">
              🍽️ {selectedMeal.name}
            </span>
          </>
        )}
      </nav>

      {/* Cache Status Indicator */}
      {snapshot && (
        <div className="cache-status">
          <small>
            {cacheHit ? '✅ Using cached data' : '🤖 AI analyzed'} 
            {' • '}{snapshot.totalMeals} meals
          </small>
        </div>
      )}

      {/* Main Content */}
      <main className="nutrition-content">
        {error && (
          <div className="nutrition-error">
            <p>⚠️ {error}</p>
            <p className="error-hint">Please generate a meal plan first from the Meal Planner app, then return here.</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {/* Plan Selection View */}
        {currentView === 'select' && !error && (
          <MealPlanSelector 
            plans={savedPlans}
            selectedPlanId={selectedPlanId}
            onAnalyze={handleAnalyzePlan}
            analyzing={analyzing}
          />
        )}

        {mealPlanData && snapshot && currentView === 'weekly' && (
          <WeeklySummaryView 
            snapshot={snapshot}
            onDayClick={(day) => handleViewChange('daily', day)}
          />
        )}

        {mealPlanData && snapshot && currentView === 'daily' && selectedDay && (
          <DailyBreakdownView 
            snapshot={snapshot}
            day={selectedDay}
            onMealClick={(meal) => handleViewChange('meal', meal)}
            onBackToWeekly={() => handleViewChange('weekly')}
          />
        )}

        {mealPlanData && snapshot && currentView === 'meal' && selectedMeal && (
          <MealDrillDownView 
            meal={selectedMeal}
            onBack={() => handleViewChange('daily', selectedMeal.day)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="nutrition-footer">
        <p>ASR Digital Services • Nutrition Tracker</p>
      </footer>
    </div>
  );
}

/**
 * Meal Plan Selector - Allows user to choose a saved meal plan to analyze
 */
function MealPlanSelector({ plans, selectedPlanId, onAnalyze, analyzing }) {
  if (!plans || plans.length === 0) {
    return (
      <div className="no-data-message">
        <span className="no-data-icon">📋</span>
        <h3>No Meal Plans Found</h3>
        <p>Create a meal plan in the Meal Planner app first, then return here to analyze nutrition.</p>
        <p className="hint">Your nutrition data will be calculated using AI analysis.</p>
      </div>
    );
  }

  return (
    <div className="plan-selector">
      <h2>📋 Select a Meal Plan to Analyze</h2>
      <p className="section-hint">Choose a saved meal plan to get detailed nutrition information using AI analysis</p>
      
      <div className="plans-grid">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`plan-card ${selectedPlanId === plan.id ? 'selected' : ''} ${analyzing && selectedPlanId === plan.id ? 'analyzing' : ''}`}
          >
            <div className="plan-date">
              📅 {new Date(plan.createdAt).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="plan-meals">
              🍽️ {plan.mealCount} meals
            </div>
            <div className="plan-preview">
              {plan.previewMeals?.map((meal, i) => (
                <div key={i} className="preview-meal">{meal}</div>
              ))}
            </div>
            <button
              className="analyze-btn"
              onClick={() => onAnalyze(plan.id)}
              disabled={analyzing}
            >
              {analyzing && selectedPlanId === plan.id ? (
                <>
                  <span className="spinner-small"></span>
                  Analyzing with AI...
                </>
              ) : (
                <>🤖 Analyze Nutrition</>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * No Meal Plan Message (legacy - kept for reference)
 */
function NoMealPlanMessage() {
  return (
    <div className="no-data-message">
      <span className="no-data-icon">📋</span>
      <h3>No Meal Plan Available</h3>
      <p>Create a meal plan in the Meal Planner app to see nutrition details here.</p>
      <p className="hint">Your nutrition data will be calculated automatically from your meal plan.</p>
    </div>
  );
}

/**
 * Weekly Summary View - Shows weekly totals, daily averages, and per-day cards
 */
function WeeklySummaryView({ snapshot, onDayClick }) {
  const { weekly, daily } = snapshot;

  return (
    <div className="weekly-summary">
      <h2>📊 Weekly Summary</h2>
      
      {/* Weekly Totals Card */}
      <div className="totals-card">
        <h3>Weekly Totals</h3>
        <div className="totals-grid">
          <div className="total-item calories">
            <span className="total-value">{weekly.totals.calories.toLocaleString()}</span>
            <span className="total-label">Calories</span>
          </div>
          <div className="total-item protein">
            <span className="total-value">{weekly.totals.protein_g}g</span>
            <span className="total-label">Protein</span>
          </div>
          <div className="total-item carbs">
            <span className="total-value">{weekly.totals.carbs_g}g</span>
            <span className="total-label">Carbs</span>
          </div>
          <div className="total-item fat">
            <span className="total-value">{weekly.totals.fat_g}g</span>
            <span className="total-label">Fat</span>
          </div>
        </div>
      </div>

      {/* Daily Averages Card */}
      <div className="averages-card">
        <h3>Daily Averages</h3>
        <div className="averages-grid">
          <div className="average-item">
            <span className="avg-icon">🔥</span>
            <span className="avg-value">{weekly.averages.calories}</span>
            <span className="avg-label">cal/day</span>
          </div>
          <div className="average-item">
            <span className="avg-icon">🥩</span>
            <span className="avg-value">{weekly.averages.protein_g}g</span>
            <span className="avg-label">protein/day</span>
          </div>
          <div className="average-item">
            <span className="avg-icon">🍞</span>
            <span className="avg-value">{weekly.averages.carbs_g}g</span>
            <span className="avg-label">carbs/day</span>
          </div>
          <div className="average-item">
            <span className="avg-icon">🥑</span>
            <span className="avg-value">{weekly.averages.fat_g}g</span>
            <span className="avg-label">fat/day</span>
          </div>
        </div>
      </div>

      {/* Macro Distribution */}
      <div className="macro-distribution">
        <h3>Macro Distribution</h3>
        <div className="macro-bars">
          <div className="macro-bar protein" style={{ width: `${weekly.macroPercentages.protein}%` }}>
            <span>Protein {weekly.macroPercentages.protein}%</span>
          </div>
          <div className="macro-bar carbs" style={{ width: `${weekly.macroPercentages.carbs}%` }}>
            <span>Carbs {weekly.macroPercentages.carbs}%</span>
          </div>
          <div className="macro-bar fat" style={{ width: `${weekly.macroPercentages.fat}%` }}>
            <span>Fat {weekly.macroPercentages.fat}%</span>
          </div>
        </div>
      </div>

      {/* Daily Breakdown Cards */}
      <div className="daily-cards">
        <h3>📅 Per-Day Breakdown</h3>
        <p className="section-hint">Click a day to see meal details</p>
        <div className="days-grid">
          {daily.map((dayData) => (
            <button 
              key={dayData.day}
              className={`day-card ${dayData.mealCount === 0 ? 'empty' : ''}`}
              onClick={() => dayData.mealCount > 0 && onDayClick(dayData.day)}
              disabled={dayData.mealCount === 0}
            >
              <div className="day-name">{dayData.day.substring(0, 3)}</div>
              <div className="day-calories">{dayData.totals.calories} cal</div>
              <div className="day-meals">{dayData.mealCount} meals</div>
              <div className="day-macros">
                <span className="macro-mini protein">{dayData.totals.protein_g}g P</span>
                <span className="macro-mini carbs">{dayData.totals.carbs_g}g C</span>
                <span className="macro-mini fat">{dayData.totals.fat_g}g F</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Daily Breakdown View - Shows meals for a specific day
 */
function DailyBreakdownView({ snapshot, day, onMealClick, onBackToWeekly }) {
  const dayData = snapshot.daily.find(d => d.day === day);
  
  if (!dayData) {
    return (
      <div className="no-data-message">
        <p>No data for {day}</p>
        <button onClick={onBackToWeekly}>Back to Weekly</button>
      </div>
    );
  }

  return (
    <div className="daily-breakdown">
      <h2>📅 {day}</h2>
      
      {/* Day Totals */}
      <div className="day-totals-card">
        <h3>Day Totals</h3>
        <div className="totals-row">
          <div className="total-pill calories">
            <span className="pill-value">{dayData.totals.calories}</span>
            <span className="pill-label">Calories</span>
          </div>
          <div className="total-pill protein">
            <span className="pill-value">{dayData.totals.protein_g}g</span>
            <span className="pill-label">Protein</span>
          </div>
          <div className="total-pill carbs">
            <span className="pill-value">{dayData.totals.carbs_g}g</span>
            <span className="pill-label">Carbs</span>
          </div>
          <div className="total-pill fat">
            <span className="pill-value">{dayData.totals.fat_g}g</span>
            <span className="pill-label">Fat</span>
          </div>
        </div>
      </div>

      {/* Meals List */}
      <div className="meals-list">
        <h3>🍽️ Meals ({dayData.mealCount})</h3>
        <p className="section-hint">Click a meal for full details</p>
        
        {dayData.meals.length === 0 ? (
          <div className="no-meals">No meals planned for {day}</div>
        ) : (
          <div className="meals-grid">
            {dayData.meals.map((meal, index) => (
              <button 
                key={meal.id || index}
                className="meal-card"
                onClick={() => onMealClick(meal)}
              >
                <div className="meal-type-badge">{meal.mealType}</div>
                <h4 className="meal-name">{meal.name}</h4>
                <div className="meal-nutrition">
                  <span className="meal-calories">{meal.calories} cal</span>
                  <div className="meal-macros">
                    <span className="macro protein">{meal.protein_g}g P</span>
                    <span className="macro carbs">{meal.carbs_g}g C</span>
                    <span className="macro fat">{meal.fat_g}g F</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Meal Drill-Down View - Shows detailed nutrition for a single meal
 */
function MealDrillDownView({ meal, onBack }) {
  // Calculate macro percentages for this meal
  const totalMacroCalories = (meal.protein_g * 4) + (meal.carbs_g * 4) + (meal.fat_g * 9);
  const macroPercentages = totalMacroCalories > 0 ? {
    protein: Math.round((meal.protein_g * 4 / totalMacroCalories) * 100),
    carbs: Math.round((meal.carbs_g * 4 / totalMacroCalories) * 100),
    fat: Math.round((meal.fat_g * 9 / totalMacroCalories) * 100)
  } : { protein: 0, carbs: 0, fat: 0 };

  return (
    <div className="meal-drilldown">
      <button className="back-link" onClick={onBack}>
        ← Back to {meal.day}
      </button>
      
      <div className="meal-header-card">
        <span className="meal-type-badge large">{meal.mealType}</span>
        <h2>{meal.name}</h2>
        <p className="meal-day">{meal.day}</p>
      </div>

      {/* Nutrition Details */}
      <div className="nutrition-details">
        <h3>📊 Nutrition Facts</h3>
        
        <div className="nutrition-grid">
          <div className="nutrition-row main">
            <span className="label">Calories</span>
            <span className="value">{meal.calories}</span>
          </div>
          
          <div className="nutrition-row">
            <span className="label">Protein</span>
            <span className="value">{meal.protein_g}g</span>
            <span className="percent">{macroPercentages.protein}%</span>
          </div>
          
          <div className="nutrition-row">
            <span className="label">Carbohydrates</span>
            <span className="value">{meal.carbs_g}g</span>
            <span className="percent">{macroPercentages.carbs}%</span>
          </div>
          
          <div className="nutrition-row">
            <span className="label">Fat</span>
            <span className="value">{meal.fat_g}g</span>
            <span className="percent">{macroPercentages.fat}%</span>
          </div>
          
          {meal.fiber_g > 0 && (
            <div className="nutrition-row">
              <span className="label">Fiber</span>
              <span className="value">{meal.fiber_g}g</span>
            </div>
          )}
          
          {meal.sodium_mg > 0 && (
            <div className="nutrition-row">
              <span className="label">Sodium</span>
              <span className="value">{meal.sodium_mg}mg</span>
            </div>
          )}
        </div>
      </div>

      {/* Macro Visualization */}
      <div className="macro-visual">
        <h3>Macro Breakdown</h3>
        <div className="macro-chart">
          <div 
            className="macro-segment protein" 
            style={{ width: `${macroPercentages.protein}%` }}
            title={`Protein: ${macroPercentages.protein}%`}
          >
            {macroPercentages.protein > 10 && `${macroPercentages.protein}%`}
          </div>
          <div 
            className="macro-segment carbs" 
            style={{ width: `${macroPercentages.carbs}%` }}
            title={`Carbs: ${macroPercentages.carbs}%`}
          >
            {macroPercentages.carbs > 10 && `${macroPercentages.carbs}%`}
          </div>
          <div 
            className="macro-segment fat" 
            style={{ width: `${macroPercentages.fat}%` }}
            title={`Fat: ${macroPercentages.fat}%`}
          >
            {macroPercentages.fat > 10 && `${macroPercentages.fat}%`}
          </div>
        </div>
        <div className="macro-legend">
          <span className="legend-item protein">🥩 Protein</span>
          <span className="legend-item carbs">🍞 Carbs</span>
          <span className="legend-item fat">🥑 Fat</span>
        </div>
      </div>
    </div>
  );
}
