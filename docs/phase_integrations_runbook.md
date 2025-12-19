# Phase Integrations Runbook

## Overview

Test procedures for verifying the Health Integrations module functionality, security, and feature flag control.

## Pre-Test Setup

1. Open browser developer console (F12)
2. Clear localStorage: `localStorage.clear()`
3. Refresh the application
4. Log in with a test account

---

## Test Suite 1: Feature Flag Control

### Test 1.1: Verify Flag Hides Module

**Steps:**
1. In console, disable the flag:
   ```javascript
   featureFlags.setOverride('health_integrations', false);
   ```
2. Refresh the page
3. Navigate to switchboard

**Expected:**
- ❌ Integrations tile should NOT be visible
- Only Meal Planner, Nutrition, AI Coach, Progress tiles shown

**STOP Condition:** If Integrations tile visible when flag is false

---

### Test 1.2: Verify Flag Shows Module

**Steps:**
1. In console, enable the flag:
   ```javascript
   featureFlags.setOverride('health_integrations', true);
   ```
2. Refresh the page
3. Navigate to switchboard

**Expected:**
- ✅ Integrations tile should be visible with 🔗 icon
- Description: "Connect Apple Health, Fitbit, Google Fit"

---

### Test 1.3: Module Renders Disabled State

**Steps:**
1. Disable flag: `featureFlags.setOverride('health_integrations', false);`
2. Try navigating directly to integrations via URL or code

**Expected:**
- Shows "Feature Not Available" message
- Shows lock icon (🔒)
- Provides "Return to Portal" button

---

## Test Suite 2: Connection Flow

### Test 2.1: Connect Provider (Fitbit)

**Steps:**
1. Ensure flag is enabled
2. Click Integrations tile
3. Find Fitbit in provider list
4. Click "Connect" button

**Expected:**
- Status changes to "Connecting..." briefly
- After ~1.5s, status shows "Connected"
- Success message appears
- Audit log entry created (check console)

---

### Test 2.2: Verify Token Storage Security

**Steps:**
1. After connecting Fitbit, check localStorage:
   ```javascript
   Object.keys(localStorage).filter(k => k.includes('asr_int_token'))
   ```
2. Examine the token value:
   ```javascript
   localStorage.getItem('asr_int_token_YOUR_USER_ID_fitbit')
   ```

**Expected:**
- Token key format: `asr_int_token_{userId}_fitbit`
- Token value is JSON with `accessToken` field
- `accessToken` value is NOT plaintext (should be Base64 encoded)
- Cannot read actual token value directly

**STOP Condition:** If accessToken is plaintext (readable without decoding)

---

### Test 2.3: Disconnect Provider

**Steps:**
1. With Fitbit connected, click "Disconnect"
2. Confirm the dialog prompt
3. Check localStorage again:
   ```javascript
   localStorage.getItem('asr_int_token_YOUR_USER_ID_fitbit')
   ```

**Expected:**
- Confirmation dialog appears first
- Status returns to "Not Connected"
- Success message appears
- Token removed from localStorage (returns `null`)

---

### Test 2.4: Disconnect Revokes Access

**Steps:**
1. Connect Fitbit
2. Verify data can be imported
3. Disconnect Fitbit
4. Try to import data

**Expected:**
- Import button disabled or hidden when disconnected
- Any import attempt shows error
- No cached data accessible after disconnect

---

## Test Suite 3: Data Import

### Test 3.1: Import Minimal Data

**Steps:**
1. Connect Fitbit
2. Click "Import Data" button
3. Review imported data summary

**Expected:**
- Only steps and sleep data imported
- Summary shows: "Imported X days of steps and sleep data"
- No heart rate, weight, or detailed metrics visible

---

### Test 3.2: Verify Data Minimality

**Steps:**
1. After import, check what data is stored:
   ```javascript
   healthDataService.getImportedData()
   ```

**Expected:**
- Object with `steps` array
- Object with `sleep` array
- NO `heartRate`, `weight`, `location`, or other fields

**STOP Condition:** If data contains fields beyond steps/sleep

---

## Test Suite 4: Login Integration

### Test 4.1: Integration Doesn't Break Login

**Steps:**
1. Log out of application
2. Clear localStorage: `localStorage.clear()`
3. Enable integrations flag (will be default anyway)
4. Log in with credentials

**Expected:**
- Login completes successfully
- Redirected to switchboard
- No errors in console related to integrations
- Integration tokens not interfering with auth token

**STOP Condition:** If login fails or redirects incorrectly

---

### Test 4.2: Tokens Scoped to User

**Steps:**
1. Log in as User A
2. Connect Fitbit
3. Log out
4. Log in as User B (different account)
5. Check Fitbit status

**Expected:**
- User B sees Fitbit as "Not Connected"
- User B cannot access User A's token
- Token keys include user ID for isolation

---

## Test Suite 5: Error Handling

### Test 5.1: Connection Failure Handling

**Steps:**
1. Simulate network failure (offline mode or block requests)
2. Attempt to connect a provider

**Expected:**
- Shows appropriate error message
- Status shows "Error"
- App remains functional
- Can retry connection

---

### Test 5.2: Audit Logging

**Steps:**
1. Connect a provider
2. Import data
3. Disconnect provider
4. Check audit logs:
   ```javascript
   auditLogger.getLogsByCategory('integration')
   ```

**Expected:**
- Entry for `provider_connected`
- Entry for `data_imported`
- Entry for `provider_disconnected`
- All entries have timestamps

**STOP Condition:** If audit logging fails or is incomplete

---

## STOP Conditions Summary

The following conditions should STOP testing and require investigation:

| Condition | Severity | Action |
|-----------|----------|--------|
| Tokens stored in plaintext | 🔴 Critical | Do not deploy |
| Integration breaks login | 🔴 Critical | Do not deploy |
| Module cannot be disabled | 🔴 Critical | Fix feature flag |
| Data contains more than steps/sleep | 🟡 High | Review data filters |
| Tokens not user-scoped | 🟡 High | Fix storage keys |

---

## Test Completion Checklist

- [ ] Feature flag hides module when disabled
- [ ] Feature flag shows module when enabled
- [ ] Connect flow works for all providers
- [ ] Tokens are NOT stored in plaintext
- [ ] Disconnect removes tokens completely
- [ ] Imported data is minimal (steps/sleep only)
- [ ] Integration doesn't break login flow
- [ ] Tokens are scoped to individual users
- [ ] Error handling is graceful
- [ ] Audit logs capture all actions

---

## Sign-Off

| Tester | Date | Result |
|--------|------|--------|
| | | |

**Notes:**
