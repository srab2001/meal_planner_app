/**
 * useAchievements Hook
 * 
 * React hook for tracking and displaying user achievements.
 * Integrates with AchievementService singleton.
 * 
 * Usage:
 * const { achievements, unlock, stats } = useAchievements();
 * unlock('FIRST_MEAL_PLAN');
 */

import { useState, useEffect, useCallback } from 'react';
import AchievementService, { ACHIEVEMENT_DEFINITIONS } from '../services/engagement/AchievementService';

const useAchievements = () => {
  const [unlocked, setUnlocked] = useState([]);
  const [stats, setStats] = useState(null);
  const [newAchievement, setNewAchievement] = useState(null);

  /**
   * Refresh achievement state
   */
  const refresh = useCallback(() => {
    setUnlocked(AchievementService.getUnlocked());
    setStats(AchievementService.getStats());
  }, []);

  useEffect(() => {
    // Initial load
    refresh();

    // Subscribe to achievement events
    const unsubscribe = AchievementService.subscribe((event, data) => {
      if (event === 'unlock') {
        setNewAchievement(data);
        refresh();
        
        // Clear new achievement after display time
        setTimeout(() => setNewAchievement(null), 5000);
      } else if (event === 'reset') {
        setNewAchievement(null);
        refresh();
      }
    });

    return unsubscribe;
  }, [refresh]);

  /**
   * Unlock an achievement
   */
  const unlock = useCallback((achievementId) => {
    return AchievementService.unlock(achievementId);
  }, []);

  /**
   * Check and unlock based on condition
   */
  const checkAndUnlock = useCallback((achievementId, condition) => {
    return AchievementService.checkAndUnlock(achievementId, condition);
  }, []);

  /**
   * Check if an achievement is unlocked
   */
  const isUnlocked = useCallback((achievementId) => {
    return AchievementService.isUnlocked(achievementId);
  }, []);

  /**
   * Get achievements by category
   */
  const getByCategory = useCallback((category) => {
    return AchievementService.getByCategory(category);
  }, []);

  /**
   * Get progress toward an achievement
   */
  const getProgress = useCallback((achievementId, targetValue = 1) => {
    return AchievementService.getProgress(achievementId, targetValue);
  }, []);

  /**
   * Update progress toward an achievement
   */
  const updateProgress = useCallback((achievementId, value = 1) => {
    AchievementService.updateProgress(achievementId, value);
    refresh();
  }, [refresh]);

  /**
   * Get total points
   */
  const getTotalPoints = useCallback(() => {
    return AchievementService.getTotalPoints();
  }, []);

  /**
   * Clear the new achievement notification
   */
  const clearNewAchievement = useCallback(() => {
    setNewAchievement(null);
  }, []);

  /**
   * Reset all achievements (for debug/testing)
   */
  const reset = useCallback(() => {
    AchievementService.reset();
  }, []);

  return {
    // State
    unlocked,
    stats,
    newAchievement,
    definitions: ACHIEVEMENT_DEFINITIONS,
    
    // Actions
    unlock,
    checkAndUnlock,
    isUnlocked,
    getByCategory,
    getProgress,
    updateProgress,
    getTotalPoints,
    clearNewAchievement,
    refresh,
    reset
  };
};

export default useAchievements;
