import React, { useState, useEffect } from 'react';
import './ProgressDashboard.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ProgressDashboard({ workouts, onBack }) {
  const [timeframe, setTimeframe] = useState('week'); // week, month, year, all
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    totalVolume: 0,
    averageDuration: 0,
    mostFrequentExercise: '-'
  });

  useEffect(() => {
    calculateStats();
  }, [workouts, timeframe]);

  const calculateStats = () => {
    if (!workouts || workouts.length === 0) {
      return;
    }

    // Filter workouts by timeframe
    const now = new Date();
    const filteredWorkouts = workouts.filter(workout => {
      const workoutDate = new Date(workout.workoutDate);
      const diffTime = Math.abs(now - workoutDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (timeframe === 'week') return diffDays <= 7;
      if (timeframe === 'month') return diffDays <= 30;
      if (timeframe === 'year') return diffDays <= 365;
      return true; // 'all'
    });

    const totalWorkouts = filteredWorkouts.length;
    const totalDuration = filteredWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const averageDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

    // Calculate total volume (sets × reps × weight)
    let totalVolume = 0;
    const exerciseCounts = {};

    filteredWorkouts.forEach(workout => {
      (workout.exercises || []).forEach(exercise => {
        // Count exercise frequency
        const exerciseName = exercise.exerciseName;
        exerciseCounts[exerciseName] = (exerciseCounts[exerciseName] || 0) + 1;

        // Calculate volume
        (exercise.sets || []).forEach(set => {
          totalVolume += (set.reps || 0) * (set.weight || 0);
        });
      });
    });

    // Find most frequent exercise
    let mostFrequent = '-';
    let maxCount = 0;
    Object.entries(exerciseCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = name;
      }
    });

    setStats({
      totalWorkouts,
      totalDuration,
      totalVolume: Math.round(totalVolume),
      averageDuration,
      mostFrequentExercise: mostFrequent
    });
  };

  return (
    <div className="progress-dashboard">
      {/* Header */}
      <div className="progress-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Progress Dashboard</h1>
      </div>

      {/* Timeframe Selector */}
      <div className="timeframe-selector">
        <button
          className={`timeframe-button ${timeframe === 'week' ? 'active' : ''}`}
          onClick={() => setTimeframe('week')}
        >
          Week
        </button>
        <button
          className={`timeframe-button ${timeframe === 'month' ? 'active' : ''}`}
          onClick={() => setTimeframe('month')}
        >
          Month
        </button>
        <button
          className={`timeframe-button ${timeframe === 'year' ? 'active' : ''}`}
          onClick={() => setTimeframe('year')}
        >
          Year
        </button>
        <button
          className={`timeframe-button ${timeframe === 'all' ? 'active' : ''}`}
          onClick={() => setTimeframe('all')}
        >
          All Time
        </button>
      </div>

      {/* Stats Grid */}
      <div className="progress-stats-grid">
        <div className="progress-stat-card">
          <div className="stat-icon">🏋️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalWorkouts}</div>
            <div className="stat-label">Total Workouts</div>
          </div>
        </div>

        <div className="progress-stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalDuration} min</div>
            <div className="stat-label">Total Duration</div>
          </div>
        </div>

        <div className="progress-stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.averageDuration} min</div>
            <div className="stat-label">Avg Duration</div>
          </div>
        </div>

        <div className="progress-stat-card">
          <div className="stat-icon">💪</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalVolume.toLocaleString()} lbs</div>
            <div className="stat-label">Total Volume</div>
          </div>
        </div>
      </div>

      {/* Most Frequent Exercise */}
      <div className="favorite-exercise">
        <h2>Most Frequent Exercise</h2>
        <div className="favorite-card">
          <span className="favorite-icon">⭐</span>
          <span className="favorite-name">{stats.mostFrequentExercise}</span>
        </div>
      </div>

      {/* Workout History */}
      <div className="workout-history">
        <h2>Workout History</h2>
        {workouts.length === 0 ? (
          <div className="empty-state">
            <p>No workout data available</p>
          </div>
        ) : (
          <div className="history-timeline">
            {workouts.slice(0, 10).map((workout, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-date">
                  {new Date(workout.workoutDate).toLocaleDateString()}
                </div>
                <div className="timeline-content">
                  <h3>{workout.workoutName}</h3>
                  <div className="timeline-details">
                    <span>💪 {workout.exerciseCount} exercises</span>
                    <span>⏱️ {workout.duration} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgressDashboard;
