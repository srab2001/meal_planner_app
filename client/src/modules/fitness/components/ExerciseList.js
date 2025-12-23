import React from 'react';

/**
 * ExerciseList - Display list of exercises
 * 
 * Props:
 * - exercises: Array of exercise names/descriptions
 * - setsReps: Optional string describing sets and reps
 * - notes: Optional section notes or tips
 * 
 * Features:
 * - Numbered list of exercises
 * - Clean, scannable formatting
 * - Optional descriptions for each exercise
 * - Sets/reps guidance
 * - Form tips and notes
 */
export default function ExerciseList({ exercises, setsReps, notes }) {
  if (!exercises || exercises.length === 0) {
    return <p className="no-exercises">No exercises in this section</p>;
  }

  return (
    <div className="exercise-list">
      <ol className="exercise-items">
        {exercises.map((exercise, idx) => (
          <li key={idx} className="exercise-item">
            <span className="exercise-name">{exercise}</span>
          </li>
        ))}
      </ol>

      {/* Sets/Reps if provided */}
      {setsReps && (
        <div className="sets-reps-info">
          <p className="sets-reps-text">
            <strong>Repetition:</strong> {setsReps}
          </p>
        </div>
      )}

      {/* Form Tips */}
      {notes && (
        <div className="exercise-notes">
          <p className="notes-text">{notes}</p>
        </div>
      )}
    </div>
  );
}
