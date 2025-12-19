# Integrations Module Documentation

## Overview

The Integrations module allows users to connect their health apps and import activity data into the ASR Health Portal. Currently supports steps and sleep data import.

## Architecture

```
modules/integrations/
├── index.js                    # Module exports
├── IntegrationsApp.js          # Main UI component
├── services/
│   ├── TokenStorage.js         # Secure token management
│   └── HealthDataService.js    # Provider connections & data import
└── styles/
    └── IntegrationsApp.css     # Module styles
```

## Features

### 1. Provider Connections

Connect to health data providers:

| Provider | Icon | Capabilities |
|----------|------|--------------|
| Apple Health | 🍎 | steps, sleep, heart_rate |
| Fitbit | ⌚ | steps, sleep, heart_rate, weight |
| Google Fit | ❤️ | steps, sleep |

### 2. Data Import

Import minimal health data:
- **Steps**: Daily step counts
- **Sleep**: Sleep duration and quality

### 3. Feature Flag Gating

Module visibility controlled by `health_integrations` feature flag:
- When disabled: Module hidden from switchboard
- When enabled: Full functionality available

### 4. Secure Token Storage

OAuth tokens stored with:
- User-scoped storage (tokens tied to userId)
- Obfuscation before storage
- Automatic expiration checking
- No plaintext storage

## Components

### IntegrationsApp

Main container component.

```javascript
import { IntegrationsApp } from './modules/integrations';

<IntegrationsApp
  user={user}
  onBack={() => setCurrentView('switchboard')}
  onLogout={handleLogout}
/>
```

**Props:**
- `user` - Current authenticated user
- `onBack` - Return to switchboard callback
- `onLogout` - Logout callback

## Services

### TokenStorage

Secure token management for OAuth credentials.

```javascript
import { tokenStorage } from './modules/integrations';

// Set user context
tokenStorage.setUserId(user.id);

// Store token
tokenStorage.storeToken('fitbit', {
  accessToken: 'xxx',
  refreshToken: 'yyy',
  expiresAt: Date.now() + 86400000
});

// Retrieve token
const token = tokenStorage.getToken('fitbit');

// Check if valid
const isValid = tokenStorage.hasValidToken('fitbit');

// Remove token
tokenStorage.removeToken('fitbit');

// Get all connected providers
const providers = tokenStorage.getConnectedProviders();
```

**Security Features:**
- Tokens obfuscated (base64 + reverse)
- User-scoped keys prevent cross-user access
- Automatic expiration checking
- Clear all tokens option

### HealthDataService

Provider connections and data import.

```javascript
import { healthDataService, HEALTH_PROVIDERS, CONNECTION_STATUS } from './modules/integrations';

// Initialize for user
healthDataService.init(userId);

// Get available providers
const providers = healthDataService.getProviders();

// Connect to provider
const result = await healthDataService.connect('fitbit');
// Returns: { success: true, provider: 'fitbit' }

// Import data
const data = await healthDataService.importData('fitbit', { days: 7 });
// Returns: { success, data: { steps, sleep }, summary }

// Disconnect
await healthDataService.disconnect('fitbit');

// Get imported data
const imported = healthDataService.getImportedData();
```

## Feature Flag Integration

### Enabling/Disabling

The module respects the `health_integrations` feature flag:

```javascript
import featureFlags from '../shared/services/FeatureFlags';

// Check if enabled
const enabled = featureFlags.isEnabled('health_integrations');

// Enable for testing
featureFlags.setOverride('health_integrations', true);

// Disable
featureFlags.setOverride('health_integrations', false);

// Remove override
featureFlags.clearOverride('health_integrations');
```

### Switchboard Behavior

- **Flag ON**: Integrations tile visible, module accessible
- **Flag OFF**: Integrations tile hidden, module inaccessible

## Data Storage

### Token Storage

```javascript
// Key format
`asr_int_token_${userId}_${providerId}`

// Stored data (obfuscated)
{
  accessToken: "<obfuscated>",
  refreshToken: "<obfuscated>",
  expiresAt: 1703028000000,
  storedAt: 1702941600000,
  provider: "fitbit"
}
```

### Health Data Cache

```javascript
// Key format
`asr_health_data_${userId}`

// Stored data
{
  steps: [
    { date: "2025-12-18", steps: 8432, source: "fitbit", importedAt: ... }
  ],
  sleep: [
    { date: "2025-12-18", hours: 7.2, quality: "good", source: "fitbit", importedAt: ... }
  ]
}
```

## Audit Logging

All operations logged:

```javascript
// Provider connected
{ category: 'INTEGRATION', action: 'provider_connected', details: { provider: 'fitbit' } }

// Data imported
{ category: 'INTEGRATION', action: 'data_imported', details: { provider: 'fitbit', stepsRecords: 7, sleepRecords: 7 } }

// Provider disconnected
{ category: 'INTEGRATION', action: 'provider_disconnected', details: { provider: 'fitbit' } }
```

## Security Considerations

### Token Security

1. **No Plaintext**: Tokens obfuscated before localStorage
2. **User Scoping**: Tokens keyed by userId
3. **Expiration**: Auto-check on retrieval
4. **Logout Cleanup**: Option to clear all tokens

### Data Privacy

1. **Minimal Import**: Only steps and sleep
2. **Local Storage**: No server transmission (demo mode)
3. **User Control**: Disconnect anytime
4. **Clear Data**: Option to delete imported data

## OAuth Flow (Production)

```
1. User clicks "Connect"
2. Redirect to provider OAuth page
3. User authorizes app
4. Provider redirects with auth code
5. Backend exchanges code for tokens
6. Tokens stored securely
7. Connection status updated
```

**Note**: Current implementation simulates OAuth for demo purposes. Production requires real OAuth implementation with backend token exchange.

## Testing

### Manual Testing

1. Enable feature flag
2. Click Integrations tile
3. Connect to a provider
4. Import data
5. Verify data displays
6. Disconnect provider
7. Disable flag, verify tile hidden

### Feature Flag Testing

```javascript
// In browser console
localStorage.setItem('feature_flag_overrides', JSON.stringify({
  health_integrations: false
}));
// Refresh page - tile should be hidden
```

## Changelog

### v1.0.0 (Current)
- Initial release
- Apple Health, Fitbit, Google Fit providers
- Steps and sleep import
- Feature flag gating
- Secure token storage
- Audit logging
