/**
 * FeatureFlags - Centralized feature flag management
 * 
 * Provides:
 * - Feature flag evaluation
 * - User/cohort targeting
 * - Gradual rollout percentages
 * - Local overrides for testing
 * - Analytics integration
 * 
 * Usage:
 *   import featureFlags from './FeatureFlags';
 *   if (featureFlags.isEnabled('calendar_sync')) { ... }
 */

class FeatureFlags {
  constructor() {
    this.STORAGE_KEY = 'feature_flags';
    this.OVERRIDES_KEY = 'feature_flag_overrides';
    this.flags = new Map();
    this.overrides = new Map();
    this.userId = null;
    this.userCohort = null;
    this.initialized = false;
    
    this._init();
  }

  /**
   * Initialize feature flags
   */
  _init() {
    if (this.initialized) return;
    
    // Load defaults
    this._loadDefaultFlags();
    
    // Load any local overrides
    this._loadOverrides();
    
    // Try to load remote config
    this._fetchRemoteFlags().catch(() => {
      console.log('[FeatureFlags] Using default flags (remote fetch failed)');
    });
    
    this.initialized = true;
  }

  /**
   * Default feature flag configurations
   * 
   * Flag schema:
   * {
   *   name: string,           // Unique identifier
   *   enabled: boolean,       // Global on/off
   *   rolloutPercent: number, // 0-100, percentage of users
   *   allowedCohorts: array,  // User cohorts that can access
   *   startDate: string,      // ISO date when flag becomes available
   *   endDate: string,        // ISO date when flag expires
   *   metadata: object        // Additional config data
   * }
   */
  _loadDefaultFlags() {
    const defaultFlags = [
      // Calendar Sync Integration
      {
        name: 'calendar_sync',
        enabled: false,
        rolloutPercent: 0,
        allowedCohorts: ['beta', 'internal'],
        startDate: null,
        endDate: null,
        metadata: {
          description: 'Sync meal plans to Google Calendar',
          category: 'integration',
          version: '1.0.0'
        }
      },
      // Notification Integration
      {
        name: 'push_notifications',
        enabled: false,
        rolloutPercent: 0,
        allowedCohorts: ['beta'],
        startDate: null,
        endDate: null,
        metadata: {
          description: 'Push notification reminders',
          category: 'integration',
          version: '1.0.0'
        }
      },
      // Export Integration
      {
        name: 'export_pdf',
        enabled: true,
        rolloutPercent: 100,
        allowedCohorts: ['all'],
        startDate: null,
        endDate: null,
        metadata: {
          description: 'Export meal plans as PDF',
          category: 'integration',
          version: '1.0.0'
        }
      },
      // Analytics Integration
      {
        name: 'advanced_analytics',
        enabled: false,
        rolloutPercent: 25,
        allowedCohorts: ['beta', 'premium'],
        startDate: null,
        endDate: null,
        metadata: {
          description: 'Detailed health analytics dashboard',
          category: 'feature',
          version: '1.0.0'
        }
      },
      // Shopping List Integration
      {
        name: 'shopping_list_sync',
        enabled: false,
        rolloutPercent: 0,
        allowedCohorts: ['beta'],
        startDate: null,
        endDate: null,
        metadata: {
          description: 'Sync shopping list to external apps',
          category: 'integration',
          version: '1.0.0'
        }
      },
      // AI Coaching Enhanced
      {
        name: 'ai_coaching_v2',
        enabled: false,
        rolloutPercent: 10,
        allowedCohorts: ['internal'],
        startDate: null,
        endDate: null,
        metadata: {
          description: 'Enhanced AI coaching with GPT-4',
          category: 'feature',
          version: '2.0.0'
        }
      },
      // Health Integrations Module
      {
        name: 'health_integrations',
        enabled: true,  // Enabled by default for testing
        rolloutPercent: 100,
        allowedCohorts: ['all'],
        startDate: null,
        endDate: null,
        metadata: {
          description: 'Connect health apps (Apple Health, Fitbit, Google Fit)',
          category: 'integration',
          version: '1.0.0'
        }
      }
    ];

    defaultFlags.forEach(flag => {
      this.flags.set(flag.name, flag);
    });
  }

  /**
   * Load local overrides from localStorage
   */
  _loadOverrides() {
    try {
      const stored = localStorage.getItem(this.OVERRIDES_KEY);
      if (stored) {
        const overrides = JSON.parse(stored);
        Object.entries(overrides).forEach(([name, value]) => {
          this.overrides.set(name, value);
        });
      }
    } catch (err) {
      console.error('[FeatureFlags] Error loading overrides:', err);
    }
  }

  /**
   * Fetch remote flag configuration (API call)
   */
  async _fetchRemoteFlags() {
    // In production, this would call your feature flag service
    // For now, we'll use localStorage as a simulated remote config
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const remoteFlags = JSON.parse(stored);
        remoteFlags.forEach(flag => {
          if (this.flags.has(flag.name)) {
            // Merge with defaults, preserving metadata
            const existing = this.flags.get(flag.name);
            this.flags.set(flag.name, { ...existing, ...flag });
          } else {
            this.flags.set(flag.name, flag);
          }
        });
      }
    } catch (err) {
      throw new Error('Failed to fetch remote flags');
    }
  }

  /**
   * Set user context for targeting
   * @param {string} userId - User identifier
   * @param {string} cohort - User cohort (e.g., 'beta', 'premium', 'internal')
   */
  setUserContext(userId, cohort = 'default') {
    this.userId = userId;
    this.userCohort = cohort;
  }

  /**
   * Check if a feature flag is enabled for current user
   * @param {string} flagName - Name of the flag to check
   * @returns {boolean} Whether the flag is enabled
   */
  isEnabled(flagName) {
    // Check for local override first
    if (this.overrides.has(flagName)) {
      return this.overrides.get(flagName);
    }

    const flag = this.flags.get(flagName);
    if (!flag) {
      console.warn(`[FeatureFlags] Unknown flag: ${flagName}`);
      return false;
    }

    // Check if globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check date constraints
    const now = new Date();
    if (flag.startDate && new Date(flag.startDate) > now) {
      return false;
    }
    if (flag.endDate && new Date(flag.endDate) < now) {
      return false;
    }

    // Check cohort access
    if (flag.allowedCohorts && !flag.allowedCohorts.includes('all')) {
      if (!this.userCohort || !flag.allowedCohorts.includes(this.userCohort)) {
        // Not in allowed cohort, check rollout percentage
        return this._checkRolloutPercentage(flagName, flag.rolloutPercent);
      }
    }

    // Check rollout percentage
    return this._checkRolloutPercentage(flagName, flag.rolloutPercent);
  }

  /**
   * Deterministic percentage check based on userId
   * Ensures same user always gets same result
   */
  _checkRolloutPercentage(flagName, percent) {
    if (percent >= 100) return true;
    if (percent <= 0) return false;

    // Generate deterministic hash from userId + flagName
    const hashInput = `${this.userId || 'anonymous'}_${flagName}`;
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to percentage (0-99)
    const userPercent = Math.abs(hash) % 100;
    return userPercent < percent;
  }

  /**
   * Get flag configuration
   * @param {string} flagName - Name of the flag
   * @returns {object|null} Flag configuration or null
   */
  getFlag(flagName) {
    return this.flags.get(flagName) || null;
  }

  /**
   * Get all flags
   * @returns {Array} Array of all flag configurations
   */
  getAllFlags() {
    return Array.from(this.flags.values());
  }

  /**
   * Get flags by category
   * @param {string} category - Category to filter by
   * @returns {Array} Filtered flags
   */
  getFlagsByCategory(category) {
    return this.getAllFlags().filter(
      flag => flag.metadata?.category === category
    );
  }

  /**
   * Set local override (for testing/development)
   * @param {string} flagName - Name of the flag
   * @param {boolean} value - Override value
   */
  setOverride(flagName, value) {
    this.overrides.set(flagName, value);
    this._saveOverrides();
    console.log(`[FeatureFlags] Override set: ${flagName} = ${value}`);
  }

  /**
   * Clear a local override
   * @param {string} flagName - Name of the flag
   */
  clearOverride(flagName) {
    this.overrides.delete(flagName);
    this._saveOverrides();
    console.log(`[FeatureFlags] Override cleared: ${flagName}`);
  }

  /**
   * Clear all local overrides
   */
  clearAllOverrides() {
    this.overrides.clear();
    localStorage.removeItem(this.OVERRIDES_KEY);
    console.log('[FeatureFlags] All overrides cleared');
  }

  /**
   * Save overrides to localStorage
   */
  _saveOverrides() {
    try {
      const overridesObj = Object.fromEntries(this.overrides);
      localStorage.setItem(this.OVERRIDES_KEY, JSON.stringify(overridesObj));
    } catch (err) {
      console.error('[FeatureFlags] Error saving overrides:', err);
    }
  }

  /**
   * Update flag configuration (admin function)
   * @param {string} flagName - Name of the flag
   * @param {object} updates - Partial flag configuration
   */
  updateFlag(flagName, updates) {
    const flag = this.flags.get(flagName);
    if (!flag) {
      console.error(`[FeatureFlags] Cannot update unknown flag: ${flagName}`);
      return false;
    }

    const updated = { ...flag, ...updates };
    this.flags.set(flagName, updated);
    this._saveFlags();
    
    console.log(`[FeatureFlags] Flag updated: ${flagName}`, updates);
    return true;
  }

  /**
   * Enable a flag with optional rollout percentage
   * @param {string} flagName - Name of the flag
   * @param {number} rolloutPercent - Rollout percentage (default: 100)
   */
  enableFlag(flagName, rolloutPercent = 100) {
    return this.updateFlag(flagName, { 
      enabled: true, 
      rolloutPercent 
    });
  }

  /**
   * Disable a flag
   * @param {string} flagName - Name of the flag
   */
  disableFlag(flagName) {
    return this.updateFlag(flagName, { 
      enabled: false, 
      rolloutPercent: 0 
    });
  }

  /**
   * Gradual rollout - increase percentage
   * @param {string} flagName - Name of the flag
   * @param {number} increment - Percentage to add (default: 10)
   */
  incrementRollout(flagName, increment = 10) {
    const flag = this.flags.get(flagName);
    if (!flag) return false;

    const newPercent = Math.min(100, flag.rolloutPercent + increment);
    return this.updateFlag(flagName, { rolloutPercent: newPercent });
  }

  /**
   * Rollback - decrease percentage or disable
   * @param {string} flagName - Name of the flag
   * @param {number} decrement - Percentage to remove (default: full rollback)
   */
  rollback(flagName, decrement = null) {
    const flag = this.flags.get(flagName);
    if (!flag) return false;

    if (decrement === null) {
      // Full rollback
      return this.disableFlag(flagName);
    }

    const newPercent = Math.max(0, flag.rolloutPercent - decrement);
    return this.updateFlag(flagName, { 
      rolloutPercent: newPercent,
      enabled: newPercent > 0
    });
  }

  /**
   * Save flags to localStorage (simulates saving to remote)
   */
  _saveFlags() {
    try {
      const flagsArray = Array.from(this.flags.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(flagsArray));
    } catch (err) {
      console.error('[FeatureFlags] Error saving flags:', err);
    }
  }

  /**
   * Get rollout status for a flag
   * @param {string} flagName - Name of the flag
   * @returns {object} Rollout status info
   */
  getRolloutStatus(flagName) {
    const flag = this.flags.get(flagName);
    if (!flag) return null;

    return {
      name: flagName,
      enabled: flag.enabled,
      rolloutPercent: flag.rolloutPercent,
      userEligible: this.isEnabled(flagName),
      hasOverride: this.overrides.has(flagName),
      overrideValue: this.overrides.get(flagName),
      cohort: this.userCohort,
      allowedCohorts: flag.allowedCohorts
    };
  }

  /**
   * Export current flag state for debugging
   */
  exportState() {
    return {
      flags: Object.fromEntries(this.flags),
      overrides: Object.fromEntries(this.overrides),
      userId: this.userId,
      userCohort: this.userCohort,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
const featureFlags = new FeatureFlags();
export default featureFlags;

// Also export class for testing
export { FeatureFlags };
