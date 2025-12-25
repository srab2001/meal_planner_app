import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE } from '../config/api';
import './WorkoutDetail.css';

/**
 * WorkoutDetail Component
 * Displays a single workout with all exercises and sets
 * Allows viewing, editing, and deleting workouts
 */
function WorkoutDetail({ user, token }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadWorkout();
    }
  }, [id]);

  const loadWorkout = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/fitness/workouts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Workout not found');
        }
        throw new Error('Failed to load workout');
      }

      const { data } = await response.json();
      setWorkout(data);
    } catch (err) {
      console.error('Error loading workout:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/workouts/${id}/edit`);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this workout? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const response = await fetch(`${API_BASE}/api/fitness/workouts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete workout');
      }

      // Navigate back to workouts list
      navigate('/workouts');
    } catch (err) {
      console.error('Error deleting workout:', err);
      alert('Failed to delete workout: ' + err.message);
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTotalVolume = () => {
    if (!workout || !workout.workout_exercises) return 0;

    let totalVolume = 0;
    workout.workout_exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.weight && set.reps) {
          totalVolume += set.weight * set.reps;
        }
      });
    });

    return totalVolume.toFixed(0);
  };

  const calculateTotalSets = () => {
    if (!workout || !workout.workout_exercises) return 0;
    return workout.workout_exercises.reduce((total, ex) => total + ex.sets.length, 0);
  };

  if (loading) {
    return (
      <div className="workout-detail-loading">
        <p>Loading workout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workout-detail-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/workouts')} className="back-to-list-btn">
          Back to Workouts
        </button>
      </div>
    );
  }

  if (!workout) {
    return null;
  }

  return (
    <div className="workout-detail">
      {/* Header */}
      <div className="workout-detail-header">
        <button onClick={() => navigate('/workouts')} className="back-button">
          ← Back
        </button>
        <div className="header-actions">
          <button onClick={handleEdit} className="edit-button">
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="delete-button"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Workout Info */}
      <div className="workout-info-card">
        <h1 className="workout-title">{workout.workout_name || 'Untitled Workout'}</h1>
        <p className="workout-date">{formatDate(workout.workout_date)}</p>

        {/* Stats */}
        <div className="workout-stats">
          <div className="stat-item">
            <span className="stat-value">{workout.workout_exercises?.length || 0}</span>
            <span className="stat-label">Exercises</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{calculateTotalSets()}</span>
            <span className="stat-label">Total Sets</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{calculateTotalVolume()}</span>
            <span className="stat-label">Volume (lbs)</span>
          </div>
          {workout.duration_minutes && (
            <div className="stat-item">
              <span className="stat-value">{workout.duration_minutes}</span>
              <span className="stat-label">Minutes</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {workout.notes && (
          <div className="workout-notes">
            <h3>Notes</h3>
            <p>{workout.notes}</p>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className="exercises-section">
        <h2>Exercises</h2>

        {workout.workout_exercises && workout.workout_exercises.length > 0 ? (
          workout.workout_exercises
            .sort((a, b) => (a.exercise_order || 0) - (b.exercise_order || 0))
            .map((exercise, exIdx) => (
              <div key={exercise.id} className="exercise-detail-card">
                <div className="exercise-header">
                  <span className="exercise-number">{exIdx + 1}</span>
                  <h3 className="exercise-name">{exercise.exercise_name}</h3>
                </div>

                {/* Sets Table */}
                <div className="sets-table">
                  <div className="sets-table-header">
                    <span className="set-col">Set</span>
                    <span className="reps-col">Reps</span>
                    <span className="weight-col">Weight</span>
                  </div>

                  {exercise.sets
                    .sort((a, b) => a.set_number - b.set_number)
                    .map((set) => (
                      <div key={set.id} className="set-row">
                        <span className="set-col">{set.set_number}</span>
                        <span className="reps-col">{set.reps || '-'}</span>
                        <span className="weight-col">
                          {set.weight ? `${set.weight} lbs` : '-'}
                        </span>
                      </div>
                    ))}

                  {/* Set Summary */}
                  <div className="set-summary">
                    <span className="summary-label">Total:</span>
                    <span className="summary-value">
                      {exercise.sets.reduce((sum, s) => sum + (s.reps || 0), 0)} reps
                    </span>
                    <span className="summary-value">
                      {exercise.sets
                        .reduce((sum, s) => {
                          if (s.weight && s.reps) {
                            return sum + s.weight * s.reps;
                          }
                          return sum;
                        }, 0)
                        .toFixed(0)}{' '}
                      lbs volume
                    </span>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="no-exercises">
            <p>No exercises recorded for this workout</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkoutDetail;
