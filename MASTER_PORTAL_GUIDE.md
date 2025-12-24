# ASR Health & Wellness Portal - Complete Master Document

**Last Updated:** December 23, 2025  
**Status:** ✅ Production Ready  
**Version:** 1.0 - Complete

---

## Executive Summary

The ASR Health & Wellness Portal is a comprehensive, integrated platform serving users across six interconnected applications. All users share a unified authentication system, centralized database, and seamless data flow between modules.

| Aspect | Details |
|--------|---------|
| **Frontend** | React SPA on Vercel (meal-planner-gold-one.vercel.app) |
| **Backend** | Express.js REST API on Render |
| **Database** | PostgreSQL on Render (meal_planner_vo27) |
| **Authentication** | OAuth2 (Google) + JWT (SESSION_SECRET) |
| **Payment** | Stripe for premium features |
| **AI** | OpenAI GPT API for meal plans, coaching, workouts |

---

## System Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                         │
│              React SPA - meal-planner-gold-one               │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │  Meal    │ Nutrition│ Fitness  │ Coaching │ Progress │   │
│  │ Planner  │  Module  │  Module  │  Module  │  Module  │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────────┐
│              BACKEND (Render - Node.js)                      │
│            meal-planner-app-mve2.onrender.com               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Express.js REST API                        │   │
│  │  • /api/users/* - Authentication & profiles         │   │
│  │  • /api/meals/* - Meal planning                      │   │
│  │  • /api/recipes/* - Recipe management                │   │
│  │  • /api/nutrition/* - Tracking & analytics           │   │
│  │  • /api/fitness/* - Workouts & AI coach              │   │
│  │  • /api/coaching/* - Health coaching                 │   │
│  │  • /api/progress/* - Goals & gamification            │   │
│  │  • /api/integrations/* - Wearable devices            │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ TCP/5432
┌────────────────────▼────────────────────────────────────────┐
│         DATABASE (PostgreSQL on Render)                      │
│               meal_planner_vo27                              │
│  • Users & authentication                                    │
│  • Recipes & meal plans                                      │
│  • Nutrition tracking                                        │
│  • Fitness profiles & workouts                               │
│  • Interview questions for AI coach                          │
│  • Health coaching sessions                                  │
│  • Progress milestones & streaks                             │
│  • Integrations & wearable data                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Six Core Applications

### 1. Meal Planner
**Purpose:** Create personalized meal plans based on nutrition goals  
**Key Features:**
- AI-powered meal generation via OpenAI
- Recipe browsing and management
- Dietary preference filtering (vegan, keto, gluten-free, etc.)
- Nutritional information display
- Shareable meal plans
- Integration with nutrition tracking

**Database Tables:**
- `meal_plans` - Generated meal plans
- `recipes` - Recipe database
- `user_preferences` - Dietary preferences
- `meal_plan_recipes` - Plan-recipe associations

**Critical APIs:**
- `POST /api/meals/generate` - Generate meal plan (OpenAI)
- `GET /api/meals/{id}` - Get specific meal plan
- `GET /api/recipes` - Search recipes
- `POST /api/meals/{id}/share` - Share meal plan

---

### 2. Nutrition Module
**Purpose:** Track daily nutrition intake and analyze against goals  
**Key Features:**
- Food logging (manual entry or barcode scanning)
- Macro and micronutrient tracking
- Daily/weekly nutrition summaries
- Visual charts and progress graphs
- Comparison with AI-recommended targets
- Integration with meal plans

**Database Tables:**
- `nutrition_logs` - Daily nutrition entries
- `nutrition_goals` - User targets
- `food_database` - Nutrition data for foods
- `nutrition_analytics` - Aggregated stats

**Critical APIs:**
- `POST /api/nutrition/log` - Log food intake
- `GET /api/nutrition/summary` - Daily/weekly stats
- `GET /api/nutrition/compare-to-plan` - vs meal plan
- `GET /api/nutrition/analytics` - Historical data

---

### 3. Fitness Module
**Purpose:** AI-powered workout coaching and fitness tracking  
**Key Features:**
- **AI Workout Coach**: Interview-based questionnaire → Personalized plan
- **Workout Logging**: Log exercises, sets, reps, duration
- **Progress Tracking**: Stats, charts, goal monitoring
- **Interview Questions**: Admin-managed, stored in DB
- **Wearable Integration**: Apple Health, Google Fit, Fitbit, Oura Ring

**Database Tables:**
- `admin_interview_questions` - AI coach questions (MAIN DB, not Neon)
- `fitness_profiles` - User fitness data
- `workouts` - Logged workouts
- `fitness_goals` - User targets
- `wearable_integrations` - Device connections

**Critical APIs:**
- `GET /api/fitness/admin/interview-questions?active=true` - Fetch questions
- `POST /api/fitness/ai-interview` - Submit answers, generate plan
- `POST /api/fitness/workouts` - Log workout
- `GET /api/fitness/profile` - Get fitness profile
- `GET /api/fitness/integrations` - Connected wearables

**Frontend Components:**
```
AICoach.jsx
├── Fetch questions from DB
├── Display question flow
├── Collect answers (text/multiple-choice/rating)
└── POST answers → OpenAI → Get workout plan

Dashboard.jsx
├── User profile summary
├── Stats grid (total workouts, duration, goals)
├── Active goals section
└── Recent workouts list

AdminQuestions.jsx (Admin only)
├── List all questions
├── Add new question (CRUD)
├── Edit existing
└── Delete/toggle active
```

**Critical Detail:** Interview questions table is in **MAIN database** (not Neon fitness DB)
- Actual columns: `question_text`, `question_type`, `order_position`, `is_active`
- ID: INT SERIAL (autoincrement)
- Fetch endpoint: `/api/fitness/admin/interview-questions?active=true`

---

### 4. Coaching Module
**Purpose:** AI-powered health coaching with personalized guidance  
**Key Features:**
- Context-aware AI coaching (aggregates data from all modules)
- Personalized health recommendations
- Motivational messages and habit tracking
- Integration with nutrition, fitness, and progress data
- Streak tracking for consistency

**Database Tables:**
- `coaching_sessions` - AI interactions
- `coaching_recommendations` - Generated advice
- `health_habits` - Tracked behaviors
- `habit_streaks` - Consistency tracking

**Critical APIs:**
- `POST /api/coaching/get-advice` - Get AI recommendation
- `GET /api/coaching/context` - Aggregate user data
- `POST /api/coaching/log-habit` - Track behavior
- `GET /api/coaching/streaks` - View streaks

---

### 5. Progress Module
**Purpose:** Gamification, goal tracking, and milestone celebration  
**Key Features:**
- Goal setting and tracking
- Achievement badges
- Streak tracking for consistency
- Progress charts and milestones
- Point system and leaderboards
- Monthly/quarterly challenges

**Database Tables:**
- `goals` - User-defined goals
- `achievements` - Earned badges
- `streaks` - Consistency tracking
- `milestones` - Significant achievements
- `points` - Gamification points

**Critical APIs:**
- `POST /api/progress/goals` - Create goal
- `GET /api/progress/achievements` - View badges
- `GET /api/progress/streaks` - View streaks
- `POST /api/progress/log-milestone` - Record achievement

---

### 6. Integrations Module
**Purpose:** Connect with external health and fitness devices  
**Key Features:**
- Wearable device connections (Apple Health, Google Fit, Fitbit, Oura Ring)
- Automatic health data sync
- Integration with fitness and nutrition tracking
- Real-time step count and sleep data
- Heart rate and activity monitoring

**Database Tables:**
- `wearable_integrations` - Connected devices
- `wearable_data` - Synced health data
- `integration_logs` - Sync history

**Critical APIs:**
- `POST /api/integrations/connect` - Add wearable device
- `GET /api/integrations/data` - Fetch synced data
- `POST /api/integrations/sync` - Manual sync
- `DELETE /api/integrations/{device}` - Remove device

---

## Data Integration & Cross-Module Flows

### User Profile (Central Hub)
All modules share a unified user profile:
```
User
├── Authentication (OAuth2 + JWT)
├── Personal Info (name, email, age, preferences)
├── Health Profile
│   ├── Fitness level
│   ├── Height, weight, body metrics
│   ├── Health conditions
│   └── Dietary preferences
└── Device Connections
    ├── Wearables (Apple Health, Google Fit, etc.)
    └── Third-party integrations
```

### Meal Planner → Nutrition Module
```
1. User generates meal plan (Meal Planner)
2. Plan recipes sent to Nutrition Module
3. Daily goals auto-calculated from recipes
4. User logs food intake
5. Compare logged nutrition vs plan targets
6. Feedback loop to adjust future plans
```

### Fitness → Coaching → Progress
```
1. User completes AI interview (Fitness)
2. Workout plan generated (OpenAI)
3. Coaching module monitors progress
4. AI coach provides real-time guidance
5. Achievements unlocked (Progress)
6. Streaks tracked for motivation
7. Leaderboard updated with points
```

### Nutrition + Fitness → Health Coaching
```
AI Health Coach aggregates:
├── Daily calorie intake (Nutrition)
├── Workout completion (Fitness)
├── Goal progress (Progress)
├── Wearable data (Integrations)
├── Sleep quality (Wearables)
├── Activity level (Wearables)
└── Habit streaks (Progress)

Then generates:
├── Personalized recommendations
├── Motivational messages
├── Adjustment suggestions
└── Next-day guidance
```

---

## Authentication & Security

### JWT Token Flow
```
┌─────────────┐
│  User Logs  │
│   In with   │
│   Google    │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  Backend creates JWT token               │
│  Signed with: SESSION_SECRET env var     │
│  Payload: { user_id, email, role, exp }  │
└──────────────┬─────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Frontend stores in localStorage         │
│  All API requests include:               │
│  Authorization: Bearer <JWT_TOKEN>       │
└──────────────┬─────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Backend middleware verifies token       │
│  Signature verified with SESSION_SECRET  │
│  User ID extracted for query scoping     │
└──────────────────────────────────────────┘
```

**Critical:** All modules must use same `SESSION_SECRET` for token verification (fixed in commit 1b70553)

### User Data Isolation
```sql
-- All queries automatically scoped to user
WHERE user_id = $1  -- Current authenticated user
```

---

## API Reference Summary

### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/users/auth/google` | Initiate OAuth |
| POST | `/api/users/auth/callback` | Handle OAuth callback |
| POST | `/api/users/logout` | Logout user |
| GET | `/api/users/profile` | Get user profile |

### Meal Planning
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/meals/generate` | Generate meal plan (OpenAI) |
| GET | `/api/meals/{id}` | Get specific plan |
| GET | `/api/recipes` | Search recipes |
| POST | `/api/meals/{id}/share` | Share plan |

### Nutrition
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/nutrition/log` | Log food intake |
| GET | `/api/nutrition/summary` | Daily/weekly stats |
| GET | `/api/nutrition/compare-to-plan` | vs meal plan |
| GET | `/api/nutrition/analytics` | Historical data |

### Fitness
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/fitness/admin/interview-questions?active=true` | Get questions |
| POST | `/api/fitness/ai-interview` | Submit answers → plan |
| POST | `/api/fitness/workouts` | Log workout |
| GET | `/api/fitness/profile` | User fitness data |
| GET | `/api/fitness/goals` | User goals |

### Coaching
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/coaching/get-advice` | Get AI recommendation |
| GET | `/api/coaching/context` | Aggregate user data |
| POST | `/api/coaching/log-habit` | Track behavior |

### Progress
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/progress/goals` | Create goal |
| GET | `/api/progress/achievements` | View badges |
| GET | `/api/progress/streaks` | View streaks |

### Integrations
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/integrations/connect` | Add wearable device |
| GET | `/api/integrations/data` | Fetch synced data |
| POST | `/api/integrations/sync` | Manual sync |

---

## Database Schema Overview

### Core Tables
```
users
├── id (UUID)
├── email
├── name
├── age
├── fitness_level
├── dietary_preferences
└── created_at

recipes
├── id (UUID)
├── title
├── ingredients
├── instructions
├── nutrition_info (JSON)
└── tags (array)

meal_plans
├── id (UUID)
├── user_id (FK: users)
├── title
├── meals (JSON array)
├── created_at
└── shared_with (array)
```

### Fitness-Specific Tables
```
admin_interview_questions (MAIN DB)
├── id (INT SERIAL)
├── question_text
├── question_type (text/multiple-choice/rating)
├── order_position
├── is_active
└── created_at

fitness_profiles
├── id (UUID)
├── user_id (FK: users)
├── fitness_level
├── height
├── weight
└── updated_at

workouts
├── id (UUID)
├── user_id (FK: users)
├── title
├── duration
├── intensity
└── created_at
```

### Tracking Tables
```
nutrition_logs
├── id (UUID)
├── user_id (FK: users)
├── food_item
├── calories
├── macros (JSON)
└── logged_at

achievements
├── id (UUID)
├── user_id (FK: users)
├── badge_name
├── unlocked_at
└── points

streaks
├── id (UUID)
├── user_id (FK: users)
├── habit_name
├── current_count
└── last_logged
```

---

## Deployment Architecture

### Frontend Deployment (Vercel)
```
meal-planner-gold-one.vercel.app
├── React SPA
├── All 6 applications bundled
├── Automatic HTTPS
├── CDN distribution
└── GitHub auto-deploy on push
```

### Backend Deployment (Render)
```
meal-planner-app-mve2.onrender.com
├── Node.js Express server
├── Environment variables:
│   ├── SESSION_SECRET (JWT signing key)
│   ├── DATABASE_URL (PostgreSQL connection)
│   ├── OPENAI_API_KEY (AI features)
│   ├── STRIPE_SECRET_KEY (payments)
│   └── GOOGLE_OAUTH_* (authentication)
├── Automatic HTTPS
└── PostgreSQL connection pooling
```

### Database (PostgreSQL on Render)
```
meal_planner_vo27
├── 20+ tables
├── 50+ indexes for performance
├── SSL encryption
├── Automated backups
└── Connection pooling via PgBouncer
```

---

## Recent Critical Fixes

| Commit | Issue | Fix | Impact |
|--------|-------|-----|--------|
| 1b70553 | JWT verification failing | Use SESSION_SECRET in fitness routes | ✅ Fixed 404 errors |
| 398f273 | Unsupported Prisma type | Removed @db.Jsonb annotation | ✅ Build successful |
| 3b289d3 | Schema field mismatch | Updated ALL endpoint field names | ✅ AI Coach working |
| 6d9daec | Missing fitness screens | Built complete fitness app | ✅ All screens ready |
| 4d26828 | CI failing | Synced package-lock.json | ✅ CI passing |

---

## Environment Variables (Required)

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db_name

# Authentication
SESSION_SECRET=<random-secret-key>
GOOGLE_OAUTH_CLIENT_ID=<from Google Cloud>
GOOGLE_OAUTH_CLIENT_SECRET=<from Google Cloud>

# AI & Integrations
OPENAI_API_KEY=<from OpenAI>
STRIPE_SECRET_KEY=<from Stripe>
STRIPE_PUBLIC_KEY=<from Stripe>

# Frontend
REACT_APP_API_URL=https://meal-planner-app-mve2.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=<matches backend>

# Fitness Frontend (if separate)
REACT_APP_API_URL=https://meal-planner-app-mve2.onrender.com
```

---

## Performance Metrics

| Component | Metric | Target |
|-----------|--------|--------|
| Frontend Load Time | First Contentful Paint | < 2s |
| API Response Time | Avg | < 200ms |
| Database Query Time | Avg | < 100ms |
| JWT Verification | Per request | < 5ms |
| AI Plan Generation | Meal plan | < 10s |
| Wearable Sync | Per device | < 30s |

---

## Testing Status

### CI/CD Pipeline
- ✅ GitHub Actions: Lint & Code Quality
- ✅ npm ci: Dependency installation
- ✅ Build verification: Vite build succeeds
- ✅ ESLint: No code quality issues

### Backend Tests
- ✅ JWT token verification
- ✅ Interview questions CRUD
- ✅ API endpoint responses
- ✅ User data isolation
- ✅ Database connection pooling

### Frontend Tests
- ✅ React component rendering
- ✅ API call integration
- ✅ Token injection in headers
- ✅ Error handling & retry logic
- ✅ Responsive design (mobile/tablet/desktop)

---

## Monitoring & Maintenance

### Key Monitoring Points
```
Backend (Render)
├── Server uptime & response times
├── Database connection health
├── JWT verification success rate
├── API error logs
└── OpenAI API rate limits

Frontend (Vercel)
├── Bundle size trends
├── Error tracking
├── User session tracking
└── Performance metrics

Database (Render)
├── Connection pool status
├── Query performance
├── Backup status
└── Disk usage
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 404 on fitness endpoints | JWT verification failing | Check SESSION_SECRET match |
| Meal plan generation fails | OpenAI API limit | Wait or upgrade API plan |
| Wearable sync not working | Device connection lost | Re-authenticate device |
| Slow nutrition queries | Missing indexes | Run migration to add indexes |
| Login failing | Session expired | Clear localStorage, login again |

---

## Future Roadmap

**Phase 6 (Q1 2026):**
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Social features (friend challenges)
- [ ] Voice-controlled meal logging
- [ ] Expanded wearable integrations

**Phase 7 (Q2 2026):**
- [ ] Meal prep planning
- [ ] Grocery list generation
- [ ] Restaurant menu integration
- [ ] Supplement recommendations
- [ ] Advanced habit tracking

**Phase 8 (Q3 2026):**
- [ ] Telemedicine integration
- [ ] Insurance partner integrations
- [ ] Corporate wellness programs
- [ ] API marketplace
- [ ] White-label solution

---

## Quick Start for Developers

### Local Development
```bash
# Clone repo
git clone https://github.com/srab2001/meal_planner_app.git
cd meal_planner_app

# Install dependencies
npm install
cd client && npm install && cd ..
cd fitness/frontend && npm install && cd ../..

# Set up environment
cp .env.example .env
# Edit .env with your secrets

# Start services
npm start                    # Main backend
cd fitness/backend && npm start  # Fitness backend (separate)
cd client && npm start      # Frontend (port 3000)

# Visit http://localhost:3000
```

### Production Deployment
```bash
# Everything auto-deploys via GitHub
git push origin main
# → GitHub Actions triggers
# → Render rebuilds backend
# → Vercel rebuilds frontend
# → Changes live in 5-10 minutes
```

---

## Support & Documentation

- **Architecture Details**: See `HEALTH_WELLNESS_PORTAL_ARCHITECTURE.md`
- **Quick Reference**: See `PORTAL_QUICK_REFERENCE.md`
- **Fitness App**: See `FITNESS_APP_BUILD_COMPLETE.md`
- **Issue Fixes**: See `FITNESS_APP_FIXES_QUICK_REF.md`
- **API Docs**: See inline code comments in `src/` and backend routes

---

## Contact & Resources

- **Repository**: https://github.com/srab2001/meal_planner_app
- **Frontend**: https://meal-planner-gold-one.vercel.app
- **Backend**: https://meal-planner-app-mve2.onrender.com
- **Documentation**: In repo root (*.md files)

**Last Updated:** December 23, 2025  
**Portal Status:** ✅ **Production Ready**  
**Next Review:** Q4 2025
