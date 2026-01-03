import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE } from '../config/api';
import './WorkoutDetail.css';

/**
 * WorkoutDetail Component
 * Displays a single workout with all exercises and sets
 * Allows viewing, editing, deleting, and LOGGING actual performance
 */
function WorkoutDetail({ user, token }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Logging state
  const [isLogging, setIsLogging] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [setLogs, setSetLogs] = useState({}); // { setId: { actual_reps, actual_weight, notes } }
  const [savingLogs, setSavingLogs] = useState(false);
  const [logHistory, setLogHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (id) {
      loadWorkout();
    }
  }, [id]);

  const loadWorkout = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/fitness/workouts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Workout not found');
        }
        throw new Error('Failed to load workout');
      }

      const { data } = await response.json();
      setWorkout(data);
    } catch (err) {
      console.error('Error loading workout:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/workouts/${id}/edit`);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this workout? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const response = await fetch(`${API_BASE}/api/fitness/workouts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete workout');
      }

      // Navigate back to workouts list
      navigate('/workouts');
    } catch (err) {
      console.error('Error deleting workout:', err);
      alert('Failed to delete workout: ' + err.message);
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTotalVolume = () => {
    if (!workout || !workout.workout_exercises) return 0;

    let totalVolume = 0;
    workout.workout_exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.weight && set.reps) {
          totalVolume += set.weight * set.reps;
        }
      });
    });

    return totalVolume.toFixed(0);
  };

  const calculateTotalSets = () => {
    if (!workout || !workout.workout_exercises) return 0;
    return workout.workout_exercises.reduce((total, ex) => total + ex.sets.length, 0);
  };

  // Initialize set logs with prescribed values
  const initializeSetLogs = () => {
    const logs = {};
    if (workout && workout.workout_exercises) {
      workout.workout_exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          logs[set.id] = {
            actual_reps: set.reps || '',
            actual_weight: set.weight || '',
            notes: ''
          };
        });
      });
    }
    setSetLogs(logs);
  };

  // Start logging mode
  const startLogging = () => {
    initializeSetLogs();
    setIsLogging(true);
  };

  // Cancel logging mode
  const cancelLogging = () => {
    setIsLogging(false);
    setSetLogs({});
  };

  // Handle changes to set log values
  const handleSetLogChange = (setId, field, value) => {
    setSetLogs(prev => ({
      ...prev,
      [setId]: {
        ...prev[setId],
        [field]: value
      }
    }));
  };

  // Save all logs to API
  const handleSaveLogs = async () => {
    try {
      setSavingLogs(true);
      setError(null);

      const logPromises = Object.entries(setLogs).map(([setId, logData]) => {
        // Only save if user entered actual values
        if (logData.actual_reps || logData.actual_weight) {
          return fetch(`${API_BASE}/api/fitness/sets/${setId}/log`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              completed_date: logDate,
              actual_reps: logData.actual_reps ? parseInt(logData.actual_reps, 10) : null,
              actual_weight: logData.actual_weight ? parseFloat(logData.actual_weight) : null,
              notes: logData.notes || null
            })
          });
        }
        return null;
      }).filter(Boolean);

      const responses = await Promise.all(logPromises);

      // Check for errors
      for (const response of responses) {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save log');
        }
      }

      alert(`Workout logged successfully for ${formatDate(logDate)}!`);
      setIsLogging(false);
      setSetLogs({});
    } catch (err) {
      console.error('Error saving logs:', err);
      setError('Failed to save workout log: ' + err.message);
    } finally {
      setSavingLogs(false);
    }
  };

  // Load log history for this workout
  const loadLogHistory = async () => {
    try {
      setLoadingHistory(true);

      const response = await fetch(`${API_BASE}/api/fitness/workouts/${id}/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load log history');
      }

      const data = await response.json();
      setLogHistory(data.logs || []);
      setShowHistory(true);
    } catch (err) {
      console.error('Error loading log history:', err);
      setError('Failed to load log history: ' + err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Format log history by date
  const groupLogsByDate = () => {
    const grouped = {};
    logHistory.forEach(log => {
      const dateKey = log.completed_date?.split('T')[0] || 'Unknown';
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(log);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="workout-detail-loading">
        <p>Loading workout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workout-detail-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/workouts')} className="back-to-list-btn">
          Back to Workouts
        </button>
      </div>
    );
  }

  if (!workout) {
    return null;
  }

  return (
    <div className="workout-detail">
      {/* Header */}
      <div className="workout-detail-header">
        <button onClick={() => navigate('/workouts')} className="back-button">
          ← Back
        </button>
        <div className="header-actions">
          {!isLogging && (
            <>
              <button onClick={startLogging} className="log-button">
                Log Workout
              </button>
              <button
                onClick={loadLogHistory}
                className="history-button"
                disabled={loadingHistory}
              >
                {loadingHistory ? 'Loading...' : 'View History'}
              </button>
              <button onClick={handleEdit} className="edit-button">
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="delete-button"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
          {isLogging && (
            <>
              <button
                onClick={handleSaveLogs}
                className="save-log-button"
                disabled={savingLogs}
              >
                {savingLogs ? 'Saving...' : 'Save Log'}
              </button>
              <button onClick={cancelLogging} className="cancel-button">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Logging Mode Banner */}
      {isLogging && (
        <div className="logging-banner">
          <h3>Logging Workout Performance</h3>
          <div className="log-date-picker">
            <label htmlFor="logDate">Completion Date:</label>
            <input
              type="date"
              id="logDate"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="date-input"
            />
          </div>
          <p className="logging-hint">
            Enter your actual reps and weights below. You can log this workout on different dates to track progress over time.
          </p>
        </div>
      )}

      {/* Log History Modal */}
      {showHistory && (
        <div className="log-history-modal">
          <div className="log-history-content">
            <div className="log-history-header">
              <h3>Workout Log History</h3>
              <button onClick={() => setShowHistory(false)} className="close-history-btn">
                Close
              </button>
            </div>
            {logHistory.length === 0 ? (
              <p className="no-history">No logs recorded yet. Click "Log Workout" to record your first session!</p>
            ) : (
              <div className="log-history-list">
                {Object.entries(groupLogsByDate()).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, logs]) => (
                  <div key={date} className="log-date-group">
                    <h4 className="log-date-header">{formatDate(date)}</h4>
                    <div className="log-entries">
                      {logs.map(log => (
                        <div key={log.id} className="log-entry">
                          <span className="log-exercise">{log.exercise_name || 'Unknown'}</span>
                          <span className="log-set">Set {log.set_number || '?'}</span>
                          <span className="log-performance">
                            {log.actual_reps || '-'} reps @ {log.actual_weight ? `${log.actual_weight} lbs` : '-'}
                          </span>
                          {log.notes && <span className="log-notes">{log.notes}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workout Info */}
      <div className="workout-info-card">
        <h1 className="workout-title">{workout.workout_name || 'Untitled Workout'}</h1>
        <p className="workout-date">{formatDate(workout.workout_date)}</p>

        {/* Stats */}
        <div className="workout-stats">
          <div className="stat-item">
            <span className="stat-value">{workout.workout_exercises?.length || 0}</span>
            <span className="stat-label">Exercises</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{calculateTotalSets()}</span>
            <span className="stat-label">Total Sets</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{calculateTotalVolume()}</span>
            <span className="stat-label">Volume (lbs)</span>
          </div>
          {workout.duration_minutes && (
            <div className="stat-item">
              <span className="stat-value">{workout.duration_minutes}</span>
              <span className="stat-label">Minutes</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {workout.notes && (
          <div className="workout-notes">
            <h3>Notes</h3>
            <p>{workout.notes}</p>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className="exercises-section">
        <h2>Exercises</h2>

        {workout.workout_exercises && workout.workout_exercises.length > 0 ? (
          workout.workout_exercises
            .sort((a, b) => (a.exercise_order || 0) - (b.exercise_order || 0))
            .map((exercise, exIdx) => (
              <div key={exercise.id} className="exercise-detail-card">
                <div className="exercise-header">
                  <span className="exercise-number">{exIdx + 1}</span>
                  <h3 className="exercise-name">{exercise.exercise_name}</h3>
                </div>

                {/* Sets Table */}
                <div className="sets-table">
                  <div className={`sets-table-header ${isLogging ? 'logging-mode' : ''}`}>
                    <span className="set-col">Set</span>
                    <span className="reps-col">{isLogging ? 'Prescribed' : 'Reps'}</span>
                    <span className="weight-col">{isLogging ? 'Prescribed' : 'Weight'}</span>
                    {isLogging && (
                      <>
                        <span className="actual-reps-col">Actual Reps</span>
                        <span className="actual-weight-col">Actual Weight</span>
                        <span className="notes-col">Notes</span>
                      </>
                    )}
                  </div>

                  {exercise.sets
                    .sort((a, b) => a.set_number - b.set_number)
                    .map((set) => (
                      <div key={set.id} className={`set-row ${isLogging ? 'logging-mode' : ''}`}>
                        <span className="set-col">{set.set_number}</span>
                        <span className="reps-col">{set.reps || '-'}</span>
                        <span className="weight-col">
                          {set.weight ? `${set.weight} lbs` : '-'}
                        </span>
                        {isLogging && (
                          <>
                            <span className="actual-reps-col">
                              <input
                                type="number"
                                min="0"
                                placeholder="Reps"
                                value={setLogs[set.id]?.actual_reps || ''}
                                onChange={(e) => handleSetLogChange(set.id, 'actual_reps', e.target.value)}
                                className="log-input"
                              />
                            </span>
                            <span className="actual-weight-col">
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="lbs"
                                value={setLogs[set.id]?.actual_weight || ''}
                                onChange={(e) => handleSetLogChange(set.id, 'actual_weight', e.target.value)}
                                className="log-input"
                              />
                            </span>
                            <span className="notes-col">
                              <input
                                type="text"
                                placeholder="Notes..."
                                value={setLogs[set.id]?.notes || ''}
                                onChange={(e) => handleSetLogChange(set.id, 'notes', e.target.value)}
                                className="log-input notes-input"
                              />
                            </span>
                          </>
                        )}
                      </div>
                    ))}

                  {/* Set Summary */}
                  <div className="set-summary">
                    <span className="summary-label">Total:</span>
                    <span className="summary-value">
                      {exercise.sets.reduce((sum, s) => sum + (s.reps || 0), 0)} reps
                    </span>
                    <span className="summary-value">
                      {exercise.sets
                        .reduce((sum, s) => {
                          if (s.weight && s.reps) {
                            return sum + s.weight * s.reps;
                          }
                          return sum;
                        }, 0)
                        .toFixed(0)}{' '}
                      lbs volume
                    </span>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="no-exercises">
            <p>No exercises recorded for this workout</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkoutDetail;
// Build trigger 1767140167
