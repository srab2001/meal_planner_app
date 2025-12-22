/**
 * Fitness Module - Exercise Card Component
 * Displays individual exercises with collapsible set details
 * Implements Wireframe 1: Exercise Card section
 */

import React, { useState } from 'react';
import styles from './ExerciseCard.module.css';

const ExerciseCard = ({ 
  exercise, 
  index, 
  exerciseNumber, 
  onUpdate, 
  onDelete 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleDelete = () => {
    onDelete(index);
    setShowDeleteConfirm(false);
  };

  const handleEdit = () => {
    // TODO: Open edit modal
    console.log('Edit exercise:', exercise);
  };

  // ============================================================================
  // CALCULATIONS
  // ============================================================================

  const totalSets = exercise.sets?.length || 0;
  const totalReps = exercise.sets?.reduce((sum, set) => sum + (set.reps || 0), 0) || 0;
  const maxWeight = Math.max(...(exercise.sets?.map(set => set.weight || 0) || [0]));

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={styles.card}>
      {/* HEADER - Clickable to expand */}
      <button
        className={styles.cardHeader}
        onClick={handleToggleExpand}
        aria-expanded={isExpanded}
        aria-label={`${exercise.exerciseName} - ${totalSets} sets`}
      >
        <div className={styles.headerContent}>
          <span className={styles.exerciseNumber}>{exerciseNumber}.</span>
          <div className={styles.exerciseInfo}>
            <h3 className={styles.exerciseName}>
              {exercise.exerciseName}
            </h3>
            <div className={styles.summary}>
              <span className={styles.summaryItem}>
                Sets: <strong>{totalSets}</strong>
              </span>
              <span className={styles.summaryItem}>
                Reps: <strong>{totalReps}</strong>
              </span>
              {maxWeight > 0 && (
                <span className={styles.summaryItem}>
                  Weight: <strong>{maxWeight} lbs</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Show action menu
            }}
            aria-label="More options"
          >
            ⋯
          </button>
          <span className={styles.expandIcon}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {/* EXPANDED CONTENT */}
      {isExpanded && (
        <div className={styles.cardContent}>
          {/* SETS LIST */}
          <div className={styles.setsList}>
            {exercise.sets && exercise.sets.map((set, setIndex) => (
              <div key={setIndex} className={styles.setItem}>
                <span className={styles.setNumber}>
                  Set {setIndex + 1}:
                </span>
                <span className={styles.setDetails}>
                  {set.reps && <span>{set.reps} reps</span>}
                  {set.weight && <span>× {set.weight} {set.unit || 'lbs'}</span>}
                  {set.duration && <span>× {set.duration} sec</span>}
                </span>
              </div>
            ))}
          </div>

          {/* ACTIONS */}
          <div className={styles.cardActions}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={handleEdit}
            >
              Edit
            </button>
            <button
              type="button"
              className={styles.actionButton + ' ' + styles.deleteButton}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className={styles.confirmationOverlay}>
          <div className={styles.confirmationModal}>
            <p className={styles.confirmationText}>
              Delete "{exercise.exerciseName}"?
            </p>
            <div className={styles.confirmationActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmButton}
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseCard;
