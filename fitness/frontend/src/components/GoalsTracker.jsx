import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, ENDPOINTS } from '../config/api';
import './GoalsTracker.css';

/**
 * Goals Tracker Component
 *
 * Based on wireframe:
 * - List of goals with icons
 * - Target and progress info
 * - Click to view/edit goal
 */
function GoalsTracker({ user, token }) {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGoals();
  }, [token]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}${ENDPOINTS.GOALS}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }

      const data = await response.json();
      setGoals(data.goals || []);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGoalIcon = (goalType) => {
    const icons = {
      weight_loss: '❤️',
      muscle_gain: '💪',
      endurance: '⭐',
      strength: '🏋️',
      flexibility: '🧘',
      general_fitness: '🎯'
    };
    return icons[goalType] || '🎯';
  };

  const formatGoalType = (goalType) => {
    return goalType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Custom Goal';
  };

  const calculateProgress = (goal) => {
    // Placeholder progress calculation
    // In real app, this would compare current vs target
    if (!goal.target_value) return null;
    const progress = Math.floor(Math.random() * 100); // Placeholder
    return progress;
  };

  if (loading) {
    return (
      <div className="goals-tracker goals-tracker--loading">
        Loading goals...
      </div>
    );
  }

  return (
    <div className="goals-tracker">
      {/* Header */}
      <div className="goals-tracker__header">
        <h2 className="goals-tracker__title">Goals Tracker</h2>
        <button
          className="asr-btn asr-btn--orange"
          onClick={() => navigate('/goals/new')}
        >
          + Create Goal
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="goals-tracker__error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Goals List */}
      <div className="goals-tracker__list">
        {goals.length === 0 ? (
          <div className="goals-tracker__empty">
            <p>No goals yet.</p>
            <button
              className="asr-btn asr-btn--primary"
              onClick={() => navigate('/goals/new')}
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = calculateProgress(goal);
            return (
              <div
                key={goal.id}
                className="goals-tracker__item"
                onClick={() => navigate(`/goals/${goal.id}/edit`)}
              >
                <div className="goals-tracker__item-icon">
                  {getGoalIcon(goal.goal_type)}
                </div>
                <div className="goals-tracker__item-content">
                  <h4 className="goals-tracker__item-title">
                    {formatGoalType(goal.goal_type)}
                  </h4>
                  <p className="goals-tracker__item-meta">
                    {goal.target_value ? (
                      <>
                        Target: {goal.target_value} {goal.unit || ''} |
                        Progress: {progress !== null ? `${progress}%` : 'N/A'}
                      </>
                    ) : (
                      <>Status: {goal.status || 'active'}</>
                    )}
                  </p>
                </div>
                <span className="goals-tracker__item-arrow">›</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default GoalsTracker;
