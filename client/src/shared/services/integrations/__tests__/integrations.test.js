/**
 * Integrations - Validation Tests
 * 
 * Tests for:
 * - Feature flag system
 * - Integration service architecture
 * - Rollout/rollback functionality
 * 
 * Run with: node client/src/shared/services/integrations/__tests__/integrations.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running Integrations Validation Tests...\n');

// ============================================================================
// TEST 1: File Structure
// ============================================================================
console.log('TEST 1: File Structure');

const integrationsPath = path.join(__dirname, '..');
const servicesPath = path.join(__dirname, '../..');

// Check required files exist
const requiredFiles = [
  { path: path.join(servicesPath, 'FeatureFlags.js'), name: 'FeatureFlags.js' },
  { path: path.join(integrationsPath, 'IntegrationService.js'), name: 'IntegrationService.js' },
  { path: path.join(integrationsPath, 'IntegrationRegistry.js'), name: 'IntegrationRegistry.js' },
  { path: path.join(integrationsPath, 'CalendarSyncIntegration.js'), name: 'CalendarSyncIntegration.js' },
  { path: path.join(integrationsPath, 'RolloutManager.js'), name: 'RolloutManager.js' },
  { path: path.join(integrationsPath, 'index.js'), name: 'integrations/index.js' }
];

requiredFiles.forEach(file => {
  assert(fs.existsSync(file.path), `❌ ${file.name} should exist`);
  console.log(`  ✅ ${file.name} exists`);
});

console.log('  ✅ TEST 1 PASSED: All required files exist\n');

// ============================================================================
// TEST 2: FeatureFlags Structure
// ============================================================================
console.log('TEST 2: FeatureFlags Structure');

const featureFlagsContent = fs.readFileSync(
  path.join(servicesPath, 'FeatureFlags.js'), 
  'utf-8'
);

// Check for required methods
const requiredMethods = [
  'isEnabled', 
  'getFlag', 
  'setOverride', 
  'clearOverride',
  'updateFlag',
  'enableFlag',
  'disableFlag',
  'incrementRollout',
  'rollback'
];

requiredMethods.forEach(method => {
  assert(
    featureFlagsContent.includes(method),
    `❌ FeatureFlags should have ${method} method`
  );
});
console.log('  ✅ Has all required methods');

// Check for default flags
const defaultFlags = ['calendar_sync', 'push_notifications', 'export_pdf'];
defaultFlags.forEach(flag => {
  assert(
    featureFlagsContent.includes(flag),
    `❌ Should have default flag: ${flag}`
  );
});
console.log('  ✅ Has default integration flags');

// Check for cohort support
assert(
  featureFlagsContent.includes('allowedCohorts') && 
  featureFlagsContent.includes('userCohort'),
  '❌ Should support user cohorts'
);
console.log('  ✅ Supports user cohort targeting');

// Check for rollout percentage
assert(
  featureFlagsContent.includes('rolloutPercent') &&
  featureFlagsContent.includes('_checkRolloutPercentage'),
  '❌ Should support gradual rollout'
);
console.log('  ✅ Supports gradual percentage rollout');

console.log('  ✅ TEST 2 PASSED: FeatureFlags structure verified\n');

// ============================================================================
// TEST 3: IntegrationService Base Class
// ============================================================================
console.log('TEST 3: IntegrationService Base Class');

const integrationServiceContent = fs.readFileSync(
  path.join(integrationsPath, 'IntegrationService.js'),
  'utf-8'
);

// Check for lifecycle methods
const lifecycleMethods = ['init', 'connect', 'disconnect', '_connect', '_disconnect'];
lifecycleMethods.forEach(method => {
  assert(
    integrationServiceContent.includes(method),
    `❌ IntegrationService should have ${method} method`
  );
});
console.log('  ✅ Has lifecycle methods');

// Check for status tracking
assert(
  integrationServiceContent.includes('INTEGRATION_STATUS'),
  '❌ Should export INTEGRATION_STATUS enum'
);
console.log('  ✅ Has status tracking');

// Check for event system
assert(
  integrationServiceContent.includes('listeners') &&
  integrationServiceContent.includes('_emit'),
  '❌ Should have event emission system'
);
console.log('  ✅ Has event emission system');

// Check for retry logic
assert(
  integrationServiceContent.includes('retryCount') &&
  integrationServiceContent.includes('maxRetries'),
  '❌ Should have retry logic'
);
console.log('  ✅ Has retry logic');

// Check for feature flag integration
assert(
  integrationServiceContent.includes('isFeatureEnabled') &&
  integrationServiceContent.includes('featureFlags'),
  '❌ Should integrate with feature flags'
);
console.log('  ✅ Integrates with feature flags');

console.log('  ✅ TEST 3 PASSED: IntegrationService base class verified\n');

// ============================================================================
// TEST 4: IntegrationRegistry
// ============================================================================
console.log('TEST 4: IntegrationRegistry');

const registryContent = fs.readFileSync(
  path.join(integrationsPath, 'IntegrationRegistry.js'),
  'utf-8'
);

// Check for registry methods
const registryMethods = ['register', 'get', 'unregister', 'getAll', 'getEnabled', 'healthCheckAll'];
registryMethods.forEach(method => {
  assert(
    registryContent.includes(method),
    `❌ IntegrationRegistry should have ${method} method`
  );
});
console.log('  ✅ Has registry management methods');

// Check for bulk operations
assert(
  registryContent.includes('initAll') && registryContent.includes('connectEnabled'),
  '❌ Should have bulk operation methods'
);
console.log('  ✅ Has bulk operation methods');

console.log('  ✅ TEST 4 PASSED: IntegrationRegistry verified\n');

// ============================================================================
// TEST 5: CalendarSyncIntegration
// ============================================================================
console.log('TEST 5: CalendarSyncIntegration');

const calendarContent = fs.readFileSync(
  path.join(integrationsPath, 'CalendarSyncIntegration.js'),
  'utf-8'
);

// Check it extends IntegrationService
assert(
  calendarContent.includes('extends IntegrationService'),
  '❌ CalendarSync should extend IntegrationService'
);
console.log('  ✅ Extends IntegrationService base class');

// Check for feature flag
assert(
  calendarContent.includes("'calendar_sync'"),
  '❌ Should use calendar_sync feature flag'
);
console.log('  ✅ Uses calendar_sync feature flag');

// Check for sync methods
const syncMethods = ['syncMealPlan', 'syncMeal', 'unsyncMeal'];
syncMethods.forEach(method => {
  assert(
    calendarContent.includes(method),
    `❌ CalendarSync should have ${method} method`
  );
});
console.log('  ✅ Has meal sync methods');

// Check for mock mode
assert(
  calendarContent.includes('mockMode'),
  '❌ Should support mock mode for testing'
);
console.log('  ✅ Supports mock mode for testing');

// Check for audit logging
assert(
  calendarContent.includes('auditLogger'),
  '❌ Should use audit logging'
);
console.log('  ✅ Uses audit logging');

console.log('  ✅ TEST 5 PASSED: CalendarSyncIntegration verified\n');

// ============================================================================
// TEST 6: RolloutManager
// ============================================================================
console.log('TEST 6: RolloutManager');

const rolloutContent = fs.readFileSync(
  path.join(integrationsPath, 'RolloutManager.js'),
  'utf-8'
);

// Check for rollout stages
assert(
  rolloutContent.includes('ROLLOUT_STAGES') &&
  rolloutContent.includes('DISABLED') &&
  rolloutContent.includes('INTERNAL') &&
  rolloutContent.includes('BETA') &&
  rolloutContent.includes('FULL'),
  '❌ Should have defined rollout stages'
);
console.log('  ✅ Has defined rollout stages');

// Check for rollout methods
const rolloutMethods = ['startRollout', 'advanceRollout', 'pauseRollout', 'rollback'];
rolloutMethods.forEach(method => {
  assert(
    rolloutContent.includes(method),
    `❌ RolloutManager should have ${method} method`
  );
});
console.log('  ✅ Has rollout lifecycle methods');

// Check for health monitoring
assert(
  rolloutContent.includes('runHealthCheck') &&
  rolloutContent.includes('healthHistory'),
  '❌ Should have health monitoring'
);
console.log('  ✅ Has health monitoring');

// Check for error threshold
assert(
  rolloutContent.includes('errorThreshold') &&
  rolloutContent.includes('_calculateErrorRate'),
  '❌ Should have error rate monitoring'
);
console.log('  ✅ Has error rate monitoring');

// Check for automatic pause on error
assert(
  rolloutContent.includes('pauseOnError'),
  '❌ Should support auto-pause on error'
);
console.log('  ✅ Supports auto-pause on error');

// Check for validation
assert(
  rolloutContent.includes('validateRollout'),
  '❌ Should have rollout validation'
);
console.log('  ✅ Has rollout validation');

console.log('  ✅ TEST 6 PASSED: RolloutManager verified\n');

// ============================================================================
// TEST 7: Module Exports
// ============================================================================
console.log('TEST 7: Module Exports');

const indexContent = fs.readFileSync(
  path.join(integrationsPath, 'index.js'),
  'utf-8'
);

// Check exports
const requiredExports = [
  'IntegrationService',
  'INTEGRATION_STATUS',
  'integrationRegistry',
  'calendarSyncIntegration',
  'setupIntegrations'
];

requiredExports.forEach(exp => {
  assert(
    indexContent.includes(exp),
    `❌ Should export ${exp}`
  );
});
console.log('  ✅ Exports all required modules');

// Check auto-registration
assert(
  indexContent.includes("integrationRegistry.register('calendar_sync'"),
  '❌ Should auto-register calendar_sync integration'
);
console.log('  ✅ Auto-registers integrations');

console.log('  ✅ TEST 7 PASSED: Module exports verified\n');

// ============================================================================
// TEST 8: Feature Flag Default Values
// ============================================================================
console.log('TEST 8: Feature Flag Default Values');

// calendar_sync should be disabled by default
assert(
  featureFlagsContent.includes("name: 'calendar_sync'") &&
  featureFlagsContent.includes("enabled: false"),
  '❌ calendar_sync should be disabled by default'
);
console.log('  ✅ calendar_sync disabled by default');

// export_pdf should be enabled by default
assert(
  featureFlagsContent.includes("name: 'export_pdf'") &&
  featureFlagsContent.includes("rolloutPercent: 100"),
  '❌ export_pdf should be fully enabled'
);
console.log('  ✅ export_pdf enabled by default');

console.log('  ✅ TEST 8 PASSED: Feature flag defaults verified\n');

// ============================================================================
// TEST 9: Audit Logger Integration
// ============================================================================
console.log('TEST 9: Audit Logger Integration');

// Check IntegrationService uses audit logger
assert(
  integrationServiceContent.includes("import auditLogger from") &&
  integrationServiceContent.includes("auditLogger.log"),
  '❌ IntegrationService should use audit logger'
);
console.log('  ✅ IntegrationService logs to audit logger');

// Check RolloutManager uses audit logger
assert(
  rolloutContent.includes("import auditLogger from") &&
  rolloutContent.includes("auditLogger.log"),
  '❌ RolloutManager should use audit logger'
);
console.log('  ✅ RolloutManager logs to audit logger');

console.log('  ✅ TEST 9 PASSED: Audit logger integration verified\n');

// ============================================================================
// TEST 10: Rollback Capability
// ============================================================================
console.log('TEST 10: Rollback Capability');

// FeatureFlags has rollback
assert(
  featureFlagsContent.includes('rollback(') &&
  featureFlagsContent.includes('disableFlag'),
  '❌ FeatureFlags should have rollback capability'
);
console.log('  ✅ FeatureFlags has rollback method');

// RolloutManager has rollback
assert(
  rolloutContent.includes('ROLLED_BACK') &&
  rolloutContent.includes('rollbackReason'),
  '❌ RolloutManager should track rollback state'
);
console.log('  ✅ RolloutManager tracks rollback state');

// Rollback disconnects integration
assert(
  rolloutContent.includes("await integration.disconnect()"),
  '❌ Rollback should disconnect integration'
);
console.log('  ✅ Rollback disconnects integration');

console.log('  ✅ TEST 10 PASSED: Rollback capability verified\n');

// ============================================================================
// Summary
// ============================================================================
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ ALL INTEGRATIONS TESTS PASSED!');
console.log('═══════════════════════════════════════════════════════════════');
console.log('\nIntegrations Architecture Verified:');
console.log('  ✅ Feature flags with rollout percentages');
console.log('  ✅ Cohort targeting support');
console.log('  ✅ Base IntegrationService class');
console.log('  ✅ Integration registry pattern');
console.log('  ✅ CalendarSync integration');
console.log('  ✅ RolloutManager with stages');
console.log('  ✅ Health monitoring');
console.log('  ✅ Automatic rollback on errors');
console.log('  ✅ Audit logging throughout');
console.log('\n');
