/**
 * RolloutManager - Manage feature flag rollouts with validation
 * 
 * Provides:
 * - Gradual rollout with health monitoring
 * - Automatic rollback on errors
 * - Rollout plans with stages
 * - Validation between stages
 */

import featureFlags from '../FeatureFlags';
import integrationRegistry from './IntegrationRegistry';
import auditLogger from '../AuditLogger';

// Rollout stages
export const ROLLOUT_STAGES = {
  DISABLED: { percent: 0, name: 'Disabled' },
  INTERNAL: { percent: 0, cohorts: ['internal'], name: 'Internal Testing' },
  BETA: { percent: 10, cohorts: ['beta', 'internal'], name: 'Beta Users' },
  EARLY_ACCESS: { percent: 25, cohorts: ['beta', 'internal'], name: 'Early Access' },
  LIMITED: { percent: 50, name: 'Limited Release' },
  GENERAL: { percent: 75, name: 'General Availability' },
  FULL: { percent: 100, name: 'Full Release' }
};

// Rollout status
export const ROLLOUT_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ROLLED_BACK: 'rolled_back',
  FAILED: 'failed'
};

class RolloutManager {
  constructor() {
    this.activeRollouts = new Map();
    this.rolloutHistory = [];
    this.healthCheckInterval = null;
    this.STORAGE_KEY = 'rollout_state';
    
    this._loadState();
  }

  /**
   * Start a new rollout plan
   * @param {string} flagName - Feature flag name
   * @param {object} options - Rollout options
   */
  async startRollout(flagName, options = {}) {
    const {
      targetStage = ROLLOUT_STAGES.FULL,
      healthCheckIntervalMs = 60000, // 1 minute
      errorThreshold = 0.05, // 5% error rate
      minSampleSize = 100,
      pauseOnError = true
    } = options;

    // Validate flag exists
    const flag = featureFlags.getFlag(flagName);
    if (!flag) {
      throw new Error(`Unknown feature flag: ${flagName}`);
    }

    // Create rollout plan
    const rollout = {
      id: `rollout_${Date.now()}`,
      flagName,
      status: ROLLOUT_STATUS.IN_PROGRESS,
      targetStage,
      currentStage: ROLLOUT_STAGES.DISABLED,
      startedAt: new Date().toISOString(),
      options: { healthCheckIntervalMs, errorThreshold, minSampleSize, pauseOnError },
      healthHistory: [],
      stageHistory: []
    };

    this.activeRollouts.set(flagName, rollout);
    
    // Log rollout start
    this._log('info', 'rollout_started', {
      flagName,
      targetStage: targetStage.name
    });

    // Start health monitoring
    this._startHealthMonitoring(flagName, healthCheckIntervalMs);

    // Save state
    this._saveState();

    return rollout;
  }

  /**
   * Advance rollout to next stage
   * @param {string} flagName - Feature flag name
   */
  async advanceRollout(flagName) {
    const rollout = this.activeRollouts.get(flagName);
    if (!rollout) {
      throw new Error(`No active rollout for: ${flagName}`);
    }

    // Run health check before advancing
    const healthCheck = await this.runHealthCheck(flagName);
    if (!healthCheck.healthy) {
      this._log('warn', 'advance_blocked', { flagName, reason: healthCheck.reason });
      throw new Error(`Cannot advance: ${healthCheck.reason}`);
    }

    // Determine next stage
    const stages = Object.values(ROLLOUT_STAGES);
    const currentIndex = stages.findIndex(s => s.name === rollout.currentStage.name);
    const nextStage = stages[currentIndex + 1];

    if (!nextStage) {
      rollout.status = ROLLOUT_STATUS.COMPLETED;
      this._log('info', 'rollout_completed', { flagName });
      this._saveState();
      return rollout;
    }

    // Check if we've reached target
    if (nextStage.percent > rollout.targetStage.percent) {
      rollout.status = ROLLOUT_STATUS.COMPLETED;
      this._log('info', 'rollout_completed', { flagName, reason: 'reached_target' });
      this._saveState();
      return rollout;
    }

    // Update flag
    featureFlags.updateFlag(flagName, {
      enabled: true,
      rolloutPercent: nextStage.percent,
      allowedCohorts: nextStage.cohorts || flag?.allowedCohorts || ['all']
    });

    // Record stage change
    rollout.currentStage = nextStage;
    rollout.stageHistory.push({
      stage: nextStage.name,
      timestamp: new Date().toISOString(),
      percent: nextStage.percent
    });

    this._log('info', 'rollout_advanced', {
      flagName,
      newStage: nextStage.name,
      percent: nextStage.percent
    });

    this._saveState();
    return rollout;
  }

  /**
   * Pause an active rollout
   * @param {string} flagName - Feature flag name
   */
  pauseRollout(flagName, reason = 'Manual pause') {
    const rollout = this.activeRollouts.get(flagName);
    if (!rollout) {
      throw new Error(`No active rollout for: ${flagName}`);
    }

    rollout.status = ROLLOUT_STATUS.PAUSED;
    rollout.pausedAt = new Date().toISOString();
    rollout.pauseReason = reason;

    this._stopHealthMonitoring(flagName);

    this._log('warn', 'rollout_paused', { flagName, reason });
    this._saveState();

    return rollout;
  }

  /**
   * Resume a paused rollout
   * @param {string} flagName - Feature flag name
   */
  async resumeRollout(flagName) {
    const rollout = this.activeRollouts.get(flagName);
    if (!rollout || rollout.status !== ROLLOUT_STATUS.PAUSED) {
      throw new Error(`No paused rollout for: ${flagName}`);
    }

    rollout.status = ROLLOUT_STATUS.IN_PROGRESS;
    rollout.resumedAt = new Date().toISOString();

    this._startHealthMonitoring(flagName, rollout.options.healthCheckIntervalMs);

    this._log('info', 'rollout_resumed', { flagName });
    this._saveState();

    return rollout;
  }

  /**
   * Rollback a feature flag
   * @param {string} flagName - Feature flag name
   * @param {string} reason - Rollback reason
   */
  async rollback(flagName, reason = 'Manual rollback') {
    const rollout = this.activeRollouts.get(flagName);
    
    // Disable the flag
    featureFlags.disableFlag(flagName);

    // If there's an associated integration, disconnect it
    const integration = integrationRegistry.get(flagName);
    if (integration) {
      try {
        await integration.disconnect();
      } catch (e) {
        console.error(`[RolloutManager] Failed to disconnect integration: ${e.message}`);
      }
    }

    if (rollout) {
      rollout.status = ROLLOUT_STATUS.ROLLED_BACK;
      rollout.rolledBackAt = new Date().toISOString();
      rollout.rollbackReason = reason;
      rollout.currentStage = ROLLOUT_STAGES.DISABLED;

      this._stopHealthMonitoring(flagName);
    }

    // Add to history
    this.rolloutHistory.push({
      flagName,
      action: 'rollback',
      reason,
      timestamp: new Date().toISOString(),
      previousState: rollout ? { ...rollout } : null
    });

    this._log('error', 'rollout_rolled_back', { flagName, reason });
    this._saveState();

    return { success: true, reason };
  }

  /**
   * Run health check for a feature
   * @param {string} flagName - Feature flag name
   */
  async runHealthCheck(flagName) {
    const rollout = this.activeRollouts.get(flagName);
    const integration = integrationRegistry.get(flagName);

    const result = {
      flagName,
      timestamp: new Date().toISOString(),
      healthy: true,
      checks: []
    };

    // Check 1: Integration health (if applicable)
    if (integration) {
      try {
        const integrationHealth = await integration.healthCheck();
        result.checks.push({
          name: 'integration_health',
          passed: integrationHealth.healthy,
          details: integrationHealth
        });
        if (!integrationHealth.healthy) {
          result.healthy = false;
          result.reason = 'Integration unhealthy';
        }
      } catch (error) {
        result.checks.push({
          name: 'integration_health',
          passed: false,
          error: error.message
        });
        result.healthy = false;
        result.reason = `Integration error: ${error.message}`;
      }
    }

    // Check 2: Error rate from audit logs
    const errorRate = this._calculateErrorRate(flagName);
    const errorThreshold = rollout?.options?.errorThreshold || 0.05;
    result.checks.push({
      name: 'error_rate',
      passed: errorRate < errorThreshold,
      errorRate,
      threshold: errorThreshold
    });
    if (errorRate >= errorThreshold) {
      result.healthy = false;
      result.reason = `Error rate ${(errorRate * 100).toFixed(1)}% exceeds threshold ${(errorThreshold * 100)}%`;
    }

    // Check 3: Feature flag status
    const flag = featureFlags.getFlag(flagName);
    result.checks.push({
      name: 'feature_flag',
      passed: flag?.enabled || false,
      enabled: flag?.enabled,
      rolloutPercent: flag?.rolloutPercent
    });

    // Record health check
    if (rollout) {
      rollout.healthHistory.push(result);
      // Keep only last 100 health checks
      if (rollout.healthHistory.length > 100) {
        rollout.healthHistory = rollout.healthHistory.slice(-100);
      }
    }

    // Auto-pause if unhealthy and configured
    if (!result.healthy && rollout?.status === ROLLOUT_STATUS.IN_PROGRESS) {
      if (rollout.options.pauseOnError) {
        this.pauseRollout(flagName, result.reason);
      }
    }

    this._saveState();
    return result;
  }

  /**
   * Calculate error rate from audit logs
   */
  _calculateErrorRate(flagName) {
    try {
      const logs = auditLogger.getLogs();
      const recentLogs = logs.filter(log => {
        const age = Date.now() - new Date(log.timestamp).getTime();
        return age < 3600000 && // Last hour
               log.details?.integration === flagName;
      });

      if (recentLogs.length === 0) return 0;

      const errorCount = recentLogs.filter(
        log => log.level === 'error' || log.level === 'critical'
      ).length;

      return errorCount / recentLogs.length;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Start health monitoring for a rollout
   */
  _startHealthMonitoring(flagName, intervalMs) {
    this._stopHealthMonitoring(flagName); // Clear any existing
    
    const intervalId = setInterval(() => {
      this.runHealthCheck(flagName).catch(console.error);
    }, intervalMs);

    this.healthCheckInterval = intervalId;
  }

  /**
   * Stop health monitoring
   */
  _stopHealthMonitoring(flagName) {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get rollout status
   * @param {string} flagName - Feature flag name
   */
  getRolloutStatus(flagName) {
    const rollout = this.activeRollouts.get(flagName);
    if (!rollout) {
      return { exists: false };
    }

    return {
      exists: true,
      ...rollout,
      flag: featureFlags.getFlag(flagName)
    };
  }

  /**
   * Get all active rollouts
   */
  getActiveRollouts() {
    return Array.from(this.activeRollouts.values());
  }

  /**
   * Get rollout history
   */
  getHistory() {
    return this.rolloutHistory;
  }

  /**
   * Validate a feature can be rolled out
   */
  async validateRollout(flagName) {
    const results = {
      flagName,
      valid: true,
      checks: []
    };

    // Check 1: Flag exists
    const flag = featureFlags.getFlag(flagName);
    results.checks.push({
      name: 'flag_exists',
      passed: !!flag,
      message: flag ? 'Feature flag found' : 'Feature flag not found'
    });
    if (!flag) {
      results.valid = false;
      return results;
    }

    // Check 2: No active rollout
    const activeRollout = this.activeRollouts.get(flagName);
    results.checks.push({
      name: 'no_active_rollout',
      passed: !activeRollout || activeRollout.status === ROLLOUT_STATUS.COMPLETED,
      message: activeRollout ? `Active rollout exists (${activeRollout.status})` : 'No active rollout'
    });

    // Check 3: Integration ready (if applicable)
    const integration = integrationRegistry.get(flagName);
    if (integration) {
      try {
        await integration.init({ mockMode: true });
        results.checks.push({
          name: 'integration_ready',
          passed: true,
          message: 'Integration initialized successfully'
        });
      } catch (error) {
        results.checks.push({
          name: 'integration_ready',
          passed: false,
          message: `Integration init failed: ${error.message}`
        });
        results.valid = false;
      }
    }

    return results;
  }

  /**
   * Log to audit logger
   */
  _log(level, action, details = {}) {
    const logLevels = {
      debug: auditLogger.LEVELS.DEBUG,
      info: auditLogger.LEVELS.INFO,
      warn: auditLogger.LEVELS.WARN,
      error: auditLogger.LEVELS.ERROR
    };

    auditLogger.log({
      category: auditLogger.CATEGORIES.DATA,
      action: `rollout_${action}`,
      level: logLevels[level] || auditLogger.LEVELS.INFO,
      details
    });
  }

  /**
   * Save state to localStorage
   */
  _saveState() {
    try {
      const state = {
        activeRollouts: Object.fromEntries(this.activeRollouts),
        rolloutHistory: this.rolloutHistory.slice(-50) // Keep last 50
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('[RolloutManager] Failed to save state:', e);
    }
  }

  /**
   * Load state from localStorage
   */
  _loadState() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        if (state.activeRollouts) {
          this.activeRollouts = new Map(Object.entries(state.activeRollouts));
        }
        if (state.rolloutHistory) {
          this.rolloutHistory = state.rolloutHistory;
        }
      }
    } catch (e) {
      console.error('[RolloutManager] Failed to load state:', e);
    }
  }

  /**
   * Export state for debugging
   */
  exportState() {
    return {
      activeRollouts: Object.fromEntries(this.activeRollouts),
      rolloutHistory: this.rolloutHistory,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
const rolloutManager = new RolloutManager();
export default rolloutManager;

// Also export class for testing
export { RolloutManager };
