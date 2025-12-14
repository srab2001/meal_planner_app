import React, { useState, useEffect, useRef } from 'react';
import './MealPlanView.css';
import ShoppingList from './ShoppingList';
import ProductRecommendations from './ProductRecommendations';

const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

// Helper function to shorten day names for mobile
const shortenDayName = (day) => {
  const dayMap = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun'
  };
  return dayMap[day] || day;
};

function MealPlanView({ mealPlan, preferences, user, selectedStores, onStartOver, onLogout, onViewProfile}) {
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
  const [historicalStores, setHistoricalStores] = useState(null);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  // Recipe customization state
  const [customServings, setCustomServings] = useState(null);
  const [recipeNotes, setRecipeNotes] = useState('');
  const [savingCustomization, setSavingCustomization] = useState(false);

  // Ingredient operations form state
  const [formData, setFormData] = useState({
    ingredientToRemove: '',
    ingredientToAdd: '',
    reasonToAdd: '',
    oldIngredient: '',
    newIngredient: '',
    reasonToSubstitute: '',
  });
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationMessage, setOperationMessage] = useState(null);

  // Mobile UI state
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Touch gesture refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const pullStartY = useRef(0);
  const mealsContentRef = useRef(null);

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

  // Use historical stores if viewing history, otherwise use current stores
  const currentStores = isViewingHistory ? historicalStores : selectedStores;

  const days = Object.keys(localMealPlan.mealPlan || {});
  console.log('📅 Days available in meal plan:', days);
  console.log('📦 Full meal plan structure:', localMealPlan.mealPlan);

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

  const handleSaveRecipe = (meal, day, mealType) => {
    let content = `${meal.name}\n`;
    content += `${'='.repeat(meal.name.length)}\n\n`;

    if (day && mealType) {
      content += `Day: ${day}\n`;
      content += `Meal Type: ${mealType}\n`;
    }

    if (meal.servings) {
      content += `Servings: ${meal.servings}\n`;
    }

    if (meal.prepTime) {
      content += `Prep Time: ${meal.prepTime}\n`;
    }

    if (meal.cookTime) {
      content += `Cook Time: ${meal.cookTime}\n`;
    }

    if (meal.estimatedCost) {
      content += `Estimated Cost: ${meal.estimatedCost}\n`;
    }

    content += `\n${'='.repeat(50)}\n\n`;

    // Ingredients
    content += `INGREDIENTS\n${'-'.repeat(11)}\n`;
    if (meal.ingredients && meal.ingredients.length > 0) {
      meal.ingredients.forEach(ingredient => {
        content += `• ${ingredient}\n`;
      });
    }

    content += `\n`;

    // Instructions
    content += `INSTRUCTIONS\n${'-'.repeat(12)}\n`;
    if (meal.instructions && meal.instructions.length > 0) {
      meal.instructions.forEach((instruction, index) => {
        content += `${index + 1}. ${instruction}\n`;
      });
    }

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = meal.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    link.download = `recipe-${fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  // Ingredient operation handlers
  const handleRemoveIngredient = async (day, mealType) => {
    if (!formData.ingredientToRemove.trim()) {
      setOperationMessage('❌ Please enter an ingredient name');
      return;
    }
    
    setOperationLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const mealId = selectedMeal?.id || `${day}-${mealType}`;
      
      const response = await fetch(`${API_BASE}/api/meal/${mealId}/remove-ingredient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          ingredientToRemove: formData.ingredientToRemove
        }),
      });

      if (response.ok) {
        // Update the selected meal to remove the ingredient
        const updatedIngredients = selectedMeal.ingredients.filter(ing => 
          !ing.toLowerCase().includes(formData.ingredientToRemove.toLowerCase())
        );
        const updatedMeal = { ...selectedMeal, ingredients: updatedIngredients };
        setSelectedMeal(updatedMeal);
        
        // Update the local meal plan
        setLocalMealPlan(prev => {
          const mealType = Object.keys(prev.mealPlan[selectedDay]).find(type => 
            prev.mealPlan[selectedDay][type].name === selectedMeal.name
          );
          if (mealType) {
            return {
              ...prev,
              mealPlan: {
                ...prev.mealPlan,
                [selectedDay]: {
                  ...prev.mealPlan[selectedDay],
                  [mealType]: updatedMeal
                }
              }
            };
          }
          return prev;
        });
        
        setOperationMessage(`✅ Removed ${formData.ingredientToRemove}`);
        setFormData(prev => ({ ...prev, ingredientToRemove: '' }));
        setTimeout(() => setOperationMessage(null), 2000);
      } else {
        setOperationMessage('❌ Failed to remove ingredient');
      }
    } catch (error) {
      setOperationMessage('❌ Error: ' + error.message);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleAddIngredient = async (day, mealType) => {
    if (!formData.ingredientToAdd.trim()) {
      setOperationMessage('❌ Please enter an ingredient name');
      return;
    }
    
    setOperationLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const mealId = selectedMeal?.id || `${day}-${mealType}`;
      
      const response = await fetch(`${API_BASE}/api/meal/${mealId}/add-ingredient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          ingredientToAdd: formData.ingredientToAdd,
          reason: formData.reasonToAdd
        }),
      });

      if (response.ok) {
        // Update the selected meal to add the ingredient
        const updatedIngredients = [...selectedMeal.ingredients, formData.ingredientToAdd];
        const updatedMeal = { ...selectedMeal, ingredients: updatedIngredients };
        setSelectedMeal(updatedMeal);
        
        // Update the local meal plan
        setLocalMealPlan(prev => {
          const mealType = Object.keys(prev.mealPlan[selectedDay]).find(type => 
            prev.mealPlan[selectedDay][type].name === selectedMeal.name
          );
          if (mealType) {
            return {
              ...prev,
              mealPlan: {
                ...prev.mealPlan,
                [selectedDay]: {
                  ...prev.mealPlan[selectedDay],
                  [mealType]: updatedMeal
                }
              }
            };
          }
          return prev;
        });
        
        setOperationMessage(`✅ Added ${formData.ingredientToAdd}`);
        setFormData(prev => ({ ...prev, ingredientToAdd: '', reasonToAdd: '' }));
        setTimeout(() => setOperationMessage(null), 2000);
      } else {
        setOperationMessage('❌ Failed to add ingredient');
      }
    } catch (error) {
      setOperationMessage('❌ Error: ' + error.message);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleSubstituteIngredient = async (day, mealType) => {
    if (!formData.oldIngredient.trim() || !formData.newIngredient.trim()) {
      setOperationMessage('❌ Please enter both ingredients');
      return;
    }
    
    setOperationLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const mealId = selectedMeal?.id || `${day}-${mealType}`;
      
      const response = await fetch(`${API_BASE}/api/meal/${mealId}/substitute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          oldIngredient: formData.oldIngredient,
          newIngredient: formData.newIngredient,
          reason: formData.reasonToSubstitute
        }),
      });

      if (response.ok) {
        // Update the selected meal to substitute the ingredient
        const updatedIngredients = selectedMeal.ingredients.map(ing =>
          ing.toLowerCase().includes(formData.oldIngredient.toLowerCase())
            ? ing.replace(new RegExp(formData.oldIngredient, 'i'), formData.newIngredient)
            : ing
        );
        const updatedMeal = { ...selectedMeal, ingredients: updatedIngredients };
        setSelectedMeal(updatedMeal);
        
        // Update the local meal plan
        setLocalMealPlan(prev => {
          const mealType = Object.keys(prev.mealPlan[selectedDay]).find(type => 
            prev.mealPlan[selectedDay][type].name === selectedMeal.name
          );
          if (mealType) {
            return {
              ...prev,
              mealPlan: {
                ...prev.mealPlan,
                [selectedDay]: {
                  ...prev.mealPlan[selectedDay],
                  [mealType]: updatedMeal
                }
              }
            };
          }
          return prev;
        });
        
        setOperationMessage(`✅ Substituted ${formData.oldIngredient} → ${formData.newIngredient}`);
        setFormData(prev => ({ ...prev, oldIngredient: '', newIngredient: '', reasonToSubstitute: '' }));
        setTimeout(() => setOperationMessage(null), 2000);
      } else {
        setOperationMessage('❌ Failed to substitute ingredient');
      }
    } catch (error) {
      setOperationMessage('❌ Error: ' + error.message);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleBlockMeal = async (day, mealType) => {
    setOperationLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const mealId = selectedMeal?.id || `${day}-${mealType}`;
      
      const response = await fetch(`${API_BASE}/api/meal/${mealId}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
      });

      if (response.ok) {
        setOperationMessage(`🚫 Blocked "${selectedMeal.name}" - won't appear in future plans`);
        setTimeout(() => {
          closeModal();
          setOperationMessage(null);
        }, 2000);
      } else {
        setOperationMessage('❌ Failed to block meal');
      }
    } catch (error) {
      setOperationMessage('❌ Error: ' + error.message);
    } finally {
      setOperationLoading(false);
    }
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

  const handleLoadHistoricalPlan = (entry) => {
    // Load the historical meal plan, shopping list, and stores
    setLocalMealPlan(entry.meal_plan);
    setHistoricalStores(entry.selectedStores || null);
    setIsViewingHistory(true);
    setShowHistory(false);
    setActiveTab('meals');
    console.log('📖 Loaded historical meal plan from', new Date(entry.createdAt).toLocaleDateString());
    console.log('📦 Historical data includes:', {
      mealPlan: !!entry.meal_plan,
      shoppingList: !!entry.meal_plan?.shoppingList,
      stores: !!entry.selectedStores
    });
  };

  const isFavorited = (mealName) => {
    return favorites.some(fav => fav.meal.name === mealName);
  };

  // Touch gesture handlers for swipeable day selector
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    const currentDayIndex = days.indexOf(selectedDay);

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && currentDayIndex < days.length - 1) {
        // Swipe left -> next day
        setSelectedDay(days[currentDayIndex + 1]);
      } else if (swipeDistance < 0 && currentDayIndex > 0) {
        // Swipe right -> previous day
        setSelectedDay(days[currentDayIndex - 1]);
      }
    }
  };

  // Pull-to-refresh handler
  const handlePullStart = (e) => {
    if (window.scrollY === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  };

  const handlePullMove = (e) => {
    const pullDistance = e.touches[0].clientY - pullStartY.current;
    if (pullDistance > 100 && window.scrollY === 0 && !refreshing) {
      setRefreshing(true);
      // Reload the current view
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  // Handle FAB menu toggle
  const toggleFabMenu = () => {
    setShowFabMenu(!showFabMenu);
  };

  // Handle more menu toggle
  const toggleMoreMenu = () => {
    setShowMoreMenu(!showMoreMenu);
  };

  return (
    <div className="meal-plan-container">
      {/* Header */}
      <div className="meal-plan-header">
        <div className="header-content">
          <h1>Your 7-Day Meal Plan</h1>
          {user && <p className="welcome-text">Welcome, {user.displayName}!</p>}
          {isViewingHistory && (
            <p className="history-badge">📖 Viewing Historical Meal Plan</p>
          )}
          {currentStores?.primaryStore && (
            <p className="store-info">
              Shopping at: <strong>{currentStores.primaryStore.name}</strong>
              {currentStores.comparisonStore && (
                <> vs <strong>{currentStores.comparisonStore.name}</strong></>
              )}
            </p>
          )}
        </div>
        <div className="header-actions">
          {isViewingHistory && (
            <button onClick={() => {
              setLocalMealPlan(mealPlan);
              setHistoricalStores(null);
              setIsViewingHistory(false);
            }} className="btn-back-to-current">
              ⬅️ Back to Current Plan
            </button>
          )}
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
          <div
            className="meals-view"
            ref={mealsContentRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Day Selector */}
            <div className="day-selector">
              {days.map((day) => (
                <button
                  key={day}
                  className={`day-button ${selectedDay === day ? 'active' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  {shortenDayName(day)}
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
                    {(meal.imageUrl || meal.image_url || meal.image) && (
                      <div className="meal-card-image">
                        <img
                          src={meal.imageUrl || meal.image_url || meal.image}
                          alt={meal.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="meal-card-content">
                      <div className="meal-type">{mealType}</div>
                      <h3 className="meal-name">
                        {meal.name}
                        {meal.isSpecialOccasion && (
                          <span className="special-occasion-badge">✨ Special Occasion</span>
                        )}
                      </h3>
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
                        className="save-recipe-btn"
                        onClick={() => handleSaveRecipe(meal, selectedDay, mealType)}
                        title="Download recipe as text file"
                      >
                        💾 Save
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
            selectedStores={currentStores}
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

            {/* Ingredient Operations Section - Customize your meal */}
            <div className="recipe-section ingredient-operations">
              <h3>⚙️ Customize Your Meal Ingredients</h3>
              
              {operationMessage && (
                <div className={`operation-message ${operationMessage.includes('✅') ? 'success' : 'error'}`}>
                  {operationMessage}
                </div>
              )}
              
              {/* Remove Ingredient */}
              <div className="operation-group">
                <h4>❌ Remove Ingredient</h4>
                <div className="operation-inputs">
                  <input
                    type="text"
                    placeholder="Enter ingredient name (e.g., 'tomato')"
                    value={formData.ingredientToRemove || ''}
                    onChange={(e) => setFormData({...formData, ingredientToRemove: e.target.value})}
                    className="operation-input"
                  />
                  <button 
                    onClick={() => handleRemoveIngredient(selectedDay, Object.keys(localMealPlan.mealPlan[selectedDay])[0])}
                    className="operation-btn remove-btn"
                    disabled={!formData.ingredientToRemove?.trim()}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Add Ingredient */}
              <div className="operation-group">
                <h4>➕ Add Ingredient</h4>
                <div className="operation-inputs">
                  <input
                    type="text"
                    placeholder="New ingredient (e.g., 'fresh basil')"
                    value={formData.ingredientToAdd || ''}
                    onChange={(e) => setFormData({...formData, ingredientToAdd: e.target.value})}
                    className="operation-input"
                  />
                  <input
                    type="text"
                    placeholder="Why? (e.g., 'better flavor')"
                    value={formData.reasonToAdd || ''}
                    onChange={(e) => setFormData({...formData, reasonToAdd: e.target.value})}
                    className="operation-input"
                  />
                  <button 
                    onClick={() => handleAddIngredient(selectedDay, Object.keys(localMealPlan.mealPlan[selectedDay])[0])}
                    className="operation-btn add-btn"
                    disabled={!formData.ingredientToAdd?.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Substitute Ingredient */}
              <div className="operation-group">
                <h4>🔄 Substitute Ingredient</h4>
                <div className="operation-inputs">
                  <input
                    type="text"
                    placeholder="Current ingredient"
                    value={formData.oldIngredient || ''}
                    onChange={(e) => setFormData({...formData, oldIngredient: e.target.value})}
                    className="operation-input"
                  />
                  <input
                    type="text"
                    placeholder="New ingredient"
                    value={formData.newIngredient || ''}
                    onChange={(e) => setFormData({...formData, newIngredient: e.target.value})}
                    className="operation-input"
                  />
                  <input
                    type="text"
                    placeholder="Why? (e.g., 'vegan alternative')"
                    value={formData.reasonToSubstitute || ''}
                    onChange={(e) => setFormData({...formData, reasonToSubstitute: e.target.value})}
                    className="operation-input"
                  />
                  <button 
                    onClick={() => handleSubstituteIngredient(selectedDay, Object.keys(localMealPlan.mealPlan[selectedDay])[0])}
                    className="operation-btn substitute-btn"
                    disabled={!formData.oldIngredient?.trim() || !formData.newIngredient?.trim()}
                  >
                    Substitute
                  </button>
                </div>
              </div>

              {/* Block Meal */}
              <div className="operation-group">
                <h4>🚫 Block This Meal</h4>
                <p className="operation-note">This meal won't appear in future meal plans</p>
                <button 
                  onClick={() => handleBlockMeal(selectedDay, Object.keys(localMealPlan.mealPlan[selectedDay])[0])}
                  className="operation-btn block-btn"
                >
                  Block Meal
                </button>
              </div>
            </div>

            {/* Special Occasion Product Recommendations */}
            {selectedMeal.isSpecialOccasion && selectedMeal.productRecommendations && (
              <ProductRecommendations
                products={selectedMeal.productRecommendations}
                mealName={selectedMeal.name}
              />
            )}

            {/* Wine Pairing for Special Occasions */}
            {selectedMeal.isSpecialOccasion && selectedMeal.winePairing && (
              <div className="wine-pairing-section">
                <h4>🍷 Recommended Pairing</h4>
                <p className="wine-pairing">{selectedMeal.winePairing}</p>
              </div>
            )}

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
          {currentStores?.primaryStore && (
            <p>
              Shopping at: {currentStores.primaryStore.name}
              {currentStores.comparisonStore && ` vs ${currentStores.comparisonStore.name}`}
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
                  <div className="print-meal-header">
                    <div className="print-meal-title-section">
                      <h3>{mealType.toUpperCase()}: {meal.name}</h3>

                      <div className="print-meal-meta">
                        {meal.prepTime && <span>⏱️ Prep: {meal.prepTime}</span>}
                        {meal.cookTime && <span>🔥 Cook: {meal.cookTime}</span>}
                        {meal.servings && <span>👥 Serves: {meal.servings}</span>}
                        {meal.estimatedCost && <span>💰 Cost: {meal.estimatedCost}</span>}
                      </div>
                    </div>

                    {(meal.imageUrl || meal.image_url || meal.image) && (
                      <div className="print-meal-image">
                        <img
                          src={meal.imageUrl || meal.image_url || meal.image}
                          alt={meal.name}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="print-meal-content">
                    <div className="print-ingredients">
                      <h4>📝 Ingredients:</h4>
                      <ul>
                        {meal.ingredients?.map((ingredient, index) => (
                          <li key={index}>{ingredient}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="print-instructions">
                      <h4>👨‍🍳 Instructions:</h4>
                      <ol>
                        {meal.instructions?.map((instruction, index) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ol>
                    </div>
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
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
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
                      {entry.total_cost && (
                        <span>💰 {entry.total_cost}</span>
                      )}
                    </div>
                    <button
                      className="btn-load-history"
                      onClick={() => handleLoadHistoricalPlan(entry)}
                    >
                      📖 View Meal Plan
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <button
          className={`mobile-nav-item ${activeTab === 'meals' ? 'active' : ''}`}
          onClick={() => setActiveTab('meals')}
        >
          <span className="mobile-nav-icon">🍽️</span>
          <span>Meals</span>
        </button>
        <button
          className={`mobile-nav-item ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          <span className="mobile-nav-icon">⭐</span>
          <span>Favorites</span>
        </button>
        <button
          className={`mobile-nav-item ${activeTab === 'shopping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopping')}
        >
          <span className="mobile-nav-icon">🛒</span>
          <span>Shopping</span>
        </button>
        <button
          className="mobile-nav-item"
          onClick={onViewProfile}
        >
          <span className="mobile-nav-icon">👤</span>
          <span>Profile</span>
        </button>
        <button
          className={`mobile-nav-item ${showMoreMenu ? 'active' : ''}`}
          onClick={toggleMoreMenu}
        >
          <span className="mobile-nav-icon">⋯</span>
          <span>More</span>
        </button>
      </div>

      {/* Mobile More Menu Modal */}
      {showMoreMenu && (
        <div className="modal-overlay" onClick={toggleMoreMenu}>
          <div className="mobile-more-menu" onClick={(e) => e.stopPropagation()}>
            <h3>More Options</h3>
            <button onClick={() => { handleFeedback(); toggleMoreMenu(); }} className="more-menu-item">
              💬 Send Feedback
            </button>
            <button onClick={() => { handleViewHistory(); toggleMoreMenu(); }} className="more-menu-item">
              📜 History
            </button>
            <button onClick={() => { handlePrintAllRecipes(); toggleMoreMenu(); }} className="more-menu-item">
              🖨️ Print All Recipes
            </button>
            <button onClick={() => { onStartOver(); toggleMoreMenu(); }} className="more-menu-item">
              🔄 Start Over
            </button>
            <button onClick={() => { onLogout(); toggleMoreMenu(); }} className="more-menu-item">
              🚪 Logout
            </button>
            <button onClick={toggleMoreMenu} className="more-menu-item cancel">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button className="fab-button" onClick={toggleFabMenu}>
        {showFabMenu ? '✕' : '+'}
      </button>

      {/* FAB Menu */}
      {showFabMenu && (
        <div className="fab-menu">
          <button onClick={() => { handlePrintAllRecipes(); toggleFabMenu(); }} className="fab-menu-item">
            🖨️ Print Recipes
          </button>
          <button onClick={() => { handleViewHistory(); toggleFabMenu(); }} className="fab-menu-item">
            📜 View History
          </button>
          <button onClick={() => { handleFeedback(); toggleFabMenu(); }} className="fab-menu-item">
            💬 Feedback
          </button>
        </div>
      )}

      {/* Pull to Refresh Indicator */}
      {refreshing && (
        <div className="refresh-indicator">
          <div className="spinner"></div>
          <p>Refreshing...</p>
        </div>
      )}
    </div>
  );
}

export default MealPlanView;