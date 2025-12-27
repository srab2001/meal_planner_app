import React, { useState, useEffect } from 'react';
import { API_BASE, ENDPOINTS } from '../config/api';
import './ProgressSummary.css';

/**
 * Progress Summary Component
 *
 * Based on wireframe:
 * - Weight Progress line chart
 * - Weekly Activity bar chart (Workouts, Calories, Steps)
 */
function ProgressSummary({ user, token }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgressData();
  }, [token]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}${ENDPOINTS.WORKOUTS}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkouts(data.workouts || []);
      }
    } catch (err) {
      console.error('Error fetching progress data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate weekly stats
  const getWeeklyStats = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyWorkouts = workouts.filter(w => {
      const date = new Date(w.workout_date || w.created_at);
      return date >= weekAgo;
    });

    return {
      workouts: weeklyWorkouts.length,
      calories: weeklyWorkouts.reduce((sum, w) => sum + (w.calories_burned || 200), 0),
      steps: 45000 // Placeholder
    };
  };

  const weeklyStats = getWeeklyStats();

  if (loading) {
    return (
      <div className="progress-summary progress-summary--loading">
        Loading progress...
      </div>
    );
  }

  return (
    <div className="progress-summary">
      {/* Header */}
      <h2 className="progress-summary__title">Progress Summary</h2>

      {/* Error */}
      {error && (
        <div className="progress-summary__error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Weight Progress Chart */}
      <div className="progress-summary__card">
        <h3 className="progress-summary__card-title">Weight Progress</h3>
        <div className="progress-summary__chart">
          <div className="progress-summary__line-chart">
            <svg viewBox="0 0 300 100" className="progress-summary__svg">
              {/* Grid lines */}
              <line x1="0" y1="25" x2="300" y2="25" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="0" y1="75" x2="300" y2="75" stroke="#e5e7eb" strokeWidth="1" />

              {/* Progress line */}
              <polyline
                points="0,70 50,65 100,60 150,55 200,50 250,45 300,40"
                fill="none"
                stroke="#5B2C6F"
                strokeWidth="2"
              />

              {/* Data points */}
              <circle cx="0" cy="70" r="4" fill="#5B2C6F" />
              <circle cx="100" cy="60" r="4" fill="#5B2C6F" />
              <circle cx="200" cy="50" r="4" fill="#5B2C6F" />
              <circle cx="300" cy="40" r="4" fill="#5B2C6F" />
            </svg>
            <div className="progress-summary__chart-labels">
              <span>Start</span>
              <span>Now</span>
              <span>Goal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="progress-summary__card">
        <h3 className="progress-summary__card-title">Weekly Activity</h3>
        <div className="progress-summary__bar-chart">
          <div className="progress-summary__bar-group">
            <div className="progress-summary__bar-container">
              <div
                className="progress-summary__bar"
                style={{ height: `${Math.min(weeklyStats.workouts * 15, 100)}%` }}
              ></div>
            </div>
            <span className="progress-summary__bar-label">Workouts</span>
            <span className="progress-summary__bar-value">{weeklyStats.workouts}</span>
          </div>
          <div className="progress-summary__bar-group">
            <div className="progress-summary__bar-container">
              <div
                className="progress-summary__bar progress-summary__bar--calories"
                style={{ height: `${Math.min(weeklyStats.calories / 30, 100)}%` }}
              ></div>
            </div>
            <span className="progress-summary__bar-label">Calories</span>
            <span className="progress-summary__bar-value">{weeklyStats.calories}</span>
          </div>
          <div className="progress-summary__bar-group">
            <div className="progress-summary__bar-container">
              <div
                className="progress-summary__bar progress-summary__bar--steps"
                style={{ height: `${Math.min(weeklyStats.steps / 700, 100)}%` }}
              ></div>
            </div>
            <span className="progress-summary__bar-label">Steps</span>
            <span className="progress-summary__bar-value">{(weeklyStats.steps / 1000).toFixed(0)}k</span>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="progress-summary__stats">
        <div className="progress-summary__stat">
          <span className="progress-summary__stat-value">{workouts.length}</span>
          <span className="progress-summary__stat-label">Total Workouts</span>
        </div>
        <div className="progress-summary__stat">
          <span className="progress-summary__stat-value">{weeklyStats.workouts}</span>
          <span className="progress-summary__stat-label">This Week</span>
        </div>
        <div className="progress-summary__stat">
          <span className="progress-summary__stat-value">
            {workouts.reduce((sum, w) => sum + (w.duration_minutes || 30), 0)}
          </span>
          <span className="progress-summary__stat-label">Total Minutes</span>
        </div>
      </div>
    </div>
  );
}

export default ProgressSummary;
