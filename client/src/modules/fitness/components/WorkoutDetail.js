import React, { useState, useEffect } from 'react';
import '../styles/WorkoutTracking.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

/**
 * WorkoutDetail - Exercise checkoff screen
 * Route: /fitness/session/:id
 */
export default function WorkoutDetail({ sessionId, onBack, onFinish }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [exerciseNotes, setExerciseNotes] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_URL}/api/workouts/session/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.ok) {
        setSession(data.session);
        // Initialize notes state
        const notes = {};
        data.session.exercises.forEach(ex => {
          notes[ex.id] = ex.notes || '';
        });
        setExerciseNotes(notes);
      }
    } catch (err) {
      console.error('Error fetching session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExercise = async (exerciseId, currentStatus) => {
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(
        `${API_URL}/api/workouts/session/${sessionId}/exercise/${exerciseId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_completed: !currentStatus })
        }
      );

      const data = await response.json();
      if (data.ok) {
        setSession(data.session);
      }
    } catch (err) {
      console.error('Error toggling exercise:', err);
    }
  };

  const handleSaveNotes = async (exerciseId) => {
    try {
      const token = localStorage.getItem('auth_token');

      await fetch(
        `${API_URL}/api/workouts/session/${sessionId}/exercise/${exerciseId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notes: exerciseNotes[exerciseId] })
        }
      );

      setExpandedNotes(prev => ({ ...prev, [exerciseId]: false }));
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  };

  const handleFinishWorkout = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(
        `${API_URL}/api/workouts/session/${sessionId}/finish`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      if (data.ok) {
        onFinish?.(data.session);
      }
    } catch (err) {
      console.error('Error finishing workout:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetSession = async () => {
    if (!window.confirm('Are you sure you want to reset this workout? All progress will be cleared.')) {
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(
        `${API_URL}/api/workouts/session/${sessionId}/reset`,
        {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.ok) {
        setSession(data.session);
      }
    } catch (err) {
      console.error('Error resetting session:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatPrescription = (prescription) => {
    if (!prescription) return '';

    if (prescription.prescription_type === 'time') {
      const sets = prescription.sets || 1;
      const seconds = prescription.seconds || 0;
      const rest = prescription.rest_seconds ? ` / ${prescription.rest_seconds}s rest` : '';
      return `${sets} x ${seconds} seconds${rest}`;
    } else {
      const sets = prescription.sets || 0;
      const reps = prescription.reps || 0;
      const rest = prescription.rest_seconds ? ` / ${prescription.rest_seconds}s rest` : '';
      return `${sets} x ${reps} reps${rest}`;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="loading-spinner" />;
  }

  if (!session) {
    return (
      <div className="empty-state">
        <h3>Session not found</h3>
        <button className="btn-secondary" onClick={onBack}>Go back</button>
      </div>
    );
  }

  const isFinished = session.status === 'finished';

  return (
    <div className="workout-detail-container">
      <button className="back-button" onClick={onBack} style={{ marginBottom: '16px' }}>
        &#8249; Back
      </button>

      <div className="workout-detail-header">
        <h1 className="workout-detail-title">{session.template?.name || 'Workout'}</h1>
        <div className="workout-detail-times">
          <span><strong>Started:</strong> {formatTime(session.started_at)}</span>
          <span><strong>Finished:</strong> {formatTime(session.finished_at)}</span>
        </div>
        <div style={{ marginTop: '12px' }}>
          <span className={`workout-status-badge ${session.status.replace('_', '-')}`}>
            {session.status === 'in_progress' ? 'In Progress' :
             session.status === 'finished' ? 'Completed' : 'Not Started'}
          </span>
          <span style={{ marginLeft: '16px', fontWeight: '600', color: 'var(--asr-purple-600)' }}>
            {session.completion_percent}% Complete
          </span>
        </div>
      </div>

      <div className="exercise-list">
        {session.exercises.map((exercise) => (
          <div
            key={exercise.id}
            className={`exercise-row ${exercise.is_completed ? 'completed' : ''}`}
          >
            <input
              type="checkbox"
              className="exercise-checkbox"
              checked={exercise.is_completed}
              onChange={() => handleToggleExercise(exercise.id, exercise.is_completed)}
              disabled={isFinished}
            />

            <div className="exercise-info">
              <div className="exercise-name">{exercise.name_snapshot}</div>
              <div className="exercise-prescription">
                {formatPrescription(exercise.prescription_snapshot)}
              </div>
            </div>

            <div className="exercise-completed-at">
              {exercise.completed_at && formatTime(exercise.completed_at)}
            </div>

            <button
              className="exercise-notes-btn"
              onClick={() => setExpandedNotes(prev => ({
                ...prev,
                [exercise.id]: !prev[exercise.id]
              }))}
            >
              {exercise.notes || expandedNotes[exercise.id] ? 'Notes' : '+ Note'}
            </button>

            {expandedNotes[exercise.id] && (
              <div style={{ gridColumn: '2 / -1', marginTop: '8px' }}>
                <input
                  type="text"
                  className="exercise-notes-input"
                  placeholder="Add notes for this exercise..."
                  value={exerciseNotes[exercise.id] || ''}
                  onChange={(e) => setExerciseNotes(prev => ({
                    ...prev,
                    [exercise.id]: e.target.value
                  }))}
                  disabled={isFinished}
                />
                {!isFinished && (
                  <button
                    className="btn-secondary"
                    style={{ marginTop: '8px', padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => handleSaveNotes(exercise.id)}
                  >
                    Save
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="workout-detail-actions">
        {!isFinished && (
          <>
            <button
              className="btn-primary"
              onClick={handleFinishWorkout}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Finish Workout'}
            </button>
            <button
              className="btn-danger"
              onClick={handleResetSession}
              disabled={saving}
            >
              Reset
            </button>
          </>
        )}
        {isFinished && (
          <button className="btn-secondary" onClick={onBack}>
            Back to Calendar
          </button>
        )}
      </div>
    </div>
  );
}
