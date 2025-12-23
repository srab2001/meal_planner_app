import React from 'react';
import ExerciseList from './ExerciseList';

/**
 * SectionCard - Display individual workout section
 * 
 * Props:
 * - sectionKey: Key identifier (warm_up, strength, etc)
 * - sectionName: Display name with emoji (e.g., "🔥 Warm-Up")
 * - sectionColor: Color theme (orange, red, yellow, green, blue, purple)
 * - section: Section data object
 * - isExpanded: Boolean for expand state
 * - onToggleExpand: Callback to toggle expand/collapse
 * 
 * Features:
 * - Color-coded cards by section type
 * - Duration badge
 * - Expand/collapse animation
 * - Exercise list with descriptions
 * - Sets/reps for strength section
 * - Section notes and tips
 */
export default function SectionCard({
  sectionKey,
  sectionName,
  sectionColor,
  section,
  isExpanded,
  onToggleExpand
}) {
  if (!section) return null;

  return (
    <div className={`section-card section-${sectionColor} ${isExpanded ? 'expanded' : ''}`}>
      {/* Section Header - Always visible */}
      <div className="section-header" onClick={onToggleExpand}>
        <div className="section-title-area">
          <h3 className="section-title">{sectionName}</h3>
          {section.duration && (
            <span className="duration-badge">⏱️ {section.duration}</span>
          )}
        </div>
        <div className="expand-toggle">
          <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {/* Section Content - Expanded only */}
      {isExpanded && (
        <div className="section-content">
          {/* Exercises */}
          {section.exercises && section.exercises.length > 0 && (
            <div className="section-block">
              <h4 className="block-title">Exercises</h4>
              <ExerciseList
                exercises={section.exercises}
                setsReps={section.sets_reps}
                notes={section.notes}
              />
            </div>
          )}

          {/* Sets/Reps for Strength Section */}
          {section.sets_reps && (
            <div className="section-block">
              <h4 className="block-title">Sets & Reps</h4>
              <p className="section-text">{section.sets_reps}</p>
            </div>
          )}

          {/* Notes (if no exercises, show as main content) */}
          {section.notes && (!section.exercises || section.exercises.length === 0) && (
            <div className="section-block">
              <p className="section-text">{section.notes}</p>
            </div>
          )}

          {/* Notes (if exercises exist, show as supplementary) */}
          {section.notes && section.exercises && section.exercises.length > 0 && (
            <div className="section-block section-notes">
              <h4 className="block-title">💡 Tips</h4>
              <p className="section-text">{section.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
