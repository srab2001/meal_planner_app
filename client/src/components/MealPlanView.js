import React, { useState, useEffect } from 'react';
import './MealPlanView.css';
import ShoppingList from './ShoppingList';

const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

function MealPlanView({ mealPlan, preferences, user, selectedStores, onStartOver, onLogout, onViewProfile }) {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [activeTab, setActiveTab] = useState('meals');
  const [regeneratingMeal, setRegeneratingMeal] = useState(null);
  const [localMealPlan, setLocalMealPlan] = useState(mealPlan);
  const [favorites, setFavorites] = useState([]);
  const [favoritingMeal, setFavoritingMeal] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Recipe customization state
  const [customServings, setCustomServings] = useState(null);
  const [recipeNotes, setRecipeNotes] = useState('');
  const [savingCustomization, setSavingCustomization] = useState(false);

  // Load favorites and save meal plan to history on mount
  // This useEffect must come before any early returns to follow React hooks rules
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        // Get JWT token from localStorage
        const token = localStorage.getItem('auth_token');

        const response = await fetch(`${API_BASE}/api/favorites`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.favorites || []);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };

    const saveMealPlanToHistory = async () => {
      try {
        // Get JWT token from localStorage
        const token = localStorage.getItem('auth_token');

        await fetch(`${API_BASE}/api/save-meal-plan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            mealPlan: localMealPlan,
            preferences,
            selectedStores
          }),
        });
        console.log('📝 Meal plan saved to history');
      } catch (error) {
        console.error('Error saving meal plan to history:', error);
      }
    };

    loadFavorites();
    saveMealPlanToHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Early return check must come after all hooks
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

  // Get all meal types from preferences for favorites dropdown
  const allMealTypes = preferences?.selectedMeals || ['breakfast', 'lunch', 'dinner'];

  const handleMealClick = (meal) => {
    setSelectedMeal(meal);
    setCustomServings(meal.servings || 2);
    setRecipeNotes('');
  };

  const closeModal = () => {
    setSelectedMeal(null);
    setCustomServings(null);
    setRecipeNotes('');
  };

  const adjustServings = (change) => {
    setCustomServings(prev => Math.max(1, (prev || 2) + change));
  };

  const calculateScaledIngredient = (ingredient, originalServings, newServings) => {
    if (!originalServings || !newServings || originalServings === newServings) {
      return ingredient;
    }

    const scale = newServings / originalServings;
    // Try to find and scale numbers in the ingredient string
    return ingredient.replace(/(\d+(?:\.\d+)?)\s*(\/?)\s*(\d+(?:\.\d+)?)?/g, (match, num1, slash, num2) => {
      if (slash && num2) {
        // Handle fractions like "1/2"
        const scaled = (parseFloat(num1) / parseFloat(num2)) * scale;
        if (scaled >= 1) {
          return Math.round(scaled * 4) / 4; // Round to nearest quarter
        }
        return scaled.toFixed(2);
      } else {
        // Handle regular numbers
        const scaled = parseFloat(num1) * scale;
        return Math.round(scaled * 4) / 4; // Round to nearest quarter
      }
    });
  };

  const handleSaveCustomizedFavorite = async () => {
    if (!selectedMeal) return;

    setSavingCustomization(true);
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE}/api/favorites/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          meal: selectedMeal,
          mealType: 'dinner', // Default type
          servings_adjustment: customServings,
          user_notes: recipeNotes
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(prev => [...prev, data.favorite]);
        alert('✅ Customized recipe saved to favorites!');
        closeModal();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving customized favorite:', error);
      alert('Failed to save customized recipe');
    } finally {
      setSavingCustomization(false);
    }
  };

  const handleRegenerateMeal = async (day, mealType) => {
    const mealKey = `${day}-${mealType}`;
    setRegeneratingMeal(mealKey);

    try {
      console.log('🔄 Regenerating meal:', day, mealType);

      // Get JWT token from localStorage
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE}/api/regenerate-meal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          cuisines: preferences?.cuisines || [],
          people: preferences?.people || 2,
          mealType,
          groceryStore: selectedStores?.primaryStore,
          currentMeal: localMealPlan.mealPlan[day][mealType].name,
          dietaryPreferences: preferences?.dietaryPreferences || []
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
    const feedbackURL = 'https://docs.google.com/forms/d/e/1FAIpQLSfNbdZD1GdQYzQvrvZkWDjlLw97fd15NX-X3Z53me5IbK_rhA/viewform?usp=header';
    window.open(feedbackURL, '_blank');
  };

  const handleAddFavorite = async (meal, mealType, day) => {
    const key = `${day}-${mealType}`;
    setFavoritingMeal(key);

    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE}/api/favorites/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ meal, mealType }),
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(prev => [...prev, data.favorite]);
        console.log('❤️ Added to favorites:', meal.name);
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
      alert('Failed to add to favorites');
    } finally {
      setFavoritingMeal(null);
    }
  };

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE}/api/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
      });

      if (response.ok) {
        setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
        console.log('🗑️ Removed from favorites');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove from favorites');
    }
  };

  const handleUseFavorite = async (favorite, day, mealType) => {
    // Replace current meal with favorite
    setLocalMealPlan(prevPlan => ({
      ...prevPlan,
      mealPlan: {
        ...prevPlan.mealPlan,
        [day]: {
          ...prevPlan.mealPlan[day],
          [mealType]: favorite.meal
        }
      }
    }));
    console.log(`✨ Applied favorite "${favorite.meal.name}" to ${day} ${mealType}`);
  };

  const handleViewHistory = async (days = null) => {
    setLoadingHistory(true);
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('auth_token');

      const url = days
        ? `${API_BASE}/api/meal-plan-history?days=${days}`
        : `${API_BASE}/api/meal-plan-history`;

      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
        setShowHistory(true);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      alert('Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const isFavorited = (mealName) => {
    return favorites.some(fav => fav.meal.name === mealName);
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
          <button onClick={() => handleViewHistory()} className="btn-history">
            📜 History
          </button>
          {onViewProfile && (
            <button onClick={onViewProfile} className="btn-profile">
              👤 Profile
            </button>
          )}
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
          className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          ❤️ Favorites ({favorites.length})
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
                const isFavoriting = favoritingMeal === mealKey;
                const alreadyFavorited = isFavorited(meal.name);

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
                        className={`favorite-btn ${alreadyFavorited ? 'favorited' : ''}`}
                        onClick={() => handleAddFavorite(meal, mealType, selectedDay)}
                        disabled={isFavoriting || alreadyFavorited}
                        title={alreadyFavorited ? 'Already in favorites' : 'Add to favorites'}
                      >
                        {isFavoriting ? '...' : alreadyFavorited ? '❤️' : '🤍'}
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

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="favorites-view">
            <h2>❤️ Your Favorite Meals</h2>
            {favorites.length === 0 ? (
              <div className="empty-favorites">
                <p>No favorites yet! Click the 🤍 button on any meal to save it here.</p>
              </div>
            ) : (
              <div className="favorites-grid">
                {favorites.map((favorite) => (
                  <div key={favorite.id} className="favorite-card">
                    <div className="favorite-header">
                      <span className="favorite-type">{favorite.mealType}</span>
                      <button
                        className="remove-favorite-btn"
                        onClick={() => handleRemoveFavorite(favorite.id)}
                        title="Remove from favorites"
                      >
                        ×
                      </button>
                    </div>
                    <h3 className="favorite-name">{favorite.meal.name}</h3>
                    {favorite.meal.prepTime && (
                      <p className="favorite-time">⏱️ Prep: {favorite.meal.prepTime}</p>
                    )}
                    {favorite.meal.cookTime && (
                      <p className="favorite-time">🔥 Cook: {favorite.meal.cookTime}</p>
                    )}
                    {favorite.meal.servings && (
                      <p className="favorite-servings">👥 Serves {favorite.meal.servings}</p>
                    )}
                    <p className="favorite-saved">Saved: {new Date(favorite.savedAt).toLocaleDateString()}</p>

                    <div className="favorite-actions">
                      <button
                        className="view-recipe-btn"
                        onClick={() => handleMealClick(favorite.meal)}
                      >
                        👁️ View Recipe
                      </button>
                      <select
                        className="use-favorite-select"
                        onChange={(e) => {
                          if (e.target.value) {
                            const [day, mealType] = e.target.value.split('|');
                            handleUseFavorite(favorite, day, mealType);
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Add to plan...</option>
                        {days.map((day) =>
                          allMealTypes.map((mealType) => (
                            <option key={`${day}-${mealType}`} value={`${day}|${mealType}`}>
                              {day} - {mealType}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                ))}
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
              {selectedMeal.estimatedCost && (
                <span>💰 Cost: {selectedMeal.estimatedCost}</span>
              )}
            </div>

            {/* Servings Adjuster */}
            <div className="servings-adjuster">
              <label>👥 Servings:</label>
              <div className="servings-controls">
                <button onClick={() => adjustServings(-1)} className="adjust-btn">−</button>
                <span className="servings-display">{customServings || selectedMeal.servings || 2}</span>
                <button onClick={() => adjustServings(1)} className="adjust-btn">+</button>
              </div>
              {customServings !== selectedMeal.servings && (
                <span className="scaling-note">
                  (scaled from {selectedMeal.servings} servings)
                </span>
              )}
            </div>

            <div className="recipe-section">
              <h3>Ingredients</h3>
              <ul className="ingredients-list">
                {selectedMeal.ingredients?.map((ingredient, index) => (
                  <li key={index}>
                    {calculateScaledIngredient(ingredient, selectedMeal.servings, customServings)}
                  </li>
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

            {/* Personal Notes */}
            <div className="recipe-section">
              <h3>📝 Personal Notes</h3>
              <textarea
                className="recipe-notes"
                placeholder="Add your own notes, ingredient swaps, or cooking tips..."
                value={recipeNotes}
                onChange={(e) => setRecipeNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button className="print-recipe-btn" onClick={() => window.print()}>
                🖨️ Print Recipe
              </button>
              <button
                className="save-custom-btn"
                onClick={handleSaveCustomizedFavorite}
                disabled={savingCustomization}
              >
                {savingCustomization ? '⏳ Saving...' : '❤️ Save to Favorites'}
              </button>
            </div>
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

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowHistory(false)}>✕</button>

            <h2>📜 Meal Plan History</h2>

            <div className="history-filters">
              <button onClick={() => handleViewHistory(30)} className="filter-btn">
                Last 30 Days
              </button>
              <button onClick={() => handleViewHistory(60)} className="filter-btn">
                Last 60 Days
              </button>
              <button onClick={() => handleViewHistory(90)} className="filter-btn">
                Last 90 Days
              </button>
              <button onClick={() => handleViewHistory(null)} className="filter-btn">
                All Time
              </button>
            </div>

            <div className="history-list">
              {loadingHistory ? (
                <p>Loading history...</p>
              ) : history.length === 0 ? (
                <p className="empty-history">No meal plan history found.</p>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="history-entry">
                    <div className="history-header">
                      <span className="history-date">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="history-details">
                        {entry.preferences?.cuisines?.slice(0, 2).join(', ') || 'Various'}
                        {entry.preferences?.cuisines?.length > 2 && '...'}
                      </span>
                    </div>
                    <div className="history-info">
                      <span>👥 {entry.preferences?.people} people</span>
                      <span>🍽️ {entry.preferences?.selectedMeals?.join(', ')}</span>
                      {entry.selectedStores?.primaryStore && (
                        <span>🛒 {entry.selectedStores.primaryStore.name}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MealPlanView;