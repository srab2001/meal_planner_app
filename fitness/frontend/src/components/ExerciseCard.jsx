import React, { useState } from 'react';
import SetEntry from './SetEntry';
import './ExerciseCard.css';

/**
 * ExerciseCard Component
 * Displays a single exercise with its sets
 * Allows adding/editing/removing sets
 */
function ExerciseCard({ exercise, exerciseIndex, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(true);

  const handleAddSet = () => {
    const newSet = {
      set_number: exercise.sets.length + 1,
      reps: null,
      weight: null,
      duration_seconds: null
    };

    onUpdate({
      ...exercise,
      sets: [...exercise.sets, newSet]
    });
  };

  const handleUpdateSet = (setIndex, updatedSet) => {
    const newSets = [...exercise.sets];
    newSets[setIndex] = updatedSet;

    onUpdate({
      ...exercise,
      sets: newSets
    });
  };

  const handleRemoveSet = (setIndex) => {
    const newSets = exercise.sets.filter((_, idx) => idx !== setIndex);

    // Renumber sets
    const renumberedSets = newSets.map((set, idx) => ({
      ...set,
      set_number: idx + 1
    }));

    onUpdate({
      ...exercise,
      sets: renumberedSets
    });
  };

  return (
    <div className="exercise-card">
      {/* Exercise Header */}
      <div className="exercise-header">
        <div className="exercise-info">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="expand-button"
          >
            {expanded ? '▼' : '▶'}
          </button>
          <div className="exercise-details">
            <h4 className="exercise-name">{exercise.exercise_name}</h4>
            <span className="sets-summary">{exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="remove-exercise-button"
          title="Remove exercise"
        >
          ✕
        </button>
      </div>

      {/* Sets List */}
      {expanded && (
        <div className="sets-container">
          {/* Sets Header */}
          <div className="sets-header">
            <span className="set-label">Set</span>
            <span className="reps-label">Reps</span>
            <span className="weight-label">Weight (lbs)</span>
            <span className="actions-label"></span>
          </div>

          {/* Set Entries */}
          {exercise.sets.map((set, setIndex) => (
            <SetEntry
              key={setIndex}
              set={set}
              setIndex={setIndex}
              onUpdate={(updated) => handleUpdateSet(setIndex, updated)}
              onRemove={() => handleRemoveSet(setIndex)}
            />
          ))}

          {/* Add Set Button */}
          <button
            type="button"
            onClick={handleAddSet}
            className="add-set-button"
          >
            + Add Set
          </button>
        </div>
      )}
    </div>
  );
}

export default ExerciseCard;
