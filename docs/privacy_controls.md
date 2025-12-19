# Privacy Controls Documentation

## Overview

This document describes the privacy controls implemented across the Meal Planner application, with specific focus on health data integrations and user data handling.

## Privacy Principles

### 1. Minimal Data Collection
- Only collect data necessary for feature functionality
- Health integrations import only steps and sleep (not all available data)
- No location tracking or device identifiers stored

### 2. User Control
- Users can connect/disconnect integrations at any time
- Disconnect completely removes all stored credentials
- Feature flags allow disabling integrations entirely

### 3. Data Isolation
- All data scoped to individual user IDs
- No cross-user data access possible
- Tokens and imported data use user-prefixed storage keys

### 4. Transparency
- Clear indication of what data is imported
- Audit logs available for user review
- Connection status always visible

## Health Data Privacy

### Data Imported

| Data Type | Imported | Purpose |
|-----------|----------|---------|
| Steps | ✅ Yes | Activity tracking, goal progress |
| Sleep Summary | ✅ Yes | Wellness insights |
| Heart Rate | ❌ No | Not collected |
| Weight | ❌ No | Not collected |
| Location | ❌ No | Not collected |
| Detailed Metrics | ❌ No | Not collected |

### Data Storage

```
Storage Location: localStorage (browser)
Encryption: Obfuscated (Base64 + reversal)
Retention: Until user disconnects
Backend Sync: None (local only)
```

### Token Security

Tokens are **NOT stored in plaintext**:

```javascript
// How tokens are stored
const obfuscate = (str) => btoa(str.split('').reverse().join(''));

// Storage format
{
  accessToken: "[OBFUSCATED]",    // Not plaintext
  refreshToken: "[OBFUSCATED]",   // Not plaintext  
  expiresAt: 1735689600000,       // Timestamp
  storedAt: 1735603200000,        // Timestamp
  provider: "fitbit"              // Provider name
}
```

### User-Scoped Storage Keys

All data uses user-prefixed keys to prevent cross-user access:

```javascript
// Token storage key pattern
`asr_int_token_${userId}_${providerId}`

// Example keys:
"asr_int_token_user123_fitbit"
"asr_int_token_user123_apple_health"
"asr_int_token_user456_fitbit"  // Different user
```

## Audit Logging Privacy

### What IS Logged

| Field | Logged | Sanitization |
|-------|--------|--------------|
| Timestamp | ✅ Yes | None needed |
| User ID | ✅ Yes | From auth token |
| Action Type | ✅ Yes | None needed |
| Provider Name | ✅ Yes | None needed |
| Error Messages | ✅ Yes | Truncated to 500 chars |
| Session ID | ✅ Yes | Random generated |

### What is NOT Logged

| Field | Logged | Reason |
|-------|--------|--------|
| Passwords | ❌ No | Security risk |
| Auth Tokens | ❌ No | Security risk |
| API Keys | ❌ No | Security risk |
| Full Chat Content | ❌ No | Privacy risk |
| Personal Health Data | ❌ No | HIPAA considerations |
| PII (name, email content) | ❌ No | Privacy risk |

### Sensitive Field Redaction

```javascript
// Automatic redaction in AuditLogger
const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
sensitiveFields.forEach(field => {
  if (data[field]) {
    data[field] = '[REDACTED]';
  }
});
```

## Feature Flag Privacy Control

The `health_integrations` feature flag provides a kill switch:

```javascript
// Disable all health integrations
featureFlags.setOverride('health_integrations', false);

// Effect:
// - Integrations tile hidden from UI
// - All service methods return disabled state
// - No new connections possible
// - Existing connections remain but inaccessible
```

## Data Deletion

### On Disconnect

When a user disconnects a provider:

1. ✅ Access token removed from localStorage
2. ✅ Refresh token removed from localStorage
3. ✅ Cached imported data cleared
4. ✅ Connection status reset
5. ✅ Audit log entry created (action only, not data)

```javascript
// What happens on disconnect
tokenStorage.removeToken(providerId);      // Removes credentials
this.importedData = { steps: [], sleep: [] }; // Clears cached data
auditLogger.log({ action: 'provider_disconnected' });
```

### Clear All Data

Users can clear all integration data:

```javascript
// Clear all tokens for current user
tokenStorage.clearAllTokens();

// Clear all cached health data
localStorage.removeItem('health_data_cache_' + userId);
```

## Compliance Considerations

### GDPR (if applicable)

| Requirement | Implementation |
|-------------|----------------|
| Right to Access | Audit logs exportable |
| Right to Deletion | Disconnect removes all data |
| Data Minimization | Only steps/sleep imported |
| Purpose Limitation | Data used only for wellness features |
| Consent | Connection requires explicit user action |

### HIPAA (if applicable)

| Consideration | Implementation |
|---------------|----------------|
| PHI Handling | Minimal health data, local storage only |
| Access Controls | User-scoped storage keys |
| Audit Trail | All actions logged with timestamps |
| Encryption | Obfuscation (recommend upgrading for production) |

## Security Recommendations for Production

### Upgrade Token Storage

```javascript
// Current: Base64 obfuscation (demo)
// Recommended: Web Crypto API
async function encryptToken(token, key) {
  const encoded = new TextEncoder().encode(token);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
    key,
    encoded
  );
  return encrypted;
}
```

### Backend Token Storage

```javascript
// Recommended: Store tokens on backend
// POST /api/integrations/tokens
{
  provider: 'fitbit',
  encryptedToken: '[server-side encrypted]'
}
```

### Token Refresh Flow

```javascript
// Recommended: Automatic refresh before expiry
if (token.expiresAt - Date.now() < 24 * 60 * 60 * 1000) {
  await refreshToken(provider);
}
```

## Privacy Settings UI (Future)

Planned privacy controls for user settings:

- [ ] Data retention period selector
- [ ] Export my data (GDPR compliance)
- [ ] Delete all health data
- [ ] Opt-out of analytics
- [ ] View audit log
- [ ] Revoke all integrations

## Contact

For privacy concerns or data requests:
- Review audit logs: `AuditLogger.getSummary()`
- Clear data: Settings → Privacy → Delete Data
- Feature issues: Check feature flag status
