import React, { useState } from 'react';
import SavedWorkouts from './SavedWorkouts';
import WorkoutCalendar from './WorkoutCalendar';
import DayDetail from './DayDetail';
import WorkoutDetail from './WorkoutDetail';
import '../styles/WorkoutTracking.css';

/**
 * WorkoutTracking - Main container for the workout tracking module
 * Manages navigation between views:
 * - Saved Workouts (list)
 * - Calendar
 * - Day Detail
 * - Workout Detail (checkoff)
 */
export default function WorkoutTracking() {
  const [currentView, setCurrentView] = useState('workouts'); // 'workouts' | 'calendar' | 'day' | 'session'
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // Navigation handlers
  const handleStartSession = (session) => {
    setSelectedSessionId(session.id);
    setCurrentView('session');
  };

  const handleContinueSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    setCurrentView('session');
  };

  const handleReviewSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    setCurrentView('session');
  };

  const handleDaySelect = (date) => {
    setSelectedDate(date);
    setCurrentView('day');
  };

  const handleBackToWorkouts = () => {
    setCurrentView('workouts');
    setSelectedSessionId(null);
    setSelectedDate(null);
  };

  const handleBackToCalendar = () => {
    setCurrentView('calendar');
    setSelectedSessionId(null);
    setSelectedDate(null);
  };

  const handleBackFromDay = () => {
    setCurrentView('calendar');
    setSelectedDate(null);
  };

  const handleSessionFinished = (session) => {
    // Go back to workouts after finishing
    setCurrentView('workouts');
    setSelectedSessionId(null);
  };

  // Render navigation tabs (only on main views)
  const renderNavTabs = () => {
    if (currentView === 'day' || currentView === 'session') return null;

    return (
      <div className="workout-nav-tabs">
        <button
          className={`workout-nav-tab ${currentView === 'workouts' ? 'active' : ''}`}
          onClick={() => setCurrentView('workouts')}
        >
          Workouts
        </button>
        <button
          className={`workout-nav-tab ${currentView === 'calendar' ? 'active' : ''}`}
          onClick={() => setCurrentView('calendar')}
        >
          Calendar
        </button>
        <button
          className={`workout-nav-tab ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentView('settings')}
        >
          Settings
        </button>
      </div>
    );
  };

  // Render current view
  const renderView = () => {
    switch (currentView) {
      case 'workouts':
        return (
          <SavedWorkouts
            onStartSession={handleStartSession}
            onContinueSession={handleContinueSession}
            onReviewSession={handleReviewSession}
          />
        );

      case 'calendar':
        return (
          <WorkoutCalendar
            onDaySelect={handleDaySelect}
          />
        );

      case 'day':
        return (
          <DayDetail
            date={selectedDate}
            onBack={handleBackFromDay}
            onReviewSession={handleReviewSession}
          />
        );

      case 'session':
        return (
          <WorkoutDetail
            sessionId={selectedSessionId}
            onBack={handleBackToWorkouts}
            onFinish={handleSessionFinished}
          />
        );

      case 'settings':
        return (
          <div className="workout-tracking-container">
            <h2>Settings</h2>
            <p style={{ color: 'var(--asr-gray-500)' }}>Settings coming soon...</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="workout-tracking-app">
      {renderNavTabs()}
      {renderView()}
    </div>
  );
}
