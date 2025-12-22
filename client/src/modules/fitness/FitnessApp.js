import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/FitnessApp.css';
import FitnessDashboard from './components/FitnessDashboard';

/**
 * FitnessApp - Main Fitness Module Component
 * 
 * Provides access to fitness tracking:
 * - Workout logging
 * - Exercise tracking
 * - Fitness goals
 * - Progress tracking
 */
export default function FitnessApp({ user, onBack, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [goals, setGoals] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Load user fitness profile on mount
  useEffect(() => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    const loadFitnessData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('auth_token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Load profile
        try {
          const profileRes = await axios.get(`${API_URL}/api/fitness/profile`, { headers });
          setProfile(profileRes.data || {});
        } catch (err) {
          if (err.response?.status !== 404) {
            console.warn('Profile load error:', err);
          }
          setProfile(null);
        }

        // Load workouts
        try {
          const workoutsRes = await axios.get(`${API_URL}/api/fitness/workouts`, { headers });
          setWorkouts(workoutsRes.data || []);
        } catch (err) {
          console.warn('Workouts load error:', err);
          setWorkouts([]);
        }

        // Load goals
        try {
          const goalsRes = await axios.get(`${API_URL}/api/fitness/goals`, { headers });
          setGoals(goalsRes.data || []);
        } catch (err) {
          console.warn('Goals load error:', err);
          setGoals([]);
        }

      } catch (err) {
        console.error('Fitness data load failed:', err);
        setError(err.message || 'Failed to load fitness data');
      } finally {
        setLoading(false);
      }
    };

    loadFitnessData();
  }, [user, API_URL]);

  // Handle profile update
  const handleProfileUpdate = async (profileData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(`${API_URL}/api/fitness/profile`, profileData, { headers });
      setProfile(response.data);
      return response.data;
    } catch (err) {
      console.error('Profile update failed:', err);
      throw err;
    }
  };

  // Handle workout logging
  const handleLogWorkout = async (workoutData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(`${API_URL}/api/fitness/workouts`, workoutData, { headers });
      setWorkouts([...workouts, response.data]);
      return response.data;
    } catch (err) {
      console.error('Workout logging failed:', err);
      throw err;
    }
  };

  // Handle goal setting
  const handleSetGoal = async (goalData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(`${API_URL}/api/fitness/goals`, goalData, { headers });
      setGoals([...goals, response.data]);
      return response.data;
    } catch (err) {
      console.error('Goal setting failed:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="fitness-app fitness-loading">
        <div className="spinner"></div>
        <p>Loading fitness data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fitness-app fitness-error">
        <div className="error-container">
          <h2>⚠️ Error Loading Fitness App</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
          <button onClick={onBack}>Back to Portal</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fitness-app">
      {/* Header */}
      <header className="fitness-header">
        <div className="fitness-header-content">
          <h1>💪 Fitness Tracker</h1>
          <p className="fitness-subtitle">Track your workouts and progress</p>
        </div>
        <div className="fitness-header-actions">
          <button className="fitness-btn-secondary" onClick={onBack}>
            ← Back to Portal
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="fitness-main">
        <FitnessDashboard
          user={user}
          profile={profile}
          workouts={workouts}
          goals={goals}
          onProfileUpdate={handleProfileUpdate}
          onLogWorkout={handleLogWorkout}
          onSetGoal={handleSetGoal}
          onLogout={onLogout}
        />
      </main>
    </div>
  );
}
