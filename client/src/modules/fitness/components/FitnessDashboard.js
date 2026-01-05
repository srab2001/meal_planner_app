import React, { useState } from 'react';
import '../styles/FitnessDashboard.css';
import AIWorkoutInterview from './AIWorkoutInterview';
import WorkoutTracking from './WorkoutTracking';
import PlanViewer from './PlanViewer';

/**
 * FitnessDashboard - Main dashboard for fitness tracking
 *
 * Shows:
 * - User fitness profile
 * - Recent workouts
 * - Fitness goals
 * - Progress tracking
 * - AI Workout Coach
 */
export default function FitnessDashboard({
  user,
  profile,
  workouts,
  goals,
  onProfileUpdate,
  onLogWorkout,
  onSetGoal,
  onLogout
}) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [logging, setLogging] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showAIInterview, setShowAIInterview] = useState(false);
  const [showPlanViewer, setShowPlanViewer] = useState(false);

  // Handle workout form submission
  const handleWorkoutSubmit = async (e) => {
    e.preventDefault();
    setLogging(true);
    try {
      const formData = new FormData(e.target);
      const workoutData = {
        exercise_type: formData.get('exercise_type'),
        duration_minutes: parseInt(formData.get('duration_minutes')),
        calories_burned: parseInt(formData.get('calories_burned')),
        intensity: formData.get('intensity'),
        notes: formData.get('notes'),
        workout_date: formData.get('workout_date')
      };
      
      await onLogWorkout(workoutData);
      e.target.reset();
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error logging workout:', error);
      alert('Failed to log workout. Please try again.');
    } finally {
      setLogging(false);
    }
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);
      const profileData = {
        height_cm: parseFloat(formData.get('height_cm')),
        weight_kg: parseFloat(formData.get('weight_kg')),
        age: parseInt(formData.get('age')),
        gender: formData.get('gender'),
        activity_level: formData.get('activity_level')
      };
      
      await onProfileUpdate(profileData);
      setShowProfileForm(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="fitness-dashboard">
      {/* Navigation */}
      <nav className="fitness-nav">
        <button
          className={`fitness-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`fitness-nav-btn ${currentView === 'log-workout' ? 'active' : ''}`}
          onClick={() => setCurrentView('log-workout')}
        >
          ➕ Log Workout
        </button>
        <button
          className={`fitness-nav-btn ${currentView === 'goals' ? 'active' : ''}`}
          onClick={() => setCurrentView('goals')}
        >
          🎯 Goals
        </button>
        <button
          className={`fitness-nav-btn ${currentView === 'profile' ? 'active' : ''}`}
          onClick={() => setCurrentView('profile')}
        >
          👤 Profile
        </button>
        <button
          className="fitness-nav-btn ai-btn"
          onClick={() => setShowAIInterview(true)}
          title="AI Workout Coach"
        >
          🤖 AI Coach
        </button>
        <button
          className="fitness-nav-btn"
          onClick={() => setShowPlanViewer(true)}
          title="View Latest AI Workout Plan"
        >
          📄 My Plan
        </button>
        <button
          className={`fitness-nav-btn ${currentView === 'saved-workouts' ? 'active' : ''}`}
          onClick={() => setCurrentView('saved-workouts')}
        >
          📋 Saved Workouts
        </button>
      </nav>

      {/* Dashboard View */}
      {currentView === 'dashboard' && (
        <div className="fitness-view">
          <h2>Your Fitness Dashboard</h2>
          
          {/* Profile Summary */}
          {profile && (
            <div className="fitness-card profile-summary">
              <h3>👤 Profile Summary</h3>
              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-label">Height</span>
                  <span className="stat-value">{profile.height_cm} cm</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Weight</span>
                  <span className="stat-value">{profile.weight_kg} kg</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Age</span>
                  <span className="stat-value">{profile.age} years</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Activity Level</span>
                  <span className="stat-value">{profile.activity_level}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Workouts */}
          <div className="fitness-card">
            <h3>💪 Recent Workouts</h3>
            {workouts && workouts.length > 0 ? (
              <div className="workouts-list">
                {workouts.slice(-5).reverse().map((workout, idx) => (
                  <div key={idx} className="workout-item">
                    <span className="workout-type">{workout.exercise_type}</span>
                    <span className="workout-duration">{workout.duration_minutes} min</span>
                    <span className="workout-calories">⚡ {workout.calories_burned} cal</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No workouts logged yet. Start by logging your first workout!</p>
            )}
          </div>

          {/* Active Goals */}
          {goals && goals.length > 0 && (
            <div className="fitness-card">
              <h3>🎯 Active Goals</h3>
              <div className="goals-list">
                {goals.map((goal, idx) => (
                  <div key={idx} className="goal-item">
                    <span className="goal-type">{goal.goal_type}</span>
                    <span className="goal-target">{goal.target_value} {goal.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Workout View */}
      {currentView === 'log-workout' && (
        <div className="fitness-view">
          <h2>Log a Workout</h2>
          <form className="fitness-form" onSubmit={handleWorkoutSubmit}>
            <div className="form-group">
              <label htmlFor="workout_date">Date</label>
              <input
                type="date"
                id="workout_date"
                name="workout_date"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="exercise_type">Exercise Type</label>
              <select id="exercise_type" name="exercise_type" required>
                <option value="">Select exercise...</option>
                <option value="running">Running</option>
                <option value="walking">Walking</option>
                <option value="cycling">Cycling</option>
                <option value="swimming">Swimming</option>
                <option value="strength-training">Strength Training</option>
                <option value="yoga">Yoga</option>
                <option value="hiit">HIIT</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="duration_minutes">Duration (minutes)</label>
              <input
                type="number"
                id="duration_minutes"
                name="duration_minutes"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="intensity">Intensity</label>
              <select id="intensity" name="intensity" required>
                <option value="">Select intensity...</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="very-high">Very High</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="calories_burned">Calories Burned</label>
              <input
                type="number"
                id="calories_burned"
                name="calories_burned"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (optional)</label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                placeholder="How did you feel? Any observations?"
              />
            </div>

            <button type="submit" className="fitness-btn-primary" disabled={logging}>
              {logging ? 'Logging...' : 'Log Workout'}
            </button>
          </form>
        </div>
      )}

      {/* Goals View */}
      {currentView === 'goals' && (
        <div className="fitness-view">
          <h2>Your Fitness Goals</h2>
          {goals && goals.length > 0 ? (
            <div className="goals-list full">
              {goals.map((goal, idx) => (
                <div key={idx} className="fitness-card goal-card">
                  <h3>{goal.goal_type}</h3>
                  <p><strong>Target:</strong> {goal.target_value} {goal.unit}</p>
                  <p><strong>Deadline:</strong> {new Date(goal.deadline).toLocaleDateString()}</p>
                  {goal.notes && <p><strong>Notes:</strong> {goal.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No goals set yet. Set your first fitness goal to stay motivated!</p>
          )}
        </div>
      )}

      {/* Profile View */}
      {currentView === 'profile' && (
        <div className="fitness-view">
          <h2>Your Fitness Profile</h2>
          
          {showProfileForm ? (
            <form className="fitness-form" onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label htmlFor="height_cm">Height (cm)</label>
                <input
                  type="number"
                  id="height_cm"
                  name="height_cm"
                  defaultValue={profile?.height_cm || ''}
                  min="100"
                  max="250"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="weight_kg">Weight (kg)</label>
                <input
                  type="number"
                  id="weight_kg"
                  name="weight_kg"
                  defaultValue={profile?.weight_kg || ''}
                  min="30"
                  max="200"
                  step="0.1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  defaultValue={profile?.age || ''}
                  min="13"
                  max="120"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select id="gender" name="gender" defaultValue={profile?.gender || ''} required>
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="activity_level">Activity Level</label>
                <select id="activity_level" name="activity_level" defaultValue={profile?.activity_level || ''} required>
                  <option value="">Select...</option>
                  <option value="sedentary">Sedentary</option>
                  <option value="lightly-active">Lightly Active</option>
                  <option value="moderately-active">Moderately Active</option>
                  <option value="very-active">Very Active</option>
                  <option value="extremely-active">Extremely Active</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="fitness-btn-primary">Save Profile</button>
                <button type="button" className="fitness-btn-secondary" onClick={() => setShowProfileForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-display">
              {profile ? (
                <div className="fitness-card">
                  <div className="profile-info">
                    <div className="info-row">
                      <span className="info-label">Height</span>
                      <span className="info-value">{profile.height_cm} cm</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Weight</span>
                      <span className="info-value">{profile.weight_kg} kg</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Age</span>
                      <span className="info-value">{profile.age} years</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Gender</span>
                      <span className="info-value">{profile.gender}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Activity Level</span>
                      <span className="info-value">{profile.activity_level}</span>
                    </div>
                  </div>
                  <button
                    className="fitness-btn-primary"
                    onClick={() => setShowProfileForm(true)}
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No profile created yet. Set up your profile to get personalized fitness recommendations!</p>
                  <button
                    className="fitness-btn-primary"
                    onClick={() => setShowProfileForm(true)}
                  >
                    Create Profile
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Saved Workouts View */}
      {currentView === 'saved-workouts' && (
        <WorkoutTracking />
      )}

      {/* AI Workout Interview Modal */}
      {showAIInterview && (
        <AIWorkoutInterview
          user={user}
          onWorkoutGenerated={(workout) => {
            // Workout is saved by the AI Interview backend
            // Close interview and show the plan viewer
            setShowAIInterview(false);
            setShowPlanViewer(true);
            setCurrentView('dashboard');
          }}
          onClose={() => setShowAIInterview(false)}
        />
      )}

      {/* Plan Viewer Modal */}
      {showPlanViewer && (
        <div className="modal-overlay">
          <PlanViewer onClose={() => setShowPlanViewer(false)} />
        </div>
      )}
    </div>
  );
}
