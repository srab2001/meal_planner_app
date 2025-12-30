import React, { useState, useEffect } from 'react';
import '../styles/WorkoutTracking.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

/**
 * SavedWorkouts - List view of workout templates
 * Route: /fitness/workouts
 */
export default function SavedWorkouts({ onStartSession, onContinueSession, onReviewSession }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, [searchTerm, filter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filter !== 'all') params.append('filter', filter);

      const response = await fetch(`${API_URL}/api/workouts/templates?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.ok) {
        setTemplates(data.templates);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load templates');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = async (templateId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/workouts/session/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workout_template_id: templateId })
      });

      const data = await response.json();
      if (data.ok) {
        onStartSession(data.session);
      } else if (data.error_code === 'session_in_progress') {
        // Session already exists, navigate to it
        onContinueSession(data.session_id);
      } else {
        alert(data.message || 'Failed to start workout');
      }
    } catch (err) {
      console.error('Error starting workout:', err);
      alert('Failed to start workout');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'not_started':
        return <span className="workout-status-badge not-started">Not Started</span>;
      case 'in_progress':
        return <span className="workout-status-badge in-progress">In Progress</span>;
      case 'done':
        return <span className="workout-status-badge done">Completed</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderActionButton = (template) => {
    switch (template.status) {
      case 'not_started':
        return (
          <button
            className="btn-primary"
            onClick={() => handleStartWorkout(template.id)}
          >
            Start
          </button>
        );
      case 'in_progress':
        return (
          <button
            className="btn-secondary"
            onClick={() => onContinueSession(template.in_progress_session_id)}
          >
            Continue
          </button>
        );
      case 'done':
        return (
          <>
            <button
              className="btn-primary"
              onClick={() => handleStartWorkout(template.id)}
            >
              Start
            </button>
            <button
              className="btn-secondary"
              onClick={() => onReviewSession(template.latest_finished_session_id)}
            >
              Review
            </button>
          </>
        );
      default:
        return null;
    }
  };

  if (loading && templates.length === 0) {
    return <div className="loading-spinner" />;
  }

  return (
    <div className="workout-tracking-container">
      <div className="workout-tracking-header">
        <h1 className="workout-tracking-title">Saved Workouts</h1>
      </div>

      <div className="saved-workouts-controls">
        <input
          type="text"
          className="workout-search-input"
          placeholder="Search workouts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="workout-filter-buttons">
          {['all', 'not_started', 'in_progress', 'done'].map((f) => (
            <button
              key={f}
              className={`workout-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' :
               f === 'not_started' ? 'Not Started' :
               f === 'in_progress' ? 'In Progress' : 'Done'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="empty-state">
          <p>{error}</p>
        </div>
      )}

      {!error && templates.length === 0 && (
        <div className="empty-state">
          <h3>No workouts found</h3>
          <p>Create your first workout template to get started.</p>
        </div>
      )}

      <div className="workout-template-list">
        {templates.map((template) => (
          <div key={template.id} className="workout-template-card">
            <div className="workout-template-info">
              <h3 className="workout-template-name">{template.name}</h3>
              <div className="workout-template-meta">
                {getStatusBadge(template.status)}
                <span>Last done: {formatDate(template.last_completed_at)}</span>
                <span>{template.exercise_count} exercises</span>
              </div>
            </div>
            <div className="workout-template-actions">
              {renderActionButton(template)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
