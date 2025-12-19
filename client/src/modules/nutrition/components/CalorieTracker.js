import React from 'react';
import './CalorieTracker.css';

/**
 * CalorieTracker - Visual ring showing daily calorie progress
 * 
 * Displays:
 * - Circular progress ring
 * - Consumed vs goal calories
 * - Percentage and remaining
 */
export default function CalorieTracker({ consumed = 0, goal = 2000 }) {
  const percentage = Math.min(Math.round((consumed / goal) * 100), 100);
  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;

  // SVG circle parameters
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="calorie-tracker">
      <h3 className="tracker-title">Daily Calories</h3>
      
      <div className="calorie-ring-container">
        <svg className="calorie-ring" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            className="ring-background"
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            strokeWidth="12"
          />
          
          {/* Progress circle */}
          <circle
            className={`ring-progress ${isOver ? 'over' : ''}`}
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 100 100)"
          />
        </svg>
        
        {/* Center content */}
        <div className="ring-center">
          <span className="calories-consumed">{consumed.toLocaleString()}</span>
          <span className="calories-label">calories</span>
        </div>
      </div>

      {/* Stats below ring */}
      <div className="calorie-stats">
        <div className="stat">
          <span className="stat-number">{goal.toLocaleString()}</span>
          <span className="stat-text">Goal</span>
        </div>
        <div className={`stat ${isOver ? 'over' : ''}`}>
          <span className="stat-number">
            {isOver ? '+' : ''}{isOver ? (consumed - goal).toLocaleString() : remaining.toLocaleString()}
          </span>
          <span className="stat-text">{isOver ? 'Over' : 'Remaining'}</span>
        </div>
        <div className="stat">
          <span className="stat-number">{percentage}%</span>
          <span className="stat-text">Complete</span>
        </div>
      </div>

      {/* Status message */}
      <div className={`calorie-status ${isOver ? 'over' : percentage >= 80 ? 'close' : 'good'}`}>
        {isOver ? (
          <span>⚠️ You've exceeded your daily goal</span>
        ) : percentage >= 80 ? (
          <span>🎯 Almost at your goal!</span>
        ) : (
          <span>✨ {remaining.toLocaleString()} calories left today</span>
        )}
      </div>
    </div>
  );
}
