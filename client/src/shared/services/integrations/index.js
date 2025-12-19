/**
 * Integrations Module Index
 * 
 * Export all integration services for easy importing
 */

// Base classes
export { IntegrationService, INTEGRATION_STATUS } from './IntegrationService';
export { default as integrationRegistry, IntegrationRegistry } from './IntegrationRegistry';
export { default as rolloutManager, RolloutManager, ROLLOUT_STAGES, ROLLOUT_STATUS } from './RolloutManager';

// Specific integrations
export { default as calendarSyncIntegration, CalendarSyncIntegration, CALENDAR_EVENT_TYPES } from './CalendarSyncIntegration';

// Auto-register integrations
import integrationRegistry from './IntegrationRegistry';
import calendarSyncIntegration from './CalendarSyncIntegration';

// Register all integrations on module load
integrationRegistry.register('calendar_sync', calendarSyncIntegration);

// Setup function for app initialization
export async function setupIntegrations(configs = {}) {
  // Initialize all registered integrations
  const initResults = await integrationRegistry.initAll(configs);
  
  // Auto-connect enabled integrations (optional)
  if (configs.autoConnect) {
    await integrationRegistry.connectEnabled();
  }

  return initResults;
}

export default integrationRegistry;
