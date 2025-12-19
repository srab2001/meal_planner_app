# Phase Nutrition Runbook

## Test Date: December 18, 2025

## Purpose
Verify the Nutrition App module:
1. Loads from switchboard
2. Displays correct totals for existing plans
3. Reload does not recompute unless data changes
4. Meal Plan App unchanged

---

## Pre-Test Setup

### Environment
- Production API: https://meal-planner-app-mve2.onrender.com
- Client: Local development (npm start)
- Browser: Chrome DevTools open (Network + Console tabs)

### Test User
- Create/use test account
- Ensure user has an existing meal plan

---

## Test 1: Generate Plan in Meal Planner

### Steps
1. Open app in browser
2. Login with test credentials
3. Navigate to Meal Planner from switchboard
4. Generate a 7-day meal plan with preferences:
   - Dietary: None
   - Servings: 2
   - Budget: Medium
5. Wait for plan generation to complete
6. Note the meals generated (names, calorie counts)

### Expected Results
- [ ] Meal plan generates successfully
- [ ] Each meal has nutrition info (calories, protein, carbs, fat)
- [ ] Plan saves to database

### Record
```
Plan Generated: Yes/No
Total Meals: ___
Sample Meal: ___________________
Sample Calories: ___
```

---

## Test 2: Open Nutrition App from Switchboard

### Steps
1. Click "Back to Portal" from Meal Planner
2. Verify switchboard displays
3. Find and click "Nutrition" tile
4. Wait for Nutrition App to load

### Expected Results
- [ ] Switchboard shows Nutrition tile with 🥗 emoji
- [ ] Clicking tile navigates to Nutrition App
- [ ] Nutrition App loads without errors
- [ ] Header shows "🥗 Nutrition Tracker"

### Record
```
Switchboard Tile Visible: Yes/No
Navigation Success: Yes/No
Load Time: ___ seconds
Any Errors: ___
```

---

## Test 3: Verify Weekly Totals Match Meals

### Steps
1. On Nutrition App weekly summary view
2. Note the weekly totals displayed
3. Calculate expected totals from meal plan meals
4. Compare displayed vs expected

### Expected Results
- [ ] Weekly calories displayed
- [ ] Weekly protein (g) displayed
- [ ] Weekly carbs (g) displayed
- [ ] Weekly fat (g) displayed
- [ ] Totals match sum of individual meals

### Calculation Check
```
Expected Weekly Calories: ___
Displayed Weekly Calories: ___
Match: Yes/No

Expected Protein: ___g
Displayed Protein: ___g
Match: Yes/No
```

---

## Test 4: Test Daily Drill-Down

### Steps
1. Click on a day card (e.g., Monday)
2. Verify daily breakdown view loads
3. Check day totals match meals shown
4. Click on a specific meal

### Expected Results
- [ ] Day totals displayed correctly
- [ ] All meals for that day listed
- [ ] Meal cards show calories and macros
- [ ] Clicking meal shows drill-down

### Record
```
Day Selected: ___
Day Calories: ___
Meals Shown: ___
Individual Meal Verified: Yes/No
```

---

## Test 5: Verify Meal Drill-Down

### Steps
1. From daily view, click a meal card
2. Verify meal details display
3. Check macro percentages calculation
4. Use back button to return

### Expected Results
- [ ] Meal name displayed
- [ ] Full nutrition facts shown
- [ ] Macro percentages add to 100%
- [ ] Back navigation works

### Record
```
Meal Name: ___
Calories: ___
Protein %: ___
Carbs %: ___
Fat %: ___
Total %: ___ (should be 100)
```

---

## Test 6: Cache Hit on Reload

### Steps
1. Note console output for "Using cached" or "Freshly computed"
2. Refresh the page (F5)
3. Navigate back to Nutrition App
4. Check console output again

### Expected Results
- [ ] First load: "Freshly computed" (if new session)
- [ ] Second load: "Using cached data"
- [ ] Data identical between loads
- [ ] No recomputation without data change

### Record
```
First Load Status: ___
Reload Status: ___
Data Identical: Yes/No
```

---

## Test 7: Meal Plan App Unchanged

### Steps
1. Go back to switchboard
2. Open Meal Planner app
3. Verify meal plan still displays correctly
4. Try regenerating a single meal
5. Verify functionality works

### Expected Results
- [ ] Meal Plan loads correctly
- [ ] Original meals display
- [ ] Regenerate meal works
- [ ] No errors in console
- [ ] Shopping list intact

### Record
```
Meal Plan Loads: Yes/No
Original Data Intact: Yes/No
Regenerate Works: Yes/No
Any Issues: ___
```

---

## STOP Condition Checks

### 1. Nutrition writes to Meal Plan tables
**Test:** Check Network tab for any POST/PUT/DELETE to meal plan endpoints

```
POST requests to /api/meal-plans: ___
PUT requests to /api/meal-plans: ___
DELETE requests to /api/meal-plans: ___

PASS: All should be 0
```

### 2. Nutrition breaks Meal Plan routing
**Test:** After using Nutrition App, can you still use Meal Planner?

```
Navigate to Meal Planner: Yes/No
All features work: Yes/No
Console errors: ___

PASS: All Yes, no errors
```

### 3. Calculations inconsistent across reloads
**Test:** Compare values before and after page reload

```
Weekly Calories (Before): ___
Weekly Calories (After): ___
Identical: Yes/No

Protein Average (Before): ___
Protein Average (After): ___
Identical: Yes/No

PASS: All identical
```

---

## Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Generate Plan | | |
| 2. Switchboard Navigation | | |
| 3. Weekly Totals | | |
| 4. Daily Drill-Down | | |
| 5. Meal Drill-Down | | |
| 6. Cache Hit | | |
| 7. Meal Plan Unchanged | | |
| STOP: No Writes | | |
| STOP: No Route Break | | |
| STOP: Consistent Calcs | | |

---

## Sign-Off

**Tester:** ___________________
**Date:** ___________________
**Overall Status:** PASS / FAIL
**Notes:** 
