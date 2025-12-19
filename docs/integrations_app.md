# Integrations Module Documentation

## Overview

The Integrations module enables users to connect external health apps to import fitness and wellness data. Currently supports **Fitbit**, **Apple Health**, and **Google Fit** providers.

## Features

### Core Capabilities
- **Connect/Disconnect Flow**: OAuth-style connection with clear user consent
- **Secure Token Storage**: Tokens are obfuscated before localStorage storage (not plaintext)
- **Minimal Data Import**: Only steps and sleep data imported (privacy-first approach)
- **Feature Flag Controlled**: Module visibility controlled by `health_integrations` flag
- **Per-User Isolation**: Tokens and data scoped to individual user IDs

### Supported Providers

| Provider | ID | Capabilities | Status |
|----------|-----|--------------|--------|
| Apple Health | `apple_health` | Steps, Sleep, Heart Rate | Available |
| Fitbit | `fitbit` | Steps, Sleep, Heart Rate, Weight | Available |
| Google Fit | `google_fit` | Steps, Sleep | Available |

## Architecture

```
modules/integrations/
├── IntegrationsApp.js       # Main UI component
├── index.js                 # Module exports
├── services/
│   ├── HealthDataService.js # Provider connection & data import
│   └── TokenStorage.js      # Secure token management
└── styles/
    └── IntegrationsApp.css  # ASR-themed styling
```

## Data Flow

```
1. User clicks Connect
   └── HealthDataService.connect(providerId)
       └── OAuth flow (simulated)
       └── TokenStorage.storeToken() [obfuscated]
       └── AuditLogger.log(provider_connected)

2. User imports data
   └── HealthDataService.importData(providerId, { days: 7 })
       └── Fetch steps + sleep only
       └── Cache locally with user scope
       └── Return minimal summary

3. User disconnects
   └── HealthDataService.disconnect(providerId)
       └── TokenStorage.removeToken()
       └── Clear cached data
       └── AuditLogger.log(provider_disconnected)
```

## Security Model

### Token Storage Security
- **NOT Plaintext**: All tokens obfuscated using Base64 encoding with string reversal
- **User-Scoped Keys**: Storage key format: `asr_int_token_{userId}_{provider}`
- **Automatic Expiration**: Tokens checked for expiry on retrieval
- **Production Recommendation**: Use Web Crypto API or backend storage

```javascript
// Token storage key pattern (secure, not plaintext)
const key = `asr_int_token_${userId}_${providerId}`;

// Stored value is obfuscated:
{
  accessToken: btoa(token.split('').reverse().join('')),
  refreshToken: btoa(refresh.split('').reverse().join('')),
  expiresAt: timestamp
}
```

### Privacy Controls
- Only steps and sleep data imported (minimal data principle)
- No heart rate, weight, or detailed metrics without explicit opt-in
- Data cached locally, not synced to backend without consent
- Disconnect completely removes all provider data

## Feature Flag

The module is controlled by the `health_integrations` feature flag:

```javascript
// In FeatureFlags.js
{
  name: 'health_integrations',
  enabled: true,            // Can be toggled
  rolloutPercent: 100,      // Available to all when enabled
  allowedCohorts: ['all'],
  metadata: {
    description: 'Connect health apps (Apple Health, Fitbit, Google Fit)',
    category: 'integration'
  }
}
```

### Enabling/Disabling

```javascript
// Enable (in browser console)
featureFlags.setOverride('health_integrations', true);

// Disable
featureFlags.setOverride('health_integrations', false);

// Check status
featureFlags.isEnabled('health_integrations');
```

When disabled:
- Integrations tile hidden from switchboard
- Module renders "Feature Not Available" message
- All service methods return appropriate error states

## API Reference

### HealthDataService

```javascript
import { healthDataService } from './services/HealthDataService';

// Initialize for user
healthDataService.init(userId);

// Check if enabled
healthDataService.isEnabled(); // boolean

// Get available providers
healthDataService.getProviders(); // array

// Connect to provider
await healthDataService.connect('fitbit');
// Returns: { success: boolean, provider?: string, error?: string }

// Disconnect
await healthDataService.disconnect('fitbit');
// Returns: { success: boolean, error?: string }

// Import data
await healthDataService.importData('fitbit', { days: 7 });
// Returns: { success: boolean, data?: object, summary?: object, error?: string }

// Get imported data
healthDataService.getImportedData();
// Returns: { steps: [], sleep: [] }
```

### TokenStorage

```javascript
import tokenStorage from './services/TokenStorage';

// Set user scope
tokenStorage.setUserId(userId);

// Store token (automatically obfuscated)
tokenStorage.storeToken('fitbit', {
  accessToken: 'token_value',
  refreshToken: 'refresh_value',
  expiresAt: Date.now() + 86400000
});

// Check for valid token
tokenStorage.hasValidToken('fitbit'); // boolean

// Remove token
tokenStorage.removeToken('fitbit');

// Clear all tokens for user
tokenStorage.clearAllTokens();
```

## Audit Logging

All integration actions are logged:

| Action | Category | Details |
|--------|----------|---------|
| `health_service_init` | INTEGRATION | Connected providers list |
| `provider_connected` | INTEGRATION | Provider ID |
| `provider_disconnected` | INTEGRATION | Provider ID |
| `provider_connect_failed` | ERROR | Provider ID, error message |
| `data_imported` | INTEGRATION | Provider ID, data summary |

## UI Components

### IntegrationsApp Component

Props:
- `user` (object): Current user object
- `onBack` (function): Navigation callback
- `onLogout` (function): Logout callback

States:
- Loading state with spinner
- Feature disabled view
- Provider list with connect/disconnect buttons
- Imported data summary
- Status badges (Connected, Connecting, Disconnected, Error)

## Testing

### Manual Test Procedure

1. **Enable Feature Flag**
   ```javascript
   featureFlags.setOverride('health_integrations', true);
   ```
   Reload app → Integrations tile should appear

2. **Connect Provider**
   - Click Integrations tile
   - Click "Connect" on Fitbit
   - Wait for simulated OAuth (1.5s)
   - Should show "Connected" status

3. **Import Data**
   - Click "Import Data"
   - Should show import summary
   - Data displayed in summary section

4. **Disconnect**
   - Click "Disconnect"
   - Confirm dialog
   - Status returns to "Not Connected"
   - Tokens removed (check localStorage)

5. **Disable Flag**
   ```javascript
   featureFlags.setOverride('health_integrations', false);
   ```
   Reload → Integrations tile should disappear

### Verification Checklist

- [ ] Connect shows OAuth simulation
- [ ] Disconnect prompts confirmation
- [ ] Disconnect removes token from storage
- [ ] Imported data is minimal (steps/sleep only)
- [ ] Feature flag hides/shows module
- [ ] Tokens not stored in plaintext
- [ ] Integration doesn't break login flow

## Troubleshooting

### Module Not Visible
1. Check feature flag: `featureFlags.isEnabled('health_integrations')`
2. Check switchboard includes tile
3. Check App.js routing for 'integrations' case

### Connection Fails
1. Check browser console for errors
2. Verify tokenStorage is initialized with userId
3. Check audit logs for error details

### Token Issues
1. Token storage key: `asr_int_token_{userId}_{provider}`
2. Tokens should be obfuscated (not readable)
3. Check expiration time in stored data

## Future Enhancements

- Real OAuth implementation for each provider
- Backend token storage with encryption
- Additional data types (heart rate, weight) with opt-in
- Automatic sync scheduling
- Data visualization in Progress module
