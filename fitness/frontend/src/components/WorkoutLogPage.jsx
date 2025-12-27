import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, ENDPOINTS } from '../config/api';
import './WorkoutLogPage.css';

/**
 * Workout Log Page Component
 *
 * Based on wireframe:
 * - Date selector at top
 * - "+ Add Workout" button
 * - List of workouts with type, duration, exercises count
 * - Click to view workout detail
 */
function WorkoutLogPage({ user, token, mode }) {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(mode === 'new');
  const [newWorkout, setNewWorkout] = useState({
    workout_type: 'strength',
    duration_minutes: 45,
    notes: ''
  });

  useEffect(() => {
    fetchWorkouts();
  }, [token, selectedDate]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}${ENDPOINTS.WORKOUTS}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workouts');
      }

      const data = await response.json();
      const workoutList = data.workouts || [];

      // Filter by selected date
      const filtered = workoutList.filter(w => {
        const workoutDate = new Date(w.workout_date || w.created_at).toISOString().split('T')[0];
        return workoutDate === selectedDate;
      });

      setWorkouts(filtered);
    } catch (err) {
      console.error('Error fetching workouts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkout = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}${ENDPOINTS.WORKOUTS}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workout_date: selectedDate,
          workout_type: newWorkout.workout_type,
          duration_minutes: parseInt(newWorkout.duration_minutes),
          notes: newWorkout.notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create workout');
      }

      setShowAddForm(false);
      setNewWorkout({
        workout_type: 'strength',
        duration_minutes: 45,
        notes: ''
      });
      fetchWorkouts();
    } catch (err) {
      console.error('Error creating workout:', err);
      setError(err.message);
    }
  };

  const formatWorkoutType = (type) => {
    const types = {
      strength: 'Strength Training',
      cardio: 'Cardio Session',
      hiit: 'HIIT Workout'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="workout-log-page workout-log-page--loading">
        Loading workouts...
      </div>
    );
  }

  return (
    <div className="workout-log-page">
      {/* Header with Date Selector */}
      <div className="workout-log-page__header">
        <div className="workout-log-page__date-selector">
          <label>Select Date:</label>
          <input
            type="date"
            className="asr-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <button
          className="asr-btn asr-btn--orange"
          onClick={() => setShowAddForm(true)}
        >
          + Add Workout
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="workout-log-page__error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Add Workout Form */}
      {showAddForm && (
        <div className="workout-log-page__form-card">
          <h3>Add New Workout</h3>
          <form onSubmit={handleAddWorkout}>
            <div className="workout-log-page__form-row">
              <div className="workout-log-page__form-field">
                <label>Workout Type</label>
                <select
                  className="asr-select"
                  value={newWorkout.workout_type}
                  onChange={(e) => setNewWorkout({ ...newWorkout, workout_type: e.target.value })}
                >
                  <option value="strength">Strength Training</option>
                  <option value="cardio">Cardio</option>
                  <option value="hiit">HIIT</option>
                </select>
              </div>
              <div className="workout-log-page__form-field">
                <label>Duration (mins)</label>
                <input
                  type="number"
                  className="asr-input"
                  value={newWorkout.duration_minutes}
                  onChange={(e) => setNewWorkout({ ...newWorkout, duration_minutes: e.target.value })}
                  min={1}
                />
              </div>
            </div>
            <div className="workout-log-page__form-field">
              <label>Notes</label>
              <textarea
                className="asr-textarea"
                value={newWorkout.notes}
                onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                placeholder="Optional notes..."
                rows={2}
              />
            </div>
            <div className="workout-log-page__form-actions">
              <button type="button" className="asr-btn asr-btn--outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button type="submit" className="asr-btn asr-btn--primary">
                Save Workout
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workout List */}
      <div className="workout-log-page__list">
        {workouts.length === 0 ? (
          <div className="workout-log-page__empty">
            No workouts for this date. Click "+ Add Workout" to log one!
          </div>
        ) : (
          workouts.map((workout) => (
            <div
              key={workout.id}
              className="workout-log-page__item"
              onClick={() => navigate(`/workouts/${workout.id}`)}
            >
              <div className="workout-log-page__item-content">
                <h4 className="workout-log-page__item-title">
                  {formatWorkoutType(workout.workout_type)}
                </h4>
                <p className="workout-log-page__item-meta">
                  {workout.duration_minutes} mins | {workout.exercises?.length || 0} Exercises
                </p>
              </div>
              <span className="workout-log-page__item-arrow">›</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default WorkoutLogPage;
