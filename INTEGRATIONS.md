# Integrations Architecture Documentation

## Overview

The Integrations system provides a standardized way to add external service integrations that can be safely rolled out, monitored, and rolled back across all apps in the Health Portal ecosystem.

## Architecture

```
shared/services/
├── FeatureFlags.js          # Feature flag management
├── integrations/
│   ├── index.js             # Module exports & auto-registration
│   ├── IntegrationService.js    # Base class for integrations
│   ├── IntegrationRegistry.js   # Central registry
│   ├── RolloutManager.js        # Rollout/rollback management
│   └── CalendarSyncIntegration.js  # Calendar integration
```

## Components

### 1. FeatureFlags

Controls which integrations are available to which users.

```javascript
import featureFlags from './shared/services/FeatureFlags';

// Check if enabled for current user
if (featureFlags.isEnabled('calendar_sync')) {
  // Show calendar sync UI
}

// Set user context for targeting
featureFlags.setUserContext(userId, 'beta');

// Local override for testing
featureFlags.setOverride('calendar_sync', true);
```

#### Flag Configuration

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Unique identifier |
| `enabled` | boolean | Global on/off |
| `rolloutPercent` | number | 0-100, gradual rollout |
| `allowedCohorts` | array | User cohorts with access |
| `startDate` | string | ISO date when available |
| `endDate` | string | ISO date when expires |
| `metadata` | object | Additional config |

#### Default Flags

| Flag | Default State | Cohorts |
|------|---------------|---------|
| `calendar_sync` | Disabled | beta, internal |
| `push_notifications` | Disabled | beta |
| `export_pdf` | Enabled 100% | all |
| `advanced_analytics` | 25% rollout | beta, premium |
| `shopping_list_sync` | Disabled | beta |
| `ai_coaching_v2` | 10% rollout | internal |

### 2. IntegrationService (Base Class)

All integrations extend this base class for consistent behavior.

```javascript
import { IntegrationService, INTEGRATION_STATUS } from './integrations';

class MyIntegration extends IntegrationService {
  constructor() {
    super('my_integration', 'my_feature_flag');
  }

  async _connect() {
    // Implement connection logic
  }

  async _disconnect() {
    // Implement disconnection logic
  }
}
```

#### Integration Status

| Status | Description |
|--------|-------------|
| `DISABLED` | Feature flag off |
| `DISCONNECTED` | Not connected |
| `CONNECTING` | Connection in progress |
| `CONNECTED` | Ready to use |
| `ERROR` | Error state |
| `RATE_LIMITED` | API rate limit hit |

#### Lifecycle Methods

```javascript
await integration.init(config);    // Initialize
await integration.connect();       // Connect to service
await integration.disconnect();    // Disconnect
await integration.healthCheck();   // Check health
```

### 3. IntegrationRegistry

Central management of all registered integrations.

```javascript
import integrationRegistry from './integrations';

// Get integration
const calendar = integrationRegistry.get('calendar_sync');

// Get all enabled
const enabled = integrationRegistry.getEnabled();

// Health check all
const results = await integrationRegistry.healthCheckAll();

// Connect all enabled
await integrationRegistry.connectEnabled();
```

### 4. RolloutManager

Manages gradual rollout with health monitoring.

```javascript
import rolloutManager, { ROLLOUT_STAGES } from './integrations';

// Start rollout
await rolloutManager.startRollout('calendar_sync', {
  targetStage: ROLLOUT_STAGES.FULL,
  healthCheckIntervalMs: 60000,
  errorThreshold: 0.05,
  pauseOnError: true
});

// Advance to next stage
await rolloutManager.advanceRollout('calendar_sync');

// Rollback on issues
await rolloutManager.rollback('calendar_sync', 'High error rate');
```

#### Rollout Stages

| Stage | Percent | Description |
|-------|---------|-------------|
| DISABLED | 0% | Feature off |
| INTERNAL | 0% + cohort | Internal testing |
| BETA | 10% | Beta users |
| EARLY_ACCESS | 25% | Early adopters |
| LIMITED | 50% | Half of users |
| GENERAL | 75% | Most users |
| FULL | 100% | Everyone |

## Calendar Sync Integration

The first integration implemented, syncs meal plans to Google Calendar.

### Setup

```javascript
import { calendarSyncIntegration } from './integrations';

// Initialize (mock mode for development)
await calendarSyncIntegration.init({
  mockMode: true,  // Use mock mode for testing
  clientId: 'your-google-client-id'
});

// Connect
await calendarSyncIntegration.connect();
```

### Usage

```javascript
// Sync entire meal plan
const results = await calendarSyncIntegration.syncMealPlan(mealPlan, {
  createReminders: true,
  reminderMinutes: 30,
  includeIngredients: true
});

// Sync single meal
await calendarSyncIntegration.syncMeal('2024-12-18', mealData);

// Remove from calendar
await calendarSyncIntegration.unsyncMeal(mealId);

// Check sync status
const status = calendarSyncIntegration.getSyncStatus([meal1.id, meal2.id]);
```

### Features

- Creates color-coded calendar events by meal type
- Includes ingredients in event description
- Supports reminder notifications
- Two-way sync status tracking
- Mock mode for development/testing

## Adding a New Integration

### Step 1: Create Integration Class

```javascript
// integrations/MyNewIntegration.js
import { IntegrationService } from './IntegrationService';

class MyNewIntegration extends IntegrationService {
  constructor() {
    super('my_integration', 'my_feature_flag');
  }

  async _connect() {
    // OAuth or API key authentication
  }

  async _disconnect() {
    // Cleanup
  }

  async _healthCheck() {
    // Verify API access
  }

  // Add your integration methods
  async doSomething() {
    return this.execute(async () => {
      // Your logic here
    });
  }
}

export default new MyNewIntegration();
```

### Step 2: Add Feature Flag

Add to `FeatureFlags.js` `_loadDefaultFlags()`:

```javascript
{
  name: 'my_feature_flag',
  enabled: false,
  rolloutPercent: 0,
  allowedCohorts: ['beta', 'internal'],
  metadata: {
    description: 'My new integration',
    category: 'integration',
    version: '1.0.0'
  }
}
```

### Step 3: Register Integration

Add to `integrations/index.js`:

```javascript
export { default as myIntegration } from './MyNewIntegration';

import myIntegration from './MyNewIntegration';
integrationRegistry.register('my_integration', myIntegration);
```

### Step 4: Add Tests

Create `integrations/__tests__/MyNewIntegration.test.js`.

## Rollout Process

### 1. Validate Before Rollout

```javascript
const validation = await rolloutManager.validateRollout('my_feature');
if (!validation.valid) {
  console.log('Validation failed:', validation.checks);
  return;
}
```

### 2. Start Rollout

```javascript
await rolloutManager.startRollout('my_feature', {
  targetStage: ROLLOUT_STAGES.BETA,
  errorThreshold: 0.05
});
```

### 3. Monitor Health

Health checks run automatically. View status:

```javascript
const status = rolloutManager.getRolloutStatus('my_feature');
console.log(status.healthHistory);
```

### 4. Advance Stages

```javascript
// Only advances if health check passes
await rolloutManager.advanceRollout('my_feature');
```

### 5. Rollback if Needed

```javascript
// Full rollback - disables flag and disconnects integration
await rolloutManager.rollback('my_feature', 'Error rate too high');
```

## Health Monitoring

The RolloutManager monitors:

1. **Integration Health** - Can the service connect?
2. **Error Rate** - % of operations failing
3. **Feature Flag Status** - Is flag properly enabled?

### Error Thresholds

| Threshold | Default | Description |
|-----------|---------|-------------|
| `errorThreshold` | 5% | Max allowed error rate |
| `minSampleSize` | 100 | Min operations before evaluating |
| `healthCheckIntervalMs` | 60000 | Check interval (1 min) |

### Auto-Pause

When `pauseOnError: true` (default), rollout automatically pauses if:
- Health check fails
- Error rate exceeds threshold

## Multi-App Usage

Integrations are designed as shared services:

```javascript
// In Meal Plan App
import { calendarSyncIntegration } from '../shared/services/integrations';
await calendarSyncIntegration.syncMealPlan(mealPlan);

// In Nutrition App
import { calendarSyncIntegration } from '../shared/services/integrations';
await calendarSyncIntegration.syncMeal(date, { type: 'meal', name: 'Logged Meal' });

// In Coaching App
import { featureFlags } from '../shared/services/FeatureFlags';
if (featureFlags.isEnabled('calendar_sync')) {
  // Show calendar integration UI
}
```

## Testing

Run integration tests:

```bash
node client/src/shared/services/integrations/__tests__/integrations.test.js
```

### Mock Mode

For development and testing, enable mock mode:

```javascript
await calendarSyncIntegration.init({ mockMode: true });
```

Mock mode:
- Simulates OAuth without real credentials
- Logs operations to console
- Returns fake event IDs
- Works offline

## Security Considerations

1. **OAuth tokens** stored in localStorage with expiration
2. **Sensitive config** automatically redacted from logs
3. **Feature flags** prevent unauthorized access
4. **Audit logging** tracks all integration operations

## API Reference

### FeatureFlags

| Method | Description |
|--------|-------------|
| `isEnabled(flagName)` | Check if flag enabled for user |
| `setUserContext(userId, cohort)` | Set targeting context |
| `setOverride(flagName, value)` | Local override |
| `clearOverride(flagName)` | Clear local override |
| `updateFlag(flagName, updates)` | Update flag config |
| `enableFlag(flagName, percent)` | Enable with rollout |
| `disableFlag(flagName)` | Disable flag |
| `rollback(flagName, decrement)` | Rollback percentage |

### IntegrationRegistry

| Method | Description |
|--------|-------------|
| `register(name, integration)` | Add integration |
| `get(name)` | Get integration |
| `getAll()` | Get all integrations |
| `getEnabled()` | Get feature-enabled integrations |
| `healthCheckAll()` | Run all health checks |
| `connectEnabled()` | Connect all enabled |

### RolloutManager

| Method | Description |
|--------|-------------|
| `startRollout(flag, options)` | Begin rollout |
| `advanceRollout(flag)` | Move to next stage |
| `pauseRollout(flag, reason)` | Pause rollout |
| `resumeRollout(flag)` | Resume paused rollout |
| `rollback(flag, reason)` | Full rollback |
| `runHealthCheck(flag)` | Manual health check |
| `validateRollout(flag)` | Pre-rollout validation |
