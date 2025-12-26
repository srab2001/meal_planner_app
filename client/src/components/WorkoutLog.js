import React, { useState } from 'react';
import './WorkoutLog.css';
import ExerciseSelector from './ExerciseSelector';
import ExerciseCard from './ExerciseCard';

function WorkoutLog({ onSave, onCancel, initialData = null }) {
  const [workoutDate, setWorkoutDate] = useState(
    initialData?.workoutDate || new Date().toISOString().split('T')[0]
  );
  const [workoutName, setWorkoutName] = useState(initialData?.workoutName || '');
  const [exercises, setExercises] = useState(initialData?.exercises || []);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleAddExercise = (exerciseData) => {
    const newExercise = {
      id: Date.now(), // Temporary ID
      exerciseName: exerciseData.name,
      category: exerciseData.category,
      sets: [
        {
          id: 1,
          reps: 10,
          weight: 0,
          unit: 'lbs'
        }
      ]
    };
    setExercises([...exercises, newExercise]);
    setShowExerciseSelector(false);
  };

  const handleUpdateExercise = (exerciseId, updatedData) => {
    setExercises(exercises.map(ex =>
      ex.id === exerciseId ? { ...ex, ...updatedData } : ex
    ));
  };

  const handleDeleteExercise = (exerciseId) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
  };

  const validate = () => {
    const newErrors = {};

    if (!workoutName.trim()) {
      newErrors.workoutName = 'Please enter a workout name';
    }

    if (!workoutDate) {
      newErrors.workoutDate = 'Please select a date';
    }

    if (exercises.length === 0) {
      newErrors.exercises = 'Please add at least one exercise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);

    const workoutData = {
      workoutDate,
      workoutName: workoutName.trim(),
      exercises: exercises.map(ex => ({
        exerciseName: ex.exerciseName,
        category: ex.category,
        sets: ex.sets.map(set => ({
          reps: parseInt(set.reps) || 0,
          weight: parseFloat(set.weight) || 0,
          unit: set.unit || 'lbs'
        }))
      })),
      notes: notes.trim()
    };

    try {
      await onSave(workoutData);
    } catch (error) {
      console.error('Error saving workout:', error);
      setSaving(false);
    }
  };

  return (
    <div className="workout-log">
      {/* Header */}
      <div className="workout-log-header">
        <button className="back-button" onClick={onCancel}>
          ← Back
        </button>
        <h1>Log Workout</h1>
      </div>

      <div className="workout-log-form">
        {/* Workout Basics */}
        <div className="form-section">
          <h2>Workout Details</h2>

          <div className="form-group">
            <label htmlFor="workoutDate">Date</label>
            <input
              type="date"
              id="workoutDate"
              value={workoutDate}
              onChange={(e) => setWorkoutDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={errors.workoutDate ? 'error' : ''}
            />
            {errors.workoutDate && (
              <span className="error-message">{errors.workoutDate}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="workoutName">Workout Name</label>
            <input
              type="text"
              id="workoutName"
              placeholder="e.g., Upper Body Strength"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              maxLength={50}
              className={errors.workoutName ? 'error' : ''}
            />
            {errors.workoutName && (
              <span className="error-message">{errors.workoutName}</span>
            )}
          </div>
        </div>

        {/* Exercises */}
        <div className="form-section">
          <div className="section-header">
            <h2>Exercises</h2>
            <button
              className="add-exercise-button"
              onClick={() => setShowExerciseSelector(true)}
            >
              + Add Exercise
            </button>
          </div>

          {exercises.length === 0 ? (
            <div className="empty-exercises">
              <p>No exercises added yet</p>
              <button
                className="action-button primary"
                onClick={() => setShowExerciseSelector(true)}
              >
                Add Your First Exercise
              </button>
            </div>
          ) : (
            <div className="exercises-list">
              {exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  exerciseNumber={index + 1}
                  onUpdate={(data) => handleUpdateExercise(exercise.id, data)}
                  onDelete={() => handleDeleteExercise(exercise.id)}
                />
              ))}
            </div>
          )}

          {errors.exercises && (
            <span className="error-message">{errors.exercises}</span>
          )}
        </div>

        {/* Notes */}
        <div className="form-section">
          <h2>Notes (Optional)</h2>
          <textarea
            placeholder="Add any notes about this workout..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={4}
          />
          <div className="char-count">{notes.length}/500</div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            className="action-button secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="action-button primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Workout'}
          </button>
        </div>
      </div>

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <ExerciseSelector
          onAdd={handleAddExercise}
          onClose={() => setShowExerciseSelector(false)}
        />
      )}
    </div>
  );
}

export default WorkoutLog;
