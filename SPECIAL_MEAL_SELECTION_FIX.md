# Special Occasion Meal Selection Fix

## Issue
When a user selected a special occasion meal during the questionnaire (e.g., "Espresso Crusted Rib Roast"), the generated meal plan showed a **different** special occasion meal instead of the user's selection.

## Root Cause
**Type Mismatch Between Frontend and Backend:**

1. **Frontend sends**: `specialMealChoice` as an **object**
   ```javascript
   {
     title: "Espresso Crusted Rib Roast",
     notes: "..."
   }
   ```

2. **Backend expected**: `specialMealChoice` as a **string**
   - Was using `specialMealChoice` directly in the AI prompt
   - JavaScript was converting the object to `"[object Object]"` 
   - AI never saw the actual meal name

## Solution
**Extract the `.title` property before using in the prompt:**

```javascript
// In server.js, line 754
const specialMealTitle = specialMealChoice?.title || specialMealChoice;

// Then use specialMealTitle in the AI prompt (line 969)
${specialMealTitle ? `- IMPORTANT: Use THIS EXACT MEAL: "${specialMealTitle}"` : ...}
```

This ensures:
- ✅ Object-type selections work correctly
- ✅ String-type selections still work (backward compatible)
- ✅ AI gets the actual meal name, not `[object Object]`
- ✅ User's selected meal appears in the generated meal plan

## Verification
After this fix, when a user:
1. Selects "Espresso Crusted Rib Roast" in the questionnaire
2. Completes the form and generates a meal plan
3. **Result**: The meal plan will contain "Espresso Crusted Rib Roast" (or the exact name the user selected)

## Commit
- **Hash**: `3452e5b`
- **Message**: "Fix: Extract special meal title from object in server.js"
- **Files Changed**: `server.js` (2 locations)
- **Lines Changed**: +6, -3

## Files Modified
- `/server.js` 
  - Line 754: Added `specialMealTitle` extraction
  - Line 969: Updated prompt to use `specialMealTitle`

## Impact
- ✅ Special occasion meals now appear correctly in meal plans
- ✅ User selections are properly respected
- ✅ No breaking changes (backward compatible)
- ✅ Deployed to production with next build
