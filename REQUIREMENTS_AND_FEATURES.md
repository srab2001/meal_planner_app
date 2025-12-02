# Requirements and Feature List
## AI Meal Planner Application

**Version:** 1.0
**Last Updated:** December 2, 2025
**Status Legend:** 🟢 Live | 🟡 In Progress | 🔵 Planned

---

## Core Features

### 1. Authentication & User Management

| Feature | Status | Linked Items | Notes |
|---------|--------|--------------|-------|
| Google OAuth Login | 🟢 Live | Screen: `/` (Login)<br>API: `GET /auth/google`<br>API: `GET /auth/google/callback`<br>Module: `passport-google-oauth20` | Users authenticate via Google OAuth 2.0 |
| Session Management | 🟢 Live | Middleware: `requireAuth`<br>API: `GET /auth/logout`<br>Module: `express-session` | In-memory session storage (see security audit) |
| User Profile Data | 🟢 Live | API: `GET /auth/user`<br>Data: Google profile (name, email, picture) | Stored in session, email hashed with MD5 |

### 2. Store Selection & Price Comparison

| Feature | Status | Linked Items | Notes |
|---------|--------|--------------|-------|
| Zip Code Entry | 🟢 Live | Screen: `/` (after login)<br>Component: `StoreSelector.js` | Users enter zip code to find nearby stores |
| Store Search by Zip | 🟢 Live | API: `POST /api/nearby-stores`<br>Module: OpenAI GPT-4o-mini | AI-powered store suggestions based on zip code |
| Primary Store Selection | 🟢 Live | Component: `StoreSelector.js`<br>State: `selectedStores.primaryStore` | Required for meal planning |
| Comparison Store Selection | 🟢 Live | Component: `StoreSelector.js`<br>State: `selectedStores.comparisonStore` | Optional second store for price comparison |
| Price Comparison View | 🟢 Live | Component: `ShoppingList.js`<br>Table: `comparison-table` | Side-by-side pricing with cheaper items highlighted |

### 3. Meal Planning Questionnaire

| Feature | Status | Linked Items | Notes |
|---------|--------|--------------|-------|
| Cuisine Preference Selection | 🟢 Live | Screen: `Questionnaire.js`<br>Constant: `CUISINE_OPTIONS` | 14 cuisines: Italian, Mexican, Chinese, Japanese, Indian, Thai, Mediterranean, American, French, Korean, Vietnamese, Greek, Spanish, Middle Eastern |
| Number of People Selector | 🟢 Live | Screen: `Questionnaire.js` (lines 164-180)<br>State: `numberOfPeople` | Range: 1-12 people |
| Leftover Ingredients Input | 🟢 Live | Screen: `Questionnaire.js` (lines 183-210)<br>State: `leftovers[]`<br>API: Included in meal generation | Dynamic input fields for ingredients to use up |
| Dietary Restrictions | 🟢 Live | Screen: `Questionnaire.js` (lines 213-276)<br>State: `dietaryPreferences` | Options: Diabetic, Dairy-Free, Gluten-Free, Peanut-Free, Vegetarian, Kosher |
| Meal Type Selection | 🟢 Live | Screen: `Questionnaire.js` (lines 278-313)<br>State: `meals` | Breakfast, Lunch, Dinner (multi-select) |
| Day Selection | 🟢 Live | Screen: `Questionnaire.js` (lines 315-332)<br>Constant: `DAYS_OF_WEEK`<br>State: `selectedDays` | Monday-Sunday (multi-select, all selected by default) |
| Form Validation | 🟢 Live | Function: `validate()` (lines 94-112) | Ensures at least one cuisine, meal type, and day selected |

### 4. AI Meal Plan Generation

| Feature | Status | Linked Items | Notes |
|---------|--------|--------------|-------|
| OpenAI Integration | 🟢 Live | API: `POST /api/generate-meal-plan`<br>Module: `openai` v4.104.0<br>Model: `gpt-4o-mini` | Generates personalized meal plans |
| Dynamic Prompt Building | 🟢 Live | Server: `server.js` (lines 352-470)<br>Variables: `leftoverRequirement`, `cuisineRequirement`, etc. | Context-aware prompts based on preferences |
| Leftover Incorporation | 🟢 Live | Server: `server.js` (lines 356-366)<br>Instruction: Use in 2-3 meals | Reduces food waste by using existing ingredients |
| Dietary Restriction Enforcement | 🟢 Live | Function: `formatDietaryPreference()`<br>Mapping includes detailed restrictions | Critical compliance with all dietary needs |
| Multi-Day Meal Plans | 🟢 Live | Based on `selectedDays` array<br>Dynamic day filtering | Generates only for selected days |
| Recipe Instructions | 🟢 Live | JSON response includes detailed steps | Step-by-step cooking instructions per meal |
| Nutritional Information | 🟢 Live | Included in meal plan JSON | Calories, protein, carbs, fats per meal |

### 5. Meal Plan Display & Interaction

| Feature | Status | Linked Items | Notes |
|---------|--------|--------------|-------|
| Day-by-Day View | 🟢 Live | Component: `MealPlanView.js`<br>State: `currentDay` | Tab navigation between days |
| Meal Cards with Details | 🟢 Live | Component: `MealPlanView.js` (meal cards) | Name, ingredients, instructions, nutrition |
| Add to Favorites | 🟢 Live | API: `POST /api/favorites/add`<br>Button: "Add to Favorites" dropdown | Save individual meals by type |
| Remove from Favorites | 🟢 Live | API: `POST /api/favorites/remove`<br>Data: `user-data/favorites.json` | Delete saved meals |
| Regenerate Specific Meal | 🟢 Live | API: `POST /api/regenerate-meal`<br>Button: "🔄 Regenerate" | Replace individual meal with new suggestion |
| View All Favorites | 🟢 Live | API: `GET /api/favorites`<br>Modal: Favorites list | Browse and select from saved meals |
| Replace Meal from Favorites | 🟢 Live | Function: `handleReplaceWithFavorite()`<br>Updates current meal plan | Swap current meal with favorite |

### 6. Shopping List Generation

| Feature | Status | Linked Items | Notes |
|---------|--------|--------------|-------|
| Automatic Shopping List | 🟢 Live | Component: `ShoppingList.js`<br>Generated from meal plan | Categorized by food type |
| Price Estimation (Single Store) | 🟢 Live | API: `POST /api/generate-meal-plan`<br>GPT estimates prices | Based on primary store |
| Price Comparison (Dual Store) | 🟢 Live | Shopping list comparison table<br>Highlights cheaper prices | Visual price difference display |
| Savings Calculation | 🟢 Live | Component: `ShoppingList.js` (lines 327-344)<br>Display: `price-comparison-summary` | Shows total savings between stores |
| Item Checkboxes | 🟢 Live | State: `checkedItems`<br>Visual strikethrough on checked | Track purchased items |
| Print Shopping List | 🟢 Live | Function: `handlePrint()`<br>Button: "🖨️ Print List" | Browser print dialog for physical list |
| Add Custom Items | 🟢 Live | API: `POST /api/custom-item-prices`<br>Component: Dynamic input fields (lines 129-165) | Add items not in meal plan |
| Custom Item Pricing | 🟢 Live | GPT-4o-mini estimates custom item prices<br>Supports both single and comparison mode | AI-powered price lookup |

### 7. History & Tracking

| Feature | Status | Linked Items | Notes |
|---------|--------|--------------|-------|
| Meal Plan History | 🟢 Live | API: `POST /api/history/save`<br>Data: `user-data/history.json` | Auto-saves each generated plan |
| View Past Plans | 🟢 Live | API: `GET /api/history`<br>Component: History view | Browse previous meal plans |
| Delete History Items | 🟢 Live | API: `POST /api/history/remove`<br>File-based storage | Remove individual history entries |

### 8. Payment & Discount System

| Feature | Status | Linked Items | Notes |
|---------|--------|--------------|-------|
| Stripe Integration | 🟢 Live | Module: `stripe` v17.4.0<br>Environment: `STRIPE_SECRET_KEY` | Payment processing |
| Discount Code Application | 🟢 Live | Endpoint exists in environment config | Promotional code support |
| Discount Usage Tracking | 🟢 Live | API: `GET /api/discount-usage-stats`<br>Data: `discount-code-usage.json` | Admin analytics (security concern - see audit) |

---

## Technical Infrastructure

### Frontend

| Component | Technology | Status | Location |
|-----------|-----------|--------|----------|
| React App | React 18+ | 🟢 Live | `/client/src/` |
| Component Library | Custom components | 🟢 Live | `/client/src/components/` |
| Styling | CSS Modules | 🟢 Live | `/client/src/components/*.css` |
| Build System | Create React App | 🟢 Live | `/client/` |
| Deployment | Vercel | 🟢 Live | `vercel.app` domain |

### Backend

| Component | Technology | Status | Location |
|-----------|-----------|--------|----------|
| Server Framework | Express.js | 🟢 Live | `/server.js` |
| Authentication | Passport.js + Google OAuth | 🟢 Live | Middleware in `server.js` |
| AI Model | OpenAI GPT-4o-mini | 🟢 Live | API integration |
| Session Store | In-Memory (express-session) | 🟢 Live | ⚠️ Security concern |
| Data Storage | File-based JSON | 🟢 Live | ⚠️ Scalability concern |
| Deployment | Render.com | 🟢 Live | Backend hosting |

---

## Known Issues & Technical Debt

See `SECURITY_SCALABILITY_AUDIT.csv` and `IMPLEMENTATION_ROADMAP.csv` for detailed analysis.

### Critical Issues

1. **CORS Misconfiguration** - `origin: true` accepts all domains
2. **No Rate Limiting** - Vulnerable to API abuse
3. **File-Based Storage** - Won't scale beyond single server
4. **In-Memory Sessions** - Lost on restart
5. **No Input Validation** - Security vulnerability

### Planned Improvements

1. PostgreSQL database migration (Week 2-3)
2. Redis session store (Week 3)
3. Rate limiting middleware (Week 1)
4. Input validation with express-validator (Week 1)
5. Security headers with helmet (Week 1)

---

## API Reference

### Authentication Endpoints

```
GET  /auth/google                    - Initiate Google OAuth flow
GET  /auth/google/callback           - OAuth callback handler
GET  /auth/logout                    - End user session
GET  /auth/user                      - Get current user info
```

### Store & Meal Planning Endpoints

```
POST /api/nearby-stores              - Find stores by zip code
POST /api/generate-meal-plan         - Generate AI meal plan
POST /api/regenerate-meal            - Replace single meal
POST /api/custom-item-prices         - Get prices for custom items
```

### User Data Endpoints

```
GET  /api/favorites                  - Retrieve user's favorite meals
POST /api/favorites/add              - Add meal to favorites
POST /api/favorites/remove           - Remove meal from favorites
GET  /api/history                    - Get meal plan history
POST /api/history/save               - Save meal plan to history
POST /api/history/remove             - Delete history entry
```

### Admin & Analytics Endpoints

```
GET  /api/discount-usage-stats       - View discount code analytics (⚠️ No auth check)
```

---

## Environment Variables

See `.env.example` for complete reference.

### Required Variables

```bash
GOOGLE_CLIENT_ID                     # Google OAuth credentials
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
FRONTEND_BASE                        # Frontend URL for CORS
OPENAI_API_KEY                       # OpenAI API access
SESSION_SECRET                       # Session encryption key
STRIPE_SECRET_KEY                    # Payment processing
STRIPE_PUBLISHABLE_KEY
```

---

## File Structure

```
meal_planner_app/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js             # Google OAuth login screen
│   │   │   ├── StoreSelector.js     # Zip code & store selection
│   │   │   ├── Questionnaire.js     # Meal preferences form
│   │   │   ├── MealPlanView.js      # Display generated meal plans
│   │   │   └── ShoppingList.js      # Shopping list with prices
│   │   └── App.js                   # Main application component
│   └── build/                       # Production build (deployed)
├── server.js                        # Express backend API
├── user-data/                       # JSON file storage (⚠️ migrate to DB)
│   ├── favorites.json
│   ├── history.json
│   └── discount-code-usage.json
├── .env                             # Environment secrets
└── package.json                     # Node dependencies
```

---

**Document Version:** 1.0
**Prepared By:** AI Documentation System
**Date:** December 2, 2025
