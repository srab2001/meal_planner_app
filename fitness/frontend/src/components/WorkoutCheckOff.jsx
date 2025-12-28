import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../config/api';
import './WorkoutCheckOff.css';

/**
 * WorkoutCheckOff - Public workout completion page
 *
 * Accessed via SMS link with token. No authentication required.
 * Users can check off exercises as they complete them.
 */
export default function WorkoutCheckOff() {
  const { token } = useParams();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null); // itemId being updated

  useEffect(() => {
    fetchWorkout();
  }, [token]);

  const fetchWorkout = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/fitness/sms/workout/check-off/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to load workout');
      }

      setWorkout(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (itemId, currentCompleted) => {
    setUpdating(itemId);

    try {
      const response = await fetch(`${API_BASE}/api/fitness/sms/workout/check-off/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, completed: !currentCompleted })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update');
      }

      // Update local state
      setWorkout(prev => {
        const updated = { ...prev };
        for (const section of Object.keys(updated.sections)) {
          updated.sections[section] = updated.sections[section].map(item =>
            item.id === itemId
              ? { ...item, completed: data.item.completed, completedAt: data.item.completedAt }
              : item
          );
        }
        updated.completedItems = data.progress.completed;
        return updated;
      });
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="checkoff-container loading">
        <div className="checkoff-spinner"></div>
        <p>Loading your workout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkoff-container error">
        <div className="checkoff-error-icon">!</div>
        <h2>Oops!</h2>
        <p>{error}</p>
        {error.includes('expired') && (
          <p className="checkoff-hint">
            This link has expired. Request a new workout link from the app.
          </p>
        )}
      </div>
    );
  }

  const progress = Math.round((workout.completedItems / workout.totalItems) * 100);
  const allComplete = workout.completedItems === workout.totalItems;

  return (
    <div className="checkoff-container">
      {/* Header */}
      <header className="checkoff-header">
        <div className="checkoff-logo">ASR</div>
        <h1>Workout Check-Off</h1>
      </header>

      {/* Workout Info */}
      <div className="checkoff-info">
        <span className="checkoff-date">
          {new Date(workout.date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
          })}
        </span>
        {workout.type && <span className="checkoff-type">{workout.type}</span>}
        {workout.intensity && <span className={`checkoff-intensity ${workout.intensity}`}>{workout.intensity}</span>}
      </div>

      {/* Progress Bar */}
      <div className="checkoff-progress">
        <div className="checkoff-progress-bar">
          <div
            className="checkoff-progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="checkoff-progress-text">
          {workout.completedItems} / {workout.totalItems} complete ({progress}%)
        </span>
      </div>

      {/* Success Message */}
      {allComplete && (
        <div className="checkoff-success">
          <span className="checkoff-success-icon">&#10003;</span>
          <span>Great job! Workout complete!</span>
        </div>
      )}

      {/* Sections */}
      <div className="checkoff-sections">
        {Object.entries(workout.sections).map(([sectionName, items]) => (
          <div key={sectionName} className="checkoff-section">
            <h2 className="checkoff-section-title">{sectionName}</h2>

            <div className="checkoff-items">
              {items.map(item => (
                <button
                  key={item.id}
                  className={`checkoff-item ${item.completed ? 'completed' : ''}`}
                  onClick={() => toggleItem(item.id, item.completed)}
                  disabled={updating === item.id}
                >
                  <span className="checkoff-item-check">
                    {item.completed ? '✓' : ''}
                  </span>

                  <div className="checkoff-item-content">
                    <span className="checkoff-item-name">{item.name}</span>
                    <span className="checkoff-item-details">
                      {item.sets && <span>{item.sets} sets</span>}
                      {item.reps && <span>{item.reps}</span>}
                      {item.weight && <span>{item.weight}</span>}
                    </span>
                  </div>

                  {updating === item.id && (
                    <span className="checkoff-item-loading">...</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="checkoff-footer">
        <p>Powered by ASR Fitness</p>
      </footer>
    </div>
  );
}
