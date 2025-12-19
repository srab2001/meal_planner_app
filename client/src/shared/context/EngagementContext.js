/**
 * EngagementProvider Context
 * 
 * Provides a centralized context for all engagement features.
 * Wrap your app with this provider to enable engagement features.
 * 
 * Usage:
 * import { EngagementProvider, useEngagement } from '../shared/context/EngagementContext';
 * 
 * <EngagementProvider>
 *   <App />
 * </EngagementProvider>
 */

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useNotification, useAchievements, useStreak, useFeedback } from '../hooks';
import { ToastContainer, AchievementPopup, FeedbackModal } from '../components';

// Create context
const EngagementContext = createContext(null);

/**
 * EngagementProvider Component
 * 
 * Provides all engagement hooks and automatically renders
 * engagement UI components (toasts, achievements, etc.)
 */
export const EngagementProvider = ({ 
  children, 
  config = {},
  renderToasts = true,
  renderAchievements = true,
  toastPosition = 'top-right'
}) => {
  // Initialize all hooks
  const notification = useNotification();
  const achievements = useAchievements();
  const streak = useStreak();
  const feedback = useFeedback();

  // Auto-record activity on mount (tracks daily usage)
  useEffect(() => {
    if (config.autoRecordActivity !== false) {
      const result = streak.recordActivity();
      
      // Check for streak achievements
      if (result.isNewMilestone && result.milestone) {
        // The streak service will handle the notification via subscriber
        // But we can also trigger achievements
        if (result.currentStreak === 3) {
          achievements.unlock('STREAK_3');
        } else if (result.currentStreak === 7) {
          achievements.unlock('STREAK_7');
        } else if (result.currentStreak === 30) {
          achievements.unlock('STREAK_30');
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show achievement notification as toast
  useEffect(() => {
    if (achievements.newAchievement && config.showAchievementToast !== false) {
      notification.showSuccess(
        `Achievement unlocked: ${achievements.newAchievement.title}!`,
        { 
          icon: achievements.newAchievement.icon,
          persistent: false,
          duration: 5000
        }
      );
    }
  }, [achievements.newAchievement]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Trigger achievement with notification
   */
  const triggerAchievement = useCallback((achievementId) => {
    const result = achievements.unlock(achievementId);
    return result;
  }, [achievements]);

  /**
   * Quick feedback prompt
   */
  const promptFeedback = useCallback(() => {
    // This would typically open the feedback modal
    // The component handles this through state
  }, []);

  // Context value
  const value = {
    // Services
    notification,
    achievements,
    streak,
    feedback,
    
    // Helper methods
    triggerAchievement,
    promptFeedback,
    
    // Quick access methods
    showSuccess: notification.showSuccess,
    showError: notification.showError,
    showInfo: notification.showInfo,
    showWarning: notification.showWarning,
    
    // Config
    config
  };

  return (
    <EngagementContext.Provider value={value}>
      {children}
      
      {/* Render engagement UI components */}
      {renderToasts && <ToastContainer position={toastPosition} />}
      {renderAchievements && <AchievementPopup />}
    </EngagementContext.Provider>
  );
};

/**
 * useEngagement Hook
 * 
 * Access all engagement features from context.
 */
export const useEngagement = () => {
  const context = useContext(EngagementContext);
  
  if (!context) {
    throw new Error('useEngagement must be used within an EngagementProvider');
  }
  
  return context;
};

export default EngagementProvider;
