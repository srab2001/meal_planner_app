/**
 * AchievementService
 * 
 * Tracks and manages user achievements/badges for gamification.
 * Uses ASR theme colors for achievement badges.
 * 
 * Achievements are stored in localStorage and can be synced with backend.
 * Designed to be consumed by all apps (Meal Plan, Nutrition, etc.)
 */

const STORAGE_KEY = 'asr_achievements';

// Achievement definitions with ASR theme colors
const ACHIEVEMENT_DEFINITIONS = {
  // Meal Planning Achievements
  FIRST_MEAL_PLAN: {
    id: 'FIRST_MEAL_PLAN',
    title: 'First Steps',
    description: 'Created your first meal plan',
    icon: '🍽️',
    category: 'meal_planning',
    color: 'var(--asr-purple-600)', // Primary purple
    points: 10
  },
  WEEK_PLANNER: {
    id: 'WEEK_PLANNER',
    title: 'Week Planner',
    description: 'Planned a full week of meals',
    icon: '📅',
    category: 'meal_planning',
    color: 'var(--asr-purple-500)',
    points: 25
  },
  RECIPE_COLLECTOR: {
    id: 'RECIPE_COLLECTOR',
    title: 'Recipe Collector',
    description: 'Saved 10 favorite recipes',
    icon: '⭐',
    category: 'meal_planning',
    color: 'var(--asr-orange-500)', // Accent orange
    points: 20
  },
  RECIPE_MASTER: {
    id: 'RECIPE_MASTER',
    title: 'Recipe Master',
    description: 'Saved 50 favorite recipes',
    icon: '🏆',
    category: 'meal_planning',
    color: 'var(--asr-orange-600)',
    points: 50
  },
  
  // Nutrition Achievements
  CALORIE_TRACKER: {
    id: 'CALORIE_TRACKER',
    title: 'Calorie Tracker',
    description: 'Viewed your nutrition dashboard',
    icon: '📊',
    category: 'nutrition',
    color: 'var(--asr-red-500)', // Secondary red
    points: 10
  },
  BALANCED_DIET: {
    id: 'BALANCED_DIET',
    title: 'Balanced Diet',
    description: 'Hit your macro targets for a day',
    icon: '⚖️',
    category: 'nutrition',
    color: 'var(--asr-red-600)',
    points: 30
  },
  NUTRITION_WEEK: {
    id: 'NUTRITION_WEEK',
    title: 'Nutrition Week',
    description: 'Tracked nutrition for 7 days straight',
    icon: '🥗',
    category: 'nutrition',
    color: 'var(--asr-purple-700)',
    points: 40
  },
  
  // Streak Achievements
  STREAK_3: {
    id: 'STREAK_3',
    title: 'Getting Started',
    description: 'Maintained a 3-day streak',
    icon: '🔥',
    category: 'streaks',
    color: 'var(--asr-orange-500)',
    points: 15
  },
  STREAK_7: {
    id: 'STREAK_7',
    title: 'Week Warrior',
    description: 'Maintained a 7-day streak',
    icon: '🔥',
    category: 'streaks',
    color: 'var(--asr-orange-600)',
    points: 35
  },
  STREAK_30: {
    id: 'STREAK_30',
    title: 'Monthly Master',
    description: 'Maintained a 30-day streak',
    icon: '👑',
    category: 'streaks',
    color: 'var(--asr-purple-800)',
    points: 100
  },
  
  // Engagement Achievements
  FEEDBACK_GIVER: {
    id: 'FEEDBACK_GIVER',
    title: 'Feedback Giver',
    description: 'Submitted your first feedback',
    icon: '💬',
    category: 'engagement',
    color: 'var(--asr-gray-600)',
    points: 10
  },
  EXPLORER: {
    id: 'EXPLORER',
    title: 'Explorer',
    description: 'Used all app features',
    icon: '🧭',
    category: 'engagement',
    color: 'var(--asr-purple-600)',
    points: 50
  }
};

// Security: Rate limiting for achievement unlock attempts
const UNLOCK_RATE_LIMIT = {
  maxAttempts: 10,
  windowMs: 60000 // 1 minute
};

class AchievementService {
  constructor() {
    this.achievements = this._loadAchievements();
    this.subscribers = [];
    this.pendingNotifications = [];
    // Rate limiting state
    this._unlockAttempts = [];
  }

  /**
   * Check if unlock attempts are rate limited
   * @returns {boolean} true if rate limited
   */
  _isRateLimited() {
    const now = Date.now();
    // Remove old attempts outside the window
    this._unlockAttempts = this._unlockAttempts.filter(
      time => now - time < UNLOCK_RATE_LIMIT.windowMs
    );
    return this._unlockAttempts.length >= UNLOCK_RATE_LIMIT.maxAttempts;
  }

  /**
   * Record an unlock attempt for rate limiting
   */
  _recordUnlockAttempt() {
    this._unlockAttempts.push(Date.now());
  }

  /**
   * Load achievements from localStorage
   */
  _loadAchievements() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { unlocked: {}, progress: {} };
    } catch (error) {
      console.error('Error loading achievements:', error);
      return { unlocked: {}, progress: {} };
    }
  }

  /**
   * Save achievements to localStorage
   */
  _saveAchievements() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.achievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  }

  /**
   * Get all achievement definitions
   */
  getDefinitions() {
    return ACHIEVEMENT_DEFINITIONS;
  }

  /**
   * Get a specific achievement definition
   */
  getDefinition(achievementId) {
    return ACHIEVEMENT_DEFINITIONS[achievementId] || null;
  }

  /**
   * Check if an achievement is unlocked
   */
  isUnlocked(achievementId) {
    return !!this.achievements.unlocked[achievementId];
  }

  /**
   * Get all unlocked achievements
   */
  getUnlocked() {
    return Object.keys(this.achievements.unlocked).map(id => ({
      ...ACHIEVEMENT_DEFINITIONS[id],
      unlockedAt: this.achievements.unlocked[id]
    })).filter(a => a.id); // Filter out any invalid
  }

  /**
   * Get achievements by category
   */
  getByCategory(category) {
    return Object.values(ACHIEVEMENT_DEFINITIONS)
      .filter(a => a.category === category)
      .map(a => ({
        ...a,
        unlocked: this.isUnlocked(a.id),
        unlockedAt: this.achievements.unlocked[a.id] || null
      }));
  }

  /**
   * Calculate total points earned
   */
  getTotalPoints() {
    return this.getUnlocked().reduce((sum, a) => sum + (a.points || 0), 0);
  }

  /**
   * Get progress toward an achievement
   */
  getProgress(achievementId, targetValue = 1) {
    const current = this.achievements.progress[achievementId] || 0;
    return {
      current,
      target: targetValue,
      percentage: Math.min(100, Math.round((current / targetValue) * 100))
    };
  }

  /**
   * Update progress toward an achievement
   */
  updateProgress(achievementId, value = 1) {
    this.achievements.progress[achievementId] = 
      (this.achievements.progress[achievementId] || 0) + value;
    this._saveAchievements();
  }

  /**
   * Unlock an achievement
   * Returns the achievement if newly unlocked, null if already unlocked or rate limited
   */
  unlock(achievementId) {
    // Security: Check rate limiting
    if (this._isRateLimited()) {
      console.warn('Achievement unlock rate limited - too many attempts');
      return null;
    }
    this._recordUnlockAttempt();

    if (this.isUnlocked(achievementId)) {
      return null; // Already unlocked
    }

    const definition = ACHIEVEMENT_DEFINITIONS[achievementId];
    if (!definition) {
      console.warn(`Unknown achievement: ${achievementId}`);
      return null;
    }

    // Mark as unlocked
    this.achievements.unlocked[achievementId] = new Date().toISOString();
    this._saveAchievements();

    const achievement = {
      ...definition,
      unlockedAt: this.achievements.unlocked[achievementId]
    };

    // Notify subscribers
    this._notifySubscribers('unlock', achievement);

    return achievement;
  }

  /**
   * Check and unlock achievement based on condition
   * Useful for trigger-based achievements
   */
  checkAndUnlock(achievementId, condition) {
    if (condition && !this.isUnlocked(achievementId)) {
      return this.unlock(achievementId);
    }
    return null;
  }

  /**
   * Subscribe to achievement events
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
        console.error('Achievement subscriber error:', error);
      }
    });
  }

  /**
   * Get achievement stats summary
   */
  getStats() {
    const all = Object.values(ACHIEVEMENT_DEFINITIONS);
    const unlocked = this.getUnlocked();
    
    return {
      total: all.length,
      unlocked: unlocked.length,
      locked: all.length - unlocked.length,
      percentage: Math.round((unlocked.length / all.length) * 100),
      totalPoints: this.getTotalPoints(),
      maxPoints: all.reduce((sum, a) => sum + (a.points || 0), 0),
      byCategory: {
        meal_planning: this.getByCategory('meal_planning'),
        nutrition: this.getByCategory('nutrition'),
        streaks: this.getByCategory('streaks'),
        engagement: this.getByCategory('engagement')
      }
    };
  }

  /**
   * Reset all achievements (for testing/debug)
   */
  reset() {
    this.achievements = { unlocked: {}, progress: {} };
    this._saveAchievements();
    this._notifySubscribers('reset', null);
  }

  /**
   * Sync achievements with backend (future use)
   */
  async syncWithBackend(token) {
    // TODO: Implement backend sync when endpoints are available
    // This will allow achievements to persist across devices
    console.log('Achievement sync not yet implemented');
    return { synced: false, message: 'Backend sync not available' };
  }
}

// Singleton instance
const achievementService = new AchievementService();

export default achievementService;
export { ACHIEVEMENT_DEFINITIONS };
