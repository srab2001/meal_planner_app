import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, ENDPOINTS } from '../config/api';
import './FitnessDashboard.css';

/**
 * Fitness Dashboard Component
 *
 * Based on wireframe:
 * - Welcome header with user profile icon
 * - Stats cards: Current Weight, Weekly Workouts, Active Goal, Calories
 * - Recent Workouts list with "View All" link
 * - Progress Overview with Weight and Calories charts
 */
function FitnessDashboard({ user, token }) {
  const navigate = useNavigate();
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

  // Calculate stats
  const thisWeekWorkouts = workouts.filter(w => {
    const workoutDate = new Date(w.workout_date || w.created_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return workoutDate >= weekAgo;
  });

  const activeGoal = goals.find(g => g.status === 'active');
  const totalCalories = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
  const currentWeight = profile?.weight_kg || 75;

  const recentWorkouts = workouts.slice(0, 3);

  if (loading) {
    return (
      <div className="fitness-dashboard fitness-dashboard--loading">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="fitness-dashboard fitness-dashboard--error">
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button className="asr-btn asr-btn--primary" onClick={fetchDashboardData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="fitness-dashboard">
      {/* Welcome Header */}
      <div className="fitness-dashboard__welcome">
        <div className="fitness-dashboard__welcome-content">
          <span className="fitness-dashboard__welcome-icon">👋</span>
          <h2 className="fitness-dashboard__welcome-text">
            Welcome, {user?.name || user?.email?.split('@')[0] || 'User'}!
          </h2>
        </div>
        <div className="fitness-dashboard__profile-icon">
          <span>👤</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="fitness-dashboard__stats">
        <div className="fitness-dashboard__stat-card">
          <div className="fitness-dashboard__stat-label">Current Weight</div>
          <div className="fitness-dashboard__stat-value">
            {currentWeight}<span className="fitness-dashboard__stat-unit">kg</span>
          </div>
        </div>
        <div className="fitness-dashboard__stat-card">
          <div className="fitness-dashboard__stat-label">Weekly Workouts</div>
          <div className="fitness-dashboard__stat-value">
            {thisWeekWorkouts.length}<span className="fitness-dashboard__stat-unit">Sessions</span>
          </div>
        </div>
        <div className="fitness-dashboard__stat-card">
          <div className="fitness-dashboard__stat-label">Active Goal</div>
          <div className="fitness-dashboard__stat-value fitness-dashboard__stat-value--text">
            {activeGoal?.goal_type?.replace(/_/g, ' ') || 'None set'}
          </div>
        </div>
        <div className="fitness-dashboard__stat-card">
          <div className="fitness-dashboard__stat-label">Calories</div>
          <div className="fitness-dashboard__stat-value">
            {totalCalories}<span className="fitness-dashboard__stat-unit">kcal</span>
          </div>
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="fitness-dashboard__section">
        <div className="fitness-dashboard__section-header">
          <h3 className="fitness-dashboard__section-title">Recent Workouts</h3>
          <button
            className="fitness-dashboard__view-all"
            onClick={() => navigate('/workouts')}
          >
            View All
          </button>
        </div>
        <div className="fitness-dashboard__workout-list">
          {recentWorkouts.length === 0 ? (
            <div className="fitness-dashboard__empty">
              No workouts yet. <a href="/workouts/new">Start your first workout!</a>
            </div>
          ) : (
            recentWorkouts.map((workout, index) => (
              <div
                key={workout.id || index}
                className="fitness-dashboard__workout-item"
                onClick={() => navigate(`/workouts/${workout.id}`)}
              >
                <div className="fitness-dashboard__workout-checkbox">
                  <input type="checkbox" checked readOnly />
                </div>
                <div className="fitness-dashboard__workout-info">
                  <span className="fitness-dashboard__workout-name">
                    {workout.workout_type || workout.title || 'Workout'} - {workout.duration_minutes || 30} mins
                  </span>
                </div>
                <span className="fitness-dashboard__workout-arrow">›</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="fitness-dashboard__section">
        <h3 className="fitness-dashboard__section-title">Progress Overview</h3>
        <div className="fitness-dashboard__charts">
          <div className="fitness-dashboard__chart">
            <h4 className="fitness-dashboard__chart-title">Weight</h4>
            <div className="fitness-dashboard__chart-placeholder">
              {/* Placeholder bar chart */}
              <div className="fitness-dashboard__bar-chart">
                <div className="fitness-dashboard__bar" style={{ height: '60%' }}></div>
                <div className="fitness-dashboard__bar" style={{ height: '55%' }}></div>
                <div className="fitness-dashboard__bar" style={{ height: '50%' }}></div>
                <div className="fitness-dashboard__bar" style={{ height: '45%' }}></div>
              </div>
              <div className="fitness-dashboard__chart-dots">
                <span className="fitness-dashboard__dot fitness-dashboard__dot--active"></span>
                <span className="fitness-dashboard__dot"></span>
                <span className="fitness-dashboard__dot"></span>
                <span className="fitness-dashboard__dot"></span>
              </div>
            </div>
          </div>
          <div className="fitness-dashboard__chart">
            <h4 className="fitness-dashboard__chart-title">Calories</h4>
            <div className="fitness-dashboard__chart-placeholder">
              {/* Placeholder bar chart */}
              <div className="fitness-dashboard__bar-chart">
                <div className="fitness-dashboard__bar" style={{ height: '70%' }}></div>
                <div className="fitness-dashboard__bar" style={{ height: '80%' }}></div>
                <div className="fitness-dashboard__bar" style={{ height: '65%' }}></div>
                <div className="fitness-dashboard__bar" style={{ height: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FitnessDashboard;
