import React, { useState, useEffect } from 'react';
import '../styles/WorkoutTracking.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

/**
 * DayDetail - Shows all workout sessions for a specific day
 * Route: /fitness/calendar/:date
 */
export default function DayDetail({ date, onBack, onReviewSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayNote, setDayNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchDayData();
  }, [date]);

  const fetchDayData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_URL}/api/workouts/calendar/day?date=${date}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.ok) {
        setSessions(data.sessions);
        // Use the note from the first session (they share the day)
        if (data.sessions.length > 0 && data.sessions[0].day_note) {
          setDayNote(data.sessions[0].day_note);
        }
      }
    } catch (err) {
      console.error('Error fetching day data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (sessionId) => {
    try {
      setSavingNote(true);
      const token = localStorage.getItem('auth_token');

      await fetch(`${API_URL}/api/workouts/session/${sessionId}/note`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ day_note: dayNote })
      });
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading-spinner" />;
  }

  return (
    <div className="day-detail-container">
      <div className="day-detail-header">
        <button className="back-button" onClick={onBack}>
          &#8249; Back
        </button>
        <h1 className="day-detail-date">{formatDate(date)}</h1>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <h3>No workouts on this day</h3>
          <p>Complete a workout to see it here.</p>
        </div>
      ) : (
        <>
          <div className="day-sessions-list">
            {sessions.map((session) => (
              <div key={session.id} className="day-session-card">
                <div className="day-session-header">
                  <h3 className="day-session-name">{session.template_name}</h3>
                  <span className="day-session-percent">{session.completion_percent}%</span>
                </div>

                <div className="day-session-times">
                  <span>Start: {formatTime(session.started_at)}</span>
                  <span>Finish: {formatTime(session.finished_at)}</span>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => onReviewSession(session.id)}
                >
                  Review workout
                </button>
              </div>
            ))}
          </div>

          <div className="day-note-section">
            <label className="day-note-label">Day Note</label>
            <textarea
              className="day-note-input"
              placeholder="Add a note about your training day..."
              value={dayNote}
              onChange={(e) => setDayNote(e.target.value)}
            />
            <button
              className="btn-primary"
              style={{ marginTop: '12px' }}
              onClick={() => handleSaveNote(sessions[0].id)}
              disabled={savingNote}
            >
              {savingNote ? 'Saving...' : 'Save note'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
