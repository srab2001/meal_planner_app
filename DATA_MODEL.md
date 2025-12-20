# Meal Planner App - Complete Data Model# Data Model Documentation

## AI Meal Planner Application

> **Last Updated**: December 2025  

> **Version**: 2.0  **Version:** 1.0

> **Production URLs**:  **Last Updated:** December 2, 2025

> - Frontend: https://meal-planner-app-chi.vercel.app  **Storage Type:** File-based JSON (⚠️ Migration to PostgreSQL recommended)

> - Backend: https://meal-planner-app-mve2.onrender.com

---

---

## Table of Contents

## 📊 System Architecture Overview

1. [Overview](#overview)

```mermaid2. [User Data Model](#user-data-model)

flowchart TB3. [Session Data Model](#session-data-model)

    subgraph Frontend["Frontend (Vercel)"]4. [Favorites Data Model](#favorites-data-model)

        subgraph Modules["React Modules"]5. [History Data Model](#history-data-model)

            MP[🍽️ Meal Planner]6. [Discount Tracking Data Model](#discount-tracking-data-model)

            NUT[🥗 Nutrition]7. [Meal Plan Data Model](#meal-plan-data-model)

            COACH[💪 Coaching]8. [Shopping List Data Model](#shopping-list-data-model)

            PROG[📈 Progress]9. [API Request/Response Models](#api-requestresponse-models)

            INT[🔗 Integrations]10. [Database Migration Plan](#database-migration-plan)

        end

        subgraph Shared["Shared Services"]---

            AUTH[Auth Service]

            API[API Utils]## Overview

            ANALYTICS[Analytics Service]

        end### Current Storage Architecture

    end

    **Type:** File-based JSON storage

    subgraph Backend["Backend (Render)"]**Location:** `/user-data/` directory

        SERVER[Express.js Server]**Persistence:** Local filesystem on server

        PASSPORT[Passport.js OAuth]

        OPENAI[OpenAI API]**Files:**

    end- `user-data/favorites.json` - User favorite meals

    - `user-data/history.json` - Meal plan history

    subgraph Database["PostgreSQL Database"]- `discount-code-usage.json` - Discount code tracking

        USERS[(users)]

        SESSION[(session)]**⚠️ Critical Limitations:**

        HISTORY[(meal_plan_history)]- Not scalable beyond single server

        FAVORITES[(favorites)]- No ACID guarantees

        SHOPPING[(shopping_list_states)]- Race conditions possible with concurrent writes

        PREFS[(user_preferences)]- No backup/restore mechanism

        USAGE[(usage_stats)]- Blocks event loop with synchronous file I/O

        SUBS[(subscriptions)]

        SETTINGS[(app_settings)]**Recommended Migration:** PostgreSQL (see [Implementation Roadmap](IMPLEMENTATION_ROADMAP.csv))

        CUISINES[(cuisine_options)]

        DIETARY[(dietary_options)]---

    end

    ## User Data Model

    Frontend --> Backend

    Backend --> Database### User Object (From Google OAuth)

    Backend --> OPENAI

```**Source:** Google OAuth 2.0 Profile

**Storage:** Session (in-memory)

---**Lifetime:** Until logout or session expiration



## 🗄️ Database Tables```typescript

interface User {

### Entity Relationship Diagram  googleId: string;           // Google unique identifier

  displayName: string;        // Full name from Google profile

```mermaid  email: string;              // Primary email address

erDiagram  picture: string;            // Profile picture URL

    users ||--o{ subscriptions : "has"  hashedEmail?: string;       // MD5 hash for file lookups (⚠️ weak hashing)

    users ||--o{ favorites : "saves"}

    users ||--o{ meal_plan_history : "generates"```

    users ||--o{ shopping_list_states : "tracks"

    users ||--|| user_preferences : "configures"**Example:**

    users ||--o{ usage_stats : "produces"```json

    users ||--o{ user_activity : "logs"{

      "googleId": "108234567890123456789",

    users {  "displayName": "John Doe",

        UUID id PK  "email": "john.doe@gmail.com",

        VARCHAR google_id UK  "picture": "https://lh3.googleusercontent.com/a/...",

        VARCHAR email UK  "hashedEmail": "5d41402abc4b2a76b9719d911017c592"

        VARCHAR display_name}

        TEXT picture_url```

        TEXT[] default_cuisine

        INTEGER default_people**Privacy Concerns:**

        TIMESTAMP created_at- MD5 hashing is reversible for emails

        TIMESTAMP updated_at- Email addresses stored in plain text in JSON files

        TIMESTAMP last_login- No encryption at rest

        TIMESTAMP deleted_at

    }**Recommended Changes:**

    - Use HMAC-SHA256 with secret salt for email hashing

    subscriptions {- Store UUIDs instead of hashed emails

        UUID id PK- Encrypt PII in database

        UUID user_id FK

        VARCHAR stripe_customer_id UK---

        VARCHAR stripe_subscription_id UK

        VARCHAR plan_type## Session Data Model

        VARCHAR status

        TIMESTAMP current_period_start### Session Object

        TIMESTAMP current_period_end

        BOOLEAN cancel_at_period_end**Storage:** In-memory (express-session)

    }**Lifetime:** 24 hours (default)

    **Persistence:** Lost on server restart

    favorites {

        UUID id PK```typescript

        UUID user_id FKinterface Session {

        VARCHAR meal_type  cookie: {

        JSONB meal_data    originalMaxAge: number;   // Session duration in milliseconds

        VARCHAR meal_name    expires: Date;            // Expiration timestamp

        INTEGER servings_adjustment    httpOnly: boolean;        // Cannot be accessed via JavaScript

        TEXT user_notes    secure: boolean;          // HTTPS only (production)

        TIMESTAMP created_at    path: string;             // Cookie path (usually "/")

    }  };

      passport: {

    meal_plan_history {    user: string;             // Serialized user ID (Google ID)

        UUID id PK  };

        UUID user_id FK}

        JSONB preferences```

        JSONB meal_plan

        JSONB stores**Example:**

        JSONB shopping_list```json

        DECIMAL total_cost{

        TIMESTAMP created_at  "cookie": {

    }    "originalMaxAge": 86400000,

        "expires": "2025-12-03T12:00:00.000Z",

    shopping_list_states {    "httpOnly": true,

        UUID id PK    "secure": true,

        UUID user_id FK    "path": "/"

        DATE meal_plan_date  },

        JSONB checked_items  "passport": {

        TIMESTAMP created_at    "user": "108234567890123456789"

        TIMESTAMP updated_at  }

    }}

    ```

    user_preferences {

        UUID id PK**Current Issues:**

        UUID user_id FK- Sessions lost on server restart (poor UX)

        JSONB default_cuisines- Doesn't scale across multiple servers

        INTEGER default_people- Memory leak risk with many concurrent users

        JSONB default_meals

        JSONB default_days**Recommended Migration:** Redis session store (see [IMPLEMENTATION_ROADMAP.csv](IMPLEMENTATION_ROADMAP.csv))

        JSONB default_dietary

        JSONB email_notifications---

        VARCHAR theme

        VARCHAR units## Favorites Data Model

    }

    ### Favorites File Structure

    usage_stats {

        UUID id PK**File:** `user-data/favorites.json`

        UUID user_id FK**Format:** JSON object with email hashes as keys

        VARCHAR action_type**Access Pattern:** Read on page load, write on add/remove

        JSONB metadata

        TIMESTAMP created_at```typescript

    }interface FavoritesDatabase {

      [hashedEmail: string]: {

    session {    [mealType: string]: Meal[];

        VARCHAR sid PK  };

        JSON sess}

        TIMESTAMP expire

    }interface Meal {

      name: string;

    app_settings {  ingredients: string[];

        VARCHAR key PK  instructions: string[];

        TEXT value  nutrition: {

        TEXT description    calories: number;

        TIMESTAMP updated_at    protein: string;

    }    carbs: string;

        fat: string;

    cuisine_options {  };

        UUID id PK  prepTime?: string;

        VARCHAR name UK  cookTime?: string;

        INTEGER display_order}

        BOOLEAN active```

    }

    **Example:**

    dietary_options {```json

        UUID id PK{

        VARCHAR key UK  "5d41402abc4b2a76b9719d911017c592": {

        VARCHAR label    "breakfast": [

        INTEGER display_order      {

        BOOLEAN active        "name": "Avocado Toast with Poached Eggs",

    }        "ingredients": [

```          "2 slices whole grain bread",

          "1 ripe avocado",

---          "2 eggs",

          "Salt and pepper to taste",

## 📋 Table Specifications          "Red pepper flakes (optional)"

        ],

### 1. `users` - Core User Table        "instructions": [

          "Toast the bread until golden brown",

| Column | Type | Constraints | Description |          "Mash avocado and spread on toast",

|--------|------|-------------|-------------|          "Poach eggs in simmering water for 3-4 minutes",

| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique user identifier |          "Place poached eggs on avocado toast",

| `google_id` | VARCHAR(255) | UNIQUE, NOT NULL | Google OAuth ID |          "Season with salt, pepper, and red pepper flakes"

| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email |        ],

| `display_name` | VARCHAR(255) | | User's display name |        "nutrition": {

| `picture_url` | TEXT | | Profile picture URL |          "calories": 350,

| `default_cuisine` | TEXT[] | | Array of preferred cuisines |          "protein": "15g",

| `default_people` | INTEGER | DEFAULT 2 | Default household size |          "carbs": "28g",

| `phone_number` | VARCHAR(20) | | Optional phone |          "fat": "20g"

| `timezone` | VARCHAR(50) | DEFAULT 'America/New_York' | User timezone |        },

| `meal_plans_generated` | INTEGER | DEFAULT 0 | Total plans generated |        "prepTime": "5 minutes",

| `bio` | TEXT | | User bio |        "cookTime": "5 minutes"

| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation |      }

| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |    ],

| `last_login` | TIMESTAMP | | Last login time |    "lunch": [],

| `deleted_at` | TIMESTAMP | | Soft delete timestamp |    "dinner": [

      {

**Indexes**:        "name": "Grilled Chicken with Quinoa",

- `idx_users_google_id` ON (google_id)        "ingredients": [

- `idx_users_email` ON (email)          "6 oz chicken breast",

- `idx_users_last_login` ON (last_login DESC)          "1 cup quinoa",

- `idx_users_timezone` ON (timezone)          "2 cups chicken broth",

          "Mixed vegetables (broccoli, carrots)"

---        ],

        "instructions": [

### 2. `meal_plan_history` - Generated Meal Plans          "Season chicken breast with salt and pepper",

          "Grill chicken for 6-7 minutes per side",

| Column | Type | Constraints | Description |          "Cook quinoa in chicken broth for 15 minutes",

|--------|------|-------------|-------------|          "Steam vegetables until tender",

| `id` | UUID | PK | Plan identifier |          "Serve chicken over quinoa with vegetables"

| `user_id` | UUID | FK → users(id), ON DELETE CASCADE | Owner |        ],

| `preferences` | JSONB | | User preferences at generation time |        "nutrition": {

| `meal_plan` | JSONB | NOT NULL | Complete meal plan data |          "calories": 450,

| `stores` | JSONB | | Selected grocery stores |          "protein": "40g",

| `shopping_list` | JSONB | | Aggregated shopping list |          "carbs": "45g",

| `total_cost` | DECIMAL(10,2) | | Estimated total cost |          "fat": "8g"

| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Generation time |        }

| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |      }

    ]

**meal_plan JSONB Structure**:  },

```json  "098f6bcd4621d373cade4e832627b4f6": {

{    "breakfast": [],

  "days": [    "lunch": [],

    {    "dinner": []

      "day": "Monday",  }

      "meals": {}

        "breakfast": {```

          "name": "Veggie Omelette",

          "ingredients": ["eggs", "spinach", "tomatoes"],**Key Structure:**

          "instructions": ["Beat eggs...", "Cook..."],- Top level: User email hash

          "calories": 320,- Second level: Meal type (`breakfast`, `lunch`, `dinner`)

          "servings": 2- Third level: Array of meal objects

        },

        "lunch": { ... },**File Operations:**

        "dinner": { ... }- **Read:** `fs.readFileSync()` - Blocking operation (⚠️)

      }- **Write:** `fs.writeFileSync()` - Blocking operation (⚠️)

    }- **Concurrency:** No locking mechanism (race condition risk)

  ]

}**API Endpoints:**

```- `GET /api/favorites` - Retrieve user favorites

- `POST /api/favorites/add` - Add meal to favorites

**Indexes**:- `POST /api/favorites/remove` - Remove meal from favorites

- `idx_history_user_id` ON (user_id)

- `idx_history_created_at` ON (created_at DESC)---

- `idx_history_user_recent` ON (user_id, created_at DESC)

- `idx_history_preferences` USING GIN (preferences)## History Data Model

- `idx_history_meal_plan` USING GIN (meal_plan)

### History File Structure

---

**File:** `user-data/history.json`

### 3. `favorites` - Saved Favorite Meals**Format:** JSON object with email hashes as keys

**Access Pattern:** Read on page load, write after plan generation

| Column | Type | Constraints | Description |

|--------|------|-------------|-------------|```typescript

| `id` | UUID | PK | Favorite identifier |interface HistoryDatabase {

| `user_id` | UUID | FK → users(id), ON DELETE CASCADE, NOT NULL | Owner |  [hashedEmail: string]: HistoryEntry[];

| `meal_type` | VARCHAR(20) | NOT NULL, CHECK (breakfast, lunch, dinner) | Meal type |}

| `meal_data` | JSONB | NOT NULL | Complete meal data |

| `meal_name` | VARCHAR(255) | NOT NULL | Meal name for display |interface HistoryEntry {

| `servings_adjustment` | INTEGER | | User's adjusted servings |  id: string;                      // Unique identifier (timestamp)

| `user_notes` | TEXT | | User's notes about meal |  timestamp: string;               // ISO 8601 date string

| `ingredient_swaps` | JSONB | DEFAULT '[]' | Custom ingredient changes |  preferences: UserPreferences;    // Original questionnaire data

| `custom_instructions` | JSONB | | Modified instructions |  mealPlan: MealPlan;             // Full meal plan object

| `cooking_time_actual` | INTEGER | | Actual time user took |  stores: {

| `difficulty_rating` | INTEGER | | User's difficulty rating |    primaryStore: Store;

| `last_cooked_at` | TIMESTAMP | | When user last cooked |    comparisonStore?: Store;

| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When favorited |  };

| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |}



**Unique Constraint**: (user_id, meal_name, meal_type)interface UserPreferences {

  cuisines: string[];

**Indexes**:  people: number;

- `idx_favorites_user_id` ON (user_id)  selectedMeals: string[];

- `idx_favorites_meal_type` ON (meal_type)  selectedDays: string[];

- `idx_favorites_meal_name` ON (meal_name)  dietaryPreferences: string[];

- `idx_favorites_last_cooked` ON (last_cooked_at DESC) WHERE last_cooked_at IS NOT NULL  leftovers?: string[];

}

---```



### 4. `shopping_list_states` - Shopping List Progress**Example:**

```json

| Column | Type | Constraints | Description |{

|--------|------|-------------|-------------|  "5d41402abc4b2a76b9719d911017c592": [

| `id` | UUID | PK | State identifier |    {

| `user_id` | UUID | FK → users(id), ON DELETE CASCADE, NOT NULL | Owner |      "id": "1733155200000",

| `meal_plan_date` | DATE | NOT NULL, DEFAULT CURRENT_DATE | Plan date |      "timestamp": "2025-12-02T12:00:00.000Z",

| `checked_items` | JSONB | NOT NULL, DEFAULT '{}' | Checked item states |      "preferences": {

| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Created |        "cuisines": ["Italian", "Mediterranean"],

| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |        "people": 4,

        "selectedMeals": ["dinner"],

**Unique Constraint**: (user_id, meal_plan_date)        "selectedDays": ["Monday", "Tuesday", "Wednesday"],

        "dietaryPreferences": ["vegetarian"],

**checked_items JSONB Structure**:        "leftovers": ["mushrooms", "spinach"]

```json      },

{      "mealPlan": {

  "produce": {        "Monday": {

    "tomatoes": true,          "dinner": {

    "spinach": false            "name": "Mushroom Risotto with Spinach",

  },            "ingredients": ["..."],

  "dairy": {            "instructions": ["..."],

    "eggs": true            "nutrition": {}

  }          }

}        },

```        "Tuesday": {

          "dinner": {}

---        },

        "Wednesday": {

### 5. `user_preferences` - User Settings          "dinner": {}

        }

| Column | Type | Constraints | Description |      },

|--------|------|-------------|-------------|      "stores": {

| `id` | UUID | PK | Preference identifier |        "primaryStore": {

| `user_id` | UUID | FK → users(id), UNIQUE, ON DELETE CASCADE | Owner |          "name": "Whole Foods",

| `default_cuisines` | JSONB | DEFAULT '[]' | Preferred cuisines |          "address": "123 Main St, New York, NY 10001"

| `default_people` | INTEGER | DEFAULT 2, CHECK (1-20) | Household size |        }

| `default_meals` | JSONB | DEFAULT '["breakfast", "lunch", "dinner"]' | Included meals |      }

| `default_days` | JSONB | DEFAULT all days | Days to plan |    },

| `default_dietary` | JSONB | DEFAULT '[]' | Dietary restrictions |    {

| `email_notifications` | JSONB | | Notification preferences |      "id": "1732982400000",

| `theme` | VARCHAR(20) | DEFAULT 'light', CHECK (light, dark, auto) | UI theme |      "timestamp": "2025-11-30T08:00:00.000Z",

| `units` | VARCHAR(20) | DEFAULT 'imperial', CHECK (imperial, metric) | Measurement units |      "preferences": {},

| `language` | VARCHAR(10) | DEFAULT 'en' | UI language |      "mealPlan": {},

| `share_favorites` | BOOLEAN | DEFAULT FALSE | Allow sharing |      "stores": {}

| `public_profile` | BOOLEAN | DEFAULT FALSE | Public profile |    }

  ]

---}

```

### 6. `subscriptions` - Payment Plans

**Sorting:** Entries stored in reverse chronological order (newest first)

| Column | Type | Constraints | Description |

|--------|------|-------------|-------------|**API Endpoints:**

| `id` | UUID | PK | Subscription identifier |- `GET /api/history` - Retrieve user history

| `user_id` | UUID | FK → users(id), ON DELETE CASCADE | Owner |- `POST /api/history/save` - Save new meal plan

| `stripe_customer_id` | VARCHAR(255) | UNIQUE | Stripe customer |- `POST /api/history/remove` - Delete history entry

| `stripe_subscription_id` | VARCHAR(255) | UNIQUE | Stripe subscription |

| `plan_type` | VARCHAR(50) | DEFAULT 'free', CHECK (free, premium) | Plan level |**Auto-Save Behavior:**

| `status` | VARCHAR(50) | DEFAULT 'active', CHECK (...) | Status |- Every generated meal plan automatically saved

| `current_period_start` | TIMESTAMP | | Billing period start |- Triggered on successful meal plan generation

| `current_period_end` | TIMESTAMP | | Billing period end |- No user action required

| `trial_end` | TIMESTAMP | | Trial expiration |

| `cancel_at_period_end` | BOOLEAN | DEFAULT FALSE | Pending cancellation |---

| `cancelled_at` | TIMESTAMP | | Cancellation date |

## Discount Tracking Data Model

---

### Discount File Structure

### 7. `usage_stats` - User Actions

**File:** `discount-code-usage.json`

| Column | Type | Constraints | Description |**Format:** JSON object with discount codes as keys

|--------|------|-------------|-------------|**Access Pattern:** Write on code use, read for analytics

| `id` | UUID | PK | Stat identifier |

| `user_id` | UUID | FK → users(id), ON DELETE CASCADE | User |```typescript

| `action_type` | VARCHAR(100) | NOT NULL | Action performed |interface DiscountDatabase {

| `metadata` | JSONB | | Additional details |  [discountCode: string]: DiscountUsage[];

| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When |}



**Common action_types**:interface DiscountUsage {

- `meal_plan_generated`  email: string;                // User email (⚠️ PII stored in plain text)

- `shopping_list_viewed`  timestamp: string;            // ISO 8601 date string

- `favorite_added`  amountSaved?: number;         // Discount amount in dollars

- `recipe_modified`}

- `app_selected` (with app name in metadata)```



---**Example:**

```json

### 8. `session` - Express Session Storage{

  "WELCOME20": [

| Column | Type | Constraints | Description |    {

|--------|------|-------------|-------------|      "email": "john.doe@gmail.com",

| `sid` | VARCHAR | PK | Session ID |      "timestamp": "2025-12-02T10:30:00.000Z",

| `sess` | JSON | NOT NULL | Session data |      "amountSaved": 5.00

| `expire` | TIMESTAMP(6) | NOT NULL | Expiration time |    },

    {

---      "email": "jane.smith@gmail.com",

      "timestamp": "2025-12-01T14:22:00.000Z",

### 9. `app_settings` - Global Configuration      "amountSaved": 5.00

    }

| Column | Type | Constraints | Description |  ],

|--------|------|-------------|-------------|  "HOLIDAY50": [

| `key` | VARCHAR(255) | PK | Setting key |    {

| `value` | TEXT | NOT NULL | Setting value |      "email": "john.doe@gmail.com",

| `description` | TEXT | | Human-readable description |      "timestamp": "2025-11-25T09:15:00.000Z",

| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |      "amountSaved": 12.50

    }

**Current settings**:  ]

- `free_meal_plans_limit`: '10' - Free tier monthly limit}

```

---

**⚠️ Security Concerns:**

### 10. `cuisine_options` - Available Cuisines- Email addresses stored in plain text (GDPR/privacy violation)

- No access control on `/api/discount-usage-stats` endpoint

| Column | Type | Constraints | Description |- Anyone authenticated can view all discount usage data

|--------|------|-------------|-------------|

| `id` | UUID | PK | Cuisine identifier |**API Endpoints:**

| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Cuisine name |- `GET /api/discount-usage-stats` - View all discount usage (⚠️ No admin check)

| `display_order` | INTEGER | DEFAULT 0 | Sort order |

| `active` | BOOLEAN | DEFAULT TRUE | Is selectable |**Recommended Changes:**

- Hash or encrypt email addresses

**Default values**: Italian, Mexican, Chinese, Japanese, Indian, Thai, Mediterranean, American, French, Korean, Vietnamese, Greek, Spanish, Middle Eastern- Add admin role check to endpoint

- Move to database with proper access controls

---

---

### 11. `dietary_options` - Dietary Restrictions

## Meal Plan Data Model

| Column | Type | Constraints | Description |

|--------|------|-------------|-------------|### Meal Plan Object

| `id` | UUID | PK | Option identifier |

| `key` | VARCHAR(50) | UNIQUE, NOT NULL | Option key |**Source:** OpenAI GPT-4o-mini generation

| `label` | VARCHAR(100) | NOT NULL | Display label |**Format:** JSON object

| `display_order` | INTEGER | DEFAULT 0 | Sort order |**Structure:** Days → Meal Types → Meal Objects

| `active` | BOOLEAN | DEFAULT TRUE | Is selectable |

```typescript

**Default values**: diabetic, dairyFree, glutenFree, peanutFree, vegetarian, kosher, vegan, lowCarb, keto, paleointerface MealPlan {

  [day: string]: {

---    [mealType: string]: Meal;

  };

## 🖥️ Frontend Modules}



### Module Architecture Diagraminterface Meal {

  name: string;

```mermaid  ingredients: string[];

flowchart LR  instructions: string[];

    subgraph Switchboard["App Switchboard"]  nutrition: {

        SB[🎯 Module Selector]    calories: number;

    end    protein: string;

        carbs: string;

    subgraph MealPlanner["🍽️ Meal Planner (Core)"]    fat: string;

        MP_GEN[Plan Generation]  };

        MP_VIEW[Plan View]  prepTime?: string;

        MP_SHOP[Shopping List]  cookTime?: string;

        MP_FAV[Favorites]  cuisine?: string;

        MP_REC[Recipe Modal]}

    end```

    

    subgraph Nutrition["🥗 Nutrition (Read-Only)"]**Example:**

        NUT_WEEK[Weekly Summary]```json

        NUT_DAY[Daily Breakdown]{

        NUT_MEAL[Per-Meal View]  "Monday": {

    end    "breakfast": {

          "name": "Greek Yogurt Parfait with Berries",

    subgraph Coaching["💪 Coaching"]      "ingredients": [

        COACH_DASH[Dashboard]        "1 cup Greek yogurt",

        COACH_CHAT[AI Chat]        "1/2 cup mixed berries",

        COACH_PROG[Programs]        "2 tbsp granola",

        COACH_GOAL[Goals]        "1 tbsp honey"

        COACH_HAB[Habits]      ],

    end      "instructions": [

            "Layer Greek yogurt in a bowl",

    subgraph Progress["📈 Progress"]        "Top with mixed berries",

        PROG_STREAK[Streak Tracker]        "Sprinkle granola on top",

        PROG_BADGE[Achievements]        "Drizzle with honey"

        PROG_REF[Referrals]      ],

    end      "nutrition": {

            "calories": 280,

    subgraph Integrations["🔗 Integrations"]        "protein": "18g",

        INT_CONNECT[Provider Connect]        "carbs": "35g",

        INT_IMPORT[Data Import]        "fat": "6g"

        INT_VIEW[Data View]      },

    end      "prepTime": "5 minutes",

          "cookTime": "0 minutes",

    SB --> MealPlanner      "cuisine": "Mediterranean"

    SB --> Nutrition    },

    SB --> Coaching    "dinner": {

    SB --> Progress      "name": "Baked Salmon with Roasted Vegetables",

    SB --> Integrations      "ingredients": [

            "6 oz salmon fillet",

    MealPlanner -.->|provides data| Nutrition        "1 cup broccoli florets",

    MealPlanner -.->|provides data| Coaching        "1 cup cherry tomatoes",

```        "2 tbsp olive oil",

        "Lemon, salt, pepper"

---      ],

      "instructions": [

### Module Details        "Preheat oven to 400°F",

        "Place salmon on baking sheet",

#### 1. 🍽️ Meal Planner (Core Module)        "Arrange vegetables around salmon",

        "Drizzle with olive oil, season with salt and pepper",

**Purpose**: AI-powered meal plan generation with grocery store integration        "Bake for 15-18 minutes",

        "Serve with lemon wedges"

**Features**:      ],

- Generate weekly meal plans based on cuisine/dietary preferences      "nutrition": {

- View meal plans by day/meal        "calories": 420,

- Recipe details with ingredients and instructions        "protein": "35g",

- Modify recipes (add/remove/substitute ingredients)        "carbs": "18g",

- Regenerate individual meals        "fat": "24g"

- Save favorites      },

- Shopping list with store integration      "prepTime": "10 minutes",

- Shopping list checkbox persistence      "cookTime": "18 minutes"

    }

**Data Access**:  },

- **READ/WRITE**: `meal_plan_history`, `favorites`, `shopping_list_states`  "Tuesday": {

- **READ**: `users`, `user_preferences`, `cuisine_options`, `dietary_options`    "breakfast": {},

    "dinner": {}

**Key Components**:  }

- `MealPlanView.js` - Main plan display}

- `RecipeModal.js` - Recipe details and editing```

- `ShoppingList.js` - Aggregated shopping list

- `FavoritesPanel.js` - Saved favorites**Dynamic Properties:**

- Days: Based on `selectedDays` from questionnaire

---- Meal types: Based on `selectedMeals` (breakfast/lunch/dinner)

- Only requested combinations included

#### 2. 🥗 Nutrition Module

**Validation:**

**Purpose**: Read-only nutritional analysis of meal plans- All dietary restrictions enforced by AI

- Leftovers incorporated when specified

**Features**:- Cuisine preferences followed

- Weekly nutrition summary (calories, macros, vitamins)

- Per-day nutrition breakdown---

- Per-meal drill-down view

- Snapshot caching for performance## Shopping List Data Model



**Data Access**:### Shopping List Object

- **READ-ONLY**: `meal_plan_history`

**Source:** Generated with meal plan

**Key Components**:**Format:** JSON object categorized by food type

- `NutritionApp.js` - Main module**Structure:** Categories → Items with quantities and prices

- `NutritionSnapshotService.js` - Caching service

```typescript

**Endpoints Used**:interface ShoppingList {

- `GET /api/nutrition/meal-plan-summary`  [category: string]: ShoppingItem[];

- `GET /api/nutrition/daily/:date`}

- `GET /api/nutrition/weekly`

interface ShoppingItem {

---  item: string;

  quantity: string;

#### 3. 💪 Coaching Module  estimatedPrice?: string;           // Single store mode

  primaryStorePrice?: string;        // Comparison mode

**Purpose**: AI-powered health coaching with goal tracking  comparisonStorePrice?: string;     // Comparison mode

}

**Features**:

- Health score dashboardinterface PriceComparison {

- AI chat interface (ChatGPT integration)  primaryStoreTotal: string;

- Coaching programs (General Wellness, Weight Management, Heart-Friendly)  comparisonStoreTotal: string;

- Goal management  savings: string;

- Habit tracking}

- Medical guardrails (no diagnosis/treatment claims)```



**Data Access**:**Example (Single Store Mode):**

- **READ-ONLY**: `meal_plan_history` (for context)```json

- **READ/WRITE**: Local storage for goals/habits (future: database){

  "Produce": [

**Key Components**:    {

- `CoachingApp.js` - Main module      "item": "Avocados",

- `CoachingDashboard.js` - Health score display      "quantity": "2",

- `CoachingChat.js` - AI chat interface      "estimatedPrice": "$3.98"

- `Programs.js` - Coaching program management    },

- `GoalManager.js` - Goal CRUD    {

- `HabitTracker.js` - Habit tracking      "item": "Spinach",

      "quantity": "1 bunch",

**Audit Logging**: Comprehensive logging for HIPAA-adjacent compliance      "estimatedPrice": "$2.49"

    }

---  ],

  "Meat & Seafood": [

#### 4. 📈 Progress Module    {

      "item": "Chicken breast",

**Purpose**: Gamification and user engagement      "quantity": "1.5 lbs",

      "estimatedPrice": "$8.99"

**Features**:    }

- Weekly streak tracking  ],

- Achievement badges  "Dairy & Eggs": [

- Referral system with limits    {

- Progress statistics      "item": "Greek yogurt",

      "quantity": "32 oz",

**Data Access**:      "estimatedPrice": "$5.99"

- **READ**: `users` (via API)    },

- **READ/WRITE**: Local storage for streak/badge data    {

      "item": "Eggs",

**Key Components**:      "quantity": "1 dozen",

- `ProgressApp.js` - Main module      "estimatedPrice": "$4.29"

- `StreakService.js` - Streak calculation    }

- `BadgeService.js` - Achievement management  ],

- `ReferralService.js` - Referral code handling  "Pantry": [

    {

---      "item": "Quinoa",

      "quantity": "1 lb",

#### 5. 🔗 Integrations Module      "estimatedPrice": "$6.49"

    },

**Purpose**: Third-party health data integration    {

      "item": "Olive oil",

**Features**:      "quantity": "1 bottle",

- Connect/disconnect health providers (Apple Health, Google Fit, Fitbit)      "estimatedPrice": "$12.99"

- Import steps and sleep data    }

- View imported data summary  ]

- Feature flag gating}

```

**Data Access**:

- **READ/WRITE**: Local storage for connection state**Example (Comparison Mode):**

- **Future**: Database storage for imported data```json

{

**Key Components**:  "Produce": [

- `IntegrationsApp.js` - Main module    {

- `HealthDataService.js` - Provider connection management      "item": "Avocados",

      "quantity": "2",

**Feature Flag**: `health_integrations` (controlled via FeatureFlags service)      "primaryStorePrice": "$3.98",

      "comparisonStorePrice": "$4.50"

---    },

    {

## 🔐 Authentication Flow      "item": "Spinach",

      "quantity": "1 bunch",

```mermaid      "primaryStorePrice": "$2.49",

sequenceDiagram      "comparisonStorePrice": "$1.99"

    participant User    }

    participant Frontend  ]

    participant Backend}

    participant Google```

    participant Database

    **Price Comparison Object:**

    User->>Frontend: Click "Sign in with Google"```json

    Frontend->>Backend: Redirect to /auth/google{

    Backend->>Google: OAuth request  "primaryStoreTotal": "$45.23",

    Google->>User: Show consent screen  "comparisonStoreTotal": "$48.75",

    User->>Google: Approve  "savings": "Save $3.52 by shopping at Whole Foods!"

    Google->>Backend: Auth code callback}

    Backend->>Google: Exchange for tokens```

    Google->>Backend: User profile

    Backend->>Database: Create/update user**Categories:**

    Backend->>Backend: Create JWT + session- Produce

    Backend->>Frontend: Redirect with token- Meat & Seafood

    Frontend->>Frontend: Store token in localStorage- Dairy & Eggs

    Frontend->>Backend: API calls with Authorization header- Pantry

```- Bakery

- Frozen

---- Other



## 📡 API Endpoints Summary**Custom Items:**

- Added via `POST /api/custom-item-prices`

### Authentication- Displayed in separate "Custom Items" section

| Method | Endpoint | Description |- Follow same pricing structure as meal plan items

|--------|----------|-------------|

| GET | `/auth/google` | Initiate Google OAuth |---

| GET | `/auth/google/callback` | OAuth callback |

| POST | `/auth/logout` | End session |## API Request/Response Models

| GET | `/api/auth/status` | Check auth status |

### 1. Nearby Stores API

### Meal Planning

| Method | Endpoint | Description |**Endpoint:** `POST /api/nearby-stores`

|--------|----------|-------------|

| POST | `/api/meal-plan` | Generate new meal plan |**Request:**

| GET | `/api/meal-plan` | Get current meal plan |```typescript

| POST | `/api/regenerate-meal` | Regenerate single meal |interface NearbyStoresRequest {

| POST | `/api/modify-recipe` | Modify recipe ingredients |  zipCode: string;              // 5-digit US zip code

}

### Favorites```

| Method | Endpoint | Description |

|--------|----------|-------------|**Request Example:**

| GET | `/api/favorites` | Get user favorites |```json

| POST | `/api/favorites` | Add favorite |{

| DELETE | `/api/favorites/:id` | Remove favorite |  "zipCode": "10001"

}

### Shopping List```

| Method | Endpoint | Description |

|--------|----------|-------------|**Response:**

| GET | `/api/shopping-list-state` | Get checked items |```typescript

| POST | `/api/shopping-list-state` | Save checked items |interface NearbyStoresResponse {

  stores: Store[];

### Nutrition (Read-Only)}

| Method | Endpoint | Description |

|--------|----------|-------------|interface Store {

| GET | `/api/nutrition/meal-plan-summary` | Get nutrition summary |  name: string;

| GET | `/api/nutrition/daily/:date` | Get daily nutrition |  address: string;

| GET | `/api/nutrition/weekly` | Get weekly nutrition |  distance?: string;

}

### User Management```

| Method | Endpoint | Description |

|--------|----------|-------------|**Response Example:**

| GET | `/api/user/profile` | Get user profile |```json

| PUT | `/api/user/profile` | Update profile |{

| GET | `/api/user/preferences` | Get preferences |  "stores": [

| PUT | `/api/user/preferences` | Update preferences |    {

      "name": "Whole Foods Market",

---      "address": "250 7th Ave, New York, NY 10001",

      "distance": "0.3 miles"

## 🚀 Deployment Architecture    },

    {

```mermaid      "name": "Trader Joe's",

flowchart TB      "address": "142 E 14th St, New York, NY 10003",

    subgraph Users      "distance": "0.7 miles"

        BROWSER[User Browser]    },

    end    {

          "name": "Fairway Market",

    subgraph Vercel["Vercel (Frontend)"]      "address": "766 6th Ave, New York, NY 10001",

        REACT[React App<br/>CDN Deployed]      "distance": "0.5 miles"

    end    }

      ]

    subgraph Render["Render (Backend)"]}

        EXPRESS[Express.js Server<br/>Docker Container]```

    end

    ---

    subgraph External["External Services"]

        GOOGLE[Google OAuth]### 2. Generate Meal Plan API

        OPENAI[OpenAI API]

        POSTGRES[(PostgreSQL)]**Endpoint:** `POST /api/generate-meal-plan`

    end

    **Request:**

    BROWSER --> REACT```typescript

    REACT --> EXPRESSinterface GenerateMealPlanRequest {

    EXPRESS --> GOOGLE  zipCode: string;

    EXPRESS --> OPENAI  primaryStore: string;

    EXPRESS --> POSTGRES  comparisonStore?: string;

```  selectedMeals: string[];          // ['breakfast', 'lunch', 'dinner']

  selectedDays: string[];           // ['Monday', 'Tuesday', ...]

**Production URLs**:  dietaryPreferences: string[];     // ['diabetic', 'vegetarian', ...]

- **Frontend**: https://meal-planner-app-chi.vercel.app  leftovers?: string[];             // ['chicken', 'broccoli']

- **Backend**: https://meal-planner-app-mve2.onrender.com  cuisines: string[];

- **Database**: Managed PostgreSQL on Render  people: number;

}

---```



## 📚 Related Documentation**Request Example:**

```json

- [README.md](./README.md) - Quick start guide{

- [QUICKSTART.md](./QUICKSTART.md) - Detailed setup instructions  "zipCode": "10001",

- [DEPLOY_TO_RENDER.md](./DEPLOY_TO_RENDER.md) - Backend deployment  "primaryStore": "Whole Foods Market",

- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Frontend deployment  "comparisonStore": "Trader Joe's",

- [MASTER_INDEX.md](./MASTER_INDEX.md) - Complete documentation index  "selectedMeals": ["breakfast", "dinner"],

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
