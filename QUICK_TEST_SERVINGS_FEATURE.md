# Quick Test: Servings Adjustment Feature
**Date:** December 23, 2025  
**Duration:** 5-10 minutes  
**Prerequisites:** Access to running meal planner app

---

## Test Setup

1. **Start the application**
   - Front-end: https://meal-planner-gold-one.vercel.app (or local dev)
   - Or local: `npm start` in the workspace

2. **Log in and generate a meal plan**
   - Complete the questionnaire (cuisine, meals, etc.)
   - Make sure at least 2-3 recipes have measurable ingredients (e.g., "2 cups flour")
   - Navigate to the Meal Plan View

---

## Test 1: Servings Adjustment in Modal
**Time:** 2-3 minutes

### Steps:
1. **Click on any meal card** (e.g., Monday breakfast)
   - Verify modal opens and shows the recipe
   - Note the original servings count (e.g., "2 servings")
   - Note at least one ingredient with a quantity (e.g., "2 cups flour")

2. **Increase servings using the "+" button**
   - Click the "+" button in the Servings adjuster section
   - Servings should increase: 2 → 3
   - Ingredients should scale: "2 cups flour" → "3 cups flour"

3. **Increase servings again**
   - Click "+" again
   - Servings: 3 → 4
   - Ingredients scale: "3 cups flour" → "4 cups flour"

4. **Verify scaling is correct**
   - Check fraction scaling: "1/2 cup milk" should become "1 cup milk" or "2 cups milk" (depending on multiplier)
   - Math check: If original is 2 servings with "1/2 cup milk"
     - At 4 servings (2x): should show "1 cup milk" ✅
   - Example with decimals: "1.5 lbs chicken" at 2 servings
     - At 4 servings (2x): should show "3 lbs chicken" ✅

5. **Decrease servings**
   - Click "-" button several times
   - Servings should decrease: 4 → 3 → 2 → 1
   - Cannot go below 1
   - Ingredients scale back down

### Expected Result: ✅ PASS
- Servings adjust correctly
- Ingredient quantities scale mathematically correct
- Scaling note appears: "(scaled from 2 servings)"

---

## Test 2: Meal Card Persistence (After Modal Close)
**Time:** 2-3 minutes

### Steps:
1. **Starting state:** Have meal modal open with adjusted servings (e.g., 4 servings)

2. **Close the modal** (click outside, press Escape, or click close button)

3. **Look at the meal card in the grid**
   - Does it show "4 servings" or "2 servings"?

4. **Re-open the same meal card**
   - Does it show 4 servings (adjusted) or 2 servings (original)?
   - Check if ingredients in the list match the servings shown

### Expected Results:

**If WORKING Correctly:**
- Meal card shows "4 servings" after adjustment
- Re-opening shows "4 servings" (adjustment persists)
- Score: ✅ PASS

**If BROKEN (Likely):**
- Meal card might still show "2 servings"
- Re-opening shows "2 servings" (adjustment lost)
- Score: ❌ FAIL - Servings adjustment not persisted

**Action:** Document which version you have

---

## Test 3: Shopping List Reflects Adjusted Servings
**Time:** 2-3 minutes

### Steps:
1. **Before adjustment:**
   - Go to Shopping List tab
   - Find an ingredient from the meal (e.g., "2 cups flour" from Monday breakfast)
   - Note the quantity

2. **Adjust servings in meal modal:**
   - Open Monday breakfast modal
   - Change servings: 2 → 4 (double the recipe)
   - Note the scaled ingredient in the modal: "2 cups flour" → "4 cups flour"

3. **Close modal and check shopping list:**
   - Click Shopping List tab
   - Find the same ingredient
   - Is it still "2 cups flour" or now "4 cups flour"?

4. **Check consolidation:**
   - If multiple meals use the same ingredient, do they sum correctly?
   - Example: Both Mon & Tue breakfast use "2 cups flour" at 2 servings each
     - Mon adjusted to 4 servings: now "4 cups flour"
     - Tue stays at 2 servings: "2 cups flour"
     - Shopping list should show: "6 cups flour" (4 + 2)

### Expected Results:

**If WORKING Correctly:**
- Shopping list shows "4 cups flour" (scaled)
- Multiple adjusted meals consolidate correctly
- Score: ✅ PASS

**If BROKEN (Likely):**
- Shopping list still shows "2 cups flour" (original)
- Adjusted quantities don't appear in shopping list
- Score: ❌ FAIL - Shopping list ignores servings adjustments

**Action:** Document which version you have

---

## Test 4: Full Workflow (All Together)
**Time:** 3-5 minutes

### Scenario: Plan a dinner for 6 people instead of 2
**Goal:** Verify all components work together

### Steps:
1. **Open Monday lunch meal card**
   - Note the recipe (e.g., "Pasta Primavera")
   - Note original servings: 2
   - Note ingredients: "2 cups pasta", "3 cups vegetables", "1 tablespoon salt"

2. **Adjust servings from 2 to 6**
   - Use "+" button 2 times (2 → 3 → 4... or click multiple times)
   - Stop at 6 servings
   - Verify modal shows: "6 servings (scaled from 2 servings)"
   - Verify ingredients scale: 
     - "2 cups pasta" → "6 cups pasta" ✅
     - "3 cups vegetables" → "9 cups vegetables" ✅
     - "1 tablespoon salt" → "3 tablespoons salt" ✅

3. **Open Tuesday lunch meal card**
   - Note original servings: 2
   - Use ingredient operations to **also increase servings to 6**
   - Close modal

4. **Check shopping list:**
   - Open Shopping List tab
   - Look for any ingredient that appears in both Mon & Tue
   - Is it properly scaled and consolidated?

5. **Print shopping list (optional)**
   - Click "Print Shopping List"
   - Check if all ingredients show scaled quantities

### Expected Results:

**Perfect Scenario (if all working):**
- Modal shows scaled ingredients ✅
- Meal cards persist adjusted servings ✅
- Shopping list shows scaled quantities ✅
- Multiple meals consolidate correctly ✅
- Print shows correct quantities ✅
- **Score: ✅✅✅ ALL WORKING**

**Partial Scenario (likely):**
- Modal shows scaled ingredients ✅
- Meal cards DON'T persist adjusted servings ❌
- Shopping list shows ORIGINAL quantities ❌
- **Score: ❌ FEATURES BROKEN**

---

## Bug Report Template

### If You Find Issues, Complete This:

```markdown
## Bug Report: Servings Adjustment Feature

**Test Date:** [TODAY'S DATE]
**Tester:** [YOUR NAME]
**App Version:** Production / Local Dev

### Bug #1: [ONE-LINE DESCRIPTION]
**Severity:** HIGH / MEDIUM / LOW
**Reproducible:** Always / Sometimes / Hard to reproduce

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Evidence:**
- Screenshot (if applicable)
- Console errors (open DevTools with F12)
- Network requests (if API-related)

### Bug #2: ...

### Summary:
- [ ] Servings adjustment UI works (modal shows adjusted count)
- [ ] Ingredient scaling works (modal shows scaled quantities)
- [ ] Meal card persistence works (adjustment saved)
- [ ] Shopping list updates (shows scaled quantities)
- [ ] Consolidation works (multiple meals sum correctly)
```

---

## Quick Reference: What Should Work

| Feature | Status | How to Test |
|---------|--------|------------|
| **Servings +/- buttons** | ✅ Should work | Click buttons in modal, count changes |
| **Ingredient scaling** | ✅ Should work | Open modal, increase servings, see quantities update |
| **Scaling note** | ✅ Should work | See "(scaled from X servings)" text |
| **Meal card shows adjusted servings** | ❓ TEST THIS | Close modal, check meal card |
| **Shopping list shows scaled quantities** | ❓ TEST THIS | Adjust servings, check shopping list |
| **Multiple meals consolidate** | ❓ TEST THIS | Adjust multiple meals, check shopping list totals |

---

## Console Debugging (Advanced)

If you want to check the data structure:

1. **Open DevTools** (F12 or right-click → Inspect)
2. **Go to Console tab**
3. **Paste this code:**
```javascript
// Check if meal plan data is being updated correctly
if (window.mealPlanState) {
  console.log('Current meal plan:', window.mealPlanState.localMealPlan);
  console.log('Custom servings:', window.mealPlanState.customServings);
  console.log('Shopping list:', window.mealPlanState.localMealPlan.shoppingList);
}
```

4. **Check the output** to see if custom servings are being saved

---

## Summary

This test verifies whether the servings adjustment feature works end-to-end:

1. ✅ **UI Level** - Users can adjust servings in the modal
2. ✅ **Display Level** - Ingredient quantities update in the modal
3. ❓ **Data Persistence** - Adjustments saved to meal data (TO BE TESTED)
4. ❓ **Shopping List** - Adjustments reflected in shopping list (TO BE TESTED)

**Expected outcome:** You'll either confirm the feature works fully, or identify specific bugs that need fixing.

---

## Next Steps (If Bugs Found)

1. Document which tests failed
2. Create GitHub issues for each bug
3. Reference this test document in the issues
4. Fix bugs in priority order:
   - Priority 1: Persist servings adjustment
   - Priority 2: Update shopping list with scaled quantities
   - Priority 3: Visual feedback on meal cards

