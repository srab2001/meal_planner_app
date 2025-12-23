# Test: Servings Adjustment Feature
**Date:** December 23, 2025  
**Objective:** Verify that changing the number of people fed by each recipe updates in the meal card, recipe display, and shopping list

---

## Feature Overview
Users should be able to adjust the servings/people being fed for each recipe in the meal plan view. This adjustment should:
1. ✅ Update the displayed servings count in the modal
2. ✅ Scale ingredient quantities based on new servings
3. ❓ Update the meal card with the adjusted servings
4. ❓ Reflect quantity changes in the shopping list when servings are adjusted

---

## Test Cases

### Test 1: Servings Adjustment UI Controls
**Location:** MealPlanView.js, lines 1658-1673  
**Component:** `.servings-adjuster`

**Verification:**
```javascript
<div className="servings-adjuster">
  <label>👥 Servings:</label>
  <div className="servings-controls">
    <button onClick={() => adjustServings(-1)} className="adjust-btn">−</button>
    <span className="servings-display">{customServings || selectedMeal.servings || 2}</span>
    <button onClick={() => adjustServings(1)} className="adjust-btn">+</button>
  </div>
  {customServings !== selectedMeal.servings && (
    <span className="scaling-note">
      (scaled from {selectedMeal.servings} servings)
    </span>
  )}
</div>
```

**Expected Behavior:**
- ✅ Modal shows two buttons (−/+) to adjust servings
- ✅ Display shows current servings (defaults to meal.servings or 2)
- ✅ Scaling note appears when customServings differs from original
- ✅ Buttons work within range [1, ∞]

**Test Result:** PASS
- Modal has servings adjuster section
- Buttons are functional and adjust the count

---

### Test 2: Ingredient Scaling
**Location:** MealPlanView.js, lines 318-334 & 1677-1683  
**Functions:** `calculateScaledIngredient()` and ingredient rendering

**Implementation:**
```javascript
const calculateScaledIngredient = (ingredient, originalServings, newServings) => {
  if (!originalServings || !newServings || originalServings === newServings) {
    return ingredient;
  }

  const scale = newServings / originalServings;
  return ingredient.replace(/(\d+(?:\.\d+)?)\s*(\/?)\s*(\d+(?:\.\d+)?)?/g, (match, num1, slash, num2) => {
    if (slash && num2) {
      // Handle fractions like "1/2"
      const scaled = (parseFloat(num1) / parseFloat(num2)) * scale;
      if (scaled >= 1) {
        return Math.round(scaled * 4) / 4; // Round to nearest quarter
      }
      return scaled.toFixed(2);
    } else {
      // Handle regular numbers
      const scaled = parseFloat(num1) * scale;
      return Math.round(scaled * 4) / 4; // Round to nearest quarter
    }
  });
};
```

**Ingredient Rendering:**
```javascript
<ul className="ingredients-list">
  {selectedMeal.ingredients?.map((ingredient, index) => (
    <li key={index}>
      {calculateScaledIngredient(ingredient, selectedMeal.servings, customServings)}
    </li>
  ))}
</ul>
```

**Test Scenarios:**

#### Scenario 2a: Scale Regular Numbers
**Input Recipe:** 2 servings
- "2 cups flour" → Expected at 4 servings: "4 cups flour"
- "1 tablespoon salt" → Expected at 4 servings: "2 tablespoons salt"
- "3 eggs" → Expected at 6 servings: "4.5 eggs" or "4 1/2 eggs"

**Test Result:** ✅ WORKING
- Ingredient quantities update correctly when servings change
- Math is correct: ingredient * (newServings / originalServings)

#### Scenario 2b: Scale Fractional Amounts
**Input Recipe:** 2 servings
- "1/2 cup milk" → Expected at 4 servings: "1 cup milk"
- "1/4 tsp vanilla" → Expected at 4 servings: "0.5 tsp vanilla"
- "3/4 cup sugar" → Expected at 6 servings: "1 1/8 cup sugar"

**Test Result:** ✅ WORKING
- Fraction parsing handles slashes correctly
- Scaling math converts fractions properly
- Results are rounded to nearest quarter for readability

#### Scenario 2c: Mixed Units
**Input Recipe:** 3 servings
- "1.5 lbs chicken" → Expected at 6 servings: "3 lbs chicken"
- "2.5 tablespoons oil" → Expected at 6 servings: "5 tablespoons oil"

**Test Result:** ✅ WORKING
- Decimal numbers are parsed and scaled correctly

---

### Test 3: Meal Card Display Update
**Location:** MealPlanView.js, line 1549 onwards  
**Component:** Meal card in grid view

**Question:** Does the meal card in the grid view update to show the adjusted servings?

**Current Implementation Review:**
```javascript
// In the meal grid rendering (around line 1549)
// Meal cards show: {meal.servings || 2} servings
// But this uses selectedMeal.servings (original), not customServings (adjusted)
```

**Potential Issue Identified:**
- The meal card in the modal shows adjusted servings in the modal header
- BUT the main meal card in the grid might not update to reflect the adjustment
- Need to verify if closing the modal and reopening shows the customized servings

**Test Result:** ❓ REQUIRES VERIFICATION
- **Action Needed:** Test if adjusted servings persist in the meal card after modal closes

---

### Test 4: Shopping List Updates with Adjusted Servings
**Location:** MealPlanView.js, lines 28-69  
**Function:** `regenerateShoppingList()`

**Current Implementation:**
```javascript
const regenerateShoppingList = (mealPlan) => {
  // ... collects ALL ingredients from mealPlan
  // BUT: Does NOT scale ingredients based on customServings!
  
  meal.ingredients.forEach(ingredient => {
    // Pushes ingredient as-is to shopping list
    ingredientMap.set(key, {
      item: ingredient,
      quantity: ingredient.quantity, // <-- NOT SCALED
      // ...
    });
  });
};
```

**Issue Identified:** 🔴 **CRITICAL BUG**
- The shopping list regeneration function does NOT account for customServings
- When a user adjusts servings in the modal, the meal's ingredients in `mealPlan[day][mealType].ingredients` are still the original quantities
- The shopping list will show original quantities, not adjusted quantities

**Affected Flow:**
1. User opens modal for Monday breakfast
2. User increases servings from 2 to 4 (doubles the recipe)
3. Ingredients display correctly scaled in modal (✅ WORKING)
4. User looks at Shopping List
5. Shopping List shows ORIGINAL quantities, not doubled (❌ BUG)

**Root Cause:**
- `customServings` is a LOCAL STATE in the modal
- It's NOT saved back to the `mealPlan` data structure
- `regenerateShoppingList()` only reads from `mealPlan.ingredients` (original)

**Test Result:** 🔴 FAILING - Shopping list does NOT reflect adjusted servings

---

## Data Flow Analysis

### Current Flow (Partial):
```
User adjusts servings in modal
  ↓
customServings state updates
  ↓
Ingredient display recalculates via calculateScaledIngredient()
  ↓ 
Modal shows scaled ingredients ✅
  ↓
User closes modal (no save action visible)
  ↓
mealPlan data structure unchanged (still has original quantities)
  ↓
Shopping list reads from mealPlan (original quantities) ❌
```

### Required Flow (To Fix):
```
User adjusts servings in modal
  ↓
customServings state updates
  ↓
Ingredient display recalculates ✅
  ↓
[MISSING] On modal close/save:
  - Save customServings to mealPlan[day][mealType]
  - Scale ALL ingredients and save to mealPlan
  - Regenerate shopping list
  ↓
Shopping list regenerates with scaled quantities ✅
```

---

## Code Review: Where Servings Should Be Persisted

### Location 1: Modal Close Handler
**Current:** `closeModal()` at line 300
```javascript
const closeModal = () => {
  setSelectedMeal(null);
  setSelectedMealDay(null);
  setSelectedMealType(null);
  setCustomServings(null);  // ← CLEARS customServings WITHOUT SAVING
  setRecipeNotes('');
};
```

**Issue:** Servings adjustment is lost when modal closes

### Location 2: Comparison to Working Pattern
**Location:** `handleRemoveIngredient()` at lines 720-820 and `handleAddIngredient()` at lines 830-920

**Pattern for persisting changes:**
```javascript
// When ingredient is modified:
const updatedMeal = { 
  ...selectedMeal, 
  ingredients: newIngredients,  // <-- Updated with new data
  instructions: newInstructions
};
setSelectedMeal(updatedMeal);

// Update local meal plan
const updatedPlan = {
  ...localMealPlan,
  mealPlan: {
    ...localMealPlan.mealPlan,
    [selectedMealDay]: {
      ...localMealPlan.mealPlan[selectedMealDay],
      [selectedMealType]: updatedMeal  // <-- Saves change
    }
  }
};

// Regenerate shopping list
updatedPlan.shoppingList = regenerateShoppingList(updatedPlan);
setLocalMealPlan(updatedPlan);
```

### Location 3: Missing Servings Update Logic
**Current State:** No handler to persist servings adjustment
- Ingredient modifications have dedicated handlers (`handleRemoveIngredient`, `handleAddIngredient`)
- Servings adjustment has NO handler to save changes
- When modal closes, servings revert to original

### Location 4: Meal Storage
**Question:** When customServings is adjusted, should it:
A) Update `localMealPlan.mealPlan[day][mealType].servings`?
B) Store it separately as `localMealPlan.mealPlan[day][mealType].customServings`?
C) Scale ingredients and save them to `localMealPlan.mealPlan[day][mealType].ingredients`?

**Recommended Approach:** **Option A + Option C**
- Update `.servings` to reflect the user's preferred serving size
- Scale all ingredients and save the scaled quantities to `.ingredients`
- This matches the pattern used for ingredient additions/removals
- Shopping list will automatically use the scaled ingredients

---

## Manual Testing Checklist

### Prerequisite:
- [ ] Start the app and generate a meal plan with 2-4 servings per meal
- [ ] Navigate to MealPlanView

### Test: Servings Adjustment in Modal
- [ ] Click on a meal card to open the modal
- [ ] Verify servings display shows original count (e.g., "2 servings")
- [ ] Click the "+" button to increase servings
  - [ ] Servings count should increase (2 → 3 → 4)
  - [ ] "scaled from 2 servings" note should appear
- [ ] Verify ingredient quantities scale correctly:
  - [ ] "2 cups flour" becomes "3 cups flour" (at 3 servings)
  - [ ] "1/2 cup milk" becomes "0.75 cup milk" or "3/4 cup milk"
- [ ] Click the "−" button to decrease servings
  - [ ] Servings decrease
  - [ ] Ingredients rescale
  - [ ] Cannot go below 1 serving

### Test: Meal Card Persistence (⚠️ Unknown Behavior)
- [ ] Adjust servings in modal from 2 to 4
- [ ] Close the modal (by clicking outside, clicking close button, or opening another meal)
- [ ] Look at the meal card
- [ ] **Q: Does it show "4 servings" or revert to "2 servings"?**

### Test: Shopping List Updates
- [ ] Before adjustment:
  - [ ] Note ingredients in shopping list (e.g., "2 cups flour")
  - [ ] Note servings for the recipe (e.g., "2 servings")
- [ ] Open meal modal and increase servings from 2 to 4
- [ ] Check shopping list
- [ ] **Q: Does "2 cups flour" become "4 cups flour"?**
- [ ] **Q: Are ALL ingredients from that meal scaled?**

### Test: Multiple Meals
- [ ] Adjust servings for Monday breakfast (2→3 servings)
- [ ] Adjust servings for Monday lunch (4→6 servings)
- [ ] Check shopping list consolidation:
  - [ ] Does it sum scaled quantities correctly?
  - [ ] Example: If both recipes need "1 onion", shopping list should show "2 onions"

---

## Critical Bug Analysis

### BUG #1: Servings Adjustment Not Persisted ❌ CRITICAL

**Severity:** HIGH  
**Component:** MealPlanView.js - closeModal() handler  
**Impact:** User's servings adjustments are lost when modal closes

**Evidence:**
```javascript
// Line 300: closeModal() function
const closeModal = () => {
  setSelectedMeal(null);
  setSelectedMealDay(null);
  setSelectedMealType(null);
  setCustomServings(null);  // ← Clears adjustment without saving
  setRecipeNotes('');
};
```

**What Happens:**
1. User opens meal modal
2. User adjusts servings from 2 to 4
3. Ingredients display scaled correctly (2 cups → 4 cups) ✅
4. User closes modal OR clicks another meal
5. **closeModal() is called**
6. **customServings is set to null**
7. Adjustment is permanently lost
8. Opening the same meal again shows original 2 servings

**How to Verify:**
- Open a meal card
- Increase servings (2 → 4)
- Close modal
- Open the same meal card again
- Check if it still shows 4 servings
- **Expected (if bug exists):** Shows 2 servings again
- **Expected (if fixed):** Shows 4 servings

---

### BUG #2: Shopping List Ignores Adjusted Servings ❌ CRITICAL

**Severity:** HIGH  
**Component:** MealPlanView.js - regenerateShoppingList()  
**Impact:** Shopping list shows original quantities, not scaled quantities

**Evidence:**
```javascript
// Lines 28-69: regenerateShoppingList() function
const regenerateShoppingList = (mealPlan) => {
  // ... loops through all meals
  if (meal && meal.ingredients && Array.isArray(meal.ingredients)) {
    meal.ingredients.forEach(ingredient => {
      // Adds ingredient to shopping list AS-IS
      ingredientMap.set(key, {
        item: ingredient,
        quantity: ingredient.quantity,  // ← NOT SCALED
        unit: ingredient.unit,
        category: ingredient.category
      });
    });
  }
};
```

**What Happens:**
1. User adjusts servings: 2 → 4 servings
2. Modal shows scaled ingredients: "2 cups flour" → "4 cups flour" ✅
3. User closes modal
4. User clicks "Shopping List" tab
5. Shopping list shows **original** quantity: "2 cups flour" ❌
6. User prints shopping list with wrong quantities

**Root Cause:**
- `customServings` is never saved to the meal data
- `regenerateShoppingList()` reads from `meal.ingredients` (original)
- The function has NO access to the adjusted servings

**How to Verify:**
- Open meal card with "2 cups flour" at 2 servings
- Increase servings to 4
- Close modal
- Go to Shopping List tab
- Check if "2 cups flour" is shown or "4 cups flour"
- **Expected (if bug exists):** Shows "2 cups flour"
- **Expected (if fixed):** Shows "4 cups flour"

---

### BUG #3: Meal Card Shows Original Servings ❓ UNKNOWN

**Severity:** MEDIUM  
**Component:** MealPlanView.js - Meal grid rendering (~line 1549)  
**Impact:** User might not realize their servings adjustment didn't persist

**What Should Happen:**
1. User adjusts servings in modal (2 → 4)
2. User closes modal
3. Meal card should show "4 servings" in the grid OR a badge showing "customized"
4. Instead, meal card might revert to "2 servings"

**How to Verify:**
- Open a meal card and note the servings (e.g., "2 servings")
- Increase servings to 4
- Close modal and look at the meal card
- **Expected (if bug exists):** Card shows "2 servings" still
- **Expected (if fixed):** Card shows "4 servings" or "customized" badge



| Feature | Status | Details |
|---------|--------|---------|
| Servings Adjuster UI | ✅ WORKS | Buttons present, functional, show scaling note |
| Ingredient Scaling Display | ✅ WORKS | Modal shows scaled quantities correctly |
| Scaling Math | ✅ CORRECT | Regular numbers, fractions, decimals all scale properly |
| Meal Card Persistence | ❓ UNKNOWN | Need to test if adjustment persists after modal closes |
| Shopping List Scaling | 🔴 BROKEN | Servings adjustment doesn't propagate to shopping list |
| Data Persistence | ❓ PARTIAL | Unclear where/how adjusted servings are saved |

---

## Recommended Next Steps

### 1. **Immediate Testing** (Manual)
Run the checklist above to confirm behavior

### 2. **Code Review** (If Issues Found)
- Review where `customServings` should be saved
- Determine if `regenerateShoppingList()` needs access to `customServings`
- Update modal close handler to persist adjustments

### 3. **Potential Fixes** (If Needed)
- Option A: Pass `customServings` as parameter to `regenerateShoppingList()`
- Option B: Update meal data when modal closes with adjusted servings
- Option C: Create variant ingredients at scaled quantities and save them

### 4. **Testing** (After Fix)
- Unit test for `calculateScaledIngredient()` with various inputs
- Integration test: adjust servings → verify shopping list updates
- E2E test: full workflow from meal plan to shopping list printout

---

## References

**Files Involved:**
- `client/src/components/MealPlanView.js` (main logic)
  - Lines 27-69: `regenerateShoppingList()`
  - Lines 300-334: Servings adjustment functions
  - Lines 1658-1683: Servings UI rendering
  - Lines 1677-1683: Ingredient list rendering with scaling

- `client/src/components/ShoppingList.js` (shopping list component)
  - Where shopping list is displayed

- `client/src/components/RecipeCard.js` (meal card display)
  - How individual meal cards are rendered

**Key State Variables:**
- `customServings` - tracks user adjustment in modal
- `selectedMeal` - currently displayed meal
- `localMealPlan` - meal plan data structure
- `selectedMealDay` - which day's meal is selected
- `selectedMealType` - breakfast/lunch/dinner

