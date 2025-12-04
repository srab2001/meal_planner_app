import React, { useState, useEffect } from 'react';
import './RecipeCard.css';

const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

function RecipeCard() {
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);

  // Extract meal ID from URL path
  const getMealIdFromUrl = () => {
    const path = window.location.pathname;
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  useEffect(() => {
    fetchMeal();
  }, []);

  const fetchMeal = async () => {
    try {
      const id = getMealIdFromUrl();
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE}/api/admin/meal-of-the-day`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const foundMeal = data.meals.find(m => m.id === id);
        if (foundMeal) {
          setMeal(foundMeal);
        }
      }
    } catch (error) {
      console.error('Error fetching meal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    if (!meal) return;
    const subject = encodeURIComponent(`Recipe: ${meal.title}`);
    const body = encodeURIComponent(`Check out this delicious recipe!\n\n${meal.title}\n\nView the full recipe at: ${window.location.origin}/meal-of-the-day`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleBack = () => {
    window.location.href = '/admin';
  };

  if (loading) {
    return (
      <div className="recipe-card-container">
        <p style={{textAlign: 'center', fontSize: '18px', color: '#666'}}>Loading recipe card...</p>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="recipe-card-container">
        <p style={{textAlign: 'center', fontSize: '18px', color: '#666'}}>Meal not found</p>
        <div className="print-buttons">
          <button onClick={handleBack} className="print-btn back-btn">
            ← Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-card-container">
      <div className="print-buttons">
        <button onClick={handlePrint} className="print-btn">
          🖨️ Print Recipe Card
        </button>
        <button onClick={handleEmail} className="print-btn">
          ✉️ Email Recipe
        </button>
        <button onClick={handleBack} className="print-btn back-btn">
          ← Back to Admin
        </button>
      </div>

      <div className="recipe-card">
        {/* Header */}
        <div className="recipe-card-header">
          <h1>{meal.title}</h1>
          {meal.description && <p>{meal.description}</p>}
        </div>

        {/* Meta Information */}
        <div className="recipe-card-meta">
          {meal.cuisine && (
            <div className="recipe-meta-item">
              <div className="recipe-meta-label">Cuisine</div>
              <div className="recipe-meta-value">{meal.cuisine}</div>
            </div>
          )}
          {meal.meal_type && (
            <div className="recipe-meta-item">
              <div className="recipe-meta-label">Type</div>
              <div className="recipe-meta-value">{meal.meal_type}</div>
            </div>
          )}
          {meal.prep_time && (
            <div className="recipe-meta-item">
              <div className="recipe-meta-label">Prep Time</div>
              <div className="recipe-meta-value">{meal.prep_time}</div>
            </div>
          )}
          {meal.cook_time && (
            <div className="recipe-meta-item">
              <div className="recipe-meta-label">Cook Time</div>
              <div className="recipe-meta-value">{meal.cook_time}</div>
            </div>
          )}
          {meal.servings && (
            <div className="recipe-meta-item">
              <div className="recipe-meta-label">Servings</div>
              <div className="recipe-meta-value">{meal.servings}</div>
            </div>
          )}
        </div>

        {/* Image */}
        {meal.image_url && (
          <img src={meal.image_url} alt={meal.title} className="recipe-card-image" />
        )}

        {/* Content */}
        <div className="recipe-card-content">
          {/* Ingredients */}
          <div className="recipe-section">
            <h2>📝 Ingredients</h2>
            <ul className="ingredients-list">
              {meal.ingredients && meal.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="recipe-section">
            <h2>👨‍🍳 Instructions</h2>
            <ol className="instructions-list">
              {meal.instructions && meal.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>

          {/* Tags */}
          {meal.tags && meal.tags.length > 0 && (
            <div className="recipe-tags">
              {meal.tags.map((tag, index) => (
                <span key={index} className="recipe-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="recipe-card-footer">
          <h3>🍽️ Want More Recipes?</h3>
          <p>Get personalized meal plans with recipes, shopping lists, and price comparisons!</p>
          <span className="app-url">{window.location.origin}</span>
        </div>
      </div>
    </div>
  );
}

export default RecipeCard;
