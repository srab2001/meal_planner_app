/**
 * AnalyticsService - Track user actions and conversions
 * 
 * Tracks:
 * - Plan generation events
 * - Shopping list saves
 * - App selection from switchboard
 * - Conversion to paid (if applicable)
 * 
 * Privacy:
 * - No PII logged
 * - User ID is anonymized
 * - Event data is minimal
 * - Failures don't affect UX
 * 
 * Architecture:
 * - Fire once per action (deduplication)
 * - Local storage for offline support
 * - Batch sync to backend (optional)
 */

// Event types
export const ANALYTICS_EVENTS = {
  // Meal Plan Events
  PLAN_GENERATION_STARTED: 'plan_generation_started',
  PLAN_GENERATION_COMPLETED: 'plan_generation_completed',
  PLAN_GENERATION_FAILED: 'plan_generation_failed',
  PLAN_SAVED: 'plan_saved',
  PLAN_EXPORTED: 'plan_exported',
  
  // Shopping List Events
  SHOPPING_LIST_CREATED: 'shopping_list_created',
  SHOPPING_LIST_SAVED: 'shopping_list_saved',
  SHOPPING_LIST_EXPORTED: 'shopping_list_exported',
  SHOPPING_LIST_ITEM_CHECKED: 'shopping_list_item_checked',
  
  // Navigation Events
  APP_SELECTED: 'app_selected',
  APP_SWITCHED: 'app_switched',
  SWITCHBOARD_VIEWED: 'switchboard_viewed',
  
  // Conversion Events
  TRIAL_STARTED: 'trial_started',
  CONVERSION_TO_PAID: 'conversion_to_paid',
  UPGRADE_CLICKED: 'upgrade_clicked',
  PAYWALL_VIEWED: 'paywall_viewed',
  DISCOUNT_CODE_APPLIED: 'discount_code_applied',
  
  // Feature Usage
  FEATURE_USED: 'feature_used',
  AI_COACHING_MESSAGE: 'ai_coaching_message',
  PROGRESS_CHECKED: 'progress_checked',
  BADGE_EARNED: 'badge_earned',
  STREAK_UPDATED: 'streak_updated',
  
  // Integration Events
  INTEGRATION_CONNECTED: 'integration_connected',
  INTEGRATION_DISCONNECTED: 'integration_disconnected',
  DATA_IMPORTED: 'data_imported'
};

// Event categories for grouping
export const EVENT_CATEGORIES = {
  MEAL_PLAN: 'meal_plan',
  SHOPPING: 'shopping',
  NAVIGATION: 'navigation',
  CONVERSION: 'conversion',
  FEATURE: 'feature',
  INTEGRATION: 'integration'
};

class AnalyticsService {
  constructor() {
    this.STORAGE_KEY = 'analytics_events';
    this.DEDUP_KEY = 'analytics_dedup';
    this.MAX_EVENTS = 1000;
    this.DEDUP_WINDOW_MS = 1000; // 1 second deduplication window
    this.sessionId = this._generateSessionId();
    this.userId = null;
    this.isEnabled = true;
    
    // Performance tracking
    this.performanceImpact = 0;
    this.MAX_PERFORMANCE_MS = 50; // Max time analytics should take
  }

  /**
   * Initialize analytics with user context
   * @param {string} userId - User identifier (will be hashed)
   */
  init(userId) {
    this.userId = this._hashUserId(userId);
    this._cleanupOldEvents();
  }

  /**
   * Generate session ID for grouping events
   */
  _generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Hash user ID to anonymize (no PII)
   */
  _hashUserId(userId) {
    if (!userId) return 'anonymous';
    // Simple hash - in production use proper hashing
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Track an analytics event
   * @param {string} eventName - Event type from ANALYTICS_EVENTS
   * @param {object} properties - Event properties (no PII)
   * @returns {boolean} - Success status
   */
  track(eventName, properties = {}) {
    const startTime = performance.now();
    
    try {
      // Fail silently if disabled
      if (!this.isEnabled) return false;

      // Validate event name
      if (!Object.values(ANALYTICS_EVENTS).includes(eventName)) {
        console.warn(`[Analytics] Unknown event: ${eventName}`);
      }

      // Check deduplication
      if (this._isDuplicate(eventName, properties)) {
        return false; // Skip duplicate
      }

      // Create event object
      const event = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: eventName,
        category: this._getCategory(eventName),
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        userId: this.userId,
        properties: this._sanitizeProperties(properties)
      };

      // Store event
      this._storeEvent(event);

      // Mark as tracked for deduplication
      this._markTracked(eventName, properties);

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] ${eventName}`, event.properties);
      }

      return true;
    } catch (err) {
      // Analytics should NEVER break the app
      console.error('[Analytics] Error (non-blocking):', err.message);
      return false;
    } finally {
      // Track performance impact
      this.performanceImpact = performance.now() - startTime;
      if (this.performanceImpact > this.MAX_PERFORMANCE_MS) {
        console.warn(`[Analytics] Performance warning: ${this.performanceImpact.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Get event category
   */
  _getCategory(eventName) {
    if (eventName.includes('plan')) return EVENT_CATEGORIES.MEAL_PLAN;
    if (eventName.includes('shopping')) return EVENT_CATEGORIES.SHOPPING;
    if (eventName.includes('app_') || eventName.includes('switchboard')) return EVENT_CATEGORIES.NAVIGATION;
    if (eventName.includes('conversion') || eventName.includes('paid') || eventName.includes('trial') || eventName.includes('upgrade')) return EVENT_CATEGORIES.CONVERSION;
    if (eventName.includes('integration')) return EVENT_CATEGORIES.INTEGRATION;
    return EVENT_CATEGORIES.FEATURE;
  }

  /**
   * Sanitize properties to remove PII
   */
  _sanitizeProperties(properties) {
    const sanitized = { ...properties };
    
    // Remove PII fields
    const piiFields = [
      'email', 'name', 'firstName', 'lastName', 'phone', 
      'address', 'ssn', 'creditCard', 'password', 'token'
    ];
    
    piiFields.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field];
        console.warn(`[Analytics] PII field removed: ${field}`);
      }
    });

    // Truncate long strings
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 200) {
        sanitized[key] = sanitized[key].substring(0, 200) + '...[truncated]';
      }
    });

    return sanitized;
  }

  /**
   * Check if event is a duplicate (within dedup window)
   */
  _isDuplicate(eventName, properties) {
    try {
      const dedupKey = `${eventName}_${JSON.stringify(properties)}`;
      const stored = sessionStorage.getItem(this.DEDUP_KEY);
      const dedupMap = stored ? JSON.parse(stored) : {};
      
      const lastTime = dedupMap[dedupKey];
      if (lastTime && (Date.now() - lastTime) < this.DEDUP_WINDOW_MS) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Mark event as tracked for deduplication
   */
  _markTracked(eventName, properties) {
    try {
      const dedupKey = `${eventName}_${JSON.stringify(properties)}`;
      const stored = sessionStorage.getItem(this.DEDUP_KEY);
      const dedupMap = stored ? JSON.parse(stored) : {};
      
      dedupMap[dedupKey] = Date.now();
      
      // Cleanup old entries
      Object.keys(dedupMap).forEach(key => {
        if (Date.now() - dedupMap[key] > 60000) { // 1 minute
          delete dedupMap[key];
        }
      });
      
      sessionStorage.setItem(this.DEDUP_KEY, JSON.stringify(dedupMap));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Store event in localStorage
   */
  _storeEvent(event) {
    try {
      const events = this._getEvents();
      events.push(event);
      
      // Trim to max size
      while (events.length > this.MAX_EVENTS) {
        events.shift();
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
    } catch (err) {
      // Storage full or disabled - fail silently
    }
  }

  /**
   * Get all stored events
   */
  _getEvents() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Cleanup old events (older than 30 days)
   */
  _cleanupOldEvents() {
    try {
      const events = this._getEvents();
      const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      const filtered = events.filter(e => {
        const eventTime = new Date(e.timestamp).getTime();
        return eventTime > cutoff;
      });
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // Ignore cleanup errors
    }
  }

  // ==========================================
  // CONVENIENCE METHODS
  // ==========================================

  /**
   * Track plan generation
   */
  trackPlanGeneration(status, details = {}) {
    const eventName = status === 'started' 
      ? ANALYTICS_EVENTS.PLAN_GENERATION_STARTED
      : status === 'completed'
        ? ANALYTICS_EVENTS.PLAN_GENERATION_COMPLETED
        : ANALYTICS_EVENTS.PLAN_GENERATION_FAILED;
    
    return this.track(eventName, {
      daysRequested: details.days,
      dietaryPreferences: details.preferences?.length || 0,
      duration: details.duration,
      error: details.error
    });
  }

  /**
   * Track shopping list save
   */
  trackShoppingListSave(itemCount, details = {}) {
    return this.track(ANALYTICS_EVENTS.SHOPPING_LIST_SAVED, {
      itemCount,
      exportFormat: details.format,
      source: details.source || 'meal_plan'
    });
  }

  /**
   * Track app selection from switchboard
   */
  trackAppSelection(appId, previousApp = null) {
    return this.track(ANALYTICS_EVENTS.APP_SELECTED, {
      appId,
      previousApp,
      fromSwitchboard: true
    });
  }

  /**
   * Track switchboard view
   */
  trackSwitchboardView() {
    return this.track(ANALYTICS_EVENTS.SWITCHBOARD_VIEWED, {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track conversion to paid
   */
  trackConversion(plan, details = {}) {
    return this.track(ANALYTICS_EVENTS.CONVERSION_TO_PAID, {
      plan,
      discountCode: details.discountCode ? 'used' : 'none',
      trialDays: details.trialDays,
      source: details.source
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureName, details = {}) {
    return this.track(ANALYTICS_EVENTS.FEATURE_USED, {
      feature: featureName,
      ...details
    });
  }

  /**
   * Track AI coaching message
   */
  trackCoachingMessage(messageType, details = {}) {
    return this.track(ANALYTICS_EVENTS.AI_COACHING_MESSAGE, {
      messageType,
      programId: details.programId,
      guardrailTriggered: details.guardrailTriggered || false
    });
  }

  /**
   * Track integration events
   */
  trackIntegration(action, provider, details = {}) {
    const eventName = action === 'connected'
      ? ANALYTICS_EVENTS.INTEGRATION_CONNECTED
      : action === 'disconnected'
        ? ANALYTICS_EVENTS.INTEGRATION_DISCONNECTED
        : ANALYTICS_EVENTS.DATA_IMPORTED;
    
    return this.track(eventName, {
      provider,
      dataTypes: details.dataTypes,
      recordCount: details.recordCount
    });
  }

  // ==========================================
  // DASHBOARD & REPORTING
  // ==========================================

  /**
   * Get event summary for dashboard
   */
  getSummary() {
    const events = this._getEvents();
    
    const summary = {
      totalEvents: events.length,
      byCategory: {},
      byEvent: {},
      byDate: {},
      conversionFunnel: {
        switchboardViews: 0,
        appSelections: 0,
        planGenerations: 0,
        shoppingSaves: 0,
        conversions: 0
      }
    };

    events.forEach(event => {
      // By category
      summary.byCategory[event.category] = (summary.byCategory[event.category] || 0) + 1;
      
      // By event name
      summary.byEvent[event.name] = (summary.byEvent[event.name] || 0) + 1;
      
      // By date
      const date = event.timestamp.split('T')[0];
      summary.byDate[date] = (summary.byDate[date] || 0) + 1;
      
      // Conversion funnel
      if (event.name === ANALYTICS_EVENTS.SWITCHBOARD_VIEWED) summary.conversionFunnel.switchboardViews++;
      if (event.name === ANALYTICS_EVENTS.APP_SELECTED) summary.conversionFunnel.appSelections++;
      if (event.name === ANALYTICS_EVENTS.PLAN_GENERATION_COMPLETED) summary.conversionFunnel.planGenerations++;
      if (event.name === ANALYTICS_EVENTS.SHOPPING_LIST_SAVED) summary.conversionFunnel.shoppingSaves++;
      if (event.name === ANALYTICS_EVENTS.CONVERSION_TO_PAID) summary.conversionFunnel.conversions++;
    });

    return summary;
  }

  /**
   * Get events by date range
   */
  getEventsByDateRange(startDate, endDate) {
    const events = this._getEvents();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= start && eventTime <= end;
    });
  }

  /**
   * Export events for external analytics
   */
  exportEvents(format = 'json') {
    const events = this._getEvents();
    
    if (format === 'csv') {
      const headers = ['id', 'name', 'category', 'timestamp', 'sessionId', 'userId'];
      const rows = events.map(e => 
        headers.map(h => JSON.stringify(e[h] || '')).join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }
    
    return JSON.stringify(events, null, 2);
  }

  /**
   * Clear all analytics data
   */
  clearAll() {
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.DEDUP_KEY);
  }

  /**
   * Disable analytics (user opt-out)
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * Enable analytics
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Check if analytics is enabled
   */
  isAnalyticsEnabled() {
    return this.isEnabled;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      lastOperationMs: this.performanceImpact,
      maxAllowedMs: this.MAX_PERFORMANCE_MS,
      status: this.performanceImpact <= this.MAX_PERFORMANCE_MS ? 'ok' : 'warning'
    };
  }
}

// Singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;

// Named exports for convenience
export { AnalyticsService };
