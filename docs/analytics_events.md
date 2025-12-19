# Analytics Events Documentation

## Overview

The Analytics Service tracks user actions and conversion events for business intelligence and product improvement. It is designed with privacy-first principles and zero UX impact on failures.

## Core Principles

1. **Fire Once Per Action**: Deduplication prevents duplicate events within 1-second window
2. **No PII Logged**: Email, name, phone, etc. are automatically stripped
3. **Failures Don't Affect UX**: All analytics operations fail silently
4. **Performance Bounded**: Max 50ms per operation, with warnings logged if exceeded

## Event Categories

| Category | Description |
|----------|-------------|
| `meal_plan` | Meal plan generation, saving, exporting |
| `shopping` | Shopping list creation, saving, item interactions |
| `navigation` | App selection, switchboard views |
| `conversion` | Trial, paid upgrades, discount codes |
| `feature` | General feature usage tracking |
| `integration` | Health app connections |

## Event Reference

### Meal Plan Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `plan_generation_started` | User initiates plan generation | `daysRequested`, `preferences` |
| `plan_generation_completed` | Plan successfully generated | `daysRequested`, `duration` |
| `plan_generation_failed` | Plan generation error | `error` |
| `plan_saved` | User saves plan | `planId`, `dayCount` |
| `plan_exported` | User exports plan (PDF, etc.) | `format` |

### Shopping List Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `shopping_list_created` | Shopping list generated | `itemCount` |
| `shopping_list_saved` | User downloads/exports list | `itemCount`, `format` |
| `shopping_list_exported` | Export to external app | `format`, `destination` |
| `shopping_list_item_checked` | Item marked as checked | `category` |

### Navigation Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `switchboard_viewed` | User sees switchboard | `timestamp` |
| `app_selected` | User clicks app tile | `appId`, `previousApp` |
| `app_switched` | User returns to switchboard | `fromApp` |

### Conversion Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `trial_started` | User begins trial | `plan`, `duration` |
| `conversion_to_paid` | User completes payment | `plan`, `discountCode`, `source` |
| `upgrade_clicked` | User clicks upgrade CTA | `location`, `plan` |
| `paywall_viewed` | Paywall displayed | `feature`, `trigger` |
| `discount_code_applied` | Discount code entered | `codeType` (not the actual code) |

### Feature Usage Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `feature_used` | Generic feature interaction | `feature`, `context` |
| `ai_coaching_message` | AI coach message sent | `messageType`, `guardrailTriggered` |
| `progress_checked` | User views progress | `streakDays`, `badgeCount` |
| `badge_earned` | User earns badge | `badgeId`, `badgeType` |
| `streak_updated` | Streak count changes | `newStreak`, `previousStreak` |

### Integration Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `integration_connected` | Provider connected | `provider` |
| `integration_disconnected` | Provider disconnected | `provider` |
| `data_imported` | Data imported from provider | `provider`, `dataTypes`, `recordCount` |

## Implementation

### Basic Usage

```javascript
import analyticsService, { ANALYTICS_EVENTS } from './shared/services/AnalyticsService';

// Initialize with user (optional - anonymizes automatically)
analyticsService.init(userId);

// Track an event
analyticsService.track(ANALYTICS_EVENTS.PLAN_GENERATION_COMPLETED, {
  daysRequested: 7,
  duration: '3.5'
});
```

### Convenience Methods

```javascript
// Plan generation tracking
analyticsService.trackPlanGeneration('started', { days: 7 });
analyticsService.trackPlanGeneration('completed', { days: 7, duration: '3.5' });
analyticsService.trackPlanGeneration('failed', { error: 'API timeout' });

// Shopping list tracking
analyticsService.trackShoppingListSave(25, { format: 'txt' });

// App selection tracking
analyticsService.trackAppSelection('meal-planner', 'switchboard');

// Conversion tracking
analyticsService.trackConversion('premium', { 
  discountCode: true,  // NOT the actual code
  source: 'payment_page' 
});
```

## Data Storage

### Local Storage Format

Events stored in `analytics_events` key:

```json
[
  {
    "id": "evt_1703001234567_abc123",
    "name": "app_selected",
    "category": "navigation",
    "timestamp": "2025-12-19T15:30:00.000Z",
    "sessionId": "sess_1703001200000_xyz789",
    "userId": "user_a1b2c3",
    "properties": {
      "appId": "meal-planner",
      "previousApp": "switchboard"
    }
  }
]
```

### Storage Limits

- **Max Events**: 1000 (FIFO rotation)
- **Retention**: 30 days (auto-cleanup)
- **Dedup Window**: 1 second

## Privacy Protections

### Automatic PII Stripping

These fields are automatically removed from event properties:

```javascript
['email', 'name', 'firstName', 'lastName', 'phone', 
 'address', 'ssn', 'creditCard', 'password', 'token']
```

### User ID Anonymization

```javascript
// User ID is hashed before storage
const hashUserId = (userId) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `user_${Math.abs(hash).toString(16)}`;
};

// Example: "john@example.com" → "user_7f3a2b1c"
```

### What is NOT Logged

| Field | Reason |
|-------|--------|
| Email addresses | PII |
| Full names | PII |
| Phone numbers | PII |
| Chat message content | Privacy |
| Health data values | HIPAA sensitivity |
| Actual discount codes | Security |
| Auth tokens | Security |

## Dashboard & Reporting

### Get Summary

```javascript
const summary = analyticsService.getSummary();
console.log(summary);
// {
//   totalEvents: 150,
//   byCategory: { meal_plan: 45, navigation: 60, ... },
//   byEvent: { app_selected: 30, plan_generation_completed: 15, ... },
//   byDate: { '2025-12-19': 50, '2025-12-18': 100 },
//   conversionFunnel: {
//     switchboardViews: 100,
//     appSelections: 80,
//     planGenerations: 40,
//     shoppingSaves: 20,
//     conversions: 5
//   }
// }
```

### Export Events

```javascript
// JSON format
const jsonExport = analyticsService.exportEvents('json');

// CSV format
const csvExport = analyticsService.exportEvents('csv');
```

### Get Events by Date Range

```javascript
const events = analyticsService.getEventsByDateRange('2025-12-01', '2025-12-19');
```

## Performance

### Monitoring

```javascript
const metrics = analyticsService.getPerformanceMetrics();
// {
//   lastOperationMs: 5.23,
//   maxAllowedMs: 50,
//   status: 'ok'  // or 'warning' if exceeded
// }
```

### Performance Guarantees

- Operations complete in < 50ms
- Failures are non-blocking
- No network requests (local storage only)
- Background sync optional (future)

## Testing

### Verification Steps

1. **Events Fire Once**
   ```javascript
   analyticsService.track('test_event', { id: 1 });
   analyticsService.track('test_event', { id: 1 }); // Should be deduplicated
   ```

2. **No PII Logged**
   ```javascript
   analyticsService.track('test', { email: 'test@test.com', action: 'click' });
   // email should be stripped from stored event
   ```

3. **No UX Impact**
   ```javascript
   localStorage.clear(); // Simulate storage failure
   const result = analyticsService.track('test_event'); // Should not throw
   ```

### Browser Console Testing

```javascript
// Check event count
analyticsService.getSummary().totalEvents

// View recent events
JSON.parse(localStorage.getItem('analytics_events')).slice(-5)

// Test tracking
analyticsService.trackAppSelection('test-app', 'switchboard')
```

## User Opt-Out

```javascript
// Disable analytics
analyticsService.disable();

// Re-enable
analyticsService.enable();

// Check status
analyticsService.isAnalyticsEnabled();

// Clear all data
analyticsService.clearAll();
```

## Integration Points

### Current Integrations

| Component | Events Tracked |
|-----------|----------------|
| `App.js` | Plan generation, app selection, switchboard view, conversion |
| `ShoppingList.js` | Shopping list save/export |
| `IntegrationsApp.js` | Provider connect/disconnect |
| `CoachingChat.js` | AI coaching messages |

### Adding New Events

1. Add event constant to `ANALYTICS_EVENTS`
2. Import service in component
3. Call `analyticsService.track()` at appropriate trigger
4. Update this documentation

```javascript
// In AnalyticsService.js
export const ANALYTICS_EVENTS = {
  // ... existing events
  NEW_EVENT: 'new_event_name'
};

// In component
analyticsService.track(ANALYTICS_EVENTS.NEW_EVENT, { relevantData: value });
```

## Future Enhancements

- [ ] Backend sync for aggregated analytics
- [ ] A/B testing framework integration
- [ ] Real-time dashboard
- [ ] Cohort analysis support
- [ ] Custom event schemas
