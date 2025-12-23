import React, { useState } from 'react';
import '../styles/WorkoutDisplay.css';
import SectionCard from './SectionCard';
import WorkoutSummary from './WorkoutSummary';

/**
 * WorkoutDisplay - Display 6-section structured workout
 * 
 * Props:
 * - workout: Complete workout object with 6 sections + summary
 * - user: User data (optional)
 * - onClose: Callback when user closes component
 * - onStart: Callback when user clicks Start Workout
 * - onSave: Callback when user saves workout
 * 
 * Features:
 * - Display all 6 workout sections (warm-up, strength, cardio, agility, recovery, closeout)
 * - Expand/collapse individual sections
 * - Show summary statistics
 * - Interactive buttons (Start, Save, Share, Close)
 * - Fully responsive design
 * - Color-coded sections for visual clarity
 */
export default function WorkoutDisplay({ workout, user, onClose, onStart, onSave }) {
  const [expandedSections, setExpandedSections] = useState({
    warm_up: true,      // Start with first section expanded
    strength: false,
    cardio: false,
    agility: false,
    recovery: false,
    closeout: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Toggle section expand/collapse
  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Handle save workout
  const handleSave = async () => {
    if (!onSave) {
      // Default: just show confirmation
      setSaveMessage('✅ Workout saved to your library!');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(workout);
      setSaveMessage('✅ Workout saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving workout:', error);
      setSaveMessage('❌ Failed to save workout');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle start workout
  const handleStart = () => {
    if (onStart) {
      onStart(workout);
    } else {
      // Default: alert user
      alert('Workout timer feature coming soon!');
    }
  };

  // Handle share workout
  const handleShare = () => {
    const workoutText = `Check out this ${workout.summary?.total_duration || 'custom'} workout! ${workout.summary?.intensity_level || 'Great'} intensity.`;
    if (navigator.share) {
      navigator.share({
        title: 'My Workout Plan',
        text: workoutText
      }).catch(err => console.log('Share error:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(workoutText);
      setSaveMessage('📋 Workout copied to clipboard!');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  if (!workout) {
    return (
      <div className="workout-display">
        <div className="workout-error">
          ❌ No workout data available
        </div>
      </div>
    );
  }

  // Map of section names to display info
  const sectionInfo = {
    warm_up: { label: '🔥 Warm-Up', color: 'orange' },
    strength: { label: '💪 Strength', color: 'red' },
    cardio: { label: '🏃 Cardio', color: 'yellow' },
    agility: { label: '⚡ Agility', color: 'green' },
    recovery: { label: '🧘 Recovery', color: 'blue' },
    closeout: { label: '🎯 Closeout', color: 'purple' }
  };

  return (
    <div className="workout-display">
      {/* Header with title and summary */}
      <div className="workout-header">
        <div className="workout-title">
          <h1>💪 Your Personalized Workout</h1>
          <p className="workout-subtitle">Tap a section to see details</p>
        </div>

        {/* Quick Summary Stats */}
        {workout.summary && (
          <div className="quick-summary">
            <div className="quick-stat">
              <span className="stat-label">⏱️ Duration</span>
              <span className="stat-value">{workout.summary.total_duration}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-label">💪 Intensity</span>
              <span className="stat-value intensity-badge" data-level={workout.summary.intensity_level}>
                {workout.summary.intensity_level?.toUpperCase() || 'MEDIUM'}
              </span>
            </div>
            <div className="quick-stat">
              <span className="stat-label">🔥 Calories</span>
              <span className="stat-value">{workout.summary.calories_burned_estimate || 0}</span>
            </div>
            <div className="quick-stat">
              <span className="stat-label">📊 Difficulty</span>
              <span className="stat-value">{workout.summary.difficulty_rating}/10</span>
            </div>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="sections-container">
        {Object.entries(sectionInfo).map(([key, info]) => {
          const section = workout[key];
          if (!section) return null;

          return (
            <SectionCard
              key={key}
              sectionKey={key}
              sectionName={info.label}
              sectionColor={info.color}
              section={section}
              isExpanded={expandedSections[key]}
              onToggleExpand={() => toggleSection(key)}
            />
          );
        })}
      </div>

      {/* Full Summary Stats */}
      {workout.summary && (
        <WorkoutSummary summary={workout.summary} />
      )}

      {/* Save Message */}
      {saveMessage && (
        <div className="save-message">
          {saveMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="btn btn-primary"
          onClick={handleStart}
          title="Start workout timer"
        >
          ▶️ Start Workout
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleSave}
          disabled={isSaving}
          title="Save to your library"
        >
          {isSaving ? '⏳ Saving...' : '💾 Save Workout'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleShare}
          title="Share this workout"
        >
          📤 Share
        </button>
        <button
          className="btn btn-tertiary"
          onClick={onClose}
          title="Close workout display"
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}
