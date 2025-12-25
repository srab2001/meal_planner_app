import React from 'react';
import './SetEntry.css';

/**
 * SetEntry Component
 * Single row for entering set details (reps, weight)
 */
function SetEntry({ set, setIndex, onUpdate, onRemove }) {
  const handleChange = (field, value) => {
    onUpdate({
      ...set,
      [field]: value ? Number(value) : null
    });
  };

  return (
    <div className="set-entry">
      <span className="set-number">{set.set_number}</span>

      <input
        type="number"
        value={set.reps || ''}
        onChange={(e) => handleChange('reps', e.target.value)}
        placeholder="10"
        min="0"
        max="999"
        className="reps-input"
      />

      <input
        type="number"
        value={set.weight || ''}
        onChange={(e) => handleChange('weight', e.target.value)}
        placeholder="135"
        min="0"
        max="9999"
        step="0.5"
        className="weight-input"
      />

      <button
        type="button"
        onClick={onRemove}
        className="remove-set-button"
        title="Remove set"
      >
        ✕
      </button>
    </div>
  );
}

export default SetEntry;
