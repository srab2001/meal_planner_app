/**
 * IntegrationRegistry - Manages all available integrations
 * 
 * Provides:
 * - Central registry of integrations
 * - Discovery of available integrations
 * - Bulk operations (connect all, health check all)
 * - Integration lifecycle management
 * 
 * Usage:
 *   import integrationRegistry from './IntegrationRegistry';
 *   const calendar = integrationRegistry.get('calendar_sync');
 */

import { INTEGRATION_STATUS } from './IntegrationService';
import featureFlags from '../FeatureFlags';
import auditLogger from '../AuditLogger';

class IntegrationRegistry {
  constructor() {
    this.integrations = new Map();
    this.initialized = false;
  }

  /**
   * Register an integration
   * @param {string} name - Unique integration name
   * @param {IntegrationService} integration - Integration instance
   */
  register(name, integration) {
    if (this.integrations.has(name)) {
      console.warn(`[IntegrationRegistry] Integration ${name} already registered, replacing`);
    }
    
    this.integrations.set(name, integration);
    
    auditLogger.log({
      category: auditLogger.CATEGORIES.DATA,
      action: 'integration_registered',
      level: auditLogger.LEVELS.DEBUG,
      details: { name, featureFlag: integration.featureFlagName }
    });

    return integration;
  }

  /**
   * Get an integration by name
   * @param {string} name - Integration name
   * @returns {IntegrationService|null}
   */
  get(name) {
    return this.integrations.get(name) || null;
  }

  /**
   * Check if integration exists
   * @param {string} name - Integration name
   * @returns {boolean}
   */
  has(name) {
    return this.integrations.has(name);
  }

  /**
   * Unregister an integration
   * @param {string} name - Integration name
   */
  unregister(name) {
    const integration = this.integrations.get(name);
    if (integration) {
      // Disconnect if connected
      if (integration.status === INTEGRATION_STATUS.CONNECTED) {
        integration.disconnect().catch(() => {});
      }
      this.integrations.delete(name);
      
      auditLogger.log({
        category: auditLogger.CATEGORIES.DATA,
        action: 'integration_unregistered',
        level: auditLogger.LEVELS.INFO,
        details: { name }
      });
    }
  }

  /**
   * Get all registered integrations
   * @returns {Array}
   */
  getAll() {
    return Array.from(this.integrations.values());
  }

  /**
   * Get all integration names
   * @returns {Array}
   */
  getNames() {
    return Array.from(this.integrations.keys());
  }

  /**
   * Get all enabled integrations
   * @returns {Array}
   */
  getEnabled() {
    return this.getAll().filter(i => i.isFeatureEnabled());
  }

  /**
   * Get all connected integrations
   * @returns {Array}
   */
  getConnected() {
    return this.getAll().filter(i => i.status === INTEGRATION_STATUS.CONNECTED);
  }

  /**
   * Initialize all registered integrations
   * @param {object} configs - Map of integration name to config
   */
  async initAll(configs = {}) {
    const results = [];
    
    for (const [name, integration] of this.integrations) {
      try {
        const config = configs[name] || {};
        const success = await integration.init(config);
        results.push({ name, success, error: null });
      } catch (error) {
        results.push({ name, success: false, error: error.message });
      }
    }

    this.initialized = true;
    return results;
  }

  /**
   * Connect all enabled integrations
   */
  async connectEnabled() {
    const enabled = this.getEnabled();
    const results = [];

    for (const integration of enabled) {
      try {
        await integration.connect();
        results.push({ name: integration.name, connected: true, error: null });
      } catch (error) {
        results.push({ name: integration.name, connected: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Disconnect all connected integrations
   */
  async disconnectAll() {
    const connected = this.getConnected();
    const results = [];

    for (const integration of connected) {
      try {
        await integration.disconnect();
        results.push({ name: integration.name, disconnected: true, error: null });
      } catch (error) {
        results.push({ name: integration.name, disconnected: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Run health checks on all integrations
   * @returns {Array} Health check results
   */
  async healthCheckAll() {
    const results = [];

    for (const [name, integration] of this.integrations) {
      const health = await integration.healthCheck();
      results.push({ name, ...health });
    }

    return results;
  }

  /**
   * Get status of all integrations
   * @returns {Array}
   */
  getStatus() {
    return this.getAll().map(i => i.getInfo());
  }

  /**
   * Get integrations by category (from feature flag metadata)
   * @param {string} category - Category to filter by
   * @returns {Array}
   */
  getByCategory(category) {
    return this.getAll().filter(integration => {
      const flag = featureFlags.getFlag(integration.featureFlagName);
      return flag?.metadata?.category === category;
    });
  }

  /**
   * Check if any integrations have errors
   * @returns {boolean}
   */
  hasErrors() {
    return this.getAll().some(i => i.status === INTEGRATION_STATUS.ERROR);
  }

  /**
   * Get integrations with errors
   * @returns {Array}
   */
  getErrors() {
    return this.getAll()
      .filter(i => i.status === INTEGRATION_STATUS.ERROR)
      .map(i => ({
        name: i.name,
        error: i.lastError?.message || 'Unknown error'
      }));
  }

  /**
   * Export registry state for debugging
   */
  exportState() {
    return {
      initialized: this.initialized,
      count: this.integrations.size,
      integrations: this.getStatus(),
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
const integrationRegistry = new IntegrationRegistry();
export default integrationRegistry;

// Also export class for testing
export { IntegrationRegistry };
