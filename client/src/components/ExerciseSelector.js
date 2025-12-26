import React, { useState } from 'react';
import './ExerciseSelector.css';

// Exercise library based on fitness design specs (40 exercises across 6 categories)
const EXERCISE_LIBRARY = {
  Chest: [
    'Bench Press', 'Incline Bench Press', 'Decline Bench Press',
    'Dumbbell Flyes', 'Push-Ups', 'Cable Crossover',
    'Chest Dips', 'Machine Chest Press'
  ],
  Back: [
    'Pull-Ups', 'Lat Pulldown', 'Barbell Rows',
    'Dumbbell Rows', 'Seated Cable Rows', 'T-Bar Rows',
    'Deadlifts', 'Face Pulls'
  ],
  Legs: [
    'Squats', 'Leg Press', 'Lunges',
    'Romanian Deadlifts', 'Leg Curls', 'Leg Extensions',
    'Calf Raises', 'Bulgarian Split Squats', 'Hack Squats',
    'Step-Ups'
  ],
  Shoulders: [
    'Overhead Press', 'Lateral Raises', 'Front Raises',
    'Rear Delt Flyes', 'Arnold Press', 'Upright Rows'
  ],
  Arms: [
    'Bicep Curls', 'Tricep Dips', 'Hammer Curls',
    'Tricep Extensions'
  ],
  Core: [
    'Planks', 'Russian Twists', 'Leg Raises',
    'Ab Crunches'
  ]
};

function ExerciseSelector({ onAdd, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['All', ...Object.keys(EXERCISE_LIBRARY)];

  const getFilteredExercises = () => {
    let exercises = [];

    if (selectedCategory === 'All') {
      // Flatten all exercises
      Object.entries(EXERCISE_LIBRARY).forEach(([category, exerciseList]) => {
        exercises.push(...exerciseList.map(name => ({ name, category })));
      });
    } else {
      exercises = EXERCISE_LIBRARY[selectedCategory].map(name => ({
        name,
        category: selectedCategory
      }));
    }

    if (searchTerm) {
      exercises = exercises.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return exercises;
  };

  const filteredExercises = getFilteredExercises();

  const handleSelectExercise = (exercise) => {
    onAdd(exercise);
  };

  return (
    <div className="exercise-selector-overlay" onClick={onClose}>
      <div className="exercise-selector-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Select Exercise</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="exercise-list">
          {filteredExercises.length === 0 ? (
            <div className="no-results">
              <p>No exercises found</p>
            </div>
          ) : (
            filteredExercises.map((exercise, index) => (
              <div
                key={index}
                className="exercise-item"
                onClick={() => handleSelectExercise(exercise)}
              >
                <div className="exercise-info">
                  <div className="exercise-name">{exercise.name}</div>
                  <div className="exercise-category">{exercise.category}</div>
                </div>
                <div className="exercise-action">
                  <span className="add-icon">+</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ExerciseSelector;
