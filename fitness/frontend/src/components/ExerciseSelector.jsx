import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import './ExerciseSelector.css';

/**
 * ExerciseSelector Component
 * Modal for browsing and selecting exercises from the library
 * Includes search, category filter, and equipment filter
 */
function ExerciseSelector({ onSelect, onClose, token }) {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');

  const categories = ['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
  const equipmentTypes = ['all', 'barbell', 'dumbbell', 'machine', 'bodyweight', 'cable'];

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, categoryFilter, equipmentFilter, exercises]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/fitness/exercise-definitions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exercises');
      }

      const { data } = await response.json();
      setExercises(data || []);
      setFilteredExercises(data || []);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...exercises];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ex => ex.category === categoryFilter);
    }

    // Equipment filter
    if (equipmentFilter !== 'all') {
      filtered = filtered.filter(ex => ex.equipment === equipmentFilter);
    }

    setFilteredExercises(filtered);
  };

  const handleSelect = (exercise) => {
    onSelect(exercise);
  };

  // Group exercises by category
  const groupedExercises = filteredExercises.reduce((acc, ex) => {
    if (!acc[ex.category]) {
      acc[ex.category] = [];
    }
    acc[ex.category].push(ex);
    return acc;
  }, {});

  return (
    <div className="exercise-selector-overlay" onClick={onClose}>
      <div className="exercise-selector-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Select Exercise</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          {/* Search */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exercises..."
            className="search-input"
          />

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          {/* Equipment Filter */}
          <select
            value={equipmentFilter}
            onChange={(e) => setEquipmentFilter(e.target.value)}
            className="filter-select"
          >
            {equipmentTypes.map(eq => (
              <option key={eq} value={eq}>
                {eq === 'all' ? 'All Equipment' : eq.charAt(0).toUpperCase() + eq.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        <div className="results-count">
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
        </div>

        {/* Exercise List */}
        <div className="exercises-list">
          {loading && (
            <div className="loading-state">
              <p>Loading exercises...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>Error: {error}</p>
              <button onClick={fetchExercises}>Retry</button>
            </div>
          )}

          {!loading && !error && filteredExercises.length === 0 && (
            <div className="empty-state">
              <p>No exercises found</p>
              <p className="empty-hint">Try adjusting your filters</p>
            </div>
          )}

          {!loading && !error && Object.keys(groupedExercises).map(category => (
            <div key={category} className="exercise-category-group">
              <h3 className="category-heading">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h3>
              {groupedExercises[category].map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => handleSelect(exercise)}
                  className="exercise-item"
                >
                  <div className="exercise-item-header">
                    <span className="exercise-item-name">{exercise.name}</span>
                    <span className="exercise-item-badge">
                      {exercise.equipment || 'bodyweight'}
                    </span>
                  </div>
                  {exercise.description && (
                    <p className="exercise-item-description">{exercise.description}</p>
                  )}
                  <div className="exercise-item-meta">
                    <span className="difficulty-badge difficulty-{exercise.difficulty_level}">
                      {exercise.difficulty_level}
                    </span>
                    {exercise.is_compound && (
                      <span className="compound-badge">Compound</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ExerciseSelector;
