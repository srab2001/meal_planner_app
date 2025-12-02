# User Flows and Screen Map
## AI Meal Planner Application

**Version:** 1.0
**Last Updated:** December 2, 2025

---

## Table of Contents

1. [User Flows](#user-flows)
   - [New User Sign Up](#flow-1-new-user-sign-up)
   - [Returning User Login](#flow-2-returning-user-login)
   - [Create Meal Plan](#flow-3-create-meal-plan)
   - [Edit/Regenerate Meals](#flow-4-editregenerate-meals)
   - [Manage Favorites](#flow-5-manage-favorites)
   - [Add Custom Shopping List Items](#flow-6-add-custom-shopping-list-items)
   - [View History](#flow-7-view-history)
2. [Screen Inventory](#screen-inventory)
3. [Component Map](#component-map)

---

## User Flows

### Flow 1: New User Sign Up

**Goal:** First-time user creates an account and logs in via Google OAuth

```
START → Login Screen → Google OAuth Consent → Application (Store Selection)
```

**Detailed Steps:**

1. **User arrives at application URL**
   - Screen: `Login.js`
   - Route: `/`
   - No authentication cookie present

2. **User clicks "Sign in with Google"**
   - Triggers: `GET /auth/google`
   - Redirects to Google OAuth consent screen
   - User grants permissions (email, profile)

3. **Google redirects back to app**
   - Callback: `GET /auth/google/callback`
   - Creates session with user data
   - Sets session cookie

4. **User lands on Store Selection screen**
   - Screen: `StoreSelector.js` within `App.js`
   - User is now authenticated
   - Ready to select stores

**Success Criteria:**
- User has active session
- Google profile data stored (name, email, picture)
- User can proceed to meal planning

---

### Flow 2: Returning User Login

**Goal:** Existing user logs in with Google

```
START → Login Screen → Google OAuth → Store Selection (if no stores) OR Questionnaire (if stores remembered)
```

**Detailed Steps:**

1. **User arrives at application**
   - Screen: `Login.js`
   - Route: `/`

2. **User clicks "Sign in with Google"**
   - Same OAuth flow as new user
   - May skip consent if previously granted

3. **App loads previous preferences** (if any)
   - Favorites loaded from `user-data/favorites.json`
   - History loaded from `user-data/history.json`
   - Session restored

4. **User proceeds to store selection**
   - Can change stores or keep previous selection
   - Continues to questionnaire

**Success Criteria:**
- User authenticated
- Previous data accessible
- Can generate new meal plan or view history

---

### Flow 3: Create Meal Plan

**Goal:** User generates a personalized weekly meal plan

```
Store Selection → Questionnaire → AI Generation → Meal Plan View → Shopping List
```

**Detailed Steps:**

1. **Select Stores (StoreSelector.js)**
   - Input: Zip code (e.g., "10001")
   - Action: Click "Find Stores"
   - API Call: `POST /api/nearby-stores`
   - Output: List of nearby stores (AI-generated)
   - Selection: Choose primary store (required)
   - Selection: Choose comparison store (optional)
   - Action: Click "Continue to Meal Planning"

2. **Complete Questionnaire (Questionnaire.js)**
   - **Cuisine Selection**
     - Input: Multi-select from 14 cuisines
     - Validation: At least 1 required
   - **Number of People**
     - Input: Number selector (1-12)
     - Default: 2
   - **Leftover Ingredients** (Optional)
     - Input: Dynamic text fields
     - Example: "chicken", "broccoli", "rice"
     - Action: Can add/remove fields
   - **Dietary Restrictions** (Optional)
     - Input: Checkboxes (Diabetic, Dairy-Free, Gluten-Free, Peanut-Free, Vegetarian, Kosher)
     - Multi-select allowed
   - **Meal Types**
     - Input: Breakfast, Lunch, Dinner checkboxes
     - Validation: At least 1 required
   - **Days Selection**
     - Input: Monday-Sunday checkboxes
     - Default: All days selected
     - Validation: At least 1 required
   - Action: Click "Generate My Meal Plan"

3. **AI Generates Meal Plan (Backend Processing)**
   - API Call: `POST /api/generate-meal-plan`
   - Processing: OpenAI GPT-4o-mini creates meal plan
   - Response: JSON with meals, recipes, shopping list, prices
   - Duration: 10-30 seconds

4. **View Meal Plan (MealPlanView.js)**
   - Display: Day-by-day tabs
   - Content: Meal cards for each selected meal type
   - Each card shows:
     - Meal name and image (emoji)
     - Ingredients list
     - Cooking instructions
     - Nutrition facts (calories, protein, carbs, fat)
   - Actions available:
     - "🔄 Regenerate" - Replace specific meal
     - "Add to Favorites" - Save meal for future use
     - "View Favorites" - Browse saved meals

5. **View Shopping List Tab**
   - Display: Categorized ingredient list
   - Price display: Single store OR comparison table
   - Features:
     - Checkboxes to mark purchased items
     - Total cost calculation
     - Savings banner (comparison mode)
     - Print button
     - Add custom items section

**Success Criteria:**
- Meal plan generated matching all preferences
- All dietary restrictions respected
- Shopping list accurate and priced
- User can navigate between days
- Plan auto-saved to history

---

### Flow 4: Edit/Regenerate Meals

**Goal:** User customizes meal plan by regenerating specific meals

```
Meal Plan View → Select Meal → Regenerate OR Replace with Favorite → Updated Plan
```

**Detailed Steps:**

1. **User views meal plan**
   - Screen: `MealPlanView.js`
   - Current meal displayed

2. **User decides to change a meal** (Option A: Regenerate)
   - Action: Click "🔄 Regenerate" on meal card
   - API Call: `POST /api/regenerate-meal`
   - Body: `{ day, mealType, preferences }`
   - Processing: AI generates new meal matching preferences
   - Response: New meal data
   - UI Update: Meal card updates in real-time
   - State: Local meal plan updated

3. **User decides to change a meal** (Option B: Use Favorite)
   - Action: Click "Add to Favorites" dropdown
   - Modal: Shows list of favorite meals by type
   - Selection: Click favorite meal
   - Function: `handleReplaceWithFavorite()`
   - UI Update: Current meal replaced with favorite
   - State: Local meal plan updated

4. **Verify changes**
   - Shopping list automatically recalculates
   - New ingredients added/removed
   - Prices updated
   - Nutrition totals adjusted

**Success Criteria:**
- New meal matches preferences and restrictions
- Shopping list reflects changes
- User can regenerate multiple times
- Changes don't affect other days/meals

---

### Flow 5: Manage Favorites

**Goal:** User saves favorite meals and reuses them in future plans

```
Meal Plan View → Add to Favorites → View Favorites → Replace Meal with Favorite
```

**Detailed Steps:**

1. **Save Meal to Favorites**
   - Screen: `MealPlanView.js`
   - Action: Click "Add to Favorites" dropdown on meal card
   - Selection: Choose meal type (breakfast/lunch/dinner)
   - API Call: `POST /api/favorites/add`
   - Body: `{ mealType, meal, userEmail }`
   - Storage: Saved to `user-data/favorites.json`
   - Feedback: "✓ Added to favorites!"

2. **View All Favorites**
   - Action: Click "View Favorites" button
   - API Call: `GET /api/favorites`
   - Modal: Opens with list of saved meals
   - Display: Grouped by meal type
   - Each favorite shows: Name, ingredients preview

3. **Use Favorite in New Plan**
   - Context: Creating new meal plan OR regenerating meal
   - Action: Click favorite meal in modal
   - Function: `handleReplaceWithFavorite(day, mealType, favorite)`
   - Result: Favorite meal inserted into current plan
   - Shopping list updates automatically

4. **Remove from Favorites**
   - Action: Click "Remove" button on favorite
   - API Call: `POST /api/favorites/remove`
   - Body: `{ mealType, mealName, userEmail }`
   - Storage: Deleted from `user-data/favorites.json`
   - UI Update: Favorite removed from list

**Success Criteria:**
- Favorites persist across sessions
- Can save unlimited favorites
- Favorites organized by meal type
- Easy to browse and reuse

---

### Flow 6: Add Custom Shopping List Items

**Goal:** User adds items to shopping list that aren't in meal plan

```
Shopping List View → Add Custom Items → Get AI Price Estimates → Items Added to List
```

**Detailed Steps:**

1. **Navigate to Shopping List Tab**
   - Screen: `ShoppingList.js`
   - Section: "➕ Add More Items"

2. **Enter Custom Items**
   - Input: Text field for item name
   - Example: "milk", "bananas", "coffee"
   - Action: Click "+ Add Another Item" for more fields
   - Can add multiple items at once
   - Can remove fields with "✕" button

3. **Submit for Pricing**
   - Action: Click "🛒 Add to Shopping List"
   - Validation: At least one non-empty item required
   - API Call: `POST /api/custom-item-prices`
   - Body: `{ items: ['milk', 'bananas'], primaryStore, comparisonStore }`
   - Processing: AI estimates prices at selected stores
   - Duration: 5-10 seconds

4. **View Priced Items**
   - Display: Custom items appear in dedicated section
   - Format: Same as meal plan items
   - Single store mode: Shows quantity and estimated price
   - Comparison mode: Shows prices from both stores with cheaper highlighted
   - Features: Checkboxes, included in total cost

**Success Criteria:**
- Custom items priced accurately
- Integrated seamlessly with meal plan items
- Comparison mode works for custom items
- Can add items multiple times in one session

---

### Flow 7: View History

**Goal:** User browses and reuses previous meal plans

```
Meal Plan View → History Button → History List → Select Past Plan → View/Reuse Plan
```

**Detailed Steps:**

1. **Access History**
   - Screen: `MealPlanView.js` (implied, not shown in code)
   - Action: Click "History" or similar button
   - API Call: `GET /api/history`
   - Response: Array of past meal plans with timestamps

2. **Browse Past Plans**
   - Display: List of previous meal plans
   - Each entry shows:
     - Date generated
     - Number of days
     - Stores used
     - Preview of meals

3. **Select Past Plan**
   - Action: Click on history entry
   - Result: Full meal plan loaded
   - Can view all meals and shopping list
   - Can regenerate specific meals
   - Can save meals to favorites

4. **Delete History Entry** (Optional)
   - Action: Click delete button
   - API Call: `POST /api/history/remove`
   - Storage: Removed from `user-data/history.json`

**Success Criteria:**
- All past plans accessible
- Can reuse or modify old plans
- History organized chronologically
- Easy to delete unwanted entries

---

## Screen Inventory

### Screen 1: Login Page

**Component:** `Login.js`
**Route:** `/` (when not authenticated)
**Purpose:** User authentication via Google OAuth

**Inputs:**
- None (handled by Google)

**Outputs:**
- Authenticated user session
- Redirect to StoreSelector

**UI Elements:**
- "Sign in with Google" button
- App branding/logo
- Welcome message

**State:**
- No local state (redirects to OAuth)

**APIs Called:**
- `GET /auth/google` (OAuth initiation)

---

### Screen 2: Store Selector

**Component:** `StoreSelector.js`
**Route:** Part of `App.js` flow
**Purpose:** Select grocery stores for price comparison

**Inputs:**
- Zip code (text input)
- Primary store selection (dropdown)
- Comparison store selection (dropdown, optional)

**Outputs:**
- Selected stores stored in state
- Proceeds to Questionnaire

**UI Elements:**
- Zip code input field
- "Find Stores" button
- Store dropdown menus
- "Continue to Meal Planning" button

**State:**
```javascript
{
  zipCode: string,
  availableStores: array,
  primaryStore: object,
  comparisonStore: object | null
}
```

**APIs Called:**
- `POST /api/nearby-stores`

---

### Screen 3: Questionnaire

**Component:** `Questionnaire.js`
**Route:** Part of `App.js` flow
**Purpose:** Collect user preferences for meal plan generation

**Inputs:**
- Cuisines (multi-select)
- Number of people (1-12)
- Leftover ingredients (dynamic text fields)
- Dietary restrictions (checkboxes)
- Meal types (checkboxes)
- Days of week (checkboxes)

**Outputs:**
- Preferences object passed to meal generation API
- Triggers meal plan generation

**UI Elements:**
- Cuisine chips (multi-select buttons)
- Number picker (+/- buttons)
- Dynamic ingredient input fields
- Dietary restriction checkboxes with icons
- Meal type checkboxes
- Day selection checkboxes
- "Generate My Meal Plan" button
- Error messages for validation

**State:**
```javascript
{
  cuisines: array,
  numberOfPeople: number,
  meals: { breakfast: bool, lunch: bool, dinner: bool },
  selectedDays: { Monday: bool, ..., Sunday: bool },
  dietaryPreferences: { diabetic: bool, dairyFree: bool, ... },
  leftovers: array,
  errors: object
}
```

**APIs Called:**
- None directly (submits to parent component)

**Validation Rules:**
- At least 1 cuisine required
- At least 1 meal type required
- At least 1 day required

---

### Screen 4: Meal Plan View

**Component:** `MealPlanView.js`
**Route:** Part of `App.js` flow
**Purpose:** Display generated meal plan with editing capabilities

**Inputs:**
- Generated meal plan (from parent)
- User preferences (for regeneration)

**Outputs:**
- Updated meal plan (after regeneration)
- Favorites additions
- Shopping list data

**UI Elements:**
- Day navigation tabs
- Meal cards (one per meal type)
  - Meal name and emoji
  - Ingredients list
  - Cooking instructions (expandable)
  - Nutrition facts
  - "🔄 Regenerate" button
  - "Add to Favorites" dropdown
- "View Favorites" button
- "Feedback" link
- Tab navigation (Meal Plan | Shopping List)

**State:**
```javascript
{
  currentDay: string,
  localMealPlan: object,
  favorites: array,
  expandedInstructions: object
}
```

**APIs Called:**
- `POST /api/regenerate-meal`
- `GET /api/favorites`
- `POST /api/favorites/add`
- `POST /api/history/save`

**Key Functions:**
- `handleRegenerateMeal(day, mealType)` - Replace specific meal
- `handleAddToFavorites(day, mealType)` - Save meal
- `handleReplaceWithFavorite(day, mealType, favorite)` - Use saved meal
- `toggleInstructions(day, mealType)` - Show/hide recipe steps

---

### Screen 5: Shopping List

**Component:** `ShoppingList.js`
**Route:** Tab within Meal Plan View
**Purpose:** Display categorized shopping list with prices

**Inputs:**
- Shopping list data (from meal plan)
- Total cost
- Price comparison data
- Selected stores

**Outputs:**
- Checked items state (for tracking purchases)
- Custom items added to list
- Print output

**UI Elements:**
- Store name(s) header
- Print button
- Custom items section:
  - Dynamic input fields
  - "+ Add Another Item" button
  - "🛒 Add to Shopping List" button
- Shopping list content:
  - Category headers (Produce, Meat, Dairy, etc.)
  - Item checkboxes
  - Item names and quantities
  - Prices (single or comparison table)
- Total cost display
- Savings banner (comparison mode)

**State:**
```javascript
{
  checkedItems: object,
  customItems: array,
  addingCustomItems: boolean,
  customItemsWithPrices: array
}
```

**APIs Called:**
- `POST /api/custom-item-prices`

**Display Modes:**
- **Single Store:** List view with estimated prices
- **Comparison Mode:** Table view with two price columns, cheaper highlighted

**Key Functions:**
- `handleCheck(category, index)` - Toggle checkbox
- `handlePrint()` - Browser print
- `handleAddToShoppingList()` - Get custom item prices
- `getCheaperStore(primaryPrice, comparisonPrice)` - Price comparison logic

---

## Component Map

### Component Hierarchy

```
App.js (Root)
│
├─ Login.js (unauthenticated)
│
├─ StoreSelector.js (authenticated, no stores selected)
│
├─ Questionnaire.js (stores selected, generating plan)
│
└─ MealPlanView.js (plan generated)
   ├─ Tab: Meal Plan
   │  ├─ Day Tabs (Monday - Sunday)
   │  └─ Meal Cards
   │     ├─ Ingredients
   │     ├─ Instructions
   │     ├─ Nutrition
   │     └─ Actions (Regenerate, Favorites)
   │
   └─ Tab: Shopping List (ShoppingList.js)
      ├─ Custom Items Section
      ├─ Shopping List Content
      │  └─ Category Sections
      │     └─ Item Rows/Table
      └─ Total/Savings Summary
```

### Shared Components/Utilities

**None currently** - All components are self-contained

**Potential Shared Components (Future Refactoring):**
- `Button.js` - Reusable button styles
- `Checkbox.js` - Checkbox with label
- `Modal.js` - Generic modal container
- `LoadingSpinner.js` - Loading state indicator
- `ErrorMessage.js` - Error display component

---

## Navigation Flow Chart

```
┌─────────────┐
│   Login     │
│  (Google)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Store    │
│  Selector   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Questionnaire│
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│  Meal Plan  │────▶│ Shopping List│
│    View     │◀────│     Tab      │
└──────┬──────┘     └──────────────┘
       │
       ├─────▶ Regenerate Meal ────┐
       │                            │
       ├─────▶ Add to Favorites ────┤
       │                            │
       ├─────▶ View History ────────┤
       │                            │
       └◀──────────────────────────┘
```

---

## URL Routes

### Frontend (React Router - Not Explicitly Defined)

The app uses conditional rendering rather than routes:

- `/` - Shows Login if not authenticated, Store Selector if authenticated
- Internal state determines component display

**Recommended URL Structure (Future Enhancement):**
```
/                          - Login page
/stores                    - Store selection
/questionnaire             - Preferences form
/meal-plan                 - Current meal plan view
/meal-plan/:planId         - Specific historical plan
/favorites                 - Favorites library
/history                   - Past meal plans
```

### Backend API Routes

See [REQUIREMENTS_AND_FEATURES.md](REQUIREMENTS_AND_FEATURES.md#api-reference) for complete API documentation.

---

## Error States & Edge Cases

### Login Flow
- **No internet:** Show error message, retry button
- **OAuth denied:** Redirect back to login with message
- **Session expired:** Clear state, redirect to login

### Store Selection
- **Invalid zip code:** Show validation error
- **No stores found:** Suggest nearby zip codes
- **API timeout:** Show retry button

### Questionnaire
- **Validation errors:** Inline error messages, scroll to first error
- **No selections:** Disable submit button

### Meal Generation
- **API timeout:** Show retry button after 60s
- **OpenAI error:** Display friendly error message
- **Invalid response:** Fallback meal plan or error

### Shopping List
- **Custom items API failure:** Show error, keep items in input fields
- **Price unavailable:** Show "-" instead of price

---

## Mobile Responsiveness

**Current State:** Not explicitly responsive in code

**Recommended Breakpoints:**
- **Mobile:** < 768px - Stack components vertically, full-width inputs
- **Tablet:** 768px - 1024px - Two-column layout for meal cards
- **Desktop:** > 1024px - Full layout as designed

---

**Document Version:** 1.0
**Prepared By:** AI Documentation System
**Date:** December 2, 2025
