/**
 * StreakService
 * 
 * Tracks user activity streaks for gamification.
 * Stores streak data in localStorage and can sync with backend.
 * Uses ASR theme colors for streak displays.
 * 
 * Designed to be consumed by all apps (Meal Plan, Nutrition, etc.)
 */

const STORAGE_KEY = 'asr_streaks';

// Streak milestone definitions with ASR theme colors
const STREAK_MILESTONES = [
  { days: 3, icon: '🔥', color: 'var(--asr-orange-400)', title: 'Getting Started' },
  { days: 7, icon: '🔥', color: 'var(--asr-orange-500)', title: 'Week Warrior' },
  { days: 14, icon: '🔥', color: 'var(--asr-orange-600)', title: 'Two Week Champion' },
  { days: 30, icon: '👑', color: 'var(--asr-purple-600)', title: 'Monthly Master' },
  { days: 60, icon: '💎', color: 'var(--asr-purple-700)', title: 'Dedication Pro' },
  { days: 90, icon: '🏆', color: 'var(--asr-purple-800)', title: 'Quarter Legend' },
  { days: 180, icon: '⭐', color: 'var(--asr-red-600)', title: 'Half Year Hero' },
  { days: 365, icon: '🌟', color: 'var(--asr-red-700)', title: 'Year Champion' }
];

class StreakService {
  constructor() {
    this.streakData = this._loadStreakData();
    this.subscribers = [];
  }

  /**
   * Load streak data from localStorage
   */
  _loadStreakData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
    
    // Default streak data structure
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      totalActiveDays: 0,
      activityHistory: [], // Last 30 days of activity
      streakStartDate: null
    };
  }

  /**
   * Save streak data to localStorage
   */
  _saveStreakData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.streakData));
    } catch (error) {
      console.error('Error saving streak data:', error);
    }
  }

  /**
   * Get current date in YYYY-MM-DD format
   */
  _getToday() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get yesterday's date in YYYY-MM-DD format
   */
  _getYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  /**
   * Check if a date is today
   */
  _isToday(dateString) {
    return dateString === this._getToday();
  }

  /**
   * Check if a date is yesterday
   */
  _isYesterday(dateString) {
    return dateString === this._getYesterday();
  }

  /**
   * Record activity for today
   * Returns streak update info
   */
  recordActivity() {
    const today = this._getToday();
    const { lastActiveDate, currentStreak, longestStreak } = this.streakData;

    // Already recorded for today
    if (lastActiveDate === today) {
      return {
        streakMaintained: true,
        streakIncreased: false,
        currentStreak: currentStreak,
        isNewMilestone: false
      };
    }

    let newStreak = currentStreak;
    let streakIncreased = false;
    let streakReset = false;

    if (this._isYesterday(lastActiveDate)) {
      // Continuing streak
      newStreak = currentStreak + 1;
      streakIncreased = true;
    } else if (lastActiveDate === null) {
      // First activity ever
      newStreak = 1;
      streakIncreased = true;
      this.streakData.streakStartDate = today;
    } else {
      // Streak broken - starting fresh
      newStreak = 1;
      streakReset = true;
      this.streakData.streakStartDate = today;
    }

    // Update streak data
    this.streakData.currentStreak = newStreak;
    this.streakData.lastActiveDate = today;
    this.streakData.totalActiveDays++;
    
    // Update longest streak if needed
    if (newStreak > longestStreak) {
      this.streakData.longestStreak = newStreak;
    }

    // Add to activity history (keep last 30 days)
    this.streakData.activityHistory.push(today);
    if (this.streakData.activityHistory.length > 30) {
      this.streakData.activityHistory.shift();
    }

    this._saveStreakData();

    // Check for milestone achievement
    const milestone = this._checkMilestone(newStreak);
    const isNewMilestone = milestone && streakIncreased;

    const result = {
      streakMaintained: !streakReset,
      streakIncreased,
      streakReset,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, longestStreak),
      isNewMilestone,
      milestone: isNewMilestone ? milestone : null
    };

    // Notify subscribers
    this._notifySubscribers('activity', result);

    return result;
  }

  /**
   * Check if current streak hits a milestone
   */
  _checkMilestone(streak) {
    return STREAK_MILESTONES.find(m => m.days === streak) || null;
  }

  /**
   * Get the next milestone to achieve
   */
  getNextMilestone() {
    const { currentStreak } = this.streakData;
    return STREAK_MILESTONES.find(m => m.days > currentStreak) || null;
  }

  /**
   * Get progress toward next milestone
   */
  getMilestoneProgress() {
    const { currentStreak } = this.streakData;
    const nextMilestone = this.getNextMilestone();
    const prevMilestones = STREAK_MILESTONES.filter(m => m.days <= currentStreak);
    const lastMilestone = prevMilestones[prevMilestones.length - 1];

    if (!nextMilestone) {
      return {
        current: currentStreak,
        target: currentStreak,
        percentage: 100,
        milestone: lastMilestone
      };
    }

    const startDays = lastMilestone ? lastMilestone.days : 0;
    const progress = currentStreak - startDays;
    const total = nextMilestone.days - startDays;

    return {
      current: currentStreak,
      target: nextMilestone.days,
      percentage: Math.round((progress / total) * 100),
      nextMilestone
    };
  }

  /**
   * Get current streak data
   */
  getCurrentStreak() {
    // Check if streak is still valid (activity within last day)
    const { lastActiveDate, currentStreak } = this.streakData;
    
    if (lastActiveDate === this._getToday()) {
      return currentStreak;
    }
    
    if (lastActiveDate === this._getYesterday()) {
      return currentStreak; // Still valid, waiting for today's activity
    }
    
    // Streak has expired
    return 0;
  }

  /**
   * Get complete streak stats
   */
  getStats() {
    const currentStreak = this.getCurrentStreak();
    const { longestStreak, totalActiveDays, activityHistory, streakStartDate } = this.streakData;
    const nextMilestone = this.getNextMilestone();
    const milestoneProgress = this.getMilestoneProgress();

    // Get current milestone level
    const currentMilestones = STREAK_MILESTONES.filter(m => m.days <= currentStreak);
    const currentLevel = currentMilestones[currentMilestones.length - 1] || null;

    // Calculate streak color based on current level
    const streakColor = currentLevel?.color || 'var(--asr-gray-400)';

    return {
      currentStreak,
      longestStreak,
      totalActiveDays,
      activityHistory,
      streakStartDate,
      currentLevel,
      nextMilestone,
      milestoneProgress,
      streakColor,
      isActive: currentStreak > 0,
      daysUntilNextMilestone: nextMilestone ? nextMilestone.days - currentStreak : 0
    };
  }

  /**
   * Get streak display info (for UI)
   */
  getDisplayInfo() {
    const stats = this.getStats();
    const { currentStreak, currentLevel, nextMilestone, daysUntilNextMilestone } = stats;

    let message = '';
    if (currentStreak === 0) {
      message = 'Start your streak today!';
    } else if (daysUntilNextMilestone === 1) {
      message = `1 day until ${nextMilestone.title}!`;
    } else if (nextMilestone) {
      message = `${daysUntilNextMilestone} days until ${nextMilestone.title}`;
    } else {
      message = 'You\'ve reached all milestones!';
    }

    return {
      streak: currentStreak,
      icon: currentLevel?.icon || '💪',
      color: stats.streakColor,
      title: currentLevel?.title || 'Starting Out',
      message,
      showAnimation: currentStreak > 0 && stats.milestoneProgress.percentage >= 90
    };
  }

  /**
   * Get activity for a specific date range (for calendar views)
   */
  getActivityRange(startDate, endDate) {
    const { activityHistory } = this.streakData;
    return activityHistory.filter(date => date >= startDate && date <= endDate);
  }

  /**
   * Check if activity was recorded on a specific date
   */
  wasActiveOn(dateString) {
    return this.streakData.activityHistory.includes(dateString);
  }

  /**
   * Subscribe to streak events
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers
   */
  _notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Streak subscriber error:', error);
      }
    });
  }

  /**
   * Reset streak data (for testing/debug)
   */
  reset() {
    this.streakData = {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      totalActiveDays: 0,
      activityHistory: [],
      streakStartDate: null
    };
    this._saveStreakData();
    this._notifySubscribers('reset', null);
  }

  /**
   * Sync streak data with backend (future use)
   */
  async syncWithBackend(token) {
    // TODO: Implement backend sync when endpoints are available
    console.log('Streak sync not yet implemented');
    return { synced: false, message: 'Backend sync not available' };
  }
}

// Singleton instance
const streakService = new StreakService();

export default streakService;
export { STREAK_MILESTONES };
