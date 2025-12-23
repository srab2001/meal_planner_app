# Special Occasion Feature - Testing Guide

**Date**: December 23, 2025  
**Feature Status**: ✅ IMPLEMENTATION COMPLETE  
**Testing Status**: 🟡 READY FOR TESTING

---

## 📋 Test Overview

The Special Occasion Feature has been fully implemented across the backend and frontend. This guide provides comprehensive testing procedures to validate all functionality.

---

## ✅ Test 1: Backend Endpoint - Valid Request

**Test Type**: Positive test case  
**Endpoint**: `POST /api/special-occasion/options`  
**Auth**: Required (JWT token)

### Step 1: Get JWT Token
```bash
node generate-token.js
# Save the token output
```

### Step 2: Run Test
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ingredient":"lobster"}' \
  http://localhost:5000/api/special-occasion/options
```

### Expected Response
```json
{
  "options": [
    {
      "title": "Lobster Tail Dinner",
      "notes": "Maine lobster tails served with garlic butter, roasted asparagus, and garlic mashed potatoes"
    },
    {
      "title": "Pan-Seared Lobster with Tarragon",
      "notes": "Fresh lobster pan-seared with white wine, shallots, and fresh tarragon cream sauce"
    },
    // ... 3-5 total options
  ]
}
```

### Validation
- [ ] Status code: 200
- [ ] Response includes `options` array
- [ ] Array contains 3-5 meal objects
- [ ] Each meal has `title` (string, non-empty)
- [ ] Each meal has `notes` (string, non-empty)
- [ ] Response is valid JSON

---

## ✅ Test 2: Backend Endpoint - Different Ingredients

**Test Type**: Positive test case (variety)  
**Purpose**: Verify endpoint works with various premium ingredients

### Test with Steak
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ingredient":"wagyu steak"}' \
  http://localhost:5000/api/special-occasion/options
```

### Test with Shrimp
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ingredient":"shrimp"}' \
  http://localhost:5000/api/special-occasion/options
```

### Test with Truffle
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ingredient":"truffle"}' \
  http://localhost:5000/api/special-occasion/options
```

### Validation
- [ ] Each ingredient returns 3-5 unique options
- [ ] Options are contextually appropriate for ingredient
- [ ] No error responses
- [ ] All titles and notes are descriptive

---

## ✅ Test 3: Backend Endpoint - Missing Ingredient

**Test Type**: Negative test case  
**Purpose**: Verify proper error handling for missing ingredient

### Test
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:5000/api/special-occasion/options
```

### Expected Response
```json
{
  "error": "Ingredient is required"
}
```

### Validation
- [ ] Status code: 400
- [ ] Error message: "Ingredient is required"
- [ ] Response is JSON

---

## ✅ Test 4: Backend Endpoint - Empty Ingredient

**Test Type**: Negative test case  
**Purpose**: Verify proper error handling for empty string ingredient

### Test
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ingredient":""}' \
  http://localhost:5000/api/special-occasion/options
```

### Expected Response
```json
{
  "error": "Ingredient cannot be empty"
}
```

### Validation
- [ ] Status code: 400
- [ ] Error message: "Ingredient cannot be empty"
- [ ] Response is JSON

---

## ✅ Test 5: Backend Endpoint - Whitespace Only

**Test Type**: Negative test case  
**Purpose**: Verify proper error handling for whitespace-only ingredient

### Test
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ingredient":"   "}' \
  http://localhost:5000/api/special-occasion/options
```

### Expected Response
```json
{
  "error": "Ingredient cannot be empty"
}
```

### Validation
- [ ] Status code: 400
- [ ] Error message: "Ingredient cannot be empty"

---

## ✅ Test 6: Backend Endpoint - Missing JWT Token

**Test Type**: Negative test case  
**Purpose**: Verify authentication is enforced

### Test
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"ingredient":"lobster"}' \
  http://localhost:5000/api/special-occasion/options
```

### Expected Response
```json
{
  "error": "Unauthorized"
}
```

### Validation
- [ ] Status code: 401
- [ ] Error message about authorization
- [ ] No data returned

---

## ✅ Test 7: Backend Endpoint - Invalid JWT Token

**Test Type**: Negative test case  
**Purpose**: Verify token validation

### Test
```bash
curl -X POST \
  -H "Authorization: Bearer invalid_token_xyz" \
  -H "Content-Type: application/json" \
  -d '{"ingredient":"lobster"}' \
  http://localhost:5000/api/special-occasion/options
```

### Expected Response
```json
{
  "error": "Unauthorized"
}
```

### Validation
- [ ] Status code: 401
- [ ] Invalid token properly rejected

---

## ✅ Test 8: Frontend - Toggle Checkbox

**Test Type**: UI interaction test

### Steps
1. Start backend: `node server.js`
2. Start frontend: `npm start` (in client directory)
3. Log in with valid credentials
4. Navigate to questionnaire
5. Look for "✨ Add a Special Occasion Meal" checkbox

### Validation
- [ ] Checkbox is visible
- [ ] Label text is clear
- [ ] Description text appears below checkbox
- [ ] Unchecked by default

---

## ✅ Test 9: Frontend - Show/Hide Ingredient Input

**Test Type**: UI conditional rendering test

### Steps
1. Check the "✨ Add a Special Occasion Meal" checkbox
2. Observe the form

### Validation
- [ ] Ingredient input field appears
- [ ] Placeholder text shows examples: "e.g., lobster, steak, shrimp, truffle, wagyu..."
- [ ] Input field is focused and ready for text
- [ ] Other form elements are not affected

### Steps (Hide)
1. Uncheck the "✨ Add a Special Occasion Meal" checkbox

### Validation
- [ ] Ingredient input field disappears
- [ ] All previous selections are cleared
- [ ] Form returns to clean state

---

## ✅ Test 10: Frontend - Ingredient Input

**Test Type**: Form input test

### Steps
1. Check the "✨ Add a Special Occasion Meal" checkbox
2. Click on the ingredient input field
3. Type "lobster"

### Validation
- [ ] Text input accepts characters
- [ ] Text displays in the field
- [ ] Cursor is visible
- [ ] Backspace/delete work properly

---

## ✅ Test 11: Frontend - Get Meal Options Button

**Test Type**: Button state test

### Test: Button Disabled When Empty
1. Check the "✨ Add a Special Occasion Meal" checkbox
2. Leave ingredient input empty
3. Look at the "Get Meal Options" button

### Validation
- [ ] Button is disabled (grayed out)
- [ ] Button cursor shows "not-allowed"
- [ ] Button cannot be clicked

### Test: Button Enabled With Input
1. Type "lobster" in ingredient input
2. Look at the "Get Meal Options" button

### Validation
- [ ] Button is enabled (full color)
- [ ] Button cursor shows pointer
- [ ] Button is clickable

---

## ✅ Test 12: Frontend - API Call (Valid Ingredient)

**Test Type**: API integration test

### Steps
1. Check the "✨ Add a Special Occasion Meal" checkbox
2. Type "lobster" in ingredient input
3. Click "Get Meal Options" button
4. Wait for response

### Validation
- [ ] Button text changes to "Generating Options..."
- [ ] Button becomes disabled
- [ ] Network request is sent (check DevTools Network tab)
- [ ] Request includes Authorization header
- [ ] Response status is 200

### After Response
- [ ] Button text returns to "Get Meal Options"
- [ ] Button becomes enabled again
- [ ] Meal options appear below
- [ ] No error message displayed

---

## ✅ Test 13: Frontend - Meal Options Display

**Test Type**: Response rendering test

### Steps
1. Complete Test 12 (get meal options for "lobster")
2. Observe the options display

### Validation
- [ ] 3-5 meal option buttons appear
- [ ] Each button shows meal title
- [ ] Each button shows meal notes
- [ ] Buttons are clickable
- [ ] Buttons have clear styling
- [ ] All text is readable

### Example Display
```
Select Your Special Occasion Meal
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Lobster Tail Dinner]
Maine lobster tails served...

[Pan-Seared Lobster with Tarragon]
Fresh lobster pan-seared...

[Lobster Thermidor]
Classic French preparation...
```

---

## ✅ Test 14: Frontend - Select Meal Option

**Test Type**: Selection interaction test

### Steps
1. Complete Test 13 (view meal options)
2. Click on the first meal option button

### Validation
- [ ] Button highlights (different border/background color)
- [ ] Checkmark (✓) appears before meal title
- [ ] Selected state is visually distinct
- [ ] Selection is stored in state

### Steps (Different Selection)
1. Click on a different meal option button

### Validation
- [ ] Previous selection is deselected
- [ ] New option is now selected with checkmark
- [ ] Visual highlighting updated
- [ ] Only one option selected at a time

---

## ✅ Test 15: Frontend - Error Handling

**Test Type**: Error display test

### Setup (Simulate Error)
1. Disconnect network or use DevTools to block API
2. Check the "✨ Add a Special Occasion Meal" checkbox
3. Enter "lobster"
4. Click "Get Meal Options"

### Validation
- [ ] Button shows "Generating Options..."
- [ ] Button is disabled
- [ ] After ~5 seconds, error message appears
- [ ] Error message: "Failed to generate options. Please try again."
- [ ] Error displays with warning styling (red background)
- [ ] Button returns to "Get Meal Options" state
- [ ] Button becomes enabled again
- [ ] User can retry

---

## ✅ Test 16: Frontend - Form Submission

**Test Type**: Data payload test

### Steps
1. Fill out complete questionnaire with special occasion:
   - Cuisines: French, Italian
   - People: 4
   - Meals: Dinner
   - Days: Saturday
   - Check Special Occasion checkbox
   - Enter ingredient: "lobster"
   - Get options and select one
2. Submit the form

### Validation (DevTools Network Tab)
- [ ] POST request to meal generation endpoint sent
- [ ] Request payload includes `specialOccasion: true`
- [ ] Request payload includes `specialIngredient: "lobster"`
- [ ] Request payload includes `specialMealChoice` object
- [ ] `specialMealChoice` contains `title` and `notes`
- [ ] All other form fields are present

### Expected Payload
```javascript
{
  cuisines: ['French', 'Italian'],
  people: 4,
  selectedMeals: ['dinner'],
  dietaryPreferences: [],
  leftovers: [],
  specialOccasion: true,
  specialIngredient: 'lobster',
  specialMealChoice: {
    title: 'Lobster Tail Dinner',
    notes: '...'
  }
}
```

---

## ✅ Test 17: Frontend - Form Submission Without Special Occasion

**Test Type**: Data payload test (negative)

### Steps
1. Fill out complete questionnaire WITHOUT special occasion:
   - Do NOT check Special Occasion checkbox
   - Submit the form

### Validation (DevTools Network Tab)
- [ ] Request payload includes `specialOccasion: false`
- [ ] `specialIngredient` is `null`
- [ ] `specialMealChoice` is `null`
- [ ] All other form fields are present

---

## ✅ Test 18: Frontend - Reset State on Uncheck

**Test Type**: State management test

### Steps
1. Check "✨ Add a Special Occasion Meal" checkbox
2. Enter "lobster"
3. Click "Get Meal Options"
4. Wait for options to load
5. Select one meal option
6. Uncheck the "✨ Add a Special Occasion Meal" checkbox

### Validation
- [ ] Ingredient input disappears
- [ ] Meal options disappear
- [ ] Error message (if any) disappears
- [ ] All special occasion state is cleared
- [ ] If checkbox is rechecked, all fields are empty again

---

## ✅ Test 19: Frontend - Multiple Ingredient Tests

**Test Type**: Various ingredient test

### Test 1: Steak
1. Enter "wagyu steak"
2. Click "Get Meal Options"
3. Verify 3-5 unique steak-based options appear

### Test 2: Shrimp
1. Clear and enter "shrimp"
2. Click "Get Meal Options"
3. Verify 3-5 unique shrimp-based options appear

### Test 3: Truffle
1. Clear and enter "black truffle"
2. Click "Get Meal Options"
3. Verify 3-5 unique truffle-based options appear

### Validation
- [ ] Options are contextually appropriate
- [ ] Options change based on ingredient
- [ ] No cached results from previous ingredient
- [ ] All options are unique and descriptive

---

## ✅ Test 20: Integration - End-to-End Flow

**Test Type**: Full feature integration test

### Complete User Journey
1. ✅ Start application
2. ✅ Log in with valid credentials
3. ✅ Navigate to questionnaire
4. ✅ Fill basic details (cuisines, people, meals, days)
5. ✅ Reach special occasion section
6. ✅ Check "Special Occasion" checkbox
7. ✅ Enter premium ingredient (e.g., "lobster")
8. ✅ Click "Get Meal Options"
9. ✅ Observe loading state
10. ✅ Verify options appear
11. ✅ Select preferred meal option
12. ✅ Complete remaining questionnaire sections
13. ✅ Submit form
14. ✅ Verify special occasion data sent to backend
15. ✅ Verify meal plan generates successfully
16. ✅ Check if special occasion meal is included in plan

### Validation
- [ ] All steps complete without errors
- [ ] No console errors (check DevTools)
- [ ] All UI elements responsive
- [ ] Form submission successful
- [ ] Backend processes special occasion data
- [ ] Meal plan includes generated meals

---

## 🐛 Debugging Commands

### Check Backend Endpoint
```bash
# Start backend with logging
node server.js

# In another terminal, test
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ingredient":"lobster"}' \
  http://localhost:5000/api/special-occasion/options
```

### Check Frontend State
```javascript
// In browser DevTools Console
// After clicking "Get Meal Options"
localStorage.getItem('token')  // Check token exists
```

### Network Debugging
1. Open DevTools (F12)
2. Go to Network tab
3. Click "Get Meal Options"
4. Check request:
   - URL: `http://localhost:5000/api/special-occasion/options`
   - Method: POST
   - Headers: `Authorization: Bearer ...`
   - Body: `{"ingredient":"lobster"}`
5. Check response:
   - Status: 200
   - Body: JSON with options array

### Console Debugging
```javascript
// Check for errors
console.log('specialOccasion:', specialOccasion);
console.log('specialIngredient:', specialIngredient);
console.log('specialOptions:', specialOptions);
console.log('specialMealChoice:', specialMealChoice);
```

---

## 📊 Test Results Summary

**Format**: After completing all tests

```
TEST RESULTS - Special Occasion Feature
═══════════════════════════════════════════

Backend Tests (7 total):
✅ Test 1: Valid request with lobster
✅ Test 2: Different ingredients (steak, shrimp, truffle)
✅ Test 3: Missing ingredient (400)
✅ Test 4: Empty ingredient (400)
✅ Test 5: Whitespace ingredient (400)
✅ Test 6: Missing JWT (401)
✅ Test 7: Invalid JWT (401)

Frontend Tests (13 total):
✅ Test 8: Toggle checkbox
✅ Test 9: Show/hide ingredient input
✅ Test 10: Ingredient text input
✅ Test 11: Button disabled/enabled states
✅ Test 12: API call with valid ingredient
✅ Test 13: Meal options display
✅ Test 14: Select meal option
✅ Test 15: Error handling
✅ Test 16: Form submission (with special occasion)
✅ Test 17: Form submission (without special occasion)
✅ Test 18: Reset state on uncheck
✅ Test 19: Multiple ingredients
✅ Test 20: End-to-end integration

OVERALL STATUS: ✅ ALL TESTS PASSED
═══════════════════════════════════════════
```

---

## 📝 Notes

- All tests should be run with a valid JWT token
- Ensure backend is running on `localhost:5000`
- Ensure frontend is running on `localhost:3000`
- Check DevTools for console errors
- OpenAI API must be accessible from backend
- Network requests should complete in <5 seconds

---

**Next Steps After Testing**:
1. ✅ Verify all 20 tests pass
2. 📋 Document any issues found
3. 🔧 Fix any identified bugs
4. 🚀 Prepare for integration with meal plan generation
5. 📤 Commit changes to git

---

**Status**: 🟡 **AWAITING TEST EXECUTION**
