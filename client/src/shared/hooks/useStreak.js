/**
 * useStreak Hook
 * 
 * React hook for tracking user activity streaks.
 * Integrates with StreakService singleton.
 * 
 * Usage:
 * const { streak, recordActivity, stats } = useStreak();
 * recordActivity(); // Call on app load or user action
 */

import { useState, useEffect, useCallback } from 'react';
import StreakService, { STREAK_MILESTONES } from '../services/engagement/StreakService';

const useStreak = () => {
  const [streakData, setStreakData] = useState(null);
  const [displayInfo, setDisplayInfo] = useState(null);
  const [newMilestone, setNewMilestone] = useState(null);

  /**
   * Refresh streak state
   */
  const refresh = useCallback(() => {
    setStreakData(StreakService.getStats());
    setDisplayInfo(StreakService.getDisplayInfo());
  }, []);

  useEffect(() => {
    // Initial load
    refresh();

    // Subscribe to streak events
    const unsubscribe = StreakService.subscribe((event, data) => {
      if (event === 'activity') {
        if (data.isNewMilestone) {
          setNewMilestone(data.milestone);
          // Clear milestone notification after display
          setTimeout(() => setNewMilestone(null), 5000);
        }
        refresh();
      } else if (event === 'reset') {
        setNewMilestone(null);
        refresh();
      }
    });

    return unsubscribe;
  }, [refresh]);

  /**
   * Record activity for today
   * Returns streak update info
   */
  const recordActivity = useCallback(() => {
    const result = StreakService.recordActivity();
    return result;
  }, []);

  /**
   * Get current streak count
   */
  const getCurrentStreak = useCallback(() => {
    return StreakService.getCurrentStreak();
  }, []);

  /**
   * Get next milestone info
   */
  const getNextMilestone = useCallback(() => {
    return StreakService.getNextMilestone();
  }, []);

  /**
   * Get progress toward next milestone
   */
  const getMilestoneProgress = useCallback(() => {
    return StreakService.getMilestoneProgress();
  }, []);

  /**
   * Check if active on a specific date
   */
  const wasActiveOn = useCallback((dateString) => {
    return StreakService.wasActiveOn(dateString);
  }, []);

  /**
   * Get activity for date range
   */
  const getActivityRange = useCallback((startDate, endDate) => {
    return StreakService.getActivityRange(startDate, endDate);
  }, []);

  /**
   * Clear milestone notification
   */
  const clearNewMilestone = useCallback(() => {
    setNewMilestone(null);
  }, []);

  /**
   * Reset streak (for debug/testing)
   */
  const reset = useCallback(() => {
    StreakService.reset();
  }, []);

  return {
    // State
    stats: streakData,
    displayInfo,
    newMilestone,
    milestones: STREAK_MILESTONES,
    
    // Computed values
    currentStreak: streakData?.currentStreak || 0,
    longestStreak: streakData?.longestStreak || 0,
    isActive: streakData?.isActive || false,
    
    // Actions
    recordActivity,
    getCurrentStreak,
    getNextMilestone,
    getMilestoneProgress,
    wasActiveOn,
    getActivityRange,
    clearNewMilestone,
    refresh,
    reset
  };
};

export default useStreak;
