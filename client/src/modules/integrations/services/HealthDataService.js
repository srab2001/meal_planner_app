/**
 * HealthDataService - Import health data from connected providers
 * 
 * Supports:
 * - Steps count
 * - Sleep data
 * - Feature flag gating
 * 
 * Providers (simulated for demo):
 * - Apple Health (via Web)
 * - Fitbit
 * - Google Fit
 */

import tokenStorage from './TokenStorage';
import featureFlags from '../../../shared/services/FeatureFlags';
import auditLogger from '../../../shared/services/AuditLogger';

// Supported providers
export const HEALTH_PROVIDERS = {
  APPLE_HEALTH: {
    id: 'apple_health',
    name: 'Apple Health',
    icon: '🍎',
    color: '#000000',
    capabilities: ['steps', 'sleep', 'heart_rate'],
    available: true
  },
  FITBIT: {
    id: 'fitbit',
    name: 'Fitbit',
    icon: '⌚',
    color: '#00B0B9',
    capabilities: ['steps', 'sleep', 'heart_rate', 'weight'],
    available: true
  },
  GOOGLE_FIT: {
    id: 'google_fit',
    name: 'Google Fit',
    icon: '❤️',
    color: '#4285F4',
    capabilities: ['steps', 'sleep'],
    available: true
  }
};

// Connection states
export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error'
};

class HealthDataService {
  constructor() {
    this.FEATURE_FLAG = 'health_integrations';
    this.connections = new Map();
    this.importedData = {
      steps: [],
      sleep: []
    };
  }

  /**
   * Check if integrations are enabled
   */
  isEnabled() {
    return featureFlags.isEnabled(this.FEATURE_FLAG);
  }

  /**
   * Initialize service for a user
   */
  init(userId) {
    tokenStorage.setUserId(userId);
    
    // Load existing connections
    const connectedProviders = tokenStorage.getConnectedProviders();
    connectedProviders.forEach(providerId => {
      this.connections.set(providerId, CONNECTION_STATUS.CONNECTED);
    });
    
    // Load cached imported data
    this._loadCachedData(userId);
    
    auditLogger.log({
      category: auditLogger.CATEGORIES.INTEGRATION,
      action: 'health_service_init',
      level: auditLogger.LEVELS.INFO,
      details: { connectedProviders }
    });
  }

  /**
   * Get list of available providers
   */
  getProviders() {
    return Object.values(HEALTH_PROVIDERS);
  }

  /**
   * Get connection status for a provider
   */
  getConnectionStatus(providerId) {
    if (!this.isEnabled()) {
      return CONNECTION_STATUS.DISCONNECTED;
    }
    return this.connections.get(providerId) || CONNECTION_STATUS.DISCONNECTED;
  }

  /**
   * Connect to a health provider
   * In production, this would initiate OAuth flow
   */
  async connect(providerId) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Integrations are disabled' };
    }

    const provider = HEALTH_PROVIDERS[providerId.toUpperCase()] || 
                     Object.values(HEALTH_PROVIDERS).find(p => p.id === providerId);
    
    if (!provider) {
      return { success: false, error: 'Unknown provider' };
    }

    this.connections.set(provider.id, CONNECTION_STATUS.CONNECTING);

    try {
      // Simulate OAuth flow delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In production, this would be a real OAuth callback with tokens
      // For demo, we simulate a successful connection
      const mockToken = {
        accessToken: `demo_token_${provider.id}_${Date.now()}`,
        refreshToken: `demo_refresh_${provider.id}_${Date.now()}`,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      };

      tokenStorage.storeToken(provider.id, mockToken);
      this.connections.set(provider.id, CONNECTION_STATUS.CONNECTED);

      auditLogger.log({
        category: auditLogger.CATEGORIES.INTEGRATION,
        action: 'provider_connected',
        level: auditLogger.LEVELS.INFO,
        details: { provider: provider.id }
      });

      return { success: true, provider: provider.id };
    } catch (err) {
      this.connections.set(provider.id, CONNECTION_STATUS.ERROR);
      
      auditLogger.log({
        category: auditLogger.CATEGORIES.ERROR,
        action: 'provider_connect_failed',
        level: auditLogger.LEVELS.ERROR,
        details: { provider: provider.id, error: err.message }
      });

      return { success: false, error: err.message };
    }
  }

  /**
   * Disconnect from a health provider
   */
  async disconnect(providerId) {
    const provider = Object.values(HEALTH_PROVIDERS).find(p => p.id === providerId);
    
    if (!provider) {
      return { success: false, error: 'Unknown provider' };
    }

    try {
      // Remove token
      tokenStorage.removeToken(provider.id);
      this.connections.set(provider.id, CONNECTION_STATUS.DISCONNECTED);

      auditLogger.log({
        category: auditLogger.CATEGORIES.INTEGRATION,
        action: 'provider_disconnected',
        level: auditLogger.LEVELS.INFO,
        details: { provider: provider.id }
      });

      return { success: true };
    } catch (err) {
      auditLogger.log({
        category: auditLogger.CATEGORIES.ERROR,
        action: 'provider_disconnect_failed',
        level: auditLogger.LEVELS.ERROR,
        details: { provider: provider.id, error: err.message }
      });

      return { success: false, error: err.message };
    }
  }

  /**
   * Import health data from connected providers
   * Minimal import: steps and sleep only
   */
  async importData(providerId, options = {}) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Integrations are disabled' };
    }

    if (this.getConnectionStatus(providerId) !== CONNECTION_STATUS.CONNECTED) {
      return { success: false, error: 'Provider not connected' };
    }

    const { days = 7 } = options;

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock data (in production, this would call provider API)
      const data = this._generateMockHealthData(providerId, days);
      
      // Store imported data
      this.importedData.steps = [...this.importedData.steps, ...data.steps];
      this.importedData.sleep = [...this.importedData.sleep, ...data.sleep];
      
      // Cache to localStorage
      this._cacheData();

      auditLogger.log({
        category: auditLogger.CATEGORIES.INTEGRATION,
        action: 'data_imported',
        level: auditLogger.LEVELS.INFO,
        details: { 
          provider: providerId, 
          stepsRecords: data.steps.length,
          sleepRecords: data.sleep.length
        }
      });

      return { 
        success: true, 
        data,
        summary: {
          stepsImported: data.steps.length,
          sleepImported: data.sleep.length,
          totalSteps: data.steps.reduce((sum, d) => sum + d.steps, 0),
          avgSleepHours: data.sleep.length > 0 
            ? (data.sleep.reduce((sum, d) => sum + d.hours, 0) / data.sleep.length).toFixed(1)
            : 0
        }
      };
    } catch (err) {
      auditLogger.log({
        category: auditLogger.CATEGORIES.ERROR,
        action: 'data_import_failed',
        level: auditLogger.LEVELS.ERROR,
        details: { provider: providerId, error: err.message }
      });

      return { success: false, error: err.message };
    }
  }

  /**
   * Get imported data summary
   */
  getImportedData() {
    return {
      steps: this.importedData.steps,
      sleep: this.importedData.sleep,
      summary: {
        totalStepsRecords: this.importedData.steps.length,
        totalSleepRecords: this.importedData.sleep.length,
        latestSteps: this.importedData.steps[this.importedData.steps.length - 1] || null,
        latestSleep: this.importedData.sleep[this.importedData.sleep.length - 1] || null
      }
    };
  }

  /**
   * Generate mock health data for demo
   */
  _generateMockHealthData(providerId, days) {
    const steps = [];
    const sleep = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Random steps between 3000-12000
      steps.push({
        date: dateStr,
        steps: Math.floor(Math.random() * 9000) + 3000,
        source: providerId,
        importedAt: Date.now()
      });

      // Random sleep between 5-9 hours
      sleep.push({
        date: dateStr,
        hours: parseFloat((Math.random() * 4 + 5).toFixed(1)),
        quality: ['poor', 'fair', 'good', 'excellent'][Math.floor(Math.random() * 4)],
        source: providerId,
        importedAt: Date.now()
      });
    }

    return { steps, sleep };
  }

  /**
   * Cache data to localStorage
   */
  _cacheData() {
    try {
      const userId = tokenStorage.userId || 'anon';
      localStorage.setItem(
        `asr_health_data_${userId}`,
        JSON.stringify(this.importedData)
      );
    } catch (err) {
      console.error('[HealthDataService] Failed to cache data:', err);
    }
  }

  /**
   * Load cached data from localStorage
   */
  _loadCachedData(userId) {
    try {
      const cached = localStorage.getItem(`asr_health_data_${userId}`);
      if (cached) {
        this.importedData = JSON.parse(cached);
      }
    } catch (err) {
      console.error('[HealthDataService] Failed to load cached data:', err);
    }
  }

  /**
   * Clear all imported data
   */
  clearData() {
    this.importedData = { steps: [], sleep: [] };
    const userId = tokenStorage.userId || 'anon';
    localStorage.removeItem(`asr_health_data_${userId}`);
  }
}

// Export singleton
export const healthDataService = new HealthDataService();
export default healthDataService;
