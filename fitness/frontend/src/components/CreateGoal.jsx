import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, ENDPOINTS } from '../config/api';
import './CreateGoal.css';

/**
 * Screen A - Create Fitness Goal
 * Simple form with Goal Name and Goal Description
 * After saving, navigates to AI Coach questionnaire
 */
function CreateGoal({ user, token }) {
  const navigate = useNavigate();
  const [goalName, setGoalName] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!goalName.trim()) {
      setError('Please enter a goal name');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Check if using demo token - skip backend for demo users
      const isDemoUser = token && token.startsWith('demo-token-');

      if (isDemoUser) {
        // For demo users, skip backend and navigate directly
        const demoGoalId = 'demo-goal-' + Date.now();
        navigate('/ai-coach', {
          state: {
            goalId: demoGoalId,
            goalName: goalName.trim(),
            goalDescription: goalDescription.trim()
          }
        });
        return;
      }

      const response = await fetch(`${API_BASE}${ENDPOINTS.GOALS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          goal_type: goalName.trim(),
          target_value: null,
          unit: goalDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create goal');
      }

      const data = await response.json();

      // Navigate to AI Coach with the goal ID
      navigate('/ai-coach', {
        state: {
          goalId: data.goal?.id,
          goalName: goalName.trim(),
          goalDescription: goalDescription.trim()
        }
      });
    } catch (err) {
      console.error('Error creating goal:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="create-goal">
      <div className="create-goal__card">
        <h1 className="create-goal__title">Create Fitness Goal</h1>
        <p className="create-goal__subtitle">
          Define your fitness objective, then let our AI Coach build your personalized workout plan.
        </p>

        {error && (
          <div className="create-goal__error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-goal__form">
          <div className="create-goal__field">
            <label htmlFor="goalName" className="create-goal__label">
              Goal Name <span className="create-goal__required">*</span>
            </label>
            <input
              type="text"
              id="goalName"
              className="create-goal__input"
              placeholder="e.g., Build muscle, Lose 20 lbs, Run a 5K"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>

          <div className="create-goal__field">
            <label htmlFor="goalDescription" className="create-goal__label">
              Goal Description
            </label>
            <textarea
              id="goalDescription"
              className="create-goal__textarea"
              placeholder="Describe your goal in more detail (optional)"
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              disabled={saving}
              rows={4}
            />
          </div>

          <button
            type="submit"
            className="create-goal__button"
            disabled={saving || !goalName.trim()}
          >
            {saving ? 'Saving...' : 'Continue to AI Coach'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateGoal;
