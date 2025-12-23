import React from 'react';

/**
 * WorkoutSummary - Display overall workout statistics
 * 
 * Props:
 * - summary: Object with:
 *   - total_duration: string (e.g., "45 minutes")
 *   - intensity_level: string (low|medium|high)
 *   - calories_burned_estimate: number
 *   - difficulty_rating: number (1-10)
 * 
 * Features:
 * - Total duration display
 * - Intensity level with color coding
 * - Estimated calories burned
 * - Difficulty rating visualization
 * - Clean grid layout
 */
export default function WorkoutSummary({ summary }) {
  if (!summary) return null;

  // Get intensity color and label
  const getIntensityInfo = (level) => {
    const normalized = level?.toLowerCase() || 'medium';
    const map = {
      'low': { label: 'Low', color: 'intensity-low' },
      'medium': { label: 'Medium', color: 'intensity-medium' },
      'high': { label: 'High', color: 'intensity-high' }
    };
    return map[normalized] || map['medium'];
  };

  const intensityInfo = getIntensityInfo(summary.intensity_level);

  // Create difficulty rating stars
  const renderDifficultyStars = (rating) => {
    if (!rating) return null;
    const numRating = parseInt(rating);
    const stars = [];
    for (let i = 1; i <= 10; i++) {
      stars.push(
        <span key={i} className={`difficulty-star ${i <= numRating ? 'filled' : 'empty'}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="workout-summary">
      <h3 className="summary-title">📊 Workout Summary</h3>
      
      <div className="summary-grid">
        {/* Duration */}
        <div className="summary-card summary-duration">
          <div className="summary-label">⏱️ Total Duration</div>
          <div className="summary-value">{summary.total_duration || 'N/A'}</div>
        </div>

        {/* Intensity */}
        <div className="summary-card summary-intensity">
          <div className="summary-label">💪 Intensity</div>
          <div className={`summary-value intensity-badge ${intensityInfo.color}`}>
            {intensityInfo.label}
          </div>
        </div>

        {/* Calories */}
        <div className="summary-card summary-calories">
          <div className="summary-label">🔥 Calories Burned</div>
          <div className="summary-value">{summary.calories_burned_estimate || 0}</div>
        </div>

        {/* Difficulty */}
        <div className="summary-card summary-difficulty">
          <div className="summary-label">📈 Difficulty Rating</div>
          <div className="difficulty-rating">
            <div className="difficulty-stars">
              {renderDifficultyStars(summary.difficulty_rating)}
            </div>
            <div className="difficulty-text">{summary.difficulty_rating}/10</div>
          </div>
        </div>
      </div>
    </div>
  );
}
