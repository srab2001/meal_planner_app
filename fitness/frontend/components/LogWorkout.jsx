/**
 * Fitness Module - Log Workout Component
 * Implements Wireframe 1: "Log Workout" - Main Entry Screen
 * 
 * Features:
 * - Workout date and name input
 * - Exercise list with collapsible set details
 * - Notes section
 * - Validation and error handling
 * - Save/Cancel actions
 */

import React, { useState } from 'react';
import styles from './LogWorkout.module.css';
import config from '../styles/wireframe.config';
import ExerciseCard from './ExerciseCard';
import ExerciseModal from './modals/ExerciseModal';

const LogWorkout = ({ onSave, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    workoutDate: initialData?.workoutDate || new Date().toISOString().split('T')[0],
    workoutName: initialData?.workoutName || '',
    exercises: initialData?.exercises || [],
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState({});
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDateChange = (e) => {
    setFormData(prev => ({
      ...prev,
      workoutDate: e.target.value
    }));
    // Clear date error if exists
    if (errors.workoutDate) {
      setErrors(prev => ({
        ...prev,
        workoutDate: null
      }));
    }
  };

  const handleNameChange = (e) => {
    setFormData(prev => ({
      ...prev,
      workoutName: e.target.value
    }));
    // Clear name error if exists
    if (errors.workoutName) {
      setErrors(prev => ({
        ...prev,
        workoutName: null
      }));
    }
  };

  const handleNotesChange = (e) => {
    const text = e.target.value;
    if (text.length <= 500) {
      setFormData(prev => ({
        ...prev,
        notes: text
      }));
    }
  };

  const handleAddExercise = (exercise) => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, exercise]
    }));
    setShowExerciseModal(false);
    
    // Clear exercises error if exists
    if (errors.exercises) {
      setErrors(prev => ({
        ...prev,
        exercises: null
      }));
    }
  };

  const handleUpdateExercise = (index, updatedExercise) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => i === index ? updatedExercise : ex)
    }));
  };

  const handleDeleteExercise = (index) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateForm = () => {
    const newErrors = {};

    // Validate date
    if (!formData.workoutDate) {
      newErrors.workoutDate = 'Workout date is required';
    } else {
      const selectedDate = new Date(formData.workoutDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (selectedDate > today) {
        newErrors.workoutDate = 'Cannot log workouts for future dates';
      }
    }

    // Validate name
    if (!formData.workoutName || !formData.workoutName.trim()) {
      newErrors.workoutName = 'Workout name is required';
    } else if (formData.workoutName.length > 255) {
      newErrors.workoutName = 'Workout name must be 255 characters or less';
    }

    // Validate exercises
    if (!formData.exercises || formData.exercises.length === 0) {
      newErrors.exercises = 'Add at least one exercise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // SUBMIT
  // ============================================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving workout:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to save workout. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={onCancel}
          aria-label="Go back"
        >
          ←
        </button>
        <h1 className={styles.headerTitle}>Log Workout</h1>
        <div style={{ width: '44px' }} />
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* ERROR BANNER */}
        {errors.submit && (
          <div className={styles.errorBanner}>
            <span className={styles.errorIcon}>⚠️</span>
            <span>{errors.submit}</span>
          </div>
        )}

        {errors.exercises && (
          <div className={styles.errorBanner}>
            <span className={styles.errorIcon}>⚠️</span>
            <span>{errors.exercises}</span>
          </div>
        )}

        {/* SECTION 1: WORKOUT BASICS */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Workout Basics</h2>

          {/* Date Field */}
          <div className={styles.formGroup}>
            <label htmlFor="workoutDate" className={styles.label}>
              Workout Date
            </label>
            <input
              id="workoutDate"
              type="date"
              value={formData.workoutDate}
              onChange={handleDateChange}
              className={errors.workoutDate ? styles.inputError : styles.input}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.workoutDate && (
              <div className={styles.errorMessage}>{errors.workoutDate}</div>
            )}
          </div>

          {/* Name Field */}
          <div className={styles.formGroup}>
            <label htmlFor="workoutName" className={styles.label}>
              Workout Name
            </label>
            <input
              id="workoutName"
              type="text"
              placeholder="e.g. Leg Day, Upper Body Push"
              value={formData.workoutName}
              onChange={handleNameChange}
              maxLength={255}
              className={errors.workoutName ? styles.inputError : styles.input}
            />
            {errors.workoutName && (
              <div className={styles.errorMessage}>{errors.workoutName}</div>
            )}
            <div className={styles.charCounter}>
              {formData.workoutName.length}/255
            </div>
          </div>
        </section>

        {/* SECTION 2: EXERCISES */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Exercises</h2>
            <button
              type="button"
              onClick={() => setShowExerciseModal(true)}
              className={styles.addButton}
              aria-label="Add exercise"
            >
              + Add
            </button>
          </div>

          {/* Exercise List */}
          <div className={styles.exerciseList}>
            {formData.exercises.map((exercise, index) => (
              <ExerciseCard
                key={`${exercise.id}-${index}`}
                exercise={exercise}
                index={index}
                exerciseNumber={index + 1}
                onUpdate={handleUpdateExercise}
                onDelete={handleDeleteExercise}
              />
            ))}
          </div>

          {/* Add Another Button */}
          {formData.exercises.length > 0 && (
            <button
              type="button"
              onClick={() => setShowExerciseModal(true)}
              className={styles.addAnotherButton}
            >
              + Add Another Exercise
            </button>
          )}
        </section>

        {/* SECTION 3: NOTES */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notes (Optional)</h2>

          <div className={styles.formGroup}>
            <textarea
              placeholder="Great session, feeling strong..."
              value={formData.notes}
              onChange={handleNotesChange}
              maxLength={500}
              className={styles.textarea}
            />
            <div className={styles.charCounter}>
              {formData.notes.length}/500 characters
            </div>
          </div>
        </section>

        {/* FOOTER: ACTIONS */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.saveButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Workout'}
          </button>
        </div>
      </form>

      {/* EXERCISE MODAL */}
      {showExerciseModal && (
        <ExerciseModal
          onAdd={handleAddExercise}
          onClose={() => setShowExerciseModal(false)}
        />
      )}
    </div>
  );
};

export default LogWorkout;
