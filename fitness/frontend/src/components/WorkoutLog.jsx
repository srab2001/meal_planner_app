import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ExerciseSelector from './ExerciseSelector';
import ExerciseCard from './ExerciseCard';
import { API_BASE, ENDPOINTS } from '../config/api';
import { colors, spacing, sizes, typography, shadows } from '../styles/wireframe.config';
import './WorkoutLog.css';

/**
 * WorkoutLog Component
 * Manual workout entry form matching wireframe specifications
 * Allows users to create/edit workouts with exercises and sets
 */
function WorkoutLog({ user, token }) {
  const navigate = useNavigate();
  const { id: workoutId } = useParams();
  const editMode = !!workoutId;

  // Form state
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [notes, setNotes] = useState('');

  // UI state
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load existing workout if editing
  useEffect(() => {
    if (editMode && workoutId) {
      loadWorkout(workoutId);
    }
  }, [editMode, workoutId]);

  const loadWorkout = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/fitness/workouts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load workout');

      const { data } = await response.json();

      // Populate form with existing data
      setWorkoutDate(new Date(data.workout_date).toISOString().split('T')[0]);
      setWorkoutName(data.workout_name || '');
      setNotes(data.notes || '');

      // Convert workout_exercises to component format
      const formattedExercises = data.workout_exercises.map(ex => ({
        id: ex.id,
        exercise_name: ex.exercise_name,
        exercise_order: ex.exercise_order,
        sets: ex.sets.map(s => ({
          id: s.id,
          set_number: s.set_number,
          reps: s.reps,
          weight: s.weight,
          duration_seconds: s.duration_seconds
        }))
      }));

      setExercises(formattedExercises);
    } catch (error) {
      console.error('Error loading workout:', error);
      setErrors({ load: 'Failed to load workout' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = (exercise) => {
    setExercises([...exercises, {
      exercise_name: exercise.name,
      exercise_order: exercises.length + 1,
      sets: [
        { set_number: 1, reps: null, weight: null, duration_seconds: null }
      ]
    }]);
    setShowExerciseSelector(false);
  };

  const handleUpdateExercise = (index, updatedExercise) => {
    const newExercises = [...exercises];
    newExercises[index] = updatedExercise;
    setExercises(newExercises);
  };

  const handleRemoveExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!workoutName.trim()) {
      newErrors.workoutName = 'Workout name is required';
    }

    if (!workoutDate) {
      newErrors.workoutDate = 'Date is required';
    }

    if (exercises.length === 0) {
      newErrors.exercises = 'Add at least one exercise';
    }

    // Validate each exercise has at least one set
    exercises.forEach((ex, idx) => {
      if (!ex.sets || ex.sets.length === 0) {
        newErrors[`exercise_${idx}`] = 'Each exercise needs at least one set';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      if (editMode) {
        // Update existing workout
        await updateWorkout();
      } else {
        // Create new workout
        await createWorkout();
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const createWorkout = async () => {
    // Step 1: Create workout
    const workoutResponse = await fetch(`${API_BASE}${ENDPOINTS.WORKOUTS}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workout_date: workoutDate,
        workout_name: workoutName,
        workout_type: 'strength',
        notes: notes || null
      })
    });

    if (!workoutResponse.ok) {
      const errorData = await workoutResponse.json();
      throw new Error(errorData.message || 'Failed to create workout');
    }

    const { workout } = await workoutResponse.json();

    // Step 2: Add exercises with sets
    for (const exercise of exercises) {
      await fetch(`${API_BASE}/api/fitness/workouts/${workout.id}/exercises`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exercise)
      });
    }

    // Navigate to workout detail
    navigate(`/workouts/${workout.id}`);
  };

  const updateWorkout = async () => {
    // Update workout metadata
    await fetch(`${API_BASE}/api/fitness/workouts/${workoutId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workout_name: workoutName,
        workout_date: workoutDate,
        notes: notes
      })
    });

    // Navigate back to workout detail
    navigate(`/workouts/${workoutId}`);
  };

  const handleCancel = () => {
    if (editMode) {
      navigate(`/workouts/${workoutId}`);
    } else {
      navigate('/workouts');
    }
  };

  if (loading) {
    return (
      <div className="workout-log-loading">
        <p>Loading workout...</p>
      </div>
    );
  }

  return (
    <div className="workout-log">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="workout-log-header">
          <button
            type="button"
            onClick={handleCancel}
            className="back-button"
          >
            ← Back
          </button>
          <h2>{editMode ? 'Edit Workout' : 'Log Workout'}</h2>
        </div>

        {/* Workout Basics Section */}
        <section className="workout-basics">
          <div className="form-group">
            <label htmlFor="workout-date">Date *</label>
            <input
              id="workout-date"
              type="date"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
            {errors.workoutDate && (
              <span className="error-message">{errors.workoutDate}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="workout-name">Workout Name *</label>
            <input
              id="workout-name"
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g., Leg Day, Push Workout"
              maxLength={255}
              required
            />
            {errors.workoutName && (
              <span className="error-message">{errors.workoutName}</span>
            )}
          </div>
        </section>

        {/* Exercises Section */}
        <section className="exercises-section">
          <div className="section-header">
            <h3>Exercises</h3>
            <span className="exercise-count">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
          </div>

          {exercises.length === 0 && (
            <div className="empty-state">
              <p>No exercises added yet</p>
              <p className="empty-state-hint">Click "Add Exercise" to get started</p>
            </div>
          )}

          {exercises.map((exercise, index) => (
            <ExerciseCard
              key={index}
              exercise={exercise}
              exerciseIndex={index}
              onUpdate={(updated) => handleUpdateExercise(index, updated)}
              onRemove={() => handleRemoveExercise(index)}
            />
          ))}

          <button
            type="button"
            onClick={() => setShowExerciseSelector(true)}
            className="add-exercise-button"
          >
            + Add Exercise
          </button>

          {errors.exercises && (
            <span className="error-message">{errors.exercises}</span>
          )}
        </section>

        {/* Notes Section */}
        <section className="notes-section">
          <label htmlFor="workout-notes">Notes (optional)</label>
          <textarea
            id="workout-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did the workout feel? Any observations?"
            maxLength={500}
            rows={4}
          />
          <span className="character-count">{notes.length}/500</span>
        </section>

        {/* Submit Error */}
        {errors.submit && (
          <div className="submit-error">
            {errors.submit}
          </div>
        )}

        {/* Footer Buttons */}
        <footer className="workout-log-footer">
          <button
            type="button"
            onClick={handleCancel}
            className="cancel-button"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="save-button"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : editMode ? 'Update Workout' : 'Save Workout'}
          </button>
        </footer>
      </form>

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <ExerciseSelector
          onSelect={handleAddExercise}
          onClose={() => setShowExerciseSelector(false)}
          token={token}
        />
      )}
    </div>
  );
}

export default WorkoutLog;
