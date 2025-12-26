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
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({
    goal_type: '',
    target_value: '',
    unit: '',
    start_date: new Date().toISOString().split('T')[0],
    target_date: ''
  });

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

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}${ENDPOINTS.GOALS}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          goal_type: goalForm.goal_type,
          target_value: parseFloat(goalForm.target_value) || null,
          unit: goalForm.unit || null,
          start_date: goalForm.start_date || null,
          target_date: goalForm.target_date || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGoals([...goals, data.goal]);
        setShowGoalForm(false);
        setGoalForm({
          goal_type: '',
          target_value: '',
          unit: '',
          start_date: new Date().toISOString().split('T')[0],
          target_date: ''
        });
      } else {
        const errorData = await response.json();
        alert(`Error creating goal: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error creating goal:', err);
      alert(`Error: ${err.message}`);
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
      <div className="goals-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>🎯 Active Goals</h3>
          <button
            onClick={() => setShowGoalForm(true)}
            className="create-goal-btn"
            style={{
              padding: '8px 16px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            + Create Goal
          </button>
        </div>

        {goals.length > 0 ? (
          <div className="goals-list">
            {goals.map(goal => (
              <div key={goal.id} className="goal-item">
                <h4>{goal.goal_type}</h4>
                {goal.target_value && (
                  <div className="goal-meta">
                    <span>Target: {goal.target_value} {goal.unit}</span>
                    <span>Target Date: {goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'Not set'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666', marginTop: '12px' }}>No goals yet. Create your first fitness goal!</p>
        )}
      </div>

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

      {/* Goal Creation Modal */}
      {showGoalForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowGoalForm(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Create New Fitness Goal</h3>
            <form onSubmit={handleCreateGoal}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Goal Type *
                </label>
                <select
                  value={goalForm.goal_type}
                  onChange={(e) => setGoalForm({ ...goalForm, goal_type: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">Select goal type...</option>
                  <option value="weight_loss">Weight Loss</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="endurance">Endurance</option>
                  <option value="strength">Strength</option>
                  <option value="flexibility">Flexibility</option>
                  <option value="general_fitness">General Fitness</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Target Value
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={goalForm.target_value}
                  onChange={(e) => setGoalForm({ ...goalForm, target_value: e.target.value })}
                  placeholder="e.g., 150, 10, 5"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Unit
                </label>
                <input
                  type="text"
                  value={goalForm.unit}
                  onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })}
                  placeholder="e.g., lbs, kg, minutes, reps"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={goalForm.start_date}
                  onChange={(e) => setGoalForm({ ...goalForm, start_date: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Target Date
                </label>
                <input
                  type="date"
                  value={goalForm.target_date}
                  onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowGoalForm(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#f5f5f5',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
