/**
 * StreakBanner Component
 * 
 * Displays the user's current streak in a compact banner format.
 * Uses ASR theme colors for styling.
 */

import React from 'react';
import { useStreak } from '../hooks';
import './StreakBanner.css';

const StreakBanner = ({ showProgress = true, compact = false }) => {
  const { stats, displayInfo } = useStreak();

  if (!stats || !displayInfo) {
    return null;
  }

  const { streak, icon, color, title, message, showAnimation } = displayInfo;
  const { milestoneProgress } = stats;

  return (
    <div className={`streak-banner ${compact ? 'streak-banner-compact' : ''}`}>
      <div 
        className={`streak-banner-icon ${showAnimation ? 'streak-banner-icon-pulse' : ''}`}
        style={{ color }}
      >
        {icon}
      </div>
      
      <div className="streak-banner-content">
        <div className="streak-banner-main">
          <span className="streak-banner-count" style={{ color }}>
            {streak}
          </span>
          <span className="streak-banner-label">
            day{streak !== 1 ? 's' : ''} streak
          </span>
        </div>
        
        {!compact && (
          <>
            <div className="streak-banner-title">{title}</div>
            <div className="streak-banner-message">{message}</div>
          </>
        )}
        
        {showProgress && milestoneProgress && milestoneProgress.percentage < 100 && (
          <div className="streak-banner-progress">
            <div className="streak-banner-progress-bar">
              <div 
                className="streak-banner-progress-fill"
                style={{ 
                  width: `${milestoneProgress.percentage}%`,
                  backgroundColor: color 
                }}
              />
            </div>
            <span className="streak-banner-progress-text">
              {milestoneProgress.current}/{milestoneProgress.target}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakBanner;
