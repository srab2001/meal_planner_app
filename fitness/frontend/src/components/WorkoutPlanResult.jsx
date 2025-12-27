import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './WorkoutPlanResult.css';

/**
 * Screen C - Workout Plan Result
 * Displays the AI-generated workout plan in table format
 * Table columns: Day | Location | Exercise | Sets | Reps | Weight
 */
function WorkoutPlanResult({ user, token }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { workout, message, goalName, answers } = location.state || {};

  // Parse workout data into table rows
  const parseWorkoutToRows = () => {
    if (!workout) return [];

    const rows = [];

    // Primary format: Daily plan with exercises array
    if (workout.days && Array.isArray(workout.days)) {
      workout.days.forEach((day) => {
        const exercises = day.exercises || [];
        exercises.forEach((ex, i) => {
          rows.push({
            day: i === 0 ? (day.day || day.name || 'Day') : '',
            location: ex.location || day.location || 'Gym',
            exercise: ex.name || ex.exercise || (typeof ex === 'string' ? ex : ''),
            sets: ex.sets || '3',
            reps: ex.reps || '10',
            weight: ex.weight || 'Body',
          });
        });
      });
      return rows;
    }

    // Alternative format: weekly_plan
    if (workout.weekly_plan && Array.isArray(workout.weekly_plan)) {
      workout.weekly_plan.forEach((day) => {
        const exercises = day.exercises || [];
        exercises.forEach((ex, i) => {
          rows.push({
            day: i === 0 ? (day.day || day.name || 'Day') : '',
            location: ex.location || day.location || 'Gym',
            exercise: ex.name || ex.exercise || (typeof ex === 'string' ? ex : ''),
            sets: ex.sets || '3',
            reps: ex.reps || '10',
            weight: ex.weight || 'Body',
          });
        });
      });
      return rows;
    }

    // Legacy format: Section-based workout (warm_up, strength, etc.)
    if (workout.warm_up || workout.strength || workout.cardio) {
      // Parse warm_up
      if (workout.warm_up?.exercises) {
        workout.warm_up.exercises.forEach((exercise, i) => {
          rows.push({
            day: i === 0 ? 'Warm Up' : '',
            location: 'Any',
            exercise: typeof exercise === 'string' ? exercise : exercise.name || '',
            sets: '-',
            reps: workout.warm_up.duration || '-',
            weight: 'Body',
          });
        });
      }

      // Parse strength
      if (workout.strength?.exercises) {
        const setsReps = workout.strength.sets_reps || '3x10';
        const matches = setsReps.match(/\d+/g) || ['3', '10'];
        const [sets, reps] = matches;

        workout.strength.exercises.forEach((exercise, i) => {
          rows.push({
            day: i === 0 ? 'Strength' : '',
            location: 'Gym',
            exercise: typeof exercise === 'string' ? exercise : exercise.name || '',
            sets: sets,
            reps: reps,
            weight: 'Varies',
          });
        });
      }

      // Parse cardio
      if (workout.cardio?.exercises) {
        workout.cardio.exercises.forEach((exercise, i) => {
          rows.push({
            day: i === 0 ? 'Cardio' : '',
            location: workout.cardio.notes?.toLowerCase().includes('pool') ? 'Pool' : 'Gym',
            exercise: typeof exercise === 'string' ? exercise : exercise.name || '',
            sets: '-',
            reps: workout.cardio.duration || '-',
            weight: 'Body',
          });
        });
      }

      // Parse agility
      if (workout.agility?.exercises) {
        workout.agility.exercises.forEach((exercise, i) => {
          rows.push({
            day: i === 0 ? 'Agility' : '',
            location: 'Gym',
            exercise: typeof exercise === 'string' ? exercise : exercise.name || '',
            sets: '3',
            reps: '30 sec',
            weight: 'Body',
          });
        });
      }

      // Parse recovery
      if (workout.recovery?.exercises) {
        workout.recovery.exercises.forEach((exercise, i) => {
          rows.push({
            day: i === 0 ? 'Recovery' : '',
            location: 'Any',
            exercise: typeof exercise === 'string' ? exercise : exercise.name || '',
            sets: '-',
            reps: workout.recovery.duration || '-',
            weight: 'Body',
          });
        });
      }
    }

    return rows;
  };

  const workoutRows = parseWorkoutToRows();

  // If no workout data, show error
  if (!workout && !workoutRows.length) {
    return (
      <div className="workout-result">
        <div className="workout-result__card">
          <h1 className="workout-result__title">No Workout Plan</h1>
          <p className="workout-result__empty">
            No workout plan was generated. Please try again.
          </p>
          <button
            className="workout-result__button"
            onClick={() => navigate('/create-goal')}
          >
            Create New Goal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-result">
      <div className="workout-result__card">
        <div className="workout-result__header">
          <h1 className="workout-result__title">Your Workout Plan</h1>
          {goalName && (
            <p className="workout-result__goal-badge">
              Goal: {goalName}
            </p>
          )}
          {message && (
            <p className="workout-result__message">{message}</p>
          )}
        </div>

        {/* Summary Stats */}
        {workout?.summary && (
          <div className="workout-result__summary">
            <div className="workout-result__stat">
              <span className="workout-result__stat-value">
                {workout.summary.total_duration || '60 min'}
              </span>
              <span className="workout-result__stat-label">Duration</span>
            </div>
            <div className="workout-result__stat">
              <span className="workout-result__stat-value">
                {workout.summary.intensity_level || 'Medium'}
              </span>
              <span className="workout-result__stat-label">Intensity</span>
            </div>
            <div className="workout-result__stat">
              <span className="workout-result__stat-value">
                {workout.summary.calories_burned_estimate || '~400'}
              </span>
              <span className="workout-result__stat-label">Calories</span>
            </div>
          </div>
        )}

        {/* Workout Table */}
        <div className="workout-result__table-wrapper">
          <table className="workout-result__table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Location</th>
                <th>Exercise</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {workoutRows.map((row, index) => (
                <tr key={index}>
                  <td className="workout-result__cell-day">{row.day}</td>
                  <td>{row.location}</td>
                  <td className="workout-result__cell-exercise">{row.exercise}</td>
                  <td>{row.sets}</td>
                  <td>{row.reps}</td>
                  <td>{row.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Closeout / Notes */}
        {workout?.closeout?.notes && (
          <div className="workout-result__closeout">
            <h3>Coach Notes</h3>
            <p>{workout.closeout.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="workout-result__actions">
          <button
            className="workout-result__button workout-result__button--secondary"
            onClick={() => navigate('/ai-coach', { state: { goalName, goalId: null } })}
          >
            Regenerate Plan
          </button>
          <button
            className="workout-result__button"
            onClick={() => navigate('/create-goal')}
          >
            New Goal
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkoutPlanResult;
