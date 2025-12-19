/**
 * IntegrationService - Base class for all integrations
 * 
 * Provides:
 * - Common lifecycle methods (init, connect, disconnect)
 * - Feature flag integration
 * - Error handling and retry logic
 * - Status tracking
 * - Event emission
 * 
 * All integrations should extend this class.
 */

import featureFlags from './FeatureFlags';
import auditLogger from './AuditLogger';

// Integration states
export const INTEGRATION_STATUS = {
  DISABLED: 'disabled',        // Feature flag off
  DISCONNECTED: 'disconnected', // Not connected
  CONNECTING: 'connecting',     // Connection in progress
  CONNECTED: 'connected',       // Ready to use
  ERROR: 'error',              // Error state
  RATE_LIMITED: 'rate_limited' // API rate limit hit
};

/**
 * Base Integration Service
 */
export class IntegrationService {
  constructor(name, featureFlagName) {
    this.name = name;
    this.featureFlagName = featureFlagName;
    this.status = INTEGRATION_STATUS.DISCONNECTED;
    this.lastError = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // ms
    this.listeners = new Map();
    this.config = {};
    this.metadata = {
      connectedAt: null,
      lastActivityAt: null,
      operationCount: 0
    };
  }

  /**
   * Check if integration is enabled via feature flag
   */
  isFeatureEnabled() {
    return featureFlags.isEnabled(this.featureFlagName);
  }

  /**
   * Get current status
   */
  getStatus() {
    if (!this.isFeatureEnabled()) {
      return INTEGRATION_STATUS.DISABLED;
    }
    return this.status;
  }

  /**
   * Initialize the integration
   * Override in subclass for specific initialization
   */
  async init(config = {}) {
    if (!this.isFeatureEnabled()) {
      this._log('info', 'Integration disabled by feature flag');
      this.status = INTEGRATION_STATUS.DISABLED;
      return false;
    }

    this.config = { ...this.config, ...config };
    this._log('info', 'Initializing integration', { config: this._sanitizeConfig(config) });
    
    return true;
  }

  /**
   * Connect to the external service
   * Override in subclass for specific connection logic
   */
  async connect() {
    if (!this.isFeatureEnabled()) {
      throw new Error(`Integration ${this.name} is disabled`);
    }

    this.status = INTEGRATION_STATUS.CONNECTING;
    this._emit('statusChange', this.status);
    
    try {
      // Subclass implements actual connection
      await this._connect();
      
      this.status = INTEGRATION_STATUS.CONNECTED;
      this.metadata.connectedAt = new Date().toISOString();
      this.retryCount = 0;
      
      this._emit('statusChange', this.status);
      this._emit('connected');
      this._log('info', 'Connected successfully');
      
      return true;
    } catch (error) {
      return this._handleConnectionError(error);
    }
  }

  /**
   * Disconnect from the external service
   */
  async disconnect() {
    try {
      await this._disconnect();
      
      this.status = INTEGRATION_STATUS.DISCONNECTED;
      this.metadata.connectedAt = null;
      
      this._emit('statusChange', this.status);
      this._emit('disconnected');
      this._log('info', 'Disconnected');
      
      return true;
    } catch (error) {
      this._log('error', 'Disconnect error', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle connection error with retry logic
   */
  async _handleConnectionError(error) {
    this.lastError = error;
    this.status = INTEGRATION_STATUS.ERROR;
    this._emit('error', error);
    
    this._log('error', 'Connection error', { 
      error: error.message,
      retryCount: this.retryCount 
    });

    // Retry logic
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = this.retryDelay * Math.pow(2, this.retryCount - 1); // Exponential backoff
      
      this._log('info', `Retrying in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
      
      await this._sleep(delay);
      return this.connect();
    }

    this._log('error', 'Max retries exceeded');
    throw error;
  }

  /**
   * Execute an operation with error handling
   */
  async execute(operation, ...args) {
    if (!this.isFeatureEnabled()) {
      throw new Error(`Integration ${this.name} is disabled`);
    }

    if (this.status !== INTEGRATION_STATUS.CONNECTED) {
      throw new Error(`Integration ${this.name} is not connected`);
    }

    this.metadata.lastActivityAt = new Date().toISOString();
    this.metadata.operationCount++;

    try {
      const result = await operation.apply(this, args);
      return result;
    } catch (error) {
      this._log('error', 'Operation error', { error: error.message });
      this._emit('error', error);
      throw error;
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  _emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[${this.name}] Event listener error:`, err);
        }
      });
    }
  }

  /**
   * Log to audit logger
   */
  _log(level, message, details = {}) {
    const logLevels = {
      debug: auditLogger.LEVELS.DEBUG,
      info: auditLogger.LEVELS.INFO,
      warn: auditLogger.LEVELS.WARN,
      error: auditLogger.LEVELS.ERROR
    };

    auditLogger.log({
      category: auditLogger.CATEGORIES.DATA,
      action: `integration_${this.name}_${message.toLowerCase().replace(/\s+/g, '_')}`,
      level: logLevels[level] || auditLogger.LEVELS.INFO,
      details: {
        integration: this.name,
        ...details
      }
    });
  }

  /**
   * Sanitize config for logging (remove secrets)
   */
  _sanitizeConfig(config) {
    const sanitized = { ...config };
    const sensitiveKeys = ['apiKey', 'secret', 'token', 'password', 'credentials'];
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });
    return sanitized;
  }

  /**
   * Sleep helper for retry delays
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get integration info
   */
  getInfo() {
    return {
      name: this.name,
      featureFlag: this.featureFlagName,
      status: this.getStatus(),
      isEnabled: this.isFeatureEnabled(),
      lastError: this.lastError?.message || null,
      metadata: this.metadata,
      rolloutStatus: featureFlags.getRolloutStatus(this.featureFlagName)
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const info = this.getInfo();
    
    try {
      if (this.status === INTEGRATION_STATUS.CONNECTED) {
        await this._healthCheck();
        return { ...info, healthy: true };
      }
      return { ...info, healthy: this.status === INTEGRATION_STATUS.DISABLED };
    } catch (error) {
      return { ...info, healthy: false, healthError: error.message };
    }
  }

  // Methods to override in subclasses
  async _connect() {
    throw new Error('_connect must be implemented');
  }

  async _disconnect() {
    // Default: no-op
  }

  async _healthCheck() {
    // Default: no-op, assume healthy if connected
  }
}

export default IntegrationService;
