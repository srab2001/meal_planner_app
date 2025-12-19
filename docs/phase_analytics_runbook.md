# Phase Analytics Runbook

## Overview

Test procedures for verifying the Analytics Service functionality, privacy protections, and performance requirements.

## Pre-Test Setup

1. Open browser developer console (F12)
2. Clear analytics data: `analyticsService.clearAll()`
3. Initialize analytics: `analyticsService.init('test-user-id')`
4. Verify empty state: `analyticsService.getSummary().totalEvents === 0`

---

## Test Suite 1: Event Tracking

### Test 1.1: Track Plan Generation

**Steps:**
1. Navigate to Meal Planner
2. Complete questionnaire
3. Generate a meal plan
4. Check analytics:
   ```javascript
   analyticsService.getSummary().byEvent
   ```

**Expected:**
- `plan_generation_started: 1`
- `plan_generation_completed: 1` (if successful)
- OR `plan_generation_failed: 1` (if error)

---

### Test 1.2: Track Shopping List Save

**Steps:**
1. With a meal plan generated, go to Shopping List tab
2. Click "Download" button to save list
3. Check analytics:
   ```javascript
   analyticsService.getSummary().byEvent.shopping_list_saved
   ```

**Expected:**
- `shopping_list_saved: 1`
- Event properties include `itemCount` and `format: 'txt'`

---

### Test 1.3: Track App Selection

**Steps:**
1. Navigate to switchboard
2. Click on "Meal Planner" tile
3. Return to switchboard
4. Click on "Nutrition" tile
5. Check analytics:
   ```javascript
   analyticsService.getSummary().byEvent.app_selected
   ```

**Expected:**
- `app_selected: 2`
- Properties include `appId` for each selection

---

### Test 1.4: Track Switchboard View

**Steps:**
1. Refresh the application
2. Wait for splash to complete
3. Check analytics:
   ```javascript
   analyticsService.getSummary().byEvent.switchboard_viewed
   ```

**Expected:**
- `switchboard_viewed: 1` (or incremented from previous)

---

## Test Suite 2: Event Deduplication

### Test 2.1: Events Fire Once Per Action

**Steps:**
1. Clear analytics: `analyticsService.clearAll()`
2. Rapidly click switchboard tile 5 times within 1 second
3. Check event count:
   ```javascript
   analyticsService.getSummary().totalEvents
   ```

**Expected:**
- Only 1 event recorded (not 5)
- Deduplication prevents rapid-fire duplicates

---

### Test 2.2: Same Event After Delay

**Steps:**
1. Track an event: `analyticsService.track('test_event', { id: 1 })`
2. Wait 2 seconds
3. Track same event again: `analyticsService.track('test_event', { id: 1 })`
4. Check count:
   ```javascript
   JSON.parse(localStorage.getItem('analytics_events')).filter(e => e.name === 'test_event').length
   ```

**Expected:**
- 2 events recorded (delay exceeds dedup window)

---

## Test Suite 3: Privacy Protection

### Test 3.1: No PII Logged

**Steps:**
1. Attempt to track event with PII:
   ```javascript
   analyticsService.track('test_pii', {
     email: 'test@example.com',
     name: 'John Doe',
     phone: '555-1234',
     action: 'clicked',
     itemId: 123
   });
   ```
2. Retrieve the event:
   ```javascript
   JSON.parse(localStorage.getItem('analytics_events')).find(e => e.name === 'test_pii')
   ```

**Expected:**
- `properties.email` should NOT exist
- `properties.name` should NOT exist  
- `properties.phone` should NOT exist
- `properties.action` should exist ('clicked')
- `properties.itemId` should exist (123)

**STOP Condition:** If any PII field is present in stored event

---

### Test 3.2: User ID Anonymization

**Steps:**
1. Initialize with real email:
   ```javascript
   analyticsService.init('john.doe@example.com');
   ```
2. Track an event and check userId:
   ```javascript
   analyticsService.track('test_anon', {});
   JSON.parse(localStorage.getItem('analytics_events')).slice(-1)[0].userId
   ```

**Expected:**
- userId is format `user_XXXXXXXX` (hex hash)
- NOT the original email address

**STOP Condition:** If actual email appears in userId field

---

### Test 3.3: Sensitive Fields Redacted

**Steps:**
1. Track with sensitive data:
   ```javascript
   analyticsService.track('test_sensitive', {
     password: 'secret123',
     token: 'abc123token',
     creditCard: '4111111111111111',
     normalField: 'allowed'
   });
   ```
2. Check stored event

**Expected:**
- `password`, `token`, `creditCard` fields removed
- `normalField` preserved

---

## Test Suite 4: Performance

### Test 4.1: No Performance Regression

**Steps:**
1. Measure baseline:
   ```javascript
   const start = performance.now();
   // Do some UI action that triggers analytics
   analyticsService.track('perf_test', { data: 'test' });
   console.log('Analytics took:', performance.now() - start, 'ms');
   ```

**Expected:**
- Operation completes in < 50ms
- No noticeable UI lag

**STOP Condition:** If analytics causes visible UI delay

---

### Test 4.2: Check Performance Metrics

**Steps:**
1. After tracking several events:
   ```javascript
   analyticsService.getPerformanceMetrics()
   ```

**Expected:**
- `lastOperationMs` < 50
- `status` is 'ok'

---

### Test 4.3: Failures Don't Affect UX

**Steps:**
1. Fill localStorage to capacity (or simulate error)
2. Attempt to track event
3. Verify app continues working

**Expected:**
- No error thrown to user
- App remains functional
- Console may show warning but no crash

---

## Test Suite 5: Dashboard & Reporting

### Test 5.1: Summary Report

**Steps:**
1. Perform various actions (generate plan, save list, switch apps)
2. Get summary:
   ```javascript
   const summary = analyticsService.getSummary();
   console.log(JSON.stringify(summary, null, 2));
   ```

**Expected:**
- `totalEvents` > 0
- `byCategory` has counts per category
- `byEvent` has counts per event type
- `byDate` has counts per day
- `conversionFunnel` has funnel metrics

---

### Test 5.2: Export Data

**Steps:**
1. Export as JSON:
   ```javascript
   const json = analyticsService.exportEvents('json');
   console.log(json.substring(0, 500));
   ```
2. Export as CSV:
   ```javascript
   const csv = analyticsService.exportEvents('csv');
   console.log(csv.substring(0, 500));
   ```

**Expected:**
- JSON is valid parseable array
- CSV has header row and data rows
- Neither export contains PII

---

## Test Suite 6: User Controls

### Test 6.1: Disable Analytics

**Steps:**
1. Disable: `analyticsService.disable()`
2. Track event: `analyticsService.track('should_not_track', {})`
3. Check: `analyticsService.getSummary().byEvent.should_not_track`

**Expected:**
- Event NOT recorded
- `isAnalyticsEnabled()` returns false

---

### Test 6.2: Re-Enable Analytics

**Steps:**
1. Enable: `analyticsService.enable()`
2. Track event: `analyticsService.track('should_track', {})`
3. Check: `analyticsService.getSummary().byEvent.should_track`

**Expected:**
- Event IS recorded
- `isAnalyticsEnabled()` returns true

---

### Test 6.3: Clear All Data

**Steps:**
1. Have some events tracked
2. Clear: `analyticsService.clearAll()`
3. Check: `analyticsService.getSummary().totalEvents`

**Expected:**
- `totalEvents` is 0
- localStorage key removed

---

## STOP Conditions Summary

| Condition | Severity | Action |
|-----------|----------|--------|
| PII is logged | 🔴 Critical | Do not deploy |
| Analytics causes performance regression | 🔴 Critical | Optimize or disable |
| Analytics errors crash app | 🔴 Critical | Fix error handling |
| Events fire multiple times | 🟡 High | Fix deduplication |
| User ID not anonymized | 🟡 High | Fix hash function |

---

## Test Procedure Checklist

### Required Tests
- [ ] Test 1.1: Plan generation tracked
- [ ] Test 1.2: Shopping list save tracked
- [ ] Test 1.3: App selection tracked
- [ ] Test 2.1: Events fire once (deduplication)
- [ ] Test 3.1: No PII logged
- [ ] Test 3.2: User ID anonymized
- [ ] Test 4.1: No performance regression

### Recommended Tests
- [ ] Test 1.4: Switchboard view tracked
- [ ] Test 3.3: Sensitive fields redacted
- [ ] Test 4.3: Failures don't affect UX
- [ ] Test 5.1: Summary report works
- [ ] Test 6.1-6.3: User controls work

---

## End-to-End Test Flow

**Full User Journey Test:**

1. Clear all data: `analyticsService.clearAll()`
2. Initialize: `analyticsService.init('test@test.com')`
3. Refresh app → Switchboard view tracked
4. Select Meal Planner → App selection tracked
5. Complete questionnaire and generate plan → Plan generation tracked
6. Go to Shopping List, download → Shopping list save tracked
7. Return to switchboard → App switch tracked
8. Check summary: All events present
9. Export CSV: No PII in export
10. ✅ All pass = Test Complete

---

## Sign-Off

| Tester | Date | Result |
|--------|------|--------|
| | | |

**Notes:**
