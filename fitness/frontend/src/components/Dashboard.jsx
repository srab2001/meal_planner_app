import React, { useState, useEffect } from 'react';
import { API_BASE, ENDPOINTS } from '../config/api';
import './Dashboard.module.css';

/**
 * Fitness Dashboard Component
 * Shows user's fitness profile, goals, workout history, and progress charts
 */
function Dashboard({ user, token }) {
  const [profile, setProfile] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile
      const profileResponse = await fetch(`${API_BASE}${ENDPOINTS.PROFILE}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }

      // Fetch workouts
      const workoutsResponse = await fetch(`${API_BASE}${ENDPOINTS.WORKOUTS}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (workoutsResponse.ok) {
        const workoutsData = await workoutsResponse.json();
        setWorkouts(Array.isArray(workoutsData) ? workoutsData : workoutsData.workouts || []);
      }

      // Fetch goals
      const goalsResponse = await fetch(`${API_BASE}${ENDPOINTS.GOALS}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        setGoals(Array.isArray(goalsData) ? goalsData : goalsData.goals || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard loading">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="dashboard error">
        <h2>❌ Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="retry-btn">Retry</button>
      </div>
    );
  }

  const recentWorkouts = workouts.slice(0, 5);
  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);

  return (
    <div className="dashboard">
      <h2>📊 Fitness Dashboard</h2>

      {/* User Profile Card */}
      {profile && (
        <div className="profile-card">
          <h3>👤 Profile</h3>
          <div className="profile-grid">
            <div className="profile-item">
              <span className="label">Name:</span>
              <span className="value">{profile.name || user.email}</span>
            </div>
            <div className="profile-item">
              <span className="label">Age:</span>
              <span className="value">{profile.age || 'Not set'}</span>
            </div>
            <div className="profile-item">
              <span className="label">Fitness Level:</span>
              <span className="value">{profile.fitness_level || 'Not set'}</span>
            </div>
            <div className="profile-item">
              <span className="label">Height:</span>
              <span className="value">{profile.height || 'Not set'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{totalWorkouts}</div>
          <div className="stat-label">Total Workouts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.round(totalDuration)}</div>
          <div className="stat-label">Total Minutes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{goals.length}</div>
          <div className="stat-label">Active Goals</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {totalWorkouts > 0 ? (totalDuration / totalWorkouts).toFixed(1) : '0'}
          </div>
          <div className="stat-label">Avg Duration (min)</div>
        </div>
      </div>

      {/* Active Goals */}
      {goals.length > 0 && (
        <div className="goals-section">
          <h3>🎯 Active Goals</h3>
          <div className="goals-list">
            {goals.map(goal => (
              <div key={goal.id} className="goal-item">
                <h4>{goal.title}</h4>
                <p>{goal.description}</p>
                <div className="goal-meta">
                  <span>Target: {goal.target_value}</span>
                  <span>Progress: {goal.current_progress || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <div className="workouts-section">
          <h3>💪 Recent Workouts</h3>
          <div className="workouts-list">
            {recentWorkouts.map(workout => (
              <div key={workout.id} className="workout-item">
                <div className="workout-info">
                  <h4>{workout.title}</h4>
                  <p className="workout-date">
                    {new Date(workout.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="workout-stats">
                  <span>{workout.duration} min</span>
                  {workout.intensity && <span className="intensity">{workout.intensity}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentWorkouts.length === 0 && (
        <div className="empty-state">
          <p>No workouts yet. Start logging your workouts to see progress!</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
