import React, { useState, useEffect } from 'react';
import './FitnessTracker.css';
import WorkoutLog from './WorkoutLog';
import ProgressDashboard from './ProgressDashboard';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function FitnessTracker({ user }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [workouts, setWorkouts] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({
    workoutCount: 0,
    totalDuration: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkouts();
    fetchWeeklyStats();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/fitness/workouts`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setWorkouts(data.workouts || []);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/fitness/stats/weekly`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setWeeklyStats(data);
      }
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    }
  };

  const handleSaveWorkout = async (workoutData) => {
    try {
      const response = await fetch(`${API_BASE}/api/fitness/workouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(workoutData)
      });

      if (response.ok) {
        await fetchWorkouts();
        await fetchWeeklyStats();
        setCurrentView('dashboard');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save workout');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Failed to save workout: ' + error.message);
    }
  };

  if (currentView === 'log') {
    return (
      <WorkoutLog
        onSave={handleSaveWorkout}
        onCancel={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'progress') {
    return (
      <ProgressDashboard
        workouts={workouts}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <div className="fitness-tracker">
      {/* Header */}
      <div className="fitness-header">
        <div className="user-greeting">
          <h1>💪 Fitness Tracker</h1>
          <p>Welcome back, {user.full_name || user.email}!</p>
        </div>
      </div>

      {/* Weekly Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏋️</div>
          <div className="stat-content">
            <div className="stat-value">{weeklyStats.workoutCount}</div>
            <div className="stat-label">Workouts This Week</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{weeklyStats.totalDuration} min</div>
            <div className="stat-label">Total Duration</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{weeklyStats.completionRate}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          className="action-button primary"
          onClick={() => setCurrentView('log')}
        >
          <span className="button-icon">📝</span>
          <span className="button-text">Log Workout</span>
        </button>

        <button
          className="action-button secondary"
          onClick={() => setCurrentView('progress')}
        >
          <span className="button-icon">📈</span>
          <span className="button-text">View Progress</span>
        </button>
      </div>

      {/* Recent Workouts */}
      <div className="recent-workouts">
        <h2>Recent Activity</h2>

        {loading ? (
          <div className="loading-skeleton">
            <p>Loading workouts...</p>
          </div>
        ) : workouts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏃</div>
            <h3>No workouts yet</h3>
            <p>Start your fitness journey by logging your first workout!</p>
            <button
              className="action-button primary"
              onClick={() => setCurrentView('log')}
            >
              Log Your First Workout
            </button>
          </div>
        ) : (
          <div className="workout-list">
            {workouts.slice(0, 5).map((workout) => (
              <div key={workout.id} className="workout-card">
                <div className="workout-header">
                  <h3>{workout.workoutName}</h3>
                  <span className="workout-date">
                    {new Date(workout.workoutDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="workout-details">
                  <span className="detail-item">
                    <span className="detail-icon">💪</span>
                    {workout.exerciseCount} exercises
                  </span>
                  <span className="detail-item">
                    <span className="detail-icon">⏱️</span>
                    {workout.duration} min
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FitnessTracker;
