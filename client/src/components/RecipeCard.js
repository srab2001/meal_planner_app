import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import './RecipeCard.css';

const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

function RecipeCard() {
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFormats, setShowFormats] = useState(false);

  // Extract meal ID from URL path
  const getMealIdFromUrl = () => {
    const path = window.location.pathname;
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  useEffect(() => {
    console.log('🍽️ RecipeCard component mounted');
    console.log('🍽️ Current URL:', window.location.pathname);
    fetchMeal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMeal = async () => {
    try {
      const id = getMealIdFromUrl();
      console.log('🍽️ Fetching meal with ID:', id);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE}/api/admin/meal-of-the-day`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('🍽️ Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🍽️ Meals data:', data);
        const foundMeal = data.meals.find(m => m.id === id);
        if (foundMeal) {
          console.log('✅ Meal found:', foundMeal.title);
          setMeal(foundMeal);
        } else {
          console.log('🔴 Meal not found with ID:', id);
        }
      }
    } catch (error) {
      console.error('🔴 Error fetching meal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePDF = () => {
    console.log('📄 Download PDF clicked');
    if (!meal) {
      console.log('🔴 No meal data available');
      return;
    }

    const element = document.querySelector('.recipe-card');
    if (!element) {
      console.log('🔴 Recipe card element not found');
      alert('Error: Could not find recipe card to export');
      return;
    }

    console.log('📄 Generating PDF...');
    const opt = {
      margin: 0.5,
      filename: `${meal.title.replace(/[^a-z0-9]/gi, '_')}_recipe.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
    console.log('✅ PDF generation initiated');
  };

  const generateEmailTemplate = () => {
    if (!meal) return '';

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 32px; }
    .meta { background: #f8f9fa; padding: 20px; display: flex; justify-content: space-around; border-bottom: 3px solid #667eea; }
    .meta-item { text-align: center; }
    .meta-label { font-size: 11px; text-transform: uppercase; color: #666; }
    .meta-value { font-size: 18px; font-weight: bold; color: #333; }
    img { width: 100%; height: auto; display: block; }
    .content { padding: 30px; }
    h2 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    .ingredient { padding: 8px 0; border-bottom: 1px solid #eee; }
    .instruction { margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 3px solid #667eea; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${meal.title}</h1>
    <p>${meal.description || ''}</p>
  </div>

  <div class="meta">
    ${meal.prep_time ? `<div class="meta-item"><div class="meta-label">Prep Time</div><div class="meta-value">${meal.prep_time}</div></div>` : ''}
    ${meal.cook_time ? `<div class="meta-item"><div class="meta-label">Cook Time</div><div class="meta-value">${meal.cook_time}</div></div>` : ''}
    ${meal.servings ? `<div class="meta-item"><div class="meta-label">Servings</div><div class="meta-value">${meal.servings}</div></div>` : ''}
  </div>

  ${meal.image_url ? `<img src="${meal.image_url}" alt="${meal.title}" />` : ''}

  <div class="content">
    <h2>📝 Ingredients</h2>
    ${meal.ingredients.map(ing => `<div class="ingredient">✓ ${ing}</div>`).join('')}

    <h2 style="margin-top: 30px;">👨‍🍳 Instructions</h2>
    ${meal.instructions.map((inst, i) => `<div class="instruction"><strong>Step ${i + 1}:</strong> ${inst}</div>`).join('')}
  </div>

  <div class="footer">
    <h3>🍽️ Want More Recipes Like This?</h3>
    <p>Get personalized meal plans with recipes, shopping lists, and price comparisons!</p>
    <a href="${window.location.origin}?meal=${meal.id}" class="cta-button">Try Our Meal Planner App</a>
  </div>
</body>
</html>`;
  };

  const handleEmail = () => {
    console.log('✉️ Copy Email HTML clicked');
    if (!meal) {
      console.log('🔴 No meal data available');
      return;
    }

    const emailHTML = generateEmailTemplate();
    console.log('✉️ Email HTML generated, length:', emailHTML.length);

    // Copy HTML to clipboard
    navigator.clipboard.writeText(emailHTML).then(() => {
      console.log('✅ Email HTML copied to clipboard');
      alert('✅ Email HTML copied to clipboard!\n\nPaste this into your email client (Gmail, Mailchimp, etc.) and send.\n\nTip: Most email clients have an "Insert HTML" or "Code view" option.');
    }).catch(err => {
      console.error('🔴 Failed to copy to clipboard:', err);
      alert('Error copying to clipboard. Please try again.');
    });
  };

  const generateSocialPost = () => {
    if (!meal) return '';

    const hashtags = meal.tags ? meal.tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ') : '';
    const cookTime = meal.cook_time ? `⏱️ Ready in ${meal.cook_time}` : '';

    return `🍽️ ${meal.title}

${meal.description || ''}

${cookTime}
${meal.servings ? `👥 Serves ${meal.servings}` : ''}

Try this recipe and get personalized meal plans with shopping lists!

🔗 ${window.location.origin}/meal-of-the-day

${hashtags} #Recipe #Cooking #MealPlanning #FoodLover #HomeCooking`;
  };

  const handleSocialPost = () => {
    console.log('📱 Copy Social Post clicked');
    if (!meal) {
      console.log('🔴 No meal data available');
      return;
    }

    const socialText = generateSocialPost();
    console.log('📱 Social post generated, length:', socialText.length);

    navigator.clipboard.writeText(socialText).then(() => {
      console.log('✅ Social post copied to clipboard');
      alert(`✅ Social media post copied to clipboard!

Post this on:
• Facebook
• Twitter
• Instagram (add image: ${meal.image_url || 'no image'})
• LinkedIn

The text includes hashtags and a link to your app.`);
    }).catch(err => {
      console.error('🔴 Failed to copy to clipboard:', err);
      alert('Error copying to clipboard. Please try again.');
    });
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
        <button onClick={handlePDF} className="print-btn" style={{background: '#ef4444'}}>
          📄 Download PDF
        </button>
        <button onClick={handleEmail} className="print-btn" style={{background: '#3b82f6'}}>
          ✉️ Copy Email HTML
        </button>
        <button onClick={handleSocialPost} className="print-btn" style={{background: '#8b5cf6'}}>
          📱 Copy Social Post
        </button>
        <button onClick={handlePrint} className="print-btn" style={{background: '#10b981'}}>
          🖨️ Print
        </button>
        <button onClick={handleBack} className="print-btn back-btn">
          ← Back to Admin
        </button>
      </div>

      {showFormats && (
        <div style={{
          background: '#f0fdf4',
          border: '2px solid #22c55e',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{margin: '0 0 15px 0', color: '#166534'}}>📤 Marketing Materials Ready!</h3>
          <p style={{margin: '0 0 10px 0', color: '#166534'}}>Your recipe has been prepared for distribution:</p>
          <ul style={{margin: 0, color: '#166534'}}>
            <li>✅ PDF downloaded - ready to print or attach to emails</li>
            <li>✅ Email HTML copied - paste into your email client</li>
            <li>✅ Social post copied - paste to Facebook, Instagram, Twitter</li>
          </ul>
        </div>
      )}


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
