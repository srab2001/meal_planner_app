/**
 * AchievementPopup Component
 * 
 * Displays a celebratory popup when user unlocks an achievement.
 * Uses ASR theme colors for styling.
 */

import React, { useEffect, useState } from 'react';
import { useAchievements } from '../hooks';
import './AchievementPopup.css';

const AchievementPopup = ({ autoHide = true, duration = 5000 }) => {
  const { newAchievement, clearNewAchievement } = useAchievements();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (newAchievement) {
      setVisible(true);
      setExiting(false);

      if (autoHide) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [newAchievement, autoHide, duration]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      clearNewAchievement();
    }, 300);
  };

  if (!visible || !newAchievement) {
    return null;
  }

  return (
    <div className={`achievement-popup-overlay ${exiting ? 'exiting' : ''}`}>
      <div className="achievement-popup">
        <div className="achievement-popup-confetti">
          <span>🎉</span>
          <span>✨</span>
          <span>🎊</span>
        </div>
        
        <div className="achievement-popup-header">
          <span className="achievement-popup-label">Achievement Unlocked!</span>
        </div>
        
        <div 
          className="achievement-popup-icon"
          style={{ backgroundColor: newAchievement.color }}
        >
          <span>{newAchievement.icon}</span>
        </div>
        
        <h3 className="achievement-popup-title">{newAchievement.title}</h3>
        <p className="achievement-popup-description">{newAchievement.description}</p>
        
        <div className="achievement-popup-points">
          <span className="achievement-popup-points-value">+{newAchievement.points}</span>
          <span className="achievement-popup-points-label">points</span>
        </div>
        
        <button 
          className="achievement-popup-close"
          onClick={handleClose}
        >
          Awesome!
        </button>
      </div>
    </div>
  );
};

export default AchievementPopup;
