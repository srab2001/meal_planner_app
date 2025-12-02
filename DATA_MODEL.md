# Data Model Documentation
## AI Meal Planner Application

**Version:** 1.0
**Last Updated:** December 2, 2025
**Storage Type:** File-based JSON (⚠️ Migration to PostgreSQL recommended)

---

## Table of Contents

1. [Overview](#overview)
2. [User Data Model](#user-data-model)
3. [Session Data Model](#session-data-model)
4. [Favorites Data Model](#favorites-data-model)
5. [History Data Model](#history-data-model)
6. [Discount Tracking Data Model](#discount-tracking-data-model)
7. [Meal Plan Data Model](#meal-plan-data-model)
8. [Shopping List Data Model](#shopping-list-data-model)
9. [API Request/Response Models](#api-requestresponse-models)
10. [Database Migration Plan](#database-migration-plan)

---

## Overview

### Current Storage Architecture

**Type:** File-based JSON storage
**Location:** `/user-data/` directory
**Persistence:** Local filesystem on server

**Files:**
- `user-data/favorites.json` - User favorite meals
- `user-data/history.json` - Meal plan history
- `discount-code-usage.json` - Discount code tracking

**⚠️ Critical Limitations:**
- Not scalable beyond single server
- No ACID guarantees
- Race conditions possible with concurrent writes
- No backup/restore mechanism
- Blocks event loop with synchronous file I/O

**Recommended Migration:** PostgreSQL (see [Implementation Roadmap](IMPLEMENTATION_ROADMAP.csv))

---

## User Data Model

### User Object (From Google OAuth)

**Source:** Google OAuth 2.0 Profile
**Storage:** Session (in-memory)
**Lifetime:** Until logout or session expiration

```typescript
interface User {
  googleId: string;           // Google unique identifier
  displayName: string;        // Full name from Google profile
  email: string;              // Primary email address
  picture: string;            // Profile picture URL
  hashedEmail?: string;       // MD5 hash for file lookups (⚠️ weak hashing)
}
```

**Example:**
```json
{
  "googleId": "108234567890123456789",
  "displayName": "John Doe",
  "email": "john.doe@gmail.com",
  "picture": "https://lh3.googleusercontent.com/a/...",
  "hashedEmail": "5d41402abc4b2a76b9719d911017c592"
}
```

**Privacy Concerns:**
- MD5 hashing is reversible for emails
- Email addresses stored in plain text in JSON files
- No encryption at rest

**Recommended Changes:**
- Use HMAC-SHA256 with secret salt for email hashing
- Store UUIDs instead of hashed emails
- Encrypt PII in database

---

## Session Data Model

### Session Object

**Storage:** In-memory (express-session)
**Lifetime:** 24 hours (default)
**Persistence:** Lost on server restart

```typescript
interface Session {
  cookie: {
    originalMaxAge: number;   // Session duration in milliseconds
    expires: Date;            // Expiration timestamp
    httpOnly: boolean;        // Cannot be accessed via JavaScript
    secure: boolean;          // HTTPS only (production)
    path: string;             // Cookie path (usually "/")
  };
  passport: {
    user: string;             // Serialized user ID (Google ID)
  };
}
```

**Example:**
```json
{
  "cookie": {
    "originalMaxAge": 86400000,
    "expires": "2025-12-03T12:00:00.000Z",
    "httpOnly": true,
    "secure": true,
    "path": "/"
  },
  "passport": {
    "user": "108234567890123456789"
  }
}
```

**Current Issues:**
- Sessions lost on server restart (poor UX)
- Doesn't scale across multiple servers
- Memory leak risk with many concurrent users

**Recommended Migration:** Redis session store (see [IMPLEMENTATION_ROADMAP.csv](IMPLEMENTATION_ROADMAP.csv))

---

## Favorites Data Model

### Favorites File Structure

**File:** `user-data/favorites.json`
**Format:** JSON object with email hashes as keys
**Access Pattern:** Read on page load, write on add/remove

```typescript
interface FavoritesDatabase {
  [hashedEmail: string]: {
    [mealType: string]: Meal[];
  };
}

interface Meal {
  name: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
  };
  prepTime?: string;
  cookTime?: string;
}
```

**Example:**
```json
{
  "5d41402abc4b2a76b9719d911017c592": {
    "breakfast": [
      {
        "name": "Avocado Toast with Poached Eggs",
        "ingredients": [
          "2 slices whole grain bread",
          "1 ripe avocado",
          "2 eggs",
          "Salt and pepper to taste",
          "Red pepper flakes (optional)"
        ],
        "instructions": [
          "Toast the bread until golden brown",
          "Mash avocado and spread on toast",
          "Poach eggs in simmering water for 3-4 minutes",
          "Place poached eggs on avocado toast",
          "Season with salt, pepper, and red pepper flakes"
        ],
        "nutrition": {
          "calories": 350,
          "protein": "15g",
          "carbs": "28g",
          "fat": "20g"
        },
        "prepTime": "5 minutes",
        "cookTime": "5 minutes"
      }
    ],
    "lunch": [],
    "dinner": [
      {
        "name": "Grilled Chicken with Quinoa",
        "ingredients": [
          "6 oz chicken breast",
          "1 cup quinoa",
          "2 cups chicken broth",
          "Mixed vegetables (broccoli, carrots)"
        ],
        "instructions": [
          "Season chicken breast with salt and pepper",
          "Grill chicken for 6-7 minutes per side",
          "Cook quinoa in chicken broth for 15 minutes",
          "Steam vegetables until tender",
          "Serve chicken over quinoa with vegetables"
        ],
        "nutrition": {
          "calories": 450,
          "protein": "40g",
          "carbs": "45g",
          "fat": "8g"
        }
      }
    ]
  },
  "098f6bcd4621d373cade4e832627b4f6": {
    "breakfast": [],
    "lunch": [],
    "dinner": []
  }
}
```

**Key Structure:**
- Top level: User email hash
- Second level: Meal type (`breakfast`, `lunch`, `dinner`)
- Third level: Array of meal objects

**File Operations:**
- **Read:** `fs.readFileSync()` - Blocking operation (⚠️)
- **Write:** `fs.writeFileSync()` - Blocking operation (⚠️)
- **Concurrency:** No locking mechanism (race condition risk)

**API Endpoints:**
- `GET /api/favorites` - Retrieve user favorites
- `POST /api/favorites/add` - Add meal to favorites
- `POST /api/favorites/remove` - Remove meal from favorites

---

## History Data Model

### History File Structure

**File:** `user-data/history.json`
**Format:** JSON object with email hashes as keys
**Access Pattern:** Read on page load, write after plan generation

```typescript
interface HistoryDatabase {
  [hashedEmail: string]: HistoryEntry[];
}

interface HistoryEntry {
  id: string;                      // Unique identifier (timestamp)
  timestamp: string;               // ISO 8601 date string
  preferences: UserPreferences;    // Original questionnaire data
  mealPlan: MealPlan;             // Full meal plan object
  stores: {
    primaryStore: Store;
    comparisonStore?: Store;
  };
}

interface UserPreferences {
  cuisines: string[];
  people: number;
  selectedMeals: string[];
  selectedDays: string[];
  dietaryPreferences: string[];
  leftovers?: string[];
}
```

**Example:**
```json
{
  "5d41402abc4b2a76b9719d911017c592": [
    {
      "id": "1733155200000",
      "timestamp": "2025-12-02T12:00:00.000Z",
      "preferences": {
        "cuisines": ["Italian", "Mediterranean"],
        "people": 4,
        "selectedMeals": ["dinner"],
        "selectedDays": ["Monday", "Tuesday", "Wednesday"],
        "dietaryPreferences": ["vegetarian"],
        "leftovers": ["mushrooms", "spinach"]
      },
      "mealPlan": {
        "Monday": {
          "dinner": {
            "name": "Mushroom Risotto with Spinach",
            "ingredients": ["..."],
            "instructions": ["..."],
            "nutrition": {}
          }
        },
        "Tuesday": {
          "dinner": {}
        },
        "Wednesday": {
          "dinner": {}
        }
      },
      "stores": {
        "primaryStore": {
          "name": "Whole Foods",
          "address": "123 Main St, New York, NY 10001"
        }
      }
    },
    {
      "id": "1732982400000",
      "timestamp": "2025-11-30T08:00:00.000Z",
      "preferences": {},
      "mealPlan": {},
      "stores": {}
    }
  ]
}
```

**Sorting:** Entries stored in reverse chronological order (newest first)

**API Endpoints:**
- `GET /api/history` - Retrieve user history
- `POST /api/history/save` - Save new meal plan
- `POST /api/history/remove` - Delete history entry

**Auto-Save Behavior:**
- Every generated meal plan automatically saved
- Triggered on successful meal plan generation
- No user action required

---

## Discount Tracking Data Model

### Discount File Structure

**File:** `discount-code-usage.json`
**Format:** JSON object with discount codes as keys
**Access Pattern:** Write on code use, read for analytics

```typescript
interface DiscountDatabase {
  [discountCode: string]: DiscountUsage[];
}

interface DiscountUsage {
  email: string;                // User email (⚠️ PII stored in plain text)
  timestamp: string;            // ISO 8601 date string
  amountSaved?: number;         // Discount amount in dollars
}
```

**Example:**
```json
{
  "WELCOME20": [
    {
      "email": "john.doe@gmail.com",
      "timestamp": "2025-12-02T10:30:00.000Z",
      "amountSaved": 5.00
    },
    {
      "email": "jane.smith@gmail.com",
      "timestamp": "2025-12-01T14:22:00.000Z",
      "amountSaved": 5.00
    }
  ],
  "HOLIDAY50": [
    {
      "email": "john.doe@gmail.com",
      "timestamp": "2025-11-25T09:15:00.000Z",
      "amountSaved": 12.50
    }
  ]
}
```

**⚠️ Security Concerns:**
- Email addresses stored in plain text (GDPR/privacy violation)
- No access control on `/api/discount-usage-stats` endpoint
- Anyone authenticated can view all discount usage data

**API Endpoints:**
- `GET /api/discount-usage-stats` - View all discount usage (⚠️ No admin check)

**Recommended Changes:**
- Hash or encrypt email addresses
- Add admin role check to endpoint
- Move to database with proper access controls

---

## Meal Plan Data Model

### Meal Plan Object

**Source:** OpenAI GPT-4o-mini generation
**Format:** JSON object
**Structure:** Days → Meal Types → Meal Objects

```typescript
interface MealPlan {
  [day: string]: {
    [mealType: string]: Meal;
  };
}

interface Meal {
  name: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
  };
  prepTime?: string;
  cookTime?: string;
  cuisine?: string;
}
```

**Example:**
```json
{
  "Monday": {
    "breakfast": {
      "name": "Greek Yogurt Parfait with Berries",
      "ingredients": [
        "1 cup Greek yogurt",
        "1/2 cup mixed berries",
        "2 tbsp granola",
        "1 tbsp honey"
      ],
      "instructions": [
        "Layer Greek yogurt in a bowl",
        "Top with mixed berries",
        "Sprinkle granola on top",
        "Drizzle with honey"
      ],
      "nutrition": {
        "calories": 280,
        "protein": "18g",
        "carbs": "35g",
        "fat": "6g"
      },
      "prepTime": "5 minutes",
      "cookTime": "0 minutes",
      "cuisine": "Mediterranean"
    },
    "dinner": {
      "name": "Baked Salmon with Roasted Vegetables",
      "ingredients": [
        "6 oz salmon fillet",
        "1 cup broccoli florets",
        "1 cup cherry tomatoes",
        "2 tbsp olive oil",
        "Lemon, salt, pepper"
      ],
      "instructions": [
        "Preheat oven to 400°F",
        "Place salmon on baking sheet",
        "Arrange vegetables around salmon",
        "Drizzle with olive oil, season with salt and pepper",
        "Bake for 15-18 minutes",
        "Serve with lemon wedges"
      ],
      "nutrition": {
        "calories": 420,
        "protein": "35g",
        "carbs": "18g",
        "fat": "24g"
      },
      "prepTime": "10 minutes",
      "cookTime": "18 minutes"
    }
  },
  "Tuesday": {
    "breakfast": {},
    "dinner": {}
  }
}
```

**Dynamic Properties:**
- Days: Based on `selectedDays` from questionnaire
- Meal types: Based on `selectedMeals` (breakfast/lunch/dinner)
- Only requested combinations included

**Validation:**
- All dietary restrictions enforced by AI
- Leftovers incorporated when specified
- Cuisine preferences followed

---

## Shopping List Data Model

### Shopping List Object

**Source:** Generated with meal plan
**Format:** JSON object categorized by food type
**Structure:** Categories → Items with quantities and prices

```typescript
interface ShoppingList {
  [category: string]: ShoppingItem[];
}

interface ShoppingItem {
  item: string;
  quantity: string;
  estimatedPrice?: string;           // Single store mode
  primaryStorePrice?: string;        // Comparison mode
  comparisonStorePrice?: string;     // Comparison mode
}

interface PriceComparison {
  primaryStoreTotal: string;
  comparisonStoreTotal: string;
  savings: string;
}
```

**Example (Single Store Mode):**
```json
{
  "Produce": [
    {
      "item": "Avocados",
      "quantity": "2",
      "estimatedPrice": "$3.98"
    },
    {
      "item": "Spinach",
      "quantity": "1 bunch",
      "estimatedPrice": "$2.49"
    }
  ],
  "Meat & Seafood": [
    {
      "item": "Chicken breast",
      "quantity": "1.5 lbs",
      "estimatedPrice": "$8.99"
    }
  ],
  "Dairy & Eggs": [
    {
      "item": "Greek yogurt",
      "quantity": "32 oz",
      "estimatedPrice": "$5.99"
    },
    {
      "item": "Eggs",
      "quantity": "1 dozen",
      "estimatedPrice": "$4.29"
    }
  ],
  "Pantry": [
    {
      "item": "Quinoa",
      "quantity": "1 lb",
      "estimatedPrice": "$6.49"
    },
    {
      "item": "Olive oil",
      "quantity": "1 bottle",
      "estimatedPrice": "$12.99"
    }
  ]
}
```

**Example (Comparison Mode):**
```json
{
  "Produce": [
    {
      "item": "Avocados",
      "quantity": "2",
      "primaryStorePrice": "$3.98",
      "comparisonStorePrice": "$4.50"
    },
    {
      "item": "Spinach",
      "quantity": "1 bunch",
      "primaryStorePrice": "$2.49",
      "comparisonStorePrice": "$1.99"
    }
  ]
}
```

**Price Comparison Object:**
```json
{
  "primaryStoreTotal": "$45.23",
  "comparisonStoreTotal": "$48.75",
  "savings": "Save $3.52 by shopping at Whole Foods!"
}
```

**Categories:**
- Produce
- Meat & Seafood
- Dairy & Eggs
- Pantry
- Bakery
- Frozen
- Other

**Custom Items:**
- Added via `POST /api/custom-item-prices`
- Displayed in separate "Custom Items" section
- Follow same pricing structure as meal plan items

---

## API Request/Response Models

### 1. Nearby Stores API

**Endpoint:** `POST /api/nearby-stores`

**Request:**
```typescript
interface NearbyStoresRequest {
  zipCode: string;              // 5-digit US zip code
}
```

**Request Example:**
```json
{
  "zipCode": "10001"
}
```

**Response:**
```typescript
interface NearbyStoresResponse {
  stores: Store[];
}

interface Store {
  name: string;
  address: string;
  distance?: string;
}
```

**Response Example:**
```json
{
  "stores": [
    {
      "name": "Whole Foods Market",
      "address": "250 7th Ave, New York, NY 10001",
      "distance": "0.3 miles"
    },
    {
      "name": "Trader Joe's",
      "address": "142 E 14th St, New York, NY 10003",
      "distance": "0.7 miles"
    },
    {
      "name": "Fairway Market",
      "address": "766 6th Ave, New York, NY 10001",
      "distance": "0.5 miles"
    }
  ]
}
```

---

### 2. Generate Meal Plan API

**Endpoint:** `POST /api/generate-meal-plan`

**Request:**
```typescript
interface GenerateMealPlanRequest {
  zipCode: string;
  primaryStore: string;
  comparisonStore?: string;
  selectedMeals: string[];          // ['breakfast', 'lunch', 'dinner']
  selectedDays: string[];           // ['Monday', 'Tuesday', ...]
  dietaryPreferences: string[];     // ['diabetic', 'vegetarian', ...]
  leftovers?: string[];             // ['chicken', 'broccoli']
  cuisines: string[];
  people: number;
}
```

**Request Example:**
```json
{
  "zipCode": "10001",
  "primaryStore": "Whole Foods Market",
  "comparisonStore": "Trader Joe's",
  "selectedMeals": ["breakfast", "dinner"],
  "selectedDays": ["Monday", "Tuesday", "Wednesday"],
  "dietaryPreferences": ["vegetarian", "glutenFree"],
  "leftovers": ["mushrooms", "spinach"],
  "cuisines": ["Italian", "Mediterranean"],
  "people": 4
}
```

**Response:**
```typescript
interface GenerateMealPlanResponse {
  mealPlan: MealPlan;
  shoppingList: ShoppingList;
  totalCost?: string;
  priceComparison?: PriceComparison;
}
```

**Response Example:**
```json
{
  "mealPlan": {
    "Monday": {
      "breakfast": { "name": "...", "ingredients": [], "instructions": [], "nutrition": {} },
      "dinner": { "name": "...", "ingredients": [], "instructions": [], "nutrition": {} }
    },
    "Tuesday": { ... },
    "Wednesday": { ... }
  },
  "shoppingList": {
    "Produce": [ ... ],
    "Dairy & Eggs": [ ... ]
  },
  "priceComparison": {
    "primaryStoreTotal": "$112.45",
    "comparisonStoreTotal": "$108.20",
    "savings": "Save $4.25 by shopping at Trader Joe's!"
  }
}
```

---

### 3. Regenerate Meal API

**Endpoint:** `POST /api/regenerate-meal`

**Request:**
```typescript
interface RegenerateMealRequest {
  day: string;                      // 'Monday', 'Tuesday', etc.
  mealType: string;                 // 'breakfast', 'lunch', 'dinner'
  preferences: UserPreferences;     // Same as meal plan generation
  primaryStore: string;
  comparisonStore?: string;
}
```

**Request Example:**
```json
{
  "day": "Monday",
  "mealType": "dinner",
  "preferences": {
    "cuisines": ["Italian"],
    "people": 4,
    "dietaryPreferences": ["vegetarian"]
  },
  "primaryStore": "Whole Foods Market"
}
```

**Response:**
```typescript
interface RegenerateMealResponse {
  meal: Meal;
}
```

**Response Example:**
```json
{
  "meal": {
    "name": "Eggplant Parmesan",
    "ingredients": [ ... ],
    "instructions": [ ... ],
    "nutrition": { ... }
  }
}
```

---

### 4. Custom Item Prices API

**Endpoint:** `POST /api/custom-item-prices`

**Request:**
```typescript
interface CustomItemPricesRequest {
  items: string[];
  primaryStore: string;
  comparisonStore?: string;
}
```

**Request Example:**
```json
{
  "items": ["milk", "bananas", "coffee"],
  "primaryStore": "Whole Foods Market",
  "comparisonStore": "Trader Joe's"
}
```

**Response:**
```typescript
interface CustomItemPricesResponse {
  items: ShoppingItem[];
}
```

**Response Example (Single Store):**
```json
{
  "items": [
    {
      "item": "Milk",
      "quantity": "1 gallon",
      "estimatedPrice": "$4.99"
    },
    {
      "item": "Bananas",
      "quantity": "1 lb",
      "estimatedPrice": "$0.69"
    },
    {
      "item": "Coffee",
      "quantity": "12 oz",
      "estimatedPrice": "$8.99"
    }
  ]
}
```

**Response Example (Comparison Mode):**
```json
{
  "items": [
    {
      "item": "Milk",
      "quantity": "1 gallon",
      "primaryStorePrice": "$4.99",
      "comparisonStorePrice": "$3.99"
    },
    {
      "item": "Bananas",
      "quantity": "1 lb",
      "primaryStorePrice": "$0.69",
      "comparisonStorePrice": "$0.59"
    }
  ]
}
```

---

## Database Migration Plan

### Recommended Schema (PostgreSQL)

**Phase:** Short-Term (Weeks 2-3)
**Priority:** P1 (High)
**See:** [IMPLEMENTATION_ROADMAP.csv](IMPLEMENTATION_ROADMAP.csv)

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  picture_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
```

### Favorites Table

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  meal_type VARCHAR(50) NOT NULL,  -- 'breakfast', 'lunch', 'dinner'
  meal_data JSONB NOT NULL,        -- Full meal object
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_meal_type CHECK (meal_type IN ('breakfast', 'lunch', 'dinner'))
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_meal_type ON favorites(meal_type);
CREATE INDEX idx_favorites_meal_data ON favorites USING GIN(meal_data);
```

### History Table

```sql
CREATE TABLE meal_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL,
  meal_plan JSONB NOT NULL,
  stores JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_user_id ON meal_plan_history(user_id);
CREATE INDEX idx_history_created_at ON meal_plan_history(created_at DESC);
```

### Discount Codes Table

```sql
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_amount DECIMAL(10, 2),
  discount_percent DECIMAL(5, 2),
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE discount_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount_saved DECIMAL(10, 2),
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discount_usage_code ON discount_usage(discount_code_id);
CREATE INDEX idx_discount_usage_user ON discount_usage(user_id);
```

### Sessions Table (Redis Alternative)

```sql
CREATE TABLE sessions (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_expire ON sessions(expire);
```

**Note:** Redis is preferred for session storage due to faster performance.

---

## Data Relationships

```
users
  ├── favorites (one-to-many)
  ├── meal_plan_history (one-to-many)
  └── discount_usage (one-to-many)

discount_codes
  └── discount_usage (one-to-many)
```

---

## Data Migration Strategy

### Step 1: Database Setup (Week 2)
- Provision PostgreSQL on Render
- Create schema with tables and indexes
- Set up connection pooling

### Step 2: Parallel Write (Week 2)
- Write to both files AND database
- Validate data consistency
- No read changes yet

### Step 3: Migrate Existing Data (Week 2-3)
- Write migration script to import JSON files
- Verify all data migrated correctly
- Keep files as backup

### Step 4: Switch Reads (Week 3)
- Change all `GET` endpoints to read from database
- Monitor performance and errors
- Keep file writes as backup

### Step 5: Deprecate Files (Week 3)
- Stop writing to files
- Archive old JSON files
- Full database mode

### Rollback Plan
- Keep JSON files for 2 weeks after migration
- Can revert reads to files if issues arise
- Database retained as single source of truth

---

## Data Privacy & Security

### Current Issues

1. **Email Storage:** Plain text in JSON files
2. **Weak Hashing:** MD5 is reversible
3. **No Encryption:** Data at rest not encrypted
4. **Access Control:** No role-based permissions
5. **Logging:** PII exposed in console.logs

### Recommended Improvements

1. **Encrypt PII:** Use AES-256 for emails in database
2. **Use UUIDs:** Replace email hashes with random UUIDs
3. **Hash with HMAC-SHA256:** If hashing needed, use strong algorithm with salt
4. **Role-Based Access:** Admin vs. User roles
5. **Audit Logging:** Track who accesses what data
6. **GDPR Compliance:** Data export/deletion endpoints

---

**Document Version:** 1.0
**Prepared By:** AI Documentation System
**Date:** December 2, 2025
