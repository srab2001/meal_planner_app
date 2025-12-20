import React, { useState, useEffect, useRef } from 'react';
import './MealPlanView.css';
import ShoppingList from './ShoppingList';
import ProductRecommendations from './ProductRecommendations';

// Engagement services
import { useEngagement } from '../shared/context/EngagementContext';

// API Configuration - Always use production URLs (Vercel/Render)
const PRODUCTION_API = 'https://meal-planner-app-mve2.onrender.com';
const API_BASE = process.env.REACT_APP_API_URL || PRODUCTION_API;

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

// Helper function to regenerate shopping list from meal plan
const regenerateShoppingList = (mealPlan) => {
  const ingredientMap = new Map();
  
  // Collect all ingredients from all meals
  if (mealPlan && mealPlan.mealPlan) {
    Object.keys(mealPlan.mealPlan).forEach(day => {
      const dayMeals = mealPlan.mealPlan[day];
      Object.keys(dayMeals).forEach(mealType => {
        const meal = dayMeals[mealType];
        if (meal && meal.ingredients && Array.isArray(meal.ingredients)) {
          meal.ingredients.forEach(ingredient => {
            const key = typeof ingredient === 'string' 
              ? ingredient.toLowerCase() 
              : (ingredient.name || '').toLowerCase();
            
            if (key) {
              if (!ingredientMap.has(key)) {
                ingredientMap.set(key, {
                  item: typeof ingredient === 'string' ? ingredient : ingredient.name || '',
                  quantity: typeof ingredient === 'string' ? '1' : ingredient.quantity || '1',
                  unit: typeof ingredient === 'string' ? '' : ingredient.unit || '',
                  category: typeof ingredient === 'string' ? 'Other' : ingredient.category || 'Other'
                });
              }
            }
          });
        }
      });
    });
  }
  
  // Group by category
  const shoppingList = {};
  ingredientMap.forEach(item => {
    const category = item.category;
    if (!shoppingList[category]) {
      shoppingList[category] = [];
    }
    shoppingList[category].push(item);
  });
  
  return shoppingList;
};

function MealPlanView({ mealPlan, preferences, user, selectedStores, onStartOver, onLogout, onViewProfile}) {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedMealDay, setSelectedMealDay] = useState(null);  // Track which day the selected meal came from
  const [selectedMealType, setSelectedMealType] = useState(null);  // Track which meal type (breakfast, lunch, etc.)
  const [activeTab, setActiveTab] = useState('meals');
  const [regeneratingMeal, setRegeneratingMeal] = useState(null);
  const [localMealPlan, setLocalMealPlan] = useState(mealPlan);
  const [favorites, setFavorites] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historicalStores, setHistoricalStores] = useState(null);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  // Engagement services hook
  const engagement = useEngagement();

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

  // Touch gesture refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const mealsContentRef = useRef(null);

  // Load favorites and save meal plan to history on mount
  // This useEffect must come before any early returns to follow React hooks rules
  useEffect(() => {
    const loadFavorites = async () => {
      console.log('📋 [Favorite] Loading favorites from server...');
      try {
        // Get JWT token from localStorage
        const token = localStorage.getItem('auth_token');
        console.log('🔑 [Favorite] Token exists:', !!token);

        if (!token) {
          console.warn('⚠️ [Favorite] No auth token - favorites not loaded');
          return;
        }

        console.log('📤 [Favorite] Fetching from:', `${API_BASE}/api/favorites`);
        const response = await fetch(`${API_BASE}/api/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('📥 [Favorite] Response status:', response.status);

        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          console.warn('⚠️ [Favorite] Token may be expired (401/403) - user will be logged out on next action');
          // Don't redirect here - let user actions trigger logout if needed
          return;
        }

        if (response.ok) {
          const data = await response.json();
          console.log('✅ [Favorite] Received favorites:', data);
          console.log('✅ [Favorite] Favorites count:', data.favorites?.length || 0);
          console.log('✅ [Favorite] Favorite items:', data.favorites);
          // Filter out invalid favorites that have no meal data
          const validFavorites = (data.favorites || []).filter(fav => {
            const isValid = fav && (fav.meal?.name || fav.meal_name);
            if (!isValid) {
              console.warn('⚠️ [Favorite] Filtering out invalid favorite:', fav);
            }
            return isValid;
          });
          console.log('✅ [Favorite] Valid favorites count:', validFavorites.length);
          setFavorites(validFavorites);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ [Favorite] Failed to load favorites:', response.status, errorData.error);
          
          // FALLBACK: Load from localStorage
          console.warn('⚠️ [Favorite] Backend unavailable - loading from localStorage');
          try {
            const localFavorites = JSON.parse(localStorage.getItem('local_favorites') || '[]');
            // Filter out invalid favorites
            const validLocalFavorites = localFavorites.filter(fav => fav && (fav.meal?.name || fav.meal_name));
            if (validLocalFavorites.length > 0) {
              console.log('💾 [Favorite] Loaded', validLocalFavorites.length, 'valid favorites from localStorage');
              setFavorites(validLocalFavorites);
            }
          } catch (localError) {
            console.error('❌ [Favorite] Failed to load from localStorage:', localError);
          }
        }
      } catch (error) {
        console.error('❌ [Favorite] Error loading favorites:', error);
        console.error('❌ [Favorite] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        // FALLBACK: Load from localStorage if network error
        console.warn('⚠️ [Favorite] Network error - loading from localStorage');
        try {
          const localFavorites = JSON.parse(localStorage.getItem('local_favorites') || '[]');
          // Filter out invalid favorites
          const validLocalFavorites = localFavorites.filter(fav => fav && (fav.meal?.name || fav.meal_name));
          if (validLocalFavorites.length > 0) {
            console.log('💾 [Favorite] Loaded', validLocalFavorites.length, 'valid favorites from localStorage');
            setFavorites(validLocalFavorites);
          }
        } catch (localError) {
          console.error('❌ [Favorite] Failed to load from localStorage:', localError);
        }
      }
    };

    const saveMealPlanToHistory = async () => {
      try {
        // Get JWT token from localStorage
        const token = localStorage.getItem('auth_token');

        if (!token) {
          console.warn('⚠️ No auth token - meal plan history not saved');
          return;
        }

        const response = await fetch(`${API_BASE}/api/save-meal-plan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            mealPlan: localMealPlan,
            preferences,
            selectedStores
          }),
        });

        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          console.warn('⚠️ Token may be expired - user will be logged out on next action');
          // Don't redirect here - let user actions trigger logout if needed
          return;
        }

        if (response.ok) {
          console.log('📝 Meal plan saved to history');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to save meal plan:', errorData.error);
        }
      } catch (error) {
        console.error('Error saving meal plan to history:', error);
      }
    };

    loadFavorites();
    saveMealPlanToHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Trigger engagement achievements when viewing a meal plan
  useEffect(() => {
    if (localMealPlan && engagement) {
      // First meal plan achievement
      engagement.achievements.checkAndUnlock('FIRST_MEAL_PLAN', true);
      
      // Check if full week is planned
      const daysPlanned = Object.keys(localMealPlan.mealPlan || {}).length;
      engagement.achievements.checkAndUnlock('WEEK_PLANNER', daysPlanned >= 7);
      
      // Show success notification for meal plan view
      engagement.showSuccess('Meal plan loaded successfully!', { duration: 2000 });
    }
  }, [localMealPlan]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleMealClick = (meal, day, mealType) => {
    if (!meal || !meal.name) {
      console.error('❌ [MealClick] Invalid meal data:', meal);
      alert('❌ This meal has incomplete data and cannot be viewed.');
      return;
    }
    setSelectedMeal(meal);
    setSelectedMealDay(day);
    setSelectedMealType(mealType);
    setCustomServings(meal.servings || 2);
    setRecipeNotes('');
  };

  const closeModal = () => {
    setSelectedMeal(null);
    setSelectedMealDay(null);
    setSelectedMealType(null);
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
    if (!selectedMeal) {
      console.warn('⚠️ [Favorite] No meal selected for customization');
      return;
    }

    console.log('📝 [Favorite] Starting customized favorite save...');
    console.log('📝 [Favorite] Selected meal:', selectedMeal);
    console.log('📝 [Favorite] Custom servings:', customServings);
    console.log('📝 [Favorite] Recipe notes:', recipeNotes);

    setSavingCustomization(true);
    try {
      const token = localStorage.getItem('auth_token');
      console.log('🔑 [Favorite] Token exists:', !!token);

      if (!token) {
        console.error('❌ [Favorite] No authentication token found');
        alert('Authentication required. Please log in again.');
        return;
      }

      const favoritePayload = {
        meal: selectedMeal,
        mealType: 'dinner', // Default type
        servings_adjustment: customServings,
        user_notes: recipeNotes
      };
      console.log('📤 [Favorite] Sending payload:', favoritePayload);

      const response = await fetch(`${API_BASE}/api/favorites/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(favoritePayload),
        timeout: 5000 // 5 second timeout
      });

      console.log('📥 [Favorite] Response status:', response.status);
      console.log('📥 [Favorite] Response headers:', response.headers);

      // Handle authentication errors - DON'T redirect, stay on meal plan page
      if (response.status === 401 || response.status === 403) {
        console.error('❌ [Favorite] Authentication failed (401/403)');
        console.error('❌ [Favorite] Response:', response.statusText);
        localStorage.removeItem('auth_token');
        // Don't redirect - let user see error message and stay on meal plan
        throw new Error('Authentication failed. Please log in again.');
      }

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [Favorite] Server response:', data);
        console.log('✅ [Favorite] Received favorite object:', data.favorite);
        
        // Update favorites state
        setFavorites(prev => {
          const updated = [...prev, data.favorite];
          console.log('✅ [Favorite] Updated favorites state. New total:', updated.length);
          
          // Trigger engagement achievements based on favorites count
          if (engagement) {
            engagement.achievements.checkAndUnlock('RECIPE_COLLECTOR', updated.length >= 10);
            engagement.achievements.checkAndUnlock('RECIPE_MASTER', updated.length >= 50);
            engagement.showSuccess('Recipe saved to favorites!', { icon: '⭐' });
          }
          
          return updated;
        });
        
        // Close modal BEFORE alert so React can update state
        console.log('✅ [Favorite] Closing modal and clearing selected meal');
        setSelectedMeal(null);
        setSelectedMealDay(null);
        setSelectedMealType(null);
        setCustomServings(null);
        setRecipeNotes('');
        
        alert('✅ Customized recipe saved to favorites!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [Favorite] Non-OK response:', response.status, errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ [Favorite] Error saving customized favorite:', error);
      console.error('❌ [Favorite] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // FALLBACK: Save to localStorage if backend fails
      console.warn('⚠️ [Favorite] Backend unavailable - saving to localStorage');
      try {
        const localFavorites = JSON.parse(localStorage.getItem('local_favorites') || '[]');
        const newFavorite = {
          id: `local_${Date.now()}`,
          meal: selectedMeal,
          meal_name: selectedMeal.name,
          mealType: 'dinner',
          servings_adjustment: customServings,
          user_notes: recipeNotes,
          created_at: new Date().toISOString(),
          local: true  // Mark as local storage only
        };
        
        // Check if already favorited
        const exists = localFavorites.some(f => f.meal_name === selectedMeal.name);
        if (!exists) {
          localFavorites.push(newFavorite);
          localStorage.setItem('local_favorites', JSON.stringify(localFavorites));
          console.log('💾 [Favorite] Saved to localStorage:', localFavorites.length, 'favorites');
          
          // Update UI favorites state with local favorite
          setFavorites(prev => [...prev, newFavorite]);
          
          // Close modal
          setSelectedMeal(null);
          setSelectedMealDay(null);
          setSelectedMealType(null);
          setCustomServings(null);
          setRecipeNotes('');
          
          alert('✅ Recipe saved locally! (Note: Requires internet to sync to your account)');
        } else {
          alert('⚠️ Recipe already in favorites');
        }
      } catch (localError) {
        console.error('❌ [Favorite] LocalStorage fallback failed:', localError);
        alert('❌ Failed to save favorite: ' + (error.message || 'Unknown error'));
      }
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
      console.log('✅ New meal generated:', data.meal?.name);
      
      // Normalize the meal data to ensure arrays
      const newMeal = { ...data.meal };
      
      // Ensure ingredients is an array
      if (typeof newMeal.ingredients === 'string') {
        try {
          newMeal.ingredients = JSON.parse(newMeal.ingredients);
        } catch {
          newMeal.ingredients = newMeal.ingredients.split('\n').filter(i => i.trim());
        }
      }
      if (!Array.isArray(newMeal.ingredients)) {
        newMeal.ingredients = [];
      }
      
      // Ensure instructions is an array
      if (typeof newMeal.instructions === 'string') {
        try {
          newMeal.instructions = JSON.parse(newMeal.instructions);
        } catch {
          newMeal.instructions = newMeal.instructions.split('\n').filter(i => i.trim());
        }
      }
      if (!Array.isArray(newMeal.instructions)) {
        newMeal.instructions = [];
      }

      // Update the local meal plan with the new meal
      setLocalMealPlan(prevPlan => ({
        ...prevPlan,
        mealPlan: {
          ...prevPlan.mealPlan,
          [day]: {
            ...prevPlan.mealPlan[day],
            [mealType]: newMeal
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
    // Open the modal so user can customize the meal before favoriting
    console.log('❤️ [Favorite] Opening meal modal for customization and favorite save');
    console.log('❤️ [Favorite] Meal details:', {
      name: meal?.name,
      mealType,
      day,
      hasRecipe: !!meal?.recipe,
      hasIngredients: !!meal?.ingredients
    });
    
    if (!meal) {
      console.error('❌ [Favorite] No meal data provided');
      alert('❌ Error: No meal data available');
      return;
    }
    
    setSelectedMeal(meal);
    setSelectedMealDay(day);
    setSelectedMealType(mealType);
    setCustomServings(meal.servings || 2);
    setRecipeNotes('');
    console.log('❤️ [Favorite] Modal state updated, ready for customization');
  };

  const handleRemoveFavorite = async (favoriteId) => {
    console.log('🗑️ [Favorite] Starting favorite removal. ID:', favoriteId);
    
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('auth_token');
      console.log('🔑 [Favorite] Token exists:', !!token);

      if (!token) {
        console.error('❌ [Favorite] No authentication token found');
        alert('Authentication required. Please log in again.');
        return;
      }

      console.log('📤 [Favorite] Sending DELETE request to /api/favorites/' + favoriteId);
      const response = await fetch(`${API_BASE}/api/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('📥 [Favorite] DELETE response status:', response.status);

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        console.error('❌ [Favorite] Authentication failed (401/403) - removing token and redirecting');
        localStorage.removeItem('auth_token');
        window.location.href = '/';
        return;
      }

      if (response.ok) {
        console.log('✅ [Favorite] Server confirmed deletion');
        setFavorites(prev => {
          const updated = prev.filter(fav => fav.id !== favoriteId);
          console.log('✅ [Favorite] Updated favorites state. New total:', updated.length);
          return updated;
        });
        console.log('🗑️ [Favorite] Removed from favorites');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [Favorite] Non-OK response:', response.status, errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ [Favorite] Error removing favorite:', error);
      console.error('❌ [Favorite] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert('❌ ' + (error.message || 'Failed to remove favorite'));
    }
  };

  const handleUseFavorite = async (favorite, day, mealType) => {
    // Defensive check for meal data
    const mealData = favorite?.meal;
    if (!mealData || !mealData.name) {
      console.error('❌ [UseFavorite] Invalid favorite meal data:', favorite);
      alert('❌ This favorite has incomplete meal data and cannot be used.');
      return;
    }
    
    // Replace current meal with favorite
    setLocalMealPlan(prevPlan => ({
      ...prevPlan,
      mealPlan: {
        ...prevPlan.mealPlan,
        [day]: {
          ...prevPlan.mealPlan[day],
          [mealType]: mealData
        }
      }
    }));
    console.log(`✨ Applied favorite "${mealData.name}" to ${day} ${mealType}`);
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
          ingredientToRemove: formData.ingredientToRemove,
          mealName: selectedMeal?.name,
          currentIngredients: selectedMeal?.ingredients || [],
          currentInstructions: selectedMeal?.instructions
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔧 Remove ingredient response:', data);
        
        // Ensure ingredients is an array (backend might return string)
        let newIngredients = data.ingredients;
        if (typeof newIngredients === 'string') {
          try {
            newIngredients = JSON.parse(newIngredients);
          } catch {
            newIngredients = newIngredients.split('\n').filter(i => i.trim());
          }
        }
        if (!Array.isArray(newIngredients)) {
          console.error('❌ Ingredients not an array, keeping original:', newIngredients);
          newIngredients = selectedMeal?.ingredients || [];
        }
        
        // Ensure instructions is an array
        let newInstructions = data.instructions;
        if (typeof newInstructions === 'string') {
          try {
            newInstructions = JSON.parse(newInstructions);
          } catch {
            newInstructions = newInstructions.split('\n').filter(i => i.trim());
          }
        }
        if (!Array.isArray(newInstructions)) {
          console.error('❌ Instructions not an array, keeping original:', newInstructions);
          newInstructions = selectedMeal?.instructions || [];
        }
        
        // Update the selected meal with the new ingredients and updated instructions from backend
        const updatedMeal = { 
          ...selectedMeal, 
          ingredients: newIngredients,
          instructions: newInstructions
        };
        setSelectedMeal(updatedMeal);
        
        // Update the local meal plan with the new meal
        if (selectedMealDay && selectedMealType) {
          const updatedPlan = {
            ...localMealPlan,
            mealPlan: {
              ...localMealPlan.mealPlan,
              [selectedMealDay]: {
                ...localMealPlan.mealPlan[selectedMealDay],
                [selectedMealType]: updatedMeal
              }
            }
          };
          
          // Regenerate shopping list from updated meal plan
          updatedPlan.shoppingList = regenerateShoppingList(updatedPlan);
          
          setLocalMealPlan(updatedPlan);
        }
        
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
          reason: formData.reasonToAdd,
          mealName: selectedMeal?.name,
          currentIngredients: selectedMeal?.ingredients || [],
          currentInstructions: selectedMeal?.instructions
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔧 Add ingredient response:', data);
        
        // Ensure ingredients is an array (backend might return string)
        let newIngredients = data.ingredients;
        if (typeof newIngredients === 'string') {
          try {
            newIngredients = JSON.parse(newIngredients);
          } catch {
            newIngredients = newIngredients.split('\n').filter(i => i.trim());
          }
        }
        if (!Array.isArray(newIngredients)) {
          console.error('❌ Ingredients not an array, keeping original:', newIngredients);
          newIngredients = selectedMeal?.ingredients || [];
        }
        
        // Ensure instructions is an array
        let newInstructions = data.instructions;
        if (typeof newInstructions === 'string') {
          try {
            newInstructions = JSON.parse(newInstructions);
          } catch {
            newInstructions = newInstructions.split('\n').filter(i => i.trim());
          }
        }
        if (!Array.isArray(newInstructions)) {
          console.error('❌ Instructions not an array, keeping original:', newInstructions);
          newInstructions = selectedMeal?.instructions || [];
        }
        
        // Update the selected meal with the new ingredients and updated instructions from backend
        const updatedMeal = { 
          ...selectedMeal, 
          ingredients: newIngredients,
          instructions: newInstructions
        };
        setSelectedMeal(updatedMeal);
        
        // Update the local meal plan with the new meal
        if (selectedMealDay && selectedMealType) {
          const updatedPlan = {
            ...localMealPlan,
            mealPlan: {
              ...localMealPlan.mealPlan,
              [selectedMealDay]: {
                ...localMealPlan.mealPlan[selectedMealDay],
                [selectedMealType]: updatedMeal
              }
            }
          };
          
          // Regenerate shopping list from updated meal plan
          updatedPlan.shoppingList = regenerateShoppingList(updatedPlan);
          
          setLocalMealPlan(updatedPlan);
        }
        
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
          reason: formData.reasonToSubstitute,
          mealName: selectedMeal?.name,
          currentIngredients: selectedMeal?.ingredients || [],
          currentInstructions: selectedMeal?.instructions
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔧 Substitute ingredient response:', data);
        
        // Ensure ingredients is an array (backend might return string)
        let newIngredients = data.ingredients;
        if (typeof newIngredients === 'string') {
          try {
            newIngredients = JSON.parse(newIngredients);
          } catch {
            newIngredients = newIngredients.split('\n').filter(i => i.trim());
          }
        }
        if (!Array.isArray(newIngredients)) {
          console.error('❌ Ingredients not an array, keeping original:', newIngredients);
          newIngredients = selectedMeal?.ingredients || [];
        }
        
        // Ensure instructions is an array
        let newInstructions = data.instructions;
        if (typeof newInstructions === 'string') {
          try {
            newInstructions = JSON.parse(newInstructions);
          } catch {
            newInstructions = newInstructions.split('\n').filter(i => i.trim());
          }
        }
        if (!Array.isArray(newInstructions)) {
          console.error('❌ Instructions not an array, keeping original:', newInstructions);
          newInstructions = selectedMeal?.instructions || [];
        }
        
        // Update the selected meal with the new ingredients and updated instructions from backend
        const updatedMeal = { 
          ...selectedMeal, 
          ingredients: newIngredients,
          instructions: newInstructions
        };
        setSelectedMeal(updatedMeal);
        
        // Update the local meal plan with the new meal
        if (selectedMealDay && selectedMealType) {
          const updatedPlan = {
            ...localMealPlan,
            mealPlan: {
              ...localMealPlan.mealPlan,
              [selectedMealDay]: {
                ...localMealPlan.mealPlan[selectedMealDay],
                [selectedMealType]: updatedMeal
              }
            }
          };
          
          // Regenerate shopping list from updated meal plan
          updatedPlan.shoppingList = regenerateShoppingList(updatedPlan);
          
          setLocalMealPlan(updatedPlan);
        }
        
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

  const handleSubmitRecipeChanges = async (day, mealType) => {
    console.log('🔧 [SubmitRecipeChanges] Starting with day:', day, 'mealType:', mealType);
    console.log('🔧 [SubmitRecipeChanges] selectedMeal:', selectedMeal);
    console.log('🔧 [SubmitRecipeChanges] selectedMealDay:', selectedMealDay, 'selectedMealType:', selectedMealType);
    
    setOperationLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        console.error('❌ No authentication token found');
        setOperationMessage('❌ Authentication required. Please log in again.');
        setOperationLoading(false);
        return;
      }
      
      // Use a placeholder ID if none exists - backend doesn't actually use it
      const mealId = selectedMeal?.id || 'current';
      const apiUrl = `${API_BASE}/api/meal/${mealId}/regenerate-recipe`;
      console.log('🔧 [SubmitRecipeChanges] API URL:', apiUrl);
      
      // Send a request to regenerate the full recipe with current ingredients
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mealName: selectedMeal?.name,
          currentIngredients: selectedMeal?.ingredients || [],
          currentInstructions: selectedMeal?.instructions
        }),
      });

      console.log('🔧 [SubmitRecipeChanges] Response status:', response.status);

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        console.error('❌ Authentication failed (401/403)');
        localStorage.removeItem('auth_token');
        window.location.href = '/';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('🔧 Regenerate recipe response:', data);
        
        // Ensure instructions is an array (backend might return string)
        let newInstructions = data.instructions;
        if (typeof newInstructions === 'string') {
          try {
            newInstructions = JSON.parse(newInstructions);
          } catch {
            newInstructions = newInstructions.split('\n').filter(i => i.trim());
          }
        }
        if (!Array.isArray(newInstructions)) {
          console.error('❌ Instructions not an array, keeping original:', newInstructions);
          newInstructions = selectedMeal?.instructions || [];
        }
        
        // Update the meal with the regenerated recipe
        const updatedMeal = {
          ...selectedMeal,
          instructions: newInstructions
        };
        
        // Update the local meal plan using the stored day/mealType
        const actualDay = selectedMealDay || day;
        const actualMealType = selectedMealType || mealType;
        
        if (actualDay && actualMealType && localMealPlan?.mealPlan?.[actualDay]) {
          const updatedPlan = {
            ...localMealPlan,
            mealPlan: {
              ...localMealPlan.mealPlan,
              [actualDay]: {
                ...localMealPlan.mealPlan[actualDay],
                [actualMealType]: updatedMeal
              }
            }
          };
          
          setLocalMealPlan(updatedPlan);
          console.log('✅ [SubmitRecipeChanges] Updated meal plan for', actualDay, actualMealType);
        }
        
        setOperationMessage(`✅ Recipe updated with your ingredient changes!`);
        // Close modal after brief delay to show success message
        setTimeout(() => {
          setOperationMessage(null);
          closeModal();
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Recipe update failed:', response.status, errorData);
        setOperationMessage(`❌ Failed to update recipe: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Exception in handleSubmitRecipeChanges:', error);
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

      if (!token) {
        console.error('❌ No authentication token found');
        alert('Authentication required. Please log in again.');
        setLoadingHistory(false);
        return;
      }

      const url = days
        ? `${API_BASE}/api/meal-plan-history?days=${days}`
        : `${API_BASE}/api/meal-plan-history`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Handle authentication errors - redirect on user action
      if (response.status === 401 || response.status === 403) {
        console.error('❌ Authentication failed (401/403) - removing token and redirecting');
        localStorage.removeItem('auth_token');
        window.location.href = '/';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
        setShowHistory(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load history');
      }
    } catch (error) {
      console.error('Error loading history:', error);
      alert('❌ ' + error.message);
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
    // Validate inputs
    if (!mealName) {
      console.debug('❓ [Favorite] isFavorited called with no mealName');
      return false;
    }
    
    if (!favorites) {
      console.debug('❓ [Favorite] isFavorited - favorites is null/undefined');
      return false;
    }
    
    if (!Array.isArray(favorites)) {
      console.warn('⚠️ [Favorite] isFavorited - favorites is not an array:', typeof favorites);
      return false;
    }

    console.debug(`🔍 [Favorite] Checking if "${mealName}" is favorited. Total favorites: ${favorites.length}`);
    
    return favorites.some(fav => {
      try {
        // Handle different data structures for favorites
        const name = fav?.meal?.name || fav?.meal_name || fav?.name;
        const isFav = name === mealName;
        
        if (isFav) {
          console.debug(`✅ [Favorite] Found favorite: "${mealName}"`);
        }
        
        return isFav;
      } catch (e) {
        console.warn('⚠️ [Favorite] Error checking favorite:', { 
          mealName, 
          favoriteObj: fav, 
          error: e.message 
        });
        return false;
      }
    });
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
      {console.log('🎯 MealPlanView rendering - Submit Recipe Changes button should be visible')}
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
                const alreadyFavorited = meal && meal.name ? isFavorited(meal.name) : false;

                // Guard: Don't render if meal doesn't exist
                if (!meal || !meal.name) {
                  return (
                    <div key={mealType} className="meal-card empty-meal-slot">
                      <div className="meal-card-content">
                        <div className="meal-type">{mealType}</div>
                        <p className="no-meal-message">No meal selected</p>
                      </div>
                    </div>
                  );
                }

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
                        onClick={() => handleMealClick(meal, selectedDay, mealType)}
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
                        disabled={alreadyFavorited}
                        title={alreadyFavorited ? 'Already in favorites' : 'Add to favorites'}
                      >
                        {alreadyFavorited ? '❤️' : '🤍'}
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
                {favorites.map((favorite) => {
                  const mealData = favorite.meal || {};
                  const mealName = mealData.name || favorite.meal_name || 'Unnamed Meal';
                  
                  // Skip rendering if no meal data available
                  if (!mealData.name && !favorite.meal_name) {
                    console.warn('Favorite missing meal data:', favorite);
                    return null;
                  }
                  
                  return (
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
                    <h3 className="favorite-name">{mealName}</h3>
                    {mealData.prepTime && (
                      <p className="favorite-time">⏱️ Prep: {mealData.prepTime}</p>
                    )}
                    {mealData.cookTime && (
                      <p className="favorite-time">🔥 Cook: {mealData.cookTime}</p>
                    )}
                    {mealData.servings && (
                      <p className="favorite-servings">👥 Serves {mealData.servings}</p>
                    )}
                    <p className="favorite-saved">Saved: {new Date(favorite.savedAt).toLocaleDateString()}</p>

                    <div className="favorite-actions">
                      <button
                        className="view-recipe-btn"
                        onClick={() => handleMealClick(mealData, selectedDay, 'breakfast')}
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
                  );
                })}
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
            {console.log('🎯 Recipe Modal opened - Submit Recipe Changes button should be visible below')}


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

              {/* Submit Recipe Changes */}
              <div className="operation-group submit-changes-group">
                <h4>✅ Save Recipe Changes</h4>
                <p className="operation-note">Click to finalize all your ingredient modifications and regenerate the recipe</p>
                {console.log('✅ BUTTON RENDERING - Submit Recipe Changes button is now visible on page')}
                <button 
                  onClick={() => handleSubmitRecipeChanges(selectedMealDay, selectedMealType)}
                  className="operation-btn submit-changes-btn"
                  disabled={operationLoading}
                >
                  {operationLoading ? 'Processing...' : 'Submit Recipe Changes'}
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
    </div>
  );
}

export default MealPlanView;