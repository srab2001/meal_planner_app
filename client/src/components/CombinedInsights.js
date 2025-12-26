import React, { useState, useEffect } from 'react';
import './CombinedInsights.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function CombinedInsights({ user, mealPlan }) {
  const [fitnessData, setFitnessData] = useState({
    weeklyWorkouts: 0,
    totalCaloriesBurned: 0,
    activeMinutes: 0
  });

  useEffect(() => {
    fetchFitnessData();
  }, []);

  const fetchFitnessData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/fitness/stats/weekly`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setFitnessData({
          weeklyWorkouts: data.workoutCount || 0,
          totalCaloriesBurned: data.estimatedCalories || 0,
          activeMinutes: data.totalDuration || 0
        });
      }
    } catch (error) {
      console.error('Error fetching fitness data:', error);
    }
  };

  // Calculate estimated daily calories from meal plan
  const estimatedDailyCalories = mealPlan ? 2000 : 0; // Placeholder

  // Calculate calorie balance
  const calorieBalance = estimatedDailyCalories - (fitnessData.totalCaloriesBurned / 7);

  return (
    <div className="combined-insights">
      <div className="insights-header">
        <h1>📊 Combined Insights</h1>
        <p>Your nutrition and fitness overview</p>
      </div>

      {/* Overview Cards */}
      <div className="overview-grid">
        {/* Nutrition Summary */}
        <div className="insight-card nutrition-card">
          <div className="card-header">
            <h2>🍽️ Nutrition</h2>
          </div>
          <div className="card-content">
            {mealPlan ? (
              <>
                <div className="insight-stat">
                  <span className="stat-label">Meal Plan Status</span>
                  <span className="stat-value active">Active</span>
                </div>
                <div className="insight-stat">
                  <span className="stat-label">Est. Daily Calories</span>
                  <span className="stat-value">{estimatedDailyCalories}</span>
                </div>
                <div className="insight-stat">
                  <span className="stat-label">Meals per Day</span>
                  <span className="stat-value">{mealPlan.mealsPerDay || 3}</span>
                </div>
              </>
            ) : (
              <div className="empty-data">
                <p>No active meal plan</p>
                <small>Create a meal plan to see insights</small>
              </div>
            )}
          </div>
        </div>

        {/* Fitness Summary */}
        <div className="insight-card fitness-card">
          <div className="card-header">
            <h2>💪 Fitness</h2>
          </div>
          <div className="card-content">
            <div className="insight-stat">
              <span className="stat-label">Workouts This Week</span>
              <span className="stat-value">{fitnessData.weeklyWorkouts}</span>
            </div>
            <div className="insight-stat">
              <span className="stat-label">Active Minutes</span>
              <span className="stat-value">{fitnessData.activeMinutes} min</span>
            </div>
            <div className="insight-stat">
              <span className="stat-label">Est. Calories Burned</span>
              <span className="stat-value">{fitnessData.totalCaloriesBurned}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calorie Balance */}
      <div className="balance-section">
        <h2>Calorie Balance</h2>
        <div className="balance-card">
          <div className="balance-item">
            <div className="balance-label">Daily Intake</div>
            <div className="balance-value positive">+{estimatedDailyCalories}</div>
          </div>
          <div className="balance-divider">−</div>
          <div className="balance-item">
            <div className="balance-label">Daily Burn</div>
            <div className="balance-value negative">−{Math.round(fitnessData.totalCaloriesBurned / 7)}</div>
          </div>
          <div className="balance-divider">=</div>
          <div className="balance-item">
            <div className="balance-label">Net Calories</div>
            <div className={`balance-value ${calorieBalance > 0 ? 'positive' : 'neutral'}`}>
              {Math.round(calorieBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* Health Goals */}
      <div className="goals-section">
        <h2>Health Goals</h2>
        <div className="goals-grid">
          <div className="goal-card">
            <div className="goal-icon">🎯</div>
            <div className="goal-content">
              <h3>Consistency</h3>
              <p>{fitnessData.weeklyWorkouts} workouts this week</p>
              <div className="goal-progress">
                <div
                  className="progress-bar"
                  style={{ width: `${Math.min((fitnessData.weeklyWorkouts / 5) * 100, 100)}%` }}
                ></div>
              </div>
              <small>Target: 5 workouts/week</small>
            </div>
          </div>

          <div className="goal-card">
            <div className="goal-icon">⏱️</div>
            <div className="goal-content">
              <h3>Active Time</h3>
              <p>{fitnessData.activeMinutes} minutes this week</p>
              <div className="goal-progress">
                <div
                  className="progress-bar"
                  style={{ width: `${Math.min((fitnessData.activeMinutes / 150) * 100, 100)}%` }}
                ></div>
              </div>
              <small>Target: 150 min/week</small>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations-section">
        <h2>Personalized Recommendations</h2>
        <div className="recommendations-list">
          {fitnessData.weeklyWorkouts < 3 && (
            <div className="recommendation-item">
              <span className="rec-icon">💡</span>
              <div className="rec-content">
                <h4>Increase Workout Frequency</h4>
                <p>Try to add 2 more workouts this week to reach your consistency goal.</p>
              </div>
            </div>
          )}

          {calorieBalance > 500 && (
            <div className="recommendation-item">
              <span className="rec-icon">🔥</span>
              <div className="rec-content">
                <h4>Consider More Activity</h4>
                <p>Your calorie surplus suggests you could benefit from additional cardio exercises.</p>
              </div>
            </div>
          )}

          {!mealPlan && (
            <div className="recommendation-item">
              <span className="rec-icon">🍽️</span>
              <div className="rec-content">
                <h4>Create a Meal Plan</h4>
                <p>A structured meal plan will help you better track your nutrition goals.</p>
              </div>
            </div>
          )}

          {fitnessData.weeklyWorkouts >= 3 && mealPlan && (
            <div className="recommendation-item success">
              <span className="rec-icon">✨</span>
              <div className="rec-content">
                <h4>Great Work!</h4>
                <p>You're maintaining a balanced approach to nutrition and fitness. Keep it up!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CombinedInsights;
