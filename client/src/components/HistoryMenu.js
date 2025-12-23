import React, { useState, useEffect } from 'react';
import './HistoryMenu.css';

const PRODUCTION_API = 'https://meal-planner-app-mve2.onrender.com';
const API_BASE = process.env.REACT_APP_API_URL || PRODUCTION_API;

/**
 * HistoryMenu Component
 * 
 * Allows user to:
 * 1. Load and edit a previously saved meal plan
 * 2. Start a new meal plan
 * 
 * Appears before the store locator screen to allow meal plan review/editing
 */
function HistoryMenu({ onNewPlan, onLoadPlan, onLogout, user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedHistory, setExpandedHistory] = useState(false);

  // Load meal plan history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('No authentication token');
        return;
      }

      const response = await fetch(`${API_BASE}/api/meal-plan-history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('auth_token');
        onLogout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to load history');
      }
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Failed to load meal plan history');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (entry) => {
    console.log('📋 Loading previous meal plan:', entry);
    onLoadPlan(entry);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatMealSummary = (mealPlan) => {
    if (!mealPlan || !mealPlan.mealPlan) return 'No meals';
    
    const dayCount = Object.keys(mealPlan.mealPlan).length;
    const mealCount = Object.values(mealPlan.mealPlan).reduce((sum, day) => {
      return sum + Object.keys(day).length;
    }, 0);
    
    return `${dayCount} days, ${mealCount} meals`;
  };

  return (
    <div className="history-menu-container">
      <div className="history-menu-content">
        <h1>📋 Meal Planning</h1>
        <p className="subtitle">What would you like to do?</p>

        <div className="menu-options">
          {/* Option 1: Load Previous Plan */}
          <button 
            className="menu-button menu-button-primary"
            onClick={() => setExpandedHistory(!expandedHistory)}
            disabled={loading}
          >
            <div className="button-icon">📚</div>
            <div className="button-text">
              <h3>Load Previous Plan</h3>
              <p>Review and edit a past meal plan</p>
            </div>
            <div className="button-arrow">
              {expandedHistory ? '▼' : '▶'}
            </div>
          </button>

          {/* History List - Expandable */}
          {expandedHistory && (
            <div className="history-list-container">
              {loading && <p className="loading-text">Loading history...</p>}
              
              {error && (
                <div className="error-message">
                  <p>{error}</p>
                  <button onClick={loadHistory} className="retry-btn">Retry</button>
                </div>
              )}

              {!loading && history.length === 0 && (
                <p className="no-history">No previous meal plans found</p>
              )}

              {!loading && history.length > 0 && (
                <div className="history-items">
                  {history.map((entry, idx) => (
                    <button
                      key={idx}
                      className="history-item"
                      onClick={() => handleSelectPlan(entry)}
                    >
                      <div className="history-item-date">
                        📅 {formatDate(entry.created_at)}
                      </div>
                      <div className="history-item-details">
                        {formatMealSummary(entry.meal_plan)}
                      </div>
                      <div className="history-item-arrow">→</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Option 2: Start New Plan */}
          <button 
            className="menu-button menu-button-secondary"
            onClick={onNewPlan}
          >
            <div className="button-icon">✨</div>
            <div className="button-text">
              <h3>Create New Plan</h3>
              <p>Start fresh with a personalized meal plan</p>
            </div>
            <div className="button-arrow">▶</div>
          </button>
        </div>

        {/* User Info */}
        <div className="menu-footer">
          <p className="user-info">Welcome, {user?.email || 'Guest'}!</p>
          <button onClick={onLogout} className="btn-logout-small">Logout</button>
        </div>
      </div>
    </div>
  );
}

export default HistoryMenu;
