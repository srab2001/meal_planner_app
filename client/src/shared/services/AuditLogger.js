/**
 * AuditLogger - Centralized audit logging service
 * 
 * Logs user actions, errors, and security events for:
 * - Compliance and debugging
 * - User behavior analytics
 * - Security monitoring
 * 
 * Events are stored locally and can be synced to backend
 */

class AuditLogger {
  constructor() {
    this.STORAGE_KEY = 'audit_log';
    this.MAX_ENTRIES = 500;
    this.SESSION_ID = this._generateSessionId();
    this.initialized = false;
    
    // Event categories
    this.CATEGORIES = {
      AUTH: 'auth',
      NAVIGATION: 'navigation',
      COACHING: 'coaching',
      GOAL: 'goal',
      HABIT: 'habit',
      PROGRAM: 'program',
      CHAT: 'chat',
      DATA: 'data',
      ERROR: 'error',
      SECURITY: 'security'
    };

    // Event severity levels
    this.LEVELS = {
      DEBUG: 'debug',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error',
      CRITICAL: 'critical'
    };

    this._init();
  }

  /**
   * Initialize the logger
   */
  _init() {
    if (this.initialized) return;
    
    // Log session start
    this.log({
      category: this.CATEGORIES.AUTH,
      action: 'session_start',
      level: this.LEVELS.INFO,
      details: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        timestamp: new Date().toISOString()
      }
    });

    this.initialized = true;
  }

  /**
   * Generate a unique session ID
   */
  _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current user ID from localStorage
   */
  _getUserId() {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Extract user info from JWT (basic parsing)
        const payload = token.split('.')[1];
        if (payload) {
          const decoded = JSON.parse(atob(payload));
          return decoded.userId || decoded.sub || 'authenticated';
        }
      }
    } catch (e) {
      // Token parsing failed
    }
    return 'anonymous';
  }

  /**
   * Main logging method
   * 
   * @param {Object} event - Event to log
   * @param {string} event.category - Event category (auth, coaching, etc.)
   * @param {string} event.action - Specific action (goal_created, habit_completed, etc.)
   * @param {string} event.level - Severity level (info, warn, error)
   * @param {Object} event.details - Additional event data
   * @param {string} event.userId - Override user ID (optional)
   */
  log(event) {
    const logEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      sessionId: this.SESSION_ID,
      userId: event.userId || this._getUserId(),
      category: event.category || this.CATEGORIES.DATA,
      action: event.action || 'unknown',
      level: event.level || this.LEVELS.INFO,
      details: this._sanitizeDetails(event.details || {}),
      url: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    };

    // Store locally
    this._storeEntry(logEntry);

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      this._consoleOutput(logEntry);
    }

    return logEntry;
  }

  /**
   * Sanitize details to remove sensitive data
   */
  _sanitizeDetails(details) {
    const sanitized = { ...details };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Truncate large strings
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 500) {
        sanitized[key] = sanitized[key].substring(0, 500) + '...[truncated]';
      }
    });

    return sanitized;
  }

  /**
   * Store entry in localStorage
   */
  _storeEntry(entry) {
    try {
      const logs = this._getLogs();
      logs.push(entry);

      // Trim to max entries (FIFO)
      while (logs.length > this.MAX_ENTRIES) {
        logs.shift();
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('AuditLogger: Failed to store entry', e);
    }
  }

  /**
   * Get all stored logs
   */
  _getLogs() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Console output for development
   */
  _consoleOutput(entry) {
    const style = this._getConsoleStyle(entry.level);
    const prefix = `[${entry.category.toUpperCase()}]`;
    
    console.log(
      `%c${prefix} ${entry.action}`,
      style,
      entry.details
    );
  }

  /**
   * Get console styling based on level
   */
  _getConsoleStyle(level) {
    const styles = {
      debug: 'color: #9ca3af',
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b; font-weight: bold',
      error: 'color: #ef4444; font-weight: bold',
      critical: 'color: #dc2626; font-weight: bold; background: #fef2f2'
    };
    return styles[level] || styles.info;
  }

  // ==========================================
  // CONVENIENCE METHODS
  // ==========================================

  /**
   * Log authentication events
   */
  logAuth(action, details = {}) {
    return this.log({
      category: this.CATEGORIES.AUTH,
      action: `auth_${action}`,
      level: this.LEVELS.INFO,
      details
    });
  }

  /**
   * Log navigation events
   */
  logNavigation(from, to, details = {}) {
    return this.log({
      category: this.CATEGORIES.NAVIGATION,
      action: 'navigate',
      level: this.LEVELS.DEBUG,
      details: { from, to, ...details }
    });
  }

  /**
   * Log coaching module events
   */
  logCoaching(action, details = {}) {
    return this.log({
      category: this.CATEGORIES.COACHING,
      action: `coaching_${action}`,
      level: this.LEVELS.INFO,
      details
    });
  }

  /**
   * Log goal events
   */
  logGoal(action, goalData = {}) {
    return this.log({
      category: this.CATEGORIES.GOAL,
      action: `goal_${action}`,
      level: this.LEVELS.INFO,
      details: {
        goalId: goalData.id,
        goalTitle: goalData.title,
        category: goalData.category,
        progress: goalData.progress,
        ...goalData
      }
    });
  }

  /**
   * Log habit events
   */
  logHabit(action, habitData = {}) {
    return this.log({
      category: this.CATEGORIES.HABIT,
      action: `habit_${action}`,
      level: this.LEVELS.INFO,
      details: {
        habitId: habitData.id,
        habitName: habitData.name,
        streak: habitData.streak,
        ...habitData
      }
    });
  }

  /**
   * Log program events
   */
  logProgram(action, programData = {}) {
    return this.log({
      category: this.CATEGORIES.PROGRAM,
      action: `program_${action}`,
      level: this.LEVELS.INFO,
      details: {
        programId: programData.id,
        programName: programData.name,
        progress: programData.progress,
        ...programData
      }
    });
  }

  /**
   * Log chat events
   */
  logChat(action, details = {}) {
    return this.log({
      category: this.CATEGORIES.CHAT,
      action: `chat_${action}`,
      level: this.LEVELS.INFO,
      details: {
        // Don't log full message content for privacy
        messageLength: details.messageLength,
        isAIResponse: details.isAIResponse,
        ...details
      }
    });
  }

  /**
   * Log errors
   */
  logError(error, context = {}) {
    return this.log({
      category: this.CATEGORIES.ERROR,
      action: 'error_occurred',
      level: this.LEVELS.ERROR,
      details: {
        errorMessage: error.message || String(error),
        errorName: error.name,
        stack: error.stack?.substring(0, 500),
        context
      }
    });
  }

  /**
   * Log security events
   */
  logSecurity(action, details = {}) {
    return this.log({
      category: this.CATEGORIES.SECURITY,
      action: `security_${action}`,
      level: this.LEVELS.WARN,
      details
    });
  }

  // ==========================================
  // ANALYTICS & EXPORT
  // ==========================================

  /**
   * Get logs by category
   */
  getLogsByCategory(category) {
    return this._getLogs().filter(log => log.category === category);
  }

  /**
   * Get logs by date range
   */
  getLogsByDateRange(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return this._getLogs().filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime >= start && logTime <= end;
    });
  }

  /**
   * Get logs for current session
   */
  getCurrentSessionLogs() {
    return this._getLogs().filter(log => log.sessionId === this.SESSION_ID);
  }

  /**
   * Get error logs
   */
  getErrors() {
    return this._getLogs().filter(log => 
      log.level === this.LEVELS.ERROR || log.level === this.LEVELS.CRITICAL
    );
  }

  /**
   * Get log summary statistics
   */
  getSummary() {
    const logs = this._getLogs();
    const summary = {
      totalEntries: logs.length,
      byCategory: {},
      byLevel: {},
      sessionCount: new Set(logs.map(l => l.sessionId)).size,
      errorCount: 0,
      dateRange: {
        earliest: logs[0]?.timestamp,
        latest: logs[logs.length - 1]?.timestamp
      }
    };

    logs.forEach(log => {
      summary.byCategory[log.category] = (summary.byCategory[log.category] || 0) + 1;
      summary.byLevel[log.level] = (summary.byLevel[log.level] || 0) + 1;
      if (log.level === this.LEVELS.ERROR || log.level === this.LEVELS.CRITICAL) {
        summary.errorCount++;
      }
    });

    return summary;
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    const logs = this._getLogs();
    const exportData = {
      exportedAt: new Date().toISOString(),
      summary: this.getSummary(),
      logs
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.log({
      category: this.CATEGORIES.SECURITY,
      action: 'logs_cleared',
      level: this.LEVELS.WARN
    });
  }
}

// Export singleton instance
const auditLogger = new AuditLogger();

export default auditLogger;
export { AuditLogger };
