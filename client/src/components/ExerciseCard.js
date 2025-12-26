import React, { useState } from 'react';
import './ExerciseCard.css';

function ExerciseCard({ exercise, exerciseNumber, onUpdate, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAddSet = () => {
    const newSet = {
      id: exercise.sets.length + 1,
      reps: 10,
      weight: 0,
      unit: 'lbs'
    };
    onUpdate({
      sets: [...exercise.sets, newSet]
    });
  };

  const handleUpdateSet = (setIndex, field, value) => {
    const updatedSets = exercise.sets.map((set, index) =>
      index === setIndex ? { ...set, [field]: value } : set
    );
    onUpdate({ sets: updatedSets });
  };

  const handleDeleteSet = (setIndex) => {
    if (exercise.sets.length === 1) {
      alert('An exercise must have at least one set');
      return;
    }
    const updatedSets = exercise.sets.filter((_, index) => index !== setIndex);
    onUpdate({ sets: updatedSets });
  };

  return (
    <div className="exercise-card">
      {/* Exercise Header */}
      <div className="exercise-card-header">
        <div className="exercise-title">
          <span className="exercise-number">{exerciseNumber}</span>
          <div className="exercise-details">
            <h3>{exercise.exerciseName}</h3>
            <span className="exercise-category">{exercise.category}</span>
          </div>
        </div>

        <div className="exercise-actions">
          <button
            className="toggle-button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <button
            className="delete-button"
            onClick={onDelete}
            title="Delete exercise"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Sets Table */}
      {isExpanded && (
        <div className="sets-section">
          <div className="sets-header">
            <span className="set-col">Set</span>
            <span className="reps-col">Reps</span>
            <span className="weight-col">Weight</span>
            <span className="actions-col"></span>
          </div>

          {exercise.sets.map((set, index) => (
            <div key={index} className="set-row">
              <span className="set-col set-number">{index + 1}</span>

              <input
                type="number"
                className="reps-col"
                value={set.reps}
                onChange={(e) => handleUpdateSet(index, 'reps', e.target.value)}
                min="1"
                max="100"
              />

              <div className="weight-col weight-input-group">
                <input
                  type="number"
                  value={set.weight}
                  onChange={(e) => handleUpdateSet(index, 'weight', e.target.value)}
                  min="0"
                  max="1000"
                  step="5"
                />
                <select
                  value={set.unit}
                  onChange={(e) => handleUpdateSet(index, 'unit', e.target.value)}
                  className="unit-select"
                >
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                </select>
              </div>

              <button
                className="actions-col delete-set-button"
                onClick={() => handleDeleteSet(index)}
                title="Delete set"
              >
                ✕
              </button>
            </div>
          ))}

          <button className="add-set-button" onClick={handleAddSet}>
            + Add Set
          </button>
        </div>
      )}
    </div>
  );
}

export default ExerciseCard;
