import React, { useState, useEffect } from 'react';
import './MealOfTheDay.css';

const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

function MealOfTheDay() {
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareSuccess, setShareSuccess] = useState('');

  useEffect(() => {
    loadMeal();
  }, []);

  const loadMeal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/meal-of-the-day`);
      const data = await response.json();
      setMeal(data.meal);
    } catch (error) {
      console.error('Error loading meal of the day:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNativeShare = async () => {
    if (!meal) return;

    const shareUrl = `${window.location.origin}/meal-of-the-day`;
    const shareText = `Check out today's Meal of the Day: ${meal.title}!\n\n${meal.description || ''}`;

    // Check if native share is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Meal of the Day: ${meal.title}`,
          text: shareText,
          url: shareUrl
        });

        // Track the share
        const token = localStorage.getItem('auth_token');
        await fetch(`${API_BASE}/api/meal-of-the-day/${meal.id}/share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({ platform: 'native' })
        });

        setShareSuccess('Shared successfully!');
        setTimeout(() => setShareSuccess(''), 3000);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  const handleShare = async (platform) => {
    if (!meal) return;

    // Track the share
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${API_BASE}/api/meal-of-the-day/${meal.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ platform })
      });
    } catch (error) {
      console.error('Error tracking share:', error);
    }

    const shareUrl = `${window.location.origin}/meal-of-the-day`;
    const shareText = `Check out today's Meal of the Day: ${meal.title}!`;
    const shareImage = meal.image_url || '';

    let url;
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'pinterest':
        url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(shareImage)}&description=${encodeURIComponent(shareText)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent('Meal of the Day: ' + meal.title)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        setShareSuccess('Link copied to clipboard!');
        setTimeout(() => setShareSuccess(''), 3000);
        return;
      default:
        return;
    }

    window.open(url, '_blank', 'width=600,height=400');
    setShareSuccess(`Shared on ${platform}!`);
    setTimeout(() => setShareSuccess(''), 3000);
  };

  if (loading) {
    return (
      <div className="meal-of-day-container">
        <div className="loading">Loading today's meal...</div>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="meal-of-day-container">
        <div className="no-meal">
          <h2>No Meal of the Day Available</h2>
          <p>Check back soon for delicious recipes!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meal-of-day-container">
      <div className="meal-header">
        <div className="meal-badge">⭐ Meal of the Day</div>
        <h1 className="meal-title">{meal.title}</h1>
        {meal.description && <p className="meal-description">{meal.description}</p>}

        <div className="meal-meta">
          {meal.cuisine && <span className="meta-item">🍽️ {meal.cuisine}</span>}
          {meal.meal_type && <span className="meta-item">🕒 {meal.meal_type}</span>}
          {meal.prep_time && <span className="meta-item">⏱️ Prep: {meal.prep_time}</span>}
          {meal.cook_time && <span className="meta-item">👨‍🍳 Cook: {meal.cook_time}</span>}
          {meal.servings && <span className="meta-item">👥 Serves: {meal.servings}</span>}
        </div>

        {meal.tags && Array.isArray(meal.tags) && meal.tags.length > 0 && (
          <div className="meal-tags">
            {meal.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {meal.image_url && (
        <div className="meal-image-container">
          <img src={meal.image_url} alt={meal.title} className="meal-image" />
        </div>
      )}

      <div className="meal-content">
        <div className="ingredients-section">
          <h2>📝 Ingredients</h2>
          <ul className="ingredients-list">
            {meal.ingredients && meal.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>

        <div className="instructions-section">
          <h2>👨‍🍳 Instructions</h2>
          <ol className="instructions-list">
            {meal.instructions && meal.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="cta-section">
        <div className="cta-card">
          <h2>🍽️ Want This Meal in Your Plan?</h2>
          <p>Sign up and we'll add this recipe to your personalized meal plan with shopping list and store price comparisons!</p>
          <a href={`/?add_meal=${meal.id}`} className="cta-button">
            ✨ Add to My Meal Plan
          </a>
          <p className="cta-subtext">Instant signup • Get this recipe + shopping list • Compare store prices • Save money</p>
        </div>
      </div>

      <div className="share-section">
        <h3>Share this recipe!</h3>
        {shareSuccess && <div className="share-success">{shareSuccess}</div>}
        <div className="share-buttons">
          {/* Native share button for mobile devices */}
          {navigator.share && (
            <button onClick={handleNativeShare} className="share-btn native-share">
              <span>📤</span> Share
            </button>
          )}
          <button onClick={() => handleShare('facebook')} className="share-btn facebook">
            <span>📘</span> Facebook
          </button>
          <button onClick={() => handleShare('twitter')} className="share-btn twitter">
            <span>🐦</span> Twitter
          </button>
          <button onClick={() => handleShare('pinterest')} className="share-btn pinterest">
            <span>📌</span> Pinterest
          </button>
          <button onClick={() => handleShare('whatsapp')} className="share-btn whatsapp">
            <span>💬</span> WhatsApp
          </button>
          <button onClick={() => handleShare('email')} className="share-btn email">
            <span>✉️</span> Email
          </button>
          <button onClick={() => handleShare('copy')} className="share-btn copy">
            <span>🔗</span> Copy Link
          </button>
        </div>
      </div>

      <div className="stats-footer">
        <span>👀 {meal.view_count} views</span>
        <span>📤 {meal.share_count} shares</span>
      </div>
    </div>
  );
}

export default MealOfTheDay;
