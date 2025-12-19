# Phase Rewards Runbook - Testing & Verification

## Overview

This runbook provides step-by-step testing procedures for the Progress & Rewards module, including Weekly Streaks, Achievement Badges, and Referral Codes.

---

## Pre-Test Setup

### Environment
- **URL**: https://meal-planner-app-mve2.onrender.com (Production)
- **Browser**: Chrome/Safari (latest)
- **Required**: Logged-in user account

### Test Accounts Needed
- Primary Test Account (User A)
- Secondary Test Account (User B) - for referral testing

### Clear Test State (Optional)
```javascript
// In browser console - CAREFUL: destroys progress data
localStorage.removeItem('meal_planner_streak_YOUR_USER_ID');
localStorage.removeItem('meal_planner_badges_YOUR_USER_ID');
localStorage.removeItem('meal_planner_referral_YOUR_USER_ID');
localStorage.removeItem('meal_planner_referred_by_YOUR_USER_ID');
```

---

## Test Suite 1: Weekly Streaks

### Test 1.1: Initial Streak State
**Steps**:
1. Log in as User A
2. Navigate to Progress module
3. Click Overview tab

**Expected**:
- Current streak shows 0 (if new user)
- Longest streak shows 0
- No "Last plan" date displayed

**Pass Criteria**: ✅ Zero state displays correctly

---

### Test 1.2: First Plan Generation
**Steps**:
1. Navigate to Meal Planner
2. Generate a new weekly meal plan
3. Return to Progress → Overview

**Expected**:
- Current streak: 1
- Longest streak: 1
- Last plan date: Today's date

**Pass Criteria**: ✅ Streak incremented to 1

---

### Test 1.3: Same-Week Duplicate Protection
**Steps**:
1. Generate another meal plan (same week)
2. Check Progress → Overview

**Expected**:
- Current streak: STILL 1 (not 2)
- Message or UI indicates already counted for this week

**Pass Criteria**: ✅ Streak does NOT increment twice in same week

---

### Test 1.4: Streak Display UI
**Steps**:
1. View the streak card on Overview

**Expected**:
- Large flame icon 🔥
- Orange gradient card background
- Streak number prominently displayed
- "Week Streak" label visible
- Longest streak stat shown

**Pass Criteria**: ✅ Visual design matches mockups

---

## Test Suite 2: Achievement Badges

### Test 2.1: Badge Categories Display
**Steps**:
1. Navigate to Progress → Badges tab
2. Note the category filter buttons

**Expected Categories**:
- All (default)
- Streak
- Plans
- Referral
- Engagement
- Special

**Pass Criteria**: ✅ All 6 category tabs present

---

### Test 2.2: Earned vs Locked Badges
**Steps**:
1. View badge grid
2. Identify earned badges (colored border)
3. Identify locked badges (grayed out)

**Expected**:
- Earned badges: Full color icon, colored border, earned date shown
- Locked badges: Grayed out, "?" or dimmed icon, no date

**Pass Criteria**: ✅ Visual distinction clear between earned/locked

---

### Test 2.3: Badge Rarity Colors
**Steps**:
1. Hover over earned badges
2. Note border colors

**Expected Border Colors**:
| Rarity | Color |
|--------|-------|
| Common | Green (#22c55e) |
| Uncommon | Blue (#3b82f6) |
| Rare | Purple (#8b5cf6) |
| Epic | Orange (#f97316) |
| Legendary | Gold (#eab308) |

**Pass Criteria**: ✅ Rarity colors match specification

---

### Test 2.4: Category Filtering
**Steps**:
1. Click "Streak" category tab
2. Verify only streak badges shown
3. Click "All" to reset
4. Repeat for each category

**Expected**:
- Each tab filters to show only that category's badges
- Badge count updates per category
- "All" shows complete collection

**Pass Criteria**: ✅ Filtering works for all categories

---

### Test 2.5: First Badge Award
**Steps**:
1. If new user, complete first streak (Test 1.2)
2. Check for "First Flame" badge

**Expected**:
- Badge appears in Streak category
- Toast notification on award (if implemented)
- Badge shows earned date

**Pass Criteria**: ✅ Badge correctly awarded on milestone

---

## Test Suite 3: Referral Codes

### Test 3.1: Code Generation
**Steps**:
1. Navigate to Progress → Referrals tab
2. View "Your Referral Code" section

**Expected**:
- 12-character code displayed
- Format: ASR + 8 alphanumeric chars
- Code is persistent (same on reload)

**Pass Criteria**: ✅ Valid code generated and displayed

---

### Test 3.2: Copy to Clipboard
**Steps**:
1. Click "Copy" button next to code
2. Paste in any text field

**Expected**:
- Code copies successfully
- Button may show "Copied!" feedback
- Pasted text matches displayed code

**Pass Criteria**: ✅ Copy function works

---

### Test 3.3: Share Functionality
**Steps**:
1. Click "Share" button
2. If native share available: share sheet appears
3. If not: fallback behavior (copy or link)

**Expected**:
- Mobile: Native share sheet with pre-populated message
- Desktop: Copy to clipboard or share URL

**Pass Criteria**: ✅ Share initiates without error

---

### Test 3.4: Hover Tooltips on Input
**Steps**:
1. Navigate to "Have a Referral Code?" section
2. Hover over the code input field (wait 1 second)
3. Hover over the Apply button

**Expected Tooltips**:
- **Input**: "Enter a referral code from a friend. Format: ASR followed by 8 characters. Each code can only be used once and you cannot use your own code."
- **Button**: "Click to apply the referral code. This action cannot be undone..."
- **Help text**: 💡 icon with tooltip on hover

**Pass Criteria**: ✅ All hover tooltips appear with correct text

---

### Test 3.5: Self-Referral Prevention
**Steps**:
1. Copy your own referral code
2. Paste it into the "Apply" input
3. Click Apply

**Expected**:
- Error message: "Cannot use your own referral code"
- Code NOT applied
- No discount granted

**Pass Criteria**: ✅ Self-referral blocked

---

### Test 3.6: Invalid Code Handling
**Steps**:
1. Enter invalid codes one at a time:
   - Empty string
   - "ABC" (too short)
   - "ASRXXXXXXXXX1" (13 chars - too long)
   - "XYZ123456789" (wrong prefix)
2. Click Apply for each

**Expected**:
- Error message for each invalid format
- "Invalid referral code format" or similar

**Pass Criteria**: ✅ Invalid codes rejected with clear error

---

### Test 3.7: Successful Referral (Cross-Account)
**Requires**: Two test accounts

**Steps**:
1. Log in as User A
2. Copy User A's referral code
3. Log out
4. Log in as User B (who has NOT used a code)
5. Navigate to Progress → Referrals
6. Paste User A's code
7. Click Apply

**Expected**:
- Success message: "Referral code applied! You received 10% off"
- User B's stats show "Referred by: [User A]"
- User A's successful referrals count increases by 1

**Pass Criteria**: ✅ Cross-account referral works

---

### Test 3.8: One-Time Redemption Lock
**Steps**:
1. After Test 3.7, attempt to apply another code as User B
2. Or try to apply same code again

**Expected**:
- Input field may be hidden/disabled
- Or error: "You have already used a referral code"
- No second discount applied

**Pass Criteria**: ✅ Second referral code blocked

---

### Test 3.9: Referral Limit Check
**Note**: Difficult to test without 20 test accounts

**Steps**:
1. Check referral stats display
2. Look for "X of 20 referrals used" indicator

**Expected**:
- Progress indicator or count shows referral usage
- When limit reached: appropriate message displayed

**Pass Criteria**: ✅ Limit displayed and enforced

---

## Test Suite 4: UI/UX Verification

### Test 4.1: Mobile Responsiveness
**Steps**:
1. Open Progress module on mobile device (or DevTools mobile view)
2. Test each tab: Overview, Badges, Referrals

**Expected**:
- All content readable without horizontal scroll
- Buttons tappable (minimum 44px touch target)
- Badge grid adjusts columns
- Streak card scales appropriately

**Pass Criteria**: ✅ Fully responsive on mobile

---

### Test 4.2: Theme Consistency
**Steps**:
1. Compare Progress module colors with other app modules

**Expected Colors**:
- Primary: Purple (#7c3aed / var(--asr-purple-600))
- Accents: Orange for streaks
- Backgrounds: Gray scale (--asr-gray-*)
- No blue gradients (old theme)

**Pass Criteria**: ✅ Matches ASR theme

---

### Test 4.3: Loading States
**Steps**:
1. Navigate between tabs quickly
2. Observe any loading indicators

**Expected**:
- Smooth transitions
- Loading spinner if data fetch needed
- No blank/broken states

**Pass Criteria**: ✅ Graceful loading behavior

---

### Test 4.4: Error States
**Steps**:
1. Simulate offline mode (DevTools Network → Offline)
2. Try to apply referral code

**Expected**:
- Graceful error message
- No app crash
- Retry option or clear guidance

**Pass Criteria**: ✅ Error handling works

---

## Test Suite 5: Data Persistence

### Test 5.1: Streak Persistence
**Steps**:
1. Record current streak value
2. Close browser completely
3. Reopen and log in
4. Check streak

**Expected**:
- Streak value unchanged
- All streak data persisted

**Pass Criteria**: ✅ Streak survives session

---

### Test 5.2: Badge Persistence
**Steps**:
1. Note earned badges
2. Log out and log back in
3. Check badge collection

**Expected**:
- All earned badges still showing
- Earned dates preserved

**Pass Criteria**: ✅ Badges persist across sessions

---

### Test 5.3: Referral State Persistence
**Steps**:
1. Note referral stats
2. Refresh page
3. Check stats again

**Expected**:
- Referral code same
- Referral count same
- "Was referred" status preserved

**Pass Criteria**: ✅ Referral data persists

---

## Post-Test Cleanup

After testing, consider:
1. Reverting test data if using production
2. Documenting any bugs found
3. Creating issues for failures
4. Updating error_log.md with findings

---

## Test Results Summary

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Initial Streak State | ⬜ | |
| 1.2 | First Plan Generation | ⬜ | |
| 1.3 | Duplicate Protection | ⬜ | |
| 1.4 | Streak Display UI | ⬜ | |
| 2.1 | Badge Categories | ⬜ | |
| 2.2 | Earned vs Locked | ⬜ | |
| 2.3 | Rarity Colors | ⬜ | |
| 2.4 | Category Filtering | ⬜ | |
| 2.5 | First Badge Award | ⬜ | |
| 3.1 | Code Generation | ⬜ | |
| 3.2 | Copy to Clipboard | ⬜ | |
| 3.3 | Share Function | ⬜ | |
| 3.4 | Hover Tooltips | ⬜ | |
| 3.5 | Self-Referral Block | ⬜ | |
| 3.6 | Invalid Code Handling | ⬜ | |
| 3.7 | Successful Referral | ⬜ | |
| 3.8 | One-Time Lock | ⬜ | |
| 3.9 | Referral Limit | ⬜ | |
| 4.1 | Mobile Responsive | ⬜ | |
| 4.2 | Theme Consistency | ⬜ | |
| 4.3 | Loading States | ⬜ | |
| 4.4 | Error States | ⬜ | |
| 5.1 | Streak Persistence | ⬜ | |
| 5.2 | Badge Persistence | ⬜ | |
| 5.3 | Referral Persistence | ⬜ | |

**Legend**: ✅ Pass | ❌ Fail | ⬜ Not Tested

---

*Runbook Version: 1.0*
*Last Updated: 2024*
*Module: Progress & Rewards*
