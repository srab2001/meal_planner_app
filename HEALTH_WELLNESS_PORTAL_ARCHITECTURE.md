# ASR Health & Wellness Portal - Complete Architecture Documentation

## Executive Summary

The ASR Health & Wellness Portal is a modular, multi-application health platform built on a unified architecture. It provides users with integrated tools for meal planning, nutrition tracking, fitness training, and personalized health coaching. The system uses a microservice-inspired frontend module architecture with a shared backend database and API layer.

**Portal URL**: https://meal-planner-gold-one.vercel.app  
**Backend API**: https://meal-planner-app-mve2.onrender.com  
**Database**: PostgreSQL (Render)

---

## 1. PORTAL ARCHITECTURE OVERVIEW

### 1.1 High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASR Health Portal                             │
│                  (Frontend - Vercel)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              App Switchboard (Router)                     │  │
│  │  ├─ Meal Planner Module                                  │  │
│  │  ├─ Nutrition Module                                     │  │
│  │  ├─ Fitness Module                                       │  │
│  │  ├─ Coaching Module                                      │  │
│  │  ├─ Progress Module                                      │  │
│  │  └─ Integrations Module                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│         ┌───────────────┴───────────────┐                      │
│         │                               │                      │
│    HTTP/REST API                  WebSocket (AI Chat)          │
│         │                               │                      │
└─────────┼───────────────────────────────┼──────────────────────┘
          │                               │
┌─────────┼───────────────────────────────┼──────────────────────┐
│         │          Backend (Render)     │                      │
│         ▼                               ▼                      │
│    ┌────────────────────────────────────────────┐             │
│    │    Express.js Server (server.js)           │             │
│    │  ├─ Auth (OAuth + JWT)                     │             │
│    │  ├─ Meal Plan Generation API               │             │
│    │  ├─ Nutrition API                          │             │
│    │  ├─ Fitness Routes                         │             │
│    │  ├─ AI Coach (OpenAI Integration)          │             │
│    │  ├─ Health Data (via Integrations)         │             │
│    │  └─ Payment Processing (Stripe)            │             │
│    └────────────────────────────────────────────┘             │
│                         │                                     │
│                         ▼                                     │
│    ┌────────────────────────────────────────────┐             │
│    │    PostgreSQL Database                     │             │
│    │  ├─ Users & Authentication                 │             │
│    │  ├─ Meal Plans & Recipes                   │             │
│    │  ├─ Nutrition Data                         │             │
│    │  ├─ Fitness Data (Profiles, Workouts)      │             │
│    │  ├─ User Preferences                       │             │
│    │  └─ Behavioral Data (Ads, Usage)           │             │
│    └────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Key Architecture Principles

1. **Modular Frontend**: Each application is a self-contained React module
2. **Unified Backend**: Single Express.js server with specialized routes
3. **Shared Database**: Single PostgreSQL instance serves all modules
4. **Token-Based Auth**: JWT authentication across all modules
5. **Component Reusability**: Shared UI components and utilities
6. **Feature Flags**: Gradual feature rollout per user segment

---

## 2. APPLICATIONS IN THE PORTAL

### 2.1 Meal Planner Application

#### A. Application Architecture

**Purpose**: Generate and manage personalized meal plans based on dietary preferences, health goals, and store availability.

**Frontend Structure**:
```
client/src/components/
├── MealPlanView.js              # Main meal plan display
├── Questionnaire.js             # User preferences form
├── ZIPCodeInput.js              # Location capture
├── StoreSelection.js            # Grocery store selection
├── RecipeCard.js                # Individual recipe component
├── PaymentPage.js               # Stripe integration
├── MealOfTheDay.js              # Daily meal highlight
└── HistoryMenu.js               # Past meal plans
```

**Key Features**:
- Meal plan generation via AI (OpenAI GPT)
- Support for dietary restrictions (vegetarian, vegan, etc.)
- Cuisine preferences configuration
- Local grocery store price lookup
- Favorite meal tracking
- Meal plan history (read-only)
- Special occasion meal customization

**Data Flow**:
```
User Input → Questionnaire → Backend API → OpenAI Integration 
    → Generated Meal Plan → Display in MealPlanView → Save to Database
```

#### B. Integration into Portal Architecture

**Entry Point**: `currentView === 'meal-planner'` in App.js  
**Navigation**: Via App Switchboard menu  
**Role**: Core application - first-time entry point for many users

**Interaction with Other Modules**:
- Provides recipe data to **Nutrition Module** for calorie/macro tracking
- Shares user dietary preferences with **Coaching Module**
- Supplies meal timing data to **Fitness Module** for workout scheduling
- Integrates with **Integrations Module** for health data context

#### C. Integration Points

**API Endpoints Used**:
- `POST /api/generate-meals` - Generate meal plan (requires meal preferences)
- `POST /api/regenerate-meal` - Regenerate single meal
- `POST /api/find-stores` - Lookup stores by ZIP code
- `POST /api/favorites/add` - Save favorite recipes
- `GET /api/favorites` - Retrieve saved recipes
- `DELETE /api/favorites/:id` - Remove favorite
- `POST /api/save-meal-plan` - Save plan history
- `GET /api/meal-plan-history` - Retrieve past plans

**Authentication**: Requires JWT token in Authorization header

**External Services**:
- OpenAI API for meal plan generation
- Google Maps API for store location (future)
- Grocery store pricing APIs (partner integrations)

#### D. Data Model

**Core Tables**:
- `users` - User profiles and authentication
- `user_preferences` - Dietary preferences, restrictions
- `meal_plan_history` - Saved meal plans per user
- `favorites` - User's favorite recipes
- `recipes` - Recipe database (implied via API responses)
- `meal_of_the_day` - Daily featured meal
- `cuisine_options` - Available cuisines
- `dietary_options` - Dietary restriction options

**Data Relationships**:
```
users
├─ user_preferences (1:1)
├─ meal_plan_history (1:N)
├─ favorites (1:N)
└─ user_activity (1:N)
```

**Shared Data Elements**:
- `users.id` - Links to all other modules
- `meal_plan_data` - Shared with Nutrition Module
- `recipe_nutritional_info` - Shared with Nutrition Module
- `user_preferences` - Shared with Coaching Module

---

### 2.2 Nutrition Module

#### A. Application Architecture

**Purpose**: Track and analyze nutritional intake, monitor macro/micronutrients, set nutrition goals.

**Frontend Structure**:
```
client/src/modules/nutrition/
├── index.js                     # Module exports
├── NutritionApp.js              # Main router
├── components/
│   ├── NutritionDashboard.js    # Overview & stats
│   ├── CalorieTracker.js        # Daily calorie log
│   ├── MacroAnalyzer.js         # Macro breakdown
│   ├── MealImport.js            # Import from meal plan
│   ├── GoalManager.js           # Set nutrition goals
│   └── NutritionReports.js      # Weekly/monthly analysis
└── styles/
    └── NutritionApp.css
```

**Key Features**:
- Daily calorie & macro tracking
- Manual food logging
- Import meals from Meal Planner
- Goal setting (calories, proteins, carbs, fats)
- Weekly/monthly nutritional reports
- Micronutrient analysis
- Meal timing optimization

**Data Flow**:
```
User Logs Food → CalorieTracker API → Nutrition Database 
    → Calculate Macros/Micros → Dashboard Display → Goals Comparison
```

#### B. Integration into Portal Architecture

**Entry Point**: `currentView === 'nutrition'` in App.js  
**Navigation**: Accessible from App Switchboard or Meal Planner module  
**Role**: Secondary application - enhances meal planning with tracking

**Interaction with Other Modules**:
- **Read from Meal Planner**: Recipes & nutritional data
- **Sends to Coaching Module**: Nutritional patterns, goals progress
- **Receives from Fitness Module**: Calorie burn data for net calorie calculations
- **Receives from Integrations Module**: Activity data for calorie burn estimation

#### C. Integration Points

**API Endpoints Used**:
- `GET /api/nutrition/daily` - Get daily nutrition summary
- `POST /api/nutrition/log-food` - Add food to daily log
- `GET /api/nutrition/goals` - User's nutrition goals
- `POST /api/nutrition/set-goal` - Create/update goal
- `GET /api/nutrition/weekly-report` - 7-day summary
- `POST /api/nutrition/import-meal` - Import from meal plan

**Data Sharing**:
- Reads meal data from Meal Planner (recipes, prepared meals)
- Subscribes to activity data from Fitness Module
- Reports patterns to Coaching Module

**External Services**:
- USDA FoodData Central API (nutrition database)
- MyFitnessPal API (optional future integration)

#### D. Data Model

**Core Tables**:
- `nutrition_goals` - User's nutrition targets
- `nutrition_logs` - Daily food entries
- `nutrition_daily_summary` - Aggregated daily stats
- `nutrition_weekly_report` - Weekly analysis
- `food_database` - Nutrition facts for foods
- `user_macros_history` - Historical macro tracking

**Data Relationships**:
```
users
├─ nutrition_goals (1:N)
├─ nutrition_logs (1:N)
│   └─ food_database (N:1)
└─ nutrition_daily_summary (1:N)
```

**Shared Data Elements**:
- `users.id` - Cross-module user reference
- `recipe_nutritional_data` - From Meal Planner
- `activity_calories_burned` - From Fitness Module
- `meal_timing` - From Meal Planner

---

### 2.3 Fitness Module

#### A. Application Architecture

**Purpose**: Create workout plans, track exercises, monitor fitness progress, and provide AI-powered workout coaching.

**Frontend Structure**:
```
client/src/modules/fitness/
├── index.js                     # Module exports
├── FitnessApp.js                # Main router
├── components/
│   ├── Dashboard.js             # Fitness overview
│   ├── WorkoutPlans.js          # Available programs
│   ├── ActiveWorkout.js         # Current session
│   ├── ExerciseLibrary.js       # Exercise database
│   ├── ProgressTracker.js       # Performance trends
│   ├── AIWorkoutCoach.js        # AI interview
│   ├── AIWorkoutInterview.js    # Interview Q&A flow
│   └── WorkoutHistory.js        # Past workouts
└── services/
    ├── fitnessAPI.js            # API calls
    └── workoutService.js        # Business logic
```

**Key Features**:
- AI-powered workout plan generation (via interview)
- Exercise library with instructions
- Set/rep/weight tracking
- Progressive overload monitoring
- Rest day recommendations
- Cardio vs. strength differentiation
- Workout history & analytics
- Recovery recommendations

**Data Flow**:
```
User Starts Interview → AIWorkoutInterview Questions → Backend AI 
    → Generate Workout Plan → Display in Dashboard → Track Progress
```

#### B. Integration into Portal Architecture

**Entry Point**: `currentView === 'fitness'` in App.js  
**Navigation**: Via App Switchboard menu  
**Role**: Secondary health optimization application

**Interaction with Other Modules**:
- **Sends to Meal Planner**: Workout type (affects macro ratios)
- **Sends to Nutrition Module**: Calorie burn estimates
- **Receives from Nutrition Module**: Calorie intake data
- **Sends to Coaching Module**: Fitness progress & goals
- **Receives from Integrations Module**: Activity/step data

#### C. Integration Points

**API Endpoints Used**:
- `GET /api/fitness/profile` - User fitness profile
- `POST /api/fitness/profile` - Create/update profile
- `GET /api/fitness/workouts` - List workouts
- `POST /api/fitness/workouts` - Create workout
- `GET /api/fitness/goals` - Fitness goals
- `POST /api/fitness/goals` - Set goals
- `GET /api/fitness/admin/interview-questions` - AI interview questions
- `POST /api/fitness/ai-interview` - Process interview responses
- `POST /api/fitness/ai-interview/generate-plan` - Generate plan from responses

**Authentication**: Requires JWT token + `SESSION_SECRET` verification

**External Services**:
- OpenAI API for workout planning
- Wearable API integrations (Apple Health, Google Fit)

#### D. Data Model

**Core Tables (Main Database)**:
- `fitness_profiles` - User fitness info (height, weight, age, gender)
- `fitness_goals` - Fitness targets
- `fitness_workouts` - Workout sessions
- `fitness_workout_exercises` - Exercise entries per workout
- `fitness_workout_sets` - Sets/reps for each exercise
- `admin_interview_questions` - AI interview questions
- `fitness_exercise_library` - Exercise database

**Separate Neon Database**:
- Fitness module maintains separate Neon PostgreSQL instance
- Shared main database for interview questions (needed by main API)

**Data Relationships**:
```
users
├─ fitness_profiles (1:1)
├─ fitness_goals (1:N)
└─ fitness_workouts (1:N)
    └─ fitness_workout_exercises (1:N)
        └─ fitness_workout_sets (1:N)
```

**Shared Data Elements**:
- `users.id` - Cross-module reference
- `admin_interview_questions` - Shared with main database
- `fitness_goals` - Shared with Coaching Module
- `workout_calories_burned` - Shared with Nutrition Module

**Schema Field Mappings** (Critical Fix):
```
admin_interview_questions table (migration 006):
- id: INT SERIAL (NOT UUID)
- question_text: TEXT (was: question)
- question_type: VARCHAR(50) (was: type)
- options: JSONB (was: STRING)
- order_position: INT (was: order)
- is_active: BOOLEAN (was: active)
```

---

### 2.4 Coaching Module

#### A. Application Architecture

**Purpose**: Provide AI-powered personalized health coaching through conversational AI, habit tracking, and SMART goal management.

**Frontend Structure**:
```
client/src/modules/coaching/
├── index.js                     # Module exports
├── CoachingApp.js               # Main router
├── components/
│   ├── CoachingDashboard.js     # Health score & overview
│   ├── CoachingChat.js          # AI chat interface
│   ├── HealthScore.js           # 0-100 metric visualization
│   ├── GoalManager.js           # SMART goals
│   ├── HabitTracker.js          # Daily habits
│   ├── CoachingPrograms.js      # Coaching programs
│   └── ProgressOverview.js      # Cross-module progress
└── styles/
    └── CoachingApp.css
```

**Key Features**:
- AI health coaching via chat (OpenAI)
- Health score calculation (0-100)
- SMART goal creation & tracking
- Daily habit logging
- Coaching programs (12-week plans)
- Cross-module context awareness
- Personalized recommendations
- Progress visualization

**Data Flow**:
```
User Selects Health Goal → CoachingApp Aggregates Portal Data 
    → Sends to AI Coach → OpenAI Generates Response 
    → Display in CoachingChat → Store Conversation History
```

#### B. Integration into Portal Architecture

**Entry Point**: `currentView === 'coaching'` in App.js  
**Navigation**: Via App Switchboard  
**Role**: Central health optimization engine - aggregates all data

**Interaction with Other Modules**:
- **Reads from Meal Planner**: Meal consistency, dietary adherence
- **Reads from Nutrition Module**: Macro compliance, calorie goals
- **Reads from Fitness Module**: Workout adherence, progress
- **Reads from Integrations Module**: Activity levels, sleep quality
- **Reads from Progress Module**: Streaks, achievements
- **Sends recommendations to**: All modules

#### C. Integration Points

**API Endpoints Used**:
- `POST /api/coaching/chat` - Send message to AI coach
- `GET /api/coaching/health-score` - Calculate current health score
- `POST /api/coaching/goals` - Create SMART goal
- `GET /api/coaching/goals` - List goals
- `POST /api/coaching/habits` - Log habit completion
- `GET /api/coaching/habits` - Get habit tracker
- `GET /api/coaching/program/:id` - Get coaching program
- `POST /api/coaching/feedback` - Store user feedback

**Context Data Aggregation**:
```javascript
const context = {
  userProfile: {name, age, goals, health_conditions},
  nutrition: {daily_calories, macro_adherence, daily_goals},
  fitness: {workouts_this_week, goals, progress},
  activity: {steps, sleep_quality, stress_level},
  habits: {completed_today, streak_count}
};
```

**External Services**:
- OpenAI API for conversation
- Google Health/Apple HealthKit for activity data (via Integrations)

#### D. Data Model

**Core Tables**:
- `coaching_conversations` - Chat history with AI
- `coaching_goals` - SMART goals created by users
- `coaching_goal_progress` - Goal completion tracking
- `coaching_habits` - Habit definitions
- `coaching_habit_logs` - Daily habit completion
- `coaching_programs` - Coaching programs (12-week, etc.)
- `coaching_program_progress` - User progress in programs
- `health_scores` - Calculated health score history

**Data Relationships**:
```
users
├─ coaching_conversations (1:N)
├─ coaching_goals (1:N)
│   └─ coaching_goal_progress (1:N)
├─ coaching_habits (1:N)
│   └─ coaching_habit_logs (1:N)
└─ coaching_program_progress (1:N)
```

**Shared Data Elements**:
- `users.id` - Cross-module reference
- `fitness_goals` - For fitness context
- `nutrition_goals` - For nutrition context
- `meal_plan_history` - For meal adherence
- `fitness_workouts` - For exercise consistency
- `user_activity` - For overall engagement

---

### 2.5 Progress Module

#### A. Application Architecture

**Purpose**: Gamify health journey with achievements, streaks, referrals, and social engagement.

**Frontend Structure**:
```
client/src/modules/progress/
├── index.js                     # Module exports
├── ProgressApp.js               # Main router
├── components/
│   ├── StreakTracker.js         # Daily streaks
│   ├── AchievementBadges.js     # Unlocked badges
│   ├── Leaderboard.js           # Social ranking
│   ├── ReferralProgram.js       # Invite friends
│   └── ProgressTimeline.js      # Achievement history
└── styles/
    └── ProgressApp.css
```

**Key Features**:
- Daily login streaks
- Achievement badges (first meal plan, 30-day fitness, etc.)
- Social leaderboards (optional)
- Referral program integration
- Progress timeline visualization
- Milestone celebrations
- Social sharing

#### B. Integration into Portal Architecture

**Entry Point**: Typically accessed from App Switchboard  
**Navigation**: Via badges/streaks displayed in other modules  
**Role**: Engagement & retention driver

**Interaction with Other Modules**:
- **Reads from All Modules**: Completion of actions
- **Triggers Notifications**: When achievements unlocked
- **Enables Sharing**: Social media integration

#### C. Integration Points

**API Endpoints Used**:
- `GET /api/progress/streaks` - Current streaks
- `POST /api/progress/check-in` - Daily check-in
- `GET /api/progress/badges` - Unlocked achievements
- `GET /api/progress/leaderboard` - Rankings
- `POST /api/progress/referral` - Generate invite link
- `POST /api/progress/referral/claim` - Claim referral reward

#### D. Data Model

**Core Tables**:
- `user_streaks` - Daily activity streaks
- `achievements` - Badge definitions
- `user_achievements` - Unlocked badges per user
- `referral_program` - Referral data
- `leaderboard_entries` - Rankings

**Data Relationships**:
```
users
├─ user_streaks (1:1)
└─ user_achievements (1:N)
```

---

### 2.6 Integrations Module

#### A. Application Architecture

**Purpose**: Connect health wearables and apps to import activity data (steps, sleep, heart rate).

**Frontend Structure**:
```
client/src/modules/integrations/
├── index.js                     # Module exports
├── IntegrationsApp.js           # Main UI
├── services/
│   ├── TokenStorage.js          # Secure credential storage
│   └── HealthDataService.js     # Provider connections
└── styles/
    └── IntegrationsApp.css
```

**Key Features**:
- Apple Health connection
- Google Fit connection
- Fitbit integration
- Oura Ring integration
- Steps import
- Sleep data import
- Heart rate tracking
- Secure credential storage
- Disconnection & data deletion

#### B. Integration into Portal Architecture

**Entry Point**: Settings/Integrations in App Switchboard  
**Navigation**: Optional feature for enhanced tracking  
**Role**: Data enrichment from external sources

**Interaction with Other Modules**:
- **Sends to Fitness Module**: Activity level, recovery data
- **Sends to Nutrition Module**: Activity for calorie burn
- **Sends to Coaching Module**: Sleep, stress, activity metrics

#### C. Integration Points

**API Endpoints Used**:
- `POST /api/integrations/connect/:provider` - Connect provider
- `POST /api/integrations/disconnect/:provider` - Disconnect
- `GET /api/integrations/status` - Connection status
- `POST /api/integrations/sync` - Trigger data sync
- `GET /api/integrations/activity` - Activity data
- `GET /api/integrations/sleep` - Sleep data

**External Services**:
- Apple HealthKit API
- Google Fit API
- Fitbit Web API
- Oura Ring API

#### D. Data Model

**Core Tables**:
- `health_integrations` - Provider connections
- `health_data_imports` - Import history
- `steps_data` - Daily steps
- `sleep_data` - Sleep records
- `heart_rate_data` - HR measurements

**Data Relationships**:
```
users
├─ health_integrations (1:N)
├─ steps_data (1:N)
├─ sleep_data (1:N)
└─ heart_rate_data (1:N)
```

**Shared Data Elements**:
- `activity_data` - Shared with all modules
- `sleep_quality` - Shared with Coaching Module

---

## 3. PORTAL-LEVEL SHARED INFRASTRUCTURE

### 3.1 Shared Components

```
client/src/shared/
├── components/
│   ├── AppShell.js              # Common layout wrapper
│   ├── Header.js                # Unified header
│   ├── Sidebar.js               # Navigation sidebar
│   ├── AppSwitchboard.js        # Module selector
│   ├── LoadingSpinner.js        # Loading states
│   ├── ErrorBoundary.js         # Error handling
│   ├── ProtectedRoute.js        # Auth guard
│   └── NotificationCenter.js    # Toast notifications
├── hooks/
│   ├── useAuth.js               # Authentication context
│   ├── useApi.js                # API call wrapper
│   ├── useTheme.js              # Theme switching
│   ├── useNotification.js       # Toast management
│   └── useHealthScore.js        # Health metrics
├── context/
│   ├── AuthContext.js           # Auth state
│   ├── ThemeContext.js          # Theme state
│   └── PortalContext.js         # Cross-module state
├── utils/
│   ├── api.js                   # API client
│   ├── formatters.js            # Data formatting
│   ├── validators.js            # Input validation
│   └── constants.js             # Shared constants
└── styles/
    ├── theme.css                # Design tokens
    ├── App.css                  # Global styles
    └── utilities.css            # Utility classes
```

### 3.2 Authentication System

**Flow**:
```
1. User visits portal (Vercel)
2. OAuth redirect to Google/Email
3. Backend creates JWT with SESSION_SECRET
4. Token stored in localStorage
5. All API requests include token in Authorization header
6. Backend verifies token with SESSION_SECRET
```

**Implementation**:
- Main Server: `JWT_SECRET = SESSION_SECRET`
- Fitness Routes: `JWT_SECRET = SESSION_SECRET || JWT_SECRET`
- Token included in: `Authorization: Bearer <token>`

### 3.3 Data Sharing Patterns

**Pattern 1: Direct Data Pass**
```javascript
// Meal Planner passes recipe data to Nutrition Module
<NutritionApp mealData={selectedMeal} />
```

**Pattern 2: Shared Context**
```javascript
// PortalContext provides user state to all modules
const {user, healthScore, preferences} = useContext(PortalContext);
```

**Pattern 3: API Aggregation**
```javascript
// Coaching Module aggregates data from all modules
const coachingContext = {
  nutritionData: await api.nutrition.getDaily(),
  fitnessData: await api.fitness.getProfile(),
  activityData: await api.integrations.getActivity()
};
```

### 3.4 Shared Database Schema

**Core User Tables**:
- `users` - All user accounts
- `session` - Active sessions
- `user_preferences` - Cross-module preferences
- `user_activity` - User action tracking
- `usage_stats` - Portal analytics

**Cross-Module Tables**:
- `admin_interview_questions` - Fitness AI questions
- `meal_of_the_day` - Daily featured content
- `favorites` - Saved content across modules
- `app_settings` - Portal configuration

---

## 4. DATA INTEGRATION & SHARED ELEMENTS

### 4.1 Cross-Module Data Flow

```
Meal Planner
    ↓ (recipes, nutrition facts)
Nutrition Module
    ↓ (macro adherence, calories)
Fitness Module
    ↓ (calorie burn, workout type)
Coaching Module (Central Hub)
    ↓ (recommendations)
All Modules (Updated goals, habits)
```

### 4.2 Shared User Properties

| Property | Source | Used By | Purpose |
|----------|--------|---------|---------|
| `user.id` | OAuth | All | User identification |
| `user.email` | OAuth | All | Notifications, login |
| `user.preferences` | Meal Planner | Nutrition, Fitness, Coaching | Dietary/fitness context |
| `user.goals` | Coaching | All | Personalization |
| `user.activity_level` | Fitness + Integrations | Nutrition, Coaching | Calorie estimates |
| `user.health_conditions` | Coaching | All | Safety & recommendations |

### 4.3 Shared Data Assets

| Asset | Owned By | Read By | Format |
|-------|----------|---------|--------|
| Recipes | Meal Planner API | Nutrition Module | JSON with macro data |
| Nutrition Facts | Meal Planner API | Nutrition, Coaching | Calorie, macro, micro breakdown |
| Interview Questions | Database (migration 006) | Fitness Module | JSON array |
| Health Score | Coaching Module | All | Single 0-100 metric |
| Activity Data | Integrations Module | Nutrition, Fitness, Coaching | Time-series data |

---

## 5. DEPLOYMENT & INFRASTRUCTURE

### 5.1 Frontend Deployment
- **Platform**: Vercel
- **URL**: https://meal-planner-gold-one.vercel.app
- **Built from**: `client/src/`
- **Environment**: React SPA
- **Deployment**: Auto on Git push

### 5.2 Backend Deployment
- **Platform**: Render
- **URL**: https://meal-planner-app-mve2.onrender.com
- **Built from**: `server.js`
- **Environment**: Node.js/Express
- **Database**: PostgreSQL (Render)
- **Health Check**: `/health` endpoint

### 5.3 Database
- **Provider**: Render PostgreSQL
- **Database**: meal_planner_vo27
- **Migrations**: `migrations/` folder
- **Backup**: Automated daily
- **Shared by**: Main server + all modules

### 5.4 Environment Variables

**Frontend (.env)**:
```
REACT_APP_API_BASE=https://meal-planner-app-mve2.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=<client-id>
REACT_APP_STRIPE_PUBLISHABLE_KEY=<key>
```

**Backend (.env)**:
```
DATABASE_URL=postgresql://<user>:<pass>@host:5432/meal_planner_vo27
SESSION_SECRET=<32-char-random>
JWT_SECRET=<same-as-session-secret>
OPENAI_API_KEY=<openai-key>
STRIPE_SECRET_KEY=<stripe-key>
GOOGLE_CLIENT_ID=<google-id>
GOOGLE_CLIENT_SECRET=<google-secret>
FRONTEND_BASE=https://meal-planner-gold-one.vercel.app
```

**Critical Note**: Fitness routes must use `SESSION_SECRET` for JWT verification to match the main server.

---

## 6. CRITICAL ARCHITECTURE DECISIONS

### 6.1 Single Database for All Modules
**Decision**: Use one PostgreSQL database for all modules  
**Rationale**: Simplifies cross-module data sharing, reduces infrastructure complexity  
**Trade-off**: Cannot independently scale modules, shared resource contention

### 6.2 Interview Questions in Main Database
**Decision**: `admin_interview_questions` table lives in main database, not fitness Neon DB  
**Rationale**: Questions used by fitness API served through main backend  
**Implementation**: Fitness routes explicitly query main `DATABASE_URL`

### 6.3 JWT Secret Consistency
**Decision**: All modules use `SESSION_SECRET` for token verification  
**Rationale**: Simplifies auth, prevents signature verification failures  
**Implementation**: Main server signs with `SESSION_SECRET`, fitness routes verify with `SESSION_SECRET`

### 6.4 Modular Frontend Architecture
**Decision**: Each application is independent React module  
**Rationale**: Allows independent development, testing, and deployment  
**Trade-off**: Code duplication in components, need for shared utilities

### 6.5 Shared Context Over Props Drilling
**Decision**: Use Context API for portal-wide state (user, health score)  
**Rationale**: Avoids prop drilling through 5+ module levels  
**Implementation**: `PortalContext` provides auth, user, and shared state

---

## 7. DATA FLOW DIAGRAMS

### 7.1 Meal Generation Flow

```
User Fills Questionnaire
        ↓
POST /api/generate-meals {preferences}
        ↓
Backend: Calls OpenAI with preferences
        ↓
OpenAI: Generates meal plan JSON
        ↓
Backend: Looks up recipe nutrition data
        ↓
Backend: Calculates costs via store APIs
        ↓
Backend: Returns {meals, recipes, costs, nutrition}
        ↓
Frontend: Stores in localStorage & database
        ↓
Display in MealPlanView
        ↓
User can save to meal_plan_history
```

### 7.2 Health Score Calculation Flow

```
Coaching Module Requests Health Score
        ↓
Aggregates from all modules:
├─ Nutrition Adherence (0-25 points)
│   ├─ Calorie goal compliance
│   └─ Macro distribution
├─ Fitness Consistency (0-25 points)
│   ├─ Workout frequency
│   └─ Progressive overload
├─ Activity Level (0-20 points)
│   └─ Steps/daily activity
├─ Sleep Quality (0-15 points)
│   └─ From Integrations Module
└─ Stress Management (0-15 points)
    └─ From Coaching habits
        ↓
Total: 0-100 score
        ↓
Display in CoachingDashboard
        ↓
Store in health_scores table
```

### 7.3 AI Coaching Context Flow

```
User Chats with Coach
        ↓
Coaching Module Gathers Context:
├─ Current health score
├─ Recent meal adherence
├─ Workout completion rate
├─ Sleep quality (last 7 days)
├─ Active goals
└─ Recent habit logs
        ↓
Constructs system prompt with context
        ↓
POST /api/coaching/chat {message, context}
        ↓
Backend: Calls OpenAI with context
        ↓
OpenAI: Generates personalized response
        ↓
Backend: Stores in coaching_conversations
        ↓
Frontend: Displays in CoachingChat UI
```

---

## 8. CRITICAL FIXES & LESSONS LEARNED

### 8.1 Fitness Module Schema Alignment (2025-12-23)

**Problem**: Interview questions endpoint returned 404  
**Root Cause**: Multiple schema mismatches

**Issue 1: Field Names Mismatch**
```
Database (migration 006):  question_text, question_type, order_position, is_active
Prisma Model (old):        question, type, order, active
API Endpoints (old):       Used old field names
```

**Fix Applied**:
- Updated both Prisma schemas to match database
- Fixed all CRUD endpoints to use correct field names
- Updated request body validation

**Issue 2: Prisma Type Annotation Error**
```
Error: @db.Jsonb not supported for postgresql connector
Solution: Use Json? without @db.Jsonb annotation
```

**Issue 3: JWT Token Verification Failure**
```
Problem: Token signature invalid
Cause:   Main server signs with SESSION_SECRET
         Fitness routes verified with JWT_SECRET (different variable)
Fix:     Updated fitness routes to use SESSION_SECRET
```

### 8.2 Lessons Learned

1. **Schema Consistency**: Database schema source of truth, all code must match
2. **Secret Management**: All JWT operations must use same secret across services
3. **Type Safety**: Prisma annotations must match database capabilities
4. **Testing in Staging**: Test all modules together before production deployment
5. **Documentation**: Keep field mappings documented for future refactoring

---

## 9. API REFERENCE SUMMARY

### 9.1 Meal Planner APIs
```
POST   /api/generate-meals          Generate new meal plan
POST   /api/regenerate-meal         Regenerate single meal
POST   /api/find-stores             Find grocery stores
POST   /api/favorites/add           Save favorite recipe
GET    /api/favorites               Get saved recipes
DELETE /api/favorites/:id           Remove favorite
POST   /api/save-meal-plan          Save plan to history
GET    /api/meal-plan-history       Get past plans
```

### 9.2 Nutrition APIs
```
GET    /api/nutrition/daily         Daily summary
POST   /api/nutrition/log-food      Log food item
GET    /api/nutrition/goals         User goals
POST   /api/nutrition/set-goal      Create goal
GET    /api/nutrition/weekly-report 7-day report
POST   /api/nutrition/import-meal   Import from meal plan
```

### 9.3 Fitness APIs
```
GET    /api/fitness/profile         Get fitness profile
POST   /api/fitness/profile         Create/update profile
GET    /api/fitness/workouts        List workouts
POST   /api/fitness/workouts        Create workout
GET    /api/fitness/goals           Get fitness goals
POST   /api/fitness/goals           Set goals
GET    /api/fitness/admin/interview-questions    AI questions
POST   /api/fitness/ai-interview    Process interview
POST   /api/fitness/ai-interview/generate-plan   Generate plan
```

### 9.4 Coaching APIs
```
POST   /api/coaching/chat           Send chat message
GET    /api/coaching/health-score   Calculate health score
POST   /api/coaching/goals          Create SMART goal
GET    /api/coaching/goals          List goals
POST   /api/coaching/habits         Log habit
GET    /api/coaching/habits         Get habits
```

### 9.5 Integrations APIs
```
POST   /api/integrations/connect/:provider      Connect provider
POST   /api/integrations/disconnect/:provider   Disconnect
GET    /api/integrations/status                 Connection status
POST   /api/integrations/sync                   Sync data
GET    /api/integrations/activity               Activity data
GET    /api/integrations/sleep                  Sleep data
```

---

## 10. FUTURE ROADMAP

### Phase 1 (Current)
- ✅ Meal Planner
- ✅ Nutrition Module
- ✅ Fitness Module (MVP with AI Coach)
- ✅ Coaching Module (Basic)
- ✅ Integrations Module (Beta)

### Phase 2 (Q1 2026)
- Enhanced AI personalization
- Social features (leaderboards, friend challenges)
- Advanced analytics dashboards
- Mobile app (React Native)
- Wearable integrations (expanded)

### Phase 3 (Q2 2026)
- Sleep optimization module
- Stress management module
- Food journal with photos
- Video exercise library
- Community challenges

### Phase 4 (Q3 2026)
- Enterprise B2B offering
- White-label solutions
- API for third-party integrations
- Advanced biomarker tracking
- Professional coaching network

---

## 11. SUPPORT & MAINTENANCE

**Documentation Locations**:
- Architecture: This document
- Nutrition Module: `NUTRITION_MODULE_DESIGN.md`
- Coaching Module: `docs/coaching_module.md`
- Fitness Module: `fitness/docs/FITNESS_COMPONENT_ARCHITECTURE.md`
- Database Schema: `prisma/schema.prisma`
- Migrations: `migrations/` directory

**Common Issues & Fixes**:
- **404 on fitness endpoints**: Check `SESSION_SECRET` environment variable
- **Token verification failed**: Ensure same secret used across modules
- **Data not syncing**: Verify API endpoint and user authentication
- **Performance issues**: Check database query indexes, consider caching

---

**Document Version**: 1.0  
**Last Updated**: December 23, 2025  
**Maintained By**: Development Team  
**Status**: Production Ready ✅
