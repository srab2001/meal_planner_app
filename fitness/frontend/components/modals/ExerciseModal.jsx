/**
 * Fitness Module - Exercise Modal Component
 * Implements Wireframe 2: "Add Exercise" - Modal Dialog
 */

import React, { useState } from 'react';
import styles from './modals/ExerciseModal.module.css';

// Sample exercise data - in production, this would come from an API
const EXERCISE_CATEGORIES = {
  chest: {
    name: 'Chest',
    exercises: [
      'Barbell Bench Press',
      'Dumbbell Bench Press',
      'Incline Bench Press',
      'Push-ups',
      'Cable Flyes',
    ]
  },
  back: {
    name: 'Back',
    exercises: [
      'Barbell Row',
      'Dumbbell Row',
      'Pull-ups',
      'Lat Pulldown',
      'Deadlift',
    ]
  },
  legs: {
    name: 'Legs',
    exercises: [
      'Barbell Squat',
      'Leg Press',
      'Leg Curl',
      'Leg Extension',
      'Calf Raises',
    ]
  },
  shoulders: {
    name: 'Shoulders',
    exercises: [
      'Shoulder Press',
      'Lateral Raise',
      'Front Raise',
      'Shrugs',
      'Reverse Flyes',
    ]
  },
  arms: {
    name: 'Arms',
    exercises: [
      'Barbell Curl',
      'Dumbbell Curl',
      'Tricep Dips',
      'Tricep Pushdown',
      'Preacher Curl',
    ]
  },
  core: {
    name: 'Core',
    exercises: [
      'Ab Wheel Rollout',
      'Cable Crunch',
      'Planks',
      'Decline Situps',
      'Hanging Leg Raises',
    ]
  },
};

const ExerciseModal = ({ onAdd, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sets, setSets] = useState([
    { reps: '', weight: '', unit: 'lbs', duration: '' }
  ]);

  // ============================================================================
  // FILTERING & SEARCH
  // ============================================================================

  const filteredExercises = Object.entries(EXERCISE_CATEGORIES)
    .filter(([key]) => selectedCategories.length === 0 || selectedCategories.includes(key))
    .flatMap(([category, data]) => 
      data.exercises
        .filter(exercise => 
          exercise.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(exercise => ({ name: exercise, category }))
    );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise);
  };

  const handleAddSet = () => {
    setSets([...sets, { reps: '', weight: '', unit: 'lbs', duration: '' }]);
  };

  const handleRemoveSet = (index) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const handleSetChange = (index, field, value) => {
    setSets(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = () => {
    if (!selectedExercise) {
      alert('Please select an exercise');
      return;
    }

    const exerciseData = {
      id: `${Date.now()}`,
      exerciseName: selectedExercise.name,
      category: selectedExercise.category,
      sets: sets.filter(set => set.reps || set.weight || set.duration),
    };

    onAdd(exerciseData);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* HEADER */}
        <div className={styles.header}>
          <h2 className={styles.title}>Add Exercise</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          {/* SEARCH */}
          <div className={styles.searchSection}>
            <input
              type="text"
              placeholder="🔍 Search (e.g. squat)"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* CATEGORIES */}
          <div className={styles.categoriesSection}>
            <label className={styles.sectionLabel}>Categories</label>
            <div className={styles.categoryList}>
              {Object.entries(EXERCISE_CATEGORIES).map(([key, data]) => (
                <label key={key} className={styles.categoryCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(key)}
                    onChange={() => handleCategoryToggle(key)}
                  />
                  <span>{data.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* EXERCISE LIST */}
          {filteredExercises.length > 0 && (
            <div className={styles.exerciseSection}>
              <label className={styles.sectionLabel}>Select Exercise</label>
              <div className={styles.exerciseList}>
                {filteredExercises.map((exercise, idx) => (
                  <button
                    key={idx}
                    className={`${styles.exerciseOption} ${
                      selectedExercise?.name === exercise.name ? styles.selected : ''
                    }`}
                    onClick={() => handleSelectExercise(exercise)}
                  >
                    {exercise.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SET CONFIGURATION */}
          {selectedExercise && (
            <div className={styles.setsSection}>
              <label className={styles.sectionLabel}>Configure Sets</label>
              <div className={styles.setsList}>
                {sets.map((set, index) => (
                  <div key={index} className={styles.setRow}>
                    <span className={styles.setNumber}>Set {index + 1}:</span>
                    
                    <input
                      type="number"
                      placeholder="Reps"
                      value={set.reps}
                      onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                      className={styles.setInput}
                    />
                    
                    <input
                      type="number"
                      placeholder="Weight"
                      value={set.weight}
                      onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                      className={styles.setInput}
                    />
                    
                    <select
                      value={set.unit}
                      onChange={(e) => handleSetChange(index, 'unit', e.target.value)}
                      className={styles.unitSelect}
                    >
                      <option value="lbs">lbs</option>
                      <option value="kg">kg</option>
                    </select>

                    {sets.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeSetButton}
                        onClick={() => handleRemoveSet(index)}
                        aria-label="Remove set"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={styles.addSetButton}
                onClick={handleAddSet}
              >
                + Add Set
              </button>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles.addButton}
            onClick={handleSubmit}
            disabled={!selectedExercise}
          >
            Add Exercise
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseModal;
