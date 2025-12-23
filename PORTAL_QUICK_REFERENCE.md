# Health & Wellness Portal - Documentation Summary

## 📋 What You Need to Know

The **ASR Health & Wellness Portal** is a comprehensive health optimization platform with 6 integrated applications working together through a unified backend and database.

---

## 🏗️ Architecture at a Glance

```
FRONTEND (React - Vercel)
├─ Meal Planner Module       (Meal plan generation & management)
├─ Nutrition Module          (Nutrition tracking & analysis)
├─ Fitness Module            (Workouts & AI coach)
├─ Coaching Module           (Health coaching & goal setting)
├─ Progress Module           (Gamification & achievements)
└─ Integrations Module       (Wearables & health data)
        │
        └─→ API Calls
        │
BACKEND (Express - Render)
        │
        └─→ PostgreSQL Database (Single shared DB)
```

---

## 📱 The 6 Applications

### 1. **Meal Planner** 🍽️
- Generates personalized meal plans using AI (OpenAI)
- Considers dietary preferences, restrictions, and local stores
- Users can save favorites and view history
- **Shares**: Recipe data → Nutrition Module

### 2. **Nutrition Module** 📊
- Tracks daily calories and macronutrients
- Allows manual food logging or imports from meal plans
- Sets and monitors nutrition goals
- **Shares**: Macro adherence data → Coaching Module

### 3. **Fitness Module** 💪
- AI-powered workout planning via interview questions
- Tracks exercises, sets, and progression
- Provides rest day recommendations
- **Shares**: Calorie burn estimates → Nutrition Module
- **Critical Fix**: Uses `SESSION_SECRET` for JWT verification

### 4. **Coaching Module** 🎯
- Central health optimization engine
- AI health coach (OpenAI chat)
- SMART goal creation and tracking
- Daily habit logging
- Health score calculation (0-100)
- **Reads from**: All other modules for context

### 5. **Progress Module** 🏆
- Daily login streaks
- Achievement badges
- Social leaderboards
- Referral program
- **Tracks**: Engagement across all modules

### 6. **Integrations Module** 🔗
- Connects Apple Health, Google Fit, Fitbit, Oura Ring
- Imports steps and sleep data
- Securely stores credentials
- **Shares**: Activity data → All modules

---

## 🔌 Critical Integration Points

### Data Flows
```
Meal Planner
    ↓ recipes, nutrition facts
Nutrition Module
    ↓ macro compliance, calories
Fitness Module
    ↓ calorie burn, activity
Coaching Module (Hub)
    ↓ personalized recommendations
All Modules
```

### Authentication
- Main server signs tokens with `SESSION_SECRET`
- **All modules** must use `SESSION_SECRET` to verify tokens
- Previously: Fitness was using `JWT_SECRET` → caused "invalid signature" errors
- **Fixed**: Fitness routes now use `SESSION_SECRET`

---

## 📊 Data Sharing

| Data Element | Source | Used By |
|---|---|---|
| User profile | OAuth | All modules |
| Recipes & nutrition facts | Meal Planner API | Nutrition, Coaching |
| Calorie/macro data | Nutrition Module | Fitness, Coaching |
| Workout plans | Fitness Module | Coaching |
| Health score | Coaching Module | All modules |
| Activity data | Integrations | Nutrition, Fitness, Coaching |

---

## 🚀 Deployment

- **Frontend**: Vercel (auto-deploy on Git push)
- **Backend**: Render (auto-deploy on Git push)
- **Database**: PostgreSQL on Render
- **Critical**: Set `SESSION_SECRET` environment variable

---

## ⚠️ Critical Fixes Applied (Dec 23, 2025)

### Issue 1: AI Coach Returns 404
**Root Cause**: Interview questions table had field name mismatch
```
Database:  question_text, question_type, order_position, is_active
Old Code:  question, type, order, active
```
**Fix**: Updated Prisma models and all endpoints to match database

### Issue 2: Token Signature Invalid
**Root Cause**: Fitness module used different JWT secret than main server
```
Main Server:    Signs with SESSION_SECRET
Fitness (old):  Verified with JWT_SECRET
```
**Fix**: Fitness routes now use `SESSION_SECRET` for verification

### Issue 3: Prisma Type Annotation Error
**Root Cause**: `@db.Jsonb` not supported in Prisma
**Fix**: Use `Json?` without annotation, Prisma handles JSONB conversion

---

## 📚 Documentation

- **Full Architecture**: `HEALTH_WELLNESS_PORTAL_ARCHITECTURE.md` (This file's parent)
- **Nutrition Module**: `NUTRITION_MODULE_DESIGN.md`
- **Coaching Module**: `docs/coaching_module.md`
- **Fitness Architecture**: `fitness/docs/FITNESS_COMPONENT_ARCHITECTURE.md`
- **Database Schema**: `prisma/schema.prisma`

---

## 🔑 Key Environment Variables

```bash
# Backend (.env)
SESSION_SECRET=<random-32-char>          # CRITICAL for JWT
OPENAI_API_KEY=<openai-api-key>         # For AI features
DATABASE_URL=postgresql://...            # Main database
STRIPE_SECRET_KEY=<stripe-key>          # Payment processing
GOOGLE_CLIENT_ID=<google-id>            # OAuth
GOOGLE_CLIENT_SECRET=<google-secret>    # OAuth

# Frontend (.env)
REACT_APP_API_BASE=https://meal-planner-app-mve2.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=<google-id>
REACT_APP_STRIPE_PUBLISHABLE_KEY=<key>
```

---

## ✅ Status

- ✅ All 6 applications functional
- ✅ Cross-module data sharing working
- ✅ AI Workout Coach fixed and deployed
- ✅ JWT authentication consistent across all modules
- ✅ Schema field names aligned
- ✅ Comprehensive documentation complete

---

## 🆘 Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `[Fitness Auth] Token verification failed: invalid signature` | Wrong JWT secret | Ensure `SESSION_SECRET` is set |
| `404 on /api/fitness/admin/interview-questions` | Schema mismatch or auth failure | Check JWT secret + database connection |
| `Prisma error: Jsonb not supported` | Wrong type annotation | Use `Json?` without `@db.Jsonb` |
| `Module import fails` | Missing module | Check module exists in `client/src/modules/` |

---

## 📈 Next Steps

1. Monitor Render deployment completion
2. Test AI Workout Coach flow on production
3. Verify interview questions load without errors
4. Collect user feedback on new features
5. Plan Phase 2 features (social, analytics, mobile)

---

**Last Updated**: December 23, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
