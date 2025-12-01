import React, { useState } from 'react';
import './MealPlanView.css';
import ShoppingList from './ShoppingList';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function MealPlanView({ mealPlan, preferences, user, selectedStores, onStartOver, onLogout }) {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [activeTab, setActiveTab] = useState('meals');
  const [regeneratingMeal, setRegeneratingMeal] = useState(null);
  const [localMealPlan, setLocalMealPlan] = useState(mealPlan);

  if (!localMealPlan) {
    return (
      <div className="meal-plan-container">
        <div className="loading">Loading meal plan...</div>
      </div>
    );
  }

  const days = Object.keys(localMealPlan.mealPlan || {});
  const currentDayMeals = localMealPlan.mealPlan[selectedDay] || {};
  const mealTypes = Object.keys(currentDayMeals);

  const handleMealClick = (meal) => {
    setSelectedMeal(meal);
  };

  const closeModal = () => {
    setSelectedMeal(null);
  };

  const handleRegenerateMeal = async (day, mealType) => {
    const mealKey = `${day}-${mealType}`;
    setRegeneratingMeal(mealKey);

    try {
      console.log('🔄 Regenerating meal:', day, mealType);

      const response = await fetch(`${API_BASE}/api/regenerate-meal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          cuisines: preferences?.cuisines || [],
          people: preferences?.people || 2,
          mealType,
          groceryStore: selectedStores?.primaryStore,
          currentMeal: localMealPlan.mealPlan[day][mealType].name
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate meal');
      }

      const data = await response.json();
      console.log('✅ New meal generated:', data.meal.name);

      // Update the local meal plan with the new meal
      setLocalMealPlan(prevPlan => ({
        ...prevPlan,
        mealPlan: {
          ...prevPlan.mealPlan,
          [day]: {
            ...prevPlan.mealPlan[day],
            [mealType]: data.meal
          }
        }
      }));

    } catch (error) {
      console.error('❌ Error regenerating meal:', error);
      alert('Failed to regenerate meal. Please try again.');
    } finally {
      setRegeneratingMeal(null);
    }
  };

  const handlePrintAllRecipes = () => {
    window.print();
  };

  const handleFeedback = () => {
    // TODO: Replace this URL with your Google Form URL
    const feedbackURL = 'https://forms.gle/YOUR-FORM-ID-HERE';
    window.open(feedbackURL, '_blank');
  };

  return (
    <div className="meal-plan-container">
      {/* Header */}
      <div className="meal-plan-header">
        <div className="header-content">
          <h1>Your 7-Day Meal Plan</h1>
          {user && <p className="welcome-text">Welcome, {user.displayName}!</p>}
          {selectedStores?.primaryStore && (
            <p className="store-info">
              Shopping at: <strong>{selectedStores.primaryStore.name}</strong>
              {selectedStores.comparisonStore && (
                <> vs <strong>{selectedStores.comparisonStore.name}</strong></>
              )}
            </p>
          )}
        </div>
        <div className="header-actions">
          <button onClick={handleFeedback} className="btn-feedback">
            💬 Send Feedback
          </button>
          <button onClick={handlePrintAllRecipes} className="btn-print">
            🖨️ Print All Recipes
          </button>
          <button onClick={onStartOver} className="btn-secondary">
            🔄 Start Over
          </button>
          <button onClick={onLogout} className="btn-logout">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="meal-plan-tabs">
        <button 
          className={`tab-button ${activeTab === 'meals' ? 'active' : ''}`}
          onClick={() => setActiveTab('meals')}
        >
          📅 Meal Plan
        </button>
        <button 
          className={`tab-button ${activeTab === 'shopping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopping')}
        >
          🛒 Shopping List
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Meals Tab */}
        {activeTab === 'meals' && (
          <div className="meals-view">
            {/* Day Selector */}
            <div className="day-selector">
              {days.map((day) => (
                <button
                  key={day}
                  className={`day-button ${selectedDay === day ? 'active' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Meals Grid */}
            <div className="meals-grid">
              {mealTypes.map((mealType) => {
                const meal = currentDayMeals[mealType];
                const mealKey = `${selectedDay}-${mealType}`;
                const isRegenerating = regeneratingMeal === mealKey;
                
                return (
                  <div key={mealType} className="meal-card">
                    <div className="meal-type">{mealType}</div>
                    <h3 className="meal-name">{meal.name}</h3>
                    {meal.prepTime && (
                      <p className="meal-time">⏱️ Prep: {meal.prepTime}</p>
                    )}
                    {meal.cookTime && (
                      <p className="meal-time">🔥 Cook: {meal.cookTime}</p>
                    )}
                    {meal.servings && (
                      <p className="meal-servings">👥 Serves {meal.servings}</p>
                    )}
                    {meal.estimatedCost && (
                      <p className="meal-cost">💰 {meal.estimatedCost}</p>
                    )}
                    
                    <div className="meal-card-actions">
                      <button 
                        className="view-recipe-btn"
                        onClick={() => handleMealClick(meal)}
                      >
                        👁️ View Recipe
                      </button>
                      
                      <button 
                        className="regenerate-meal-btn"
                        onClick={() => handleRegenerateMeal(selectedDay, mealType)}
                        disabled={isRegenerating}
                      >
                        {isRegenerating ? (
                          <>
                            <span className="spinner-tiny"></span>
                            Generating...
                          </>
                        ) : (
                          <>🔄 New Meal</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Preferences Summary */}
            {preferences && (
              <div className="preferences-summary">
                <h3>Your Preferences</h3>
                <div className="preferences-grid">
                  <div className="pref-item">
                    <span className="pref-label">Cuisines:</span>
                    <span className="pref-value">{preferences.cuisines?.join(', ')}</span>
                  </div>
                  <div className="pref-item">
                    <span className="pref-label">People:</span>
                    <span className="pref-value">{preferences.people}</span>
                  </div>
                  <div className="pref-item">
                    <span className="pref-label">Meals per day:</span>
                    <span className="pref-value">{preferences.meals}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shopping List Tab */}
        {activeTab === 'shopping' && (
          <ShoppingList
            shoppingList={localMealPlan.shoppingList}
            totalCost={localMealPlan.totalEstimatedCost}
            priceComparison={localMealPlan.priceComparison}
            selectedStores={selectedStores}
          />
        )}
      </div>

      {/* Recipe Modal */}
      {selectedMeal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>✕</button>
            
            <h2 className="recipe-title">{selectedMeal.name}</h2>
            
            <div className="recipe-meta">
              {selectedMeal.prepTime && (
                <span>⏱️ Prep: {selectedMeal.prepTime}</span>
              )}
              {selectedMeal.cookTime && (
                <span>🔥 Cook: {selectedMeal.cookTime}</span>
              )}
              {selectedMeal.servings && (
                <span>👥 Serves: {selectedMeal.servings}</span>
              )}
              {selectedMeal.estimatedCost && (
                <span>💰 Cost: {selectedMeal.estimatedCost}</span>
              )}
            </div>

            <div className="recipe-section">
              <h3>Ingredients</h3>
              <ul className="ingredients-list">
                {selectedMeal.ingredients?.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </div>

            <div className="recipe-section">
              <h3>Instructions</h3>
              <ol className="instructions-list">
                {selectedMeal.instructions?.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>

            <button className="print-recipe-btn" onClick={() => window.print()}>
              🖨️ Print This Recipe
            </button>
          </div>
        </div>
      )}

      {/* Hidden Print-Only Content */}
      <div className="print-only-content">
        <div className="print-header">
          <h1>7-Day Meal Plan</h1>
          {selectedStores?.primaryStore && (
            <p>
              Shopping at: {selectedStores.primaryStore.name}
              {selectedStores.comparisonStore && ` vs ${selectedStores.comparisonStore.name}`}
            </p>
          )}
          {preferences && (
            <p>For {preferences.people} people | {preferences.cuisines?.join(', ')}</p>
          )}
          <hr />
        </div>

        {days.map((day) => (
          <div key={day} className="print-day-section">
            <h2>{day}</h2>
            {Object.keys(localMealPlan.mealPlan[day] || {}).map((mealType) => {
              const meal = localMealPlan.mealPlan[day][mealType];
              return (
                <div key={mealType} className="print-meal">
                  <h3>{mealType.toUpperCase()}: {meal.name}</h3>
                  
                  <div className="print-meal-meta">
                    {meal.prepTime && <span>Prep: {meal.prepTime}</span>}
                    {meal.cookTime && <span>Cook: {meal.cookTime}</span>}
                    {meal.servings && <span>Serves: {meal.servings}</span>}
                    {meal.estimatedCost && <span>Cost: {meal.estimatedCost}</span>}
                  </div>

                  <div className="print-ingredients">
                    <h4>Ingredients:</h4>
                    <ul>
                      {meal.ingredients?.map((ingredient, index) => (
                        <li key={index}>{ingredient}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="print-instructions">
                    <h4>Instructions:</h4>
                    <ol>
                      {meal.instructions?.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Print Shopping List */}
        {localMealPlan.shoppingList && (
          <div className="print-shopping-list">
            <h2>Shopping List</h2>
            {Object.keys(localMealPlan.shoppingList).map((category) => (
              <div key={category} className="print-category">
                <h3>{category}</h3>
                <ul>
                  {localMealPlan.shoppingList[category].map((item, index) => (
                    <li key={index}>
                      {item.item} - {item.quantity}
                      {item.estimatedPrice && ` (${item.estimatedPrice})`}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {localMealPlan.totalEstimatedCost && (
              <p className="print-total">
                <strong>Total Estimated Cost: {localMealPlan.totalEstimatedCost}</strong>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MealPlanView;