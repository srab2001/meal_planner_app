/**
 * FeedbackService
 * 
 * Handles user feedback collection including ratings, NPS scores,
 * feature requests, and bug reports.
 * 
 * Stores feedback locally and can submit to backend.
 * Uses ASR theme colors for feedback UI elements.
 * 
 * Designed to be consumed by all apps (Meal Plan, Nutrition, etc.)
 */

const STORAGE_KEY = 'asr_feedback';
const FEEDBACK_SETTINGS_KEY = 'asr_feedback_settings';

// Feedback types with ASR theme colors
const FEEDBACK_TYPES = {
  RATING: {
    id: 'RATING',
    title: 'Rate Your Experience',
    icon: '⭐',
    color: 'var(--asr-orange-500)'
  },
  NPS: {
    id: 'NPS',
    title: 'Net Promoter Score',
    description: 'How likely are you to recommend us?',
    icon: '📊',
    color: 'var(--asr-purple-600)'
  },
  FEATURE_REQUEST: {
    id: 'FEATURE_REQUEST',
    title: 'Feature Request',
    description: 'Tell us what you\'d like to see',
    icon: '💡',
    color: 'var(--asr-orange-400)'
  },
  BUG_REPORT: {
    id: 'BUG_REPORT',
    title: 'Report a Problem',
    description: 'Help us improve by reporting issues',
    icon: '🐛',
    color: 'var(--asr-red-500)'
  },
  GENERAL: {
    id: 'GENERAL',
    title: 'General Feedback',
    description: 'Share your thoughts',
    icon: '💬',
    color: 'var(--asr-purple-500)'
  }
};

// Rating emoji scale
const RATING_SCALE = [
  { value: 1, emoji: '😠', label: 'Very Dissatisfied', color: 'var(--asr-red-600)' },
  { value: 2, emoji: '😞', label: 'Dissatisfied', color: 'var(--asr-red-400)' },
  { value: 3, emoji: '😐', label: 'Neutral', color: 'var(--asr-orange-400)' },
  { value: 4, emoji: '😊', label: 'Satisfied', color: 'var(--asr-purple-400)' },
  { value: 5, emoji: '😍', label: 'Very Satisfied', color: 'var(--asr-purple-600)' }
];

// NPS score categories
const NPS_CATEGORIES = {
  DETRACTOR: { min: 0, max: 6, label: 'Detractor', color: 'var(--asr-red-500)' },
  PASSIVE: { min: 7, max: 8, label: 'Passive', color: 'var(--asr-orange-500)' },
  PROMOTER: { min: 9, max: 10, label: 'Promoter', color: 'var(--asr-purple-600)' }
};

class FeedbackService {
  constructor() {
    this.feedbackHistory = this._loadFeedbackHistory();
    this.settings = this._loadSettings();
    this.subscribers = [];
    this.pendingFeedback = [];
  }

  /**
   * Load feedback history from localStorage
   */
  _loadFeedbackHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading feedback history:', error);
      return [];
    }
  }

  /**
   * Save feedback history to localStorage
   * Limits history to MAX_FEEDBACK_HISTORY entries to prevent storage abuse
   */
  _saveFeedbackHistory() {
    try {
      // Security: Limit feedback history to prevent localStorage abuse
      const MAX_FEEDBACK_HISTORY = 100;
      if (this.feedbackHistory.length > MAX_FEEDBACK_HISTORY) {
        this.feedbackHistory = this.feedbackHistory.slice(-MAX_FEEDBACK_HISTORY);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.feedbackHistory));
    } catch (error) {
      console.error('Error saving feedback history:', error);
    }
  }

  /**
   * Load feedback settings
   */
  _loadSettings() {
    try {
      const stored = localStorage.getItem(FEEDBACK_SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading feedback settings:', error);
    }

    return {
      lastPromptDate: null,
      promptFrequency: 7, // Days between prompts
      hasGivenRating: false,
      hasGivenNPS: false,
      dismissedUntil: null,
      totalFeedbackGiven: 0
    };
  }

  /**
   * Save feedback settings
   */
  _saveSettings() {
    try {
      localStorage.setItem(FEEDBACK_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving feedback settings:', error);
    }
  }

  /**
   * Sanitize and validate text input
   * @param {string} text - Input text to sanitize
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} Sanitized text
   */
  _sanitizeText(text, maxLength = 5000) {
    if (!text || typeof text !== 'string') return '';
    // Trim and limit length to prevent abuse
    return text.trim().slice(0, maxLength);
  }

  /**
   * Submit feedback
   */
  submit(type, data) {
    // Security: Sanitize text fields
    const sanitizedData = {
      ...data,
      comment: this._sanitizeText(data.comment, 5000),
      message: this._sanitizeText(data.message, 5000),
      title: this._sanitizeText(data.title, 200),
      description: this._sanitizeText(data.description, 5000)
    };

    const feedbackEntry = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data: sanitizedData,
      timestamp: new Date().toISOString(),
      appContext: sanitizedData.appContext || 'meal_planner',
      synced: false
    };

    // Add to history
    this.feedbackHistory.push(feedbackEntry);
    this._saveFeedbackHistory();

    // Update settings
    this.settings.totalFeedbackGiven++;
    this.settings.lastPromptDate = new Date().toISOString().split('T')[0];

    if (type === 'RATING') {
      this.settings.hasGivenRating = true;
    } else if (type === 'NPS') {
      this.settings.hasGivenNPS = true;
    }

    this._saveSettings();

    // Notify subscribers
    this._notifySubscribers('submitted', feedbackEntry);

    return feedbackEntry;
  }

  /**
   * Submit a rating (1-5 scale)
   */
  submitRating(rating, comment = '', context = {}) {
    return this.submit('RATING', {
      rating,
      comment,
      ratingLabel: RATING_SCALE.find(r => r.value === rating)?.label,
      ...context
    });
  }

  /**
   * Submit NPS score (0-10 scale)
   */
  submitNPS(score, comment = '', context = {}) {
    let category;
    if (score <= 6) category = 'DETRACTOR';
    else if (score <= 8) category = 'PASSIVE';
    else category = 'PROMOTER';

    return this.submit('NPS', {
      score,
      category,
      categoryLabel: NPS_CATEGORIES[category].label,
      comment,
      ...context
    });
  }

  /**
   * Submit a feature request
   */
  submitFeatureRequest(title, description, priority = 'medium', context = {}) {
    return this.submit('FEATURE_REQUEST', {
      title,
      description,
      priority,
      ...context
    });
  }

  /**
   * Submit a bug report
   */
  submitBugReport(title, description, severity = 'medium', context = {}) {
    return this.submit('BUG_REPORT', {
      title,
      description,
      severity,
      browser: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      ...context
    });
  }

  /**
   * Submit general feedback
   */
  submitGeneral(message, category = 'general', context = {}) {
    return this.submit('GENERAL', {
      message,
      category,
      ...context
    });
  }

  /**
   * Check if should prompt for feedback
   */
  shouldPromptForFeedback() {
    const { lastPromptDate, promptFrequency, dismissedUntil } = this.settings;
    const today = new Date().toISOString().split('T')[0];

    // Check if dismissed
    if (dismissedUntil && dismissedUntil > today) {
      return { shouldPrompt: false, reason: 'dismissed' };
    }

    // Check frequency
    if (lastPromptDate) {
      const daysSinceLastPrompt = this._daysBetween(lastPromptDate, today);
      if (daysSinceLastPrompt < promptFrequency) {
        return { 
          shouldPrompt: false, 
          reason: 'too_soon',
          daysUntilPrompt: promptFrequency - daysSinceLastPrompt 
        };
      }
    }

    return { shouldPrompt: true, reason: 'ready' };
  }

  /**
   * Calculate days between two date strings
   */
  _daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  /**
   * Dismiss feedback prompt for specified days
   */
  dismissPrompt(days = 7) {
    const dismissDate = new Date();
    dismissDate.setDate(dismissDate.getDate() + days);
    this.settings.dismissedUntil = dismissDate.toISOString().split('T')[0];
    this._saveSettings();
  }

  /**
   * Get feedback types config
   */
  getFeedbackTypes() {
    return FEEDBACK_TYPES;
  }

  /**
   * Get rating scale
   */
  getRatingScale() {
    return RATING_SCALE;
  }

  /**
   * Get NPS categories
   */
  getNPSCategories() {
    return NPS_CATEGORIES;
  }

  /**
   * Get feedback history
   */
  getHistory(type = null) {
    if (type) {
      return this.feedbackHistory.filter(f => f.type === type);
    }
    return this.feedbackHistory;
  }

  /**
   * Get feedback stats
   */
  getStats() {
    const history = this.feedbackHistory;
    
    // Calculate average rating
    const ratings = history.filter(f => f.type === 'RATING').map(f => f.data.rating);
    const avgRating = ratings.length > 0 
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;

    // Calculate NPS score
    const npsScores = history.filter(f => f.type === 'NPS');
    let npsScore = null;
    if (npsScores.length > 0) {
      const promoters = npsScores.filter(f => f.data.score >= 9).length;
      const detractors = npsScores.filter(f => f.data.score <= 6).length;
      npsScore = Math.round(((promoters - detractors) / npsScores.length) * 100);
    }

    return {
      totalFeedback: history.length,
      byType: {
        RATING: history.filter(f => f.type === 'RATING').length,
        NPS: history.filter(f => f.type === 'NPS').length,
        FEATURE_REQUEST: history.filter(f => f.type === 'FEATURE_REQUEST').length,
        BUG_REPORT: history.filter(f => f.type === 'BUG_REPORT').length,
        GENERAL: history.filter(f => f.type === 'GENERAL').length
      },
      averageRating: avgRating,
      npsScore,
      settings: this.settings
    };
  }

  /**
   * Subscribe to feedback events
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
        console.error('Feedback subscriber error:', error);
      }
    });
  }

  /**
   * Reset all feedback data (for testing/debug)
   */
  reset() {
    this.feedbackHistory = [];
    this.settings = {
      lastPromptDate: null,
      promptFrequency: 7,
      hasGivenRating: false,
      hasGivenNPS: false,
      dismissedUntil: null,
      totalFeedbackGiven: 0
    };
    this._saveFeedbackHistory();
    this._saveSettings();
    this._notifySubscribers('reset', null);
  }

  /**
   * Sync feedback with backend
   */
  async syncWithBackend(token) {
    const unsynced = this.feedbackHistory.filter(f => !f.synced);
    
    if (unsynced.length === 0) {
      return { synced: true, count: 0 };
    }

    // TODO: Implement actual backend sync when endpoints are available
    console.log(`Would sync ${unsynced.length} feedback entries to backend`);
    
    // Mark as synced (mock)
    // unsynced.forEach(f => f.synced = true);
    // this._saveFeedbackHistory();

    return { 
      synced: false, 
      count: unsynced.length,
      message: 'Backend sync not yet implemented' 
    };
  }
}

// Singleton instance
const feedbackService = new FeedbackService();

export default feedbackService;
export { FEEDBACK_TYPES, RATING_SCALE, NPS_CATEGORIES };
