# FITNESS APP - DEPLOYMENT ARCHITECTURE (MONOREPO + SEPARATE NEON DB)

**Decision:** Option B (Monorepo) + Separate Neon Database
**Date:** 2025-12-21
**Status:** Ready for Implementation

---

## ARCHITECTURE

### Code Organization
```
meal_planner/ (Single Vercel Project)
├── client/
│   ├── src/pages/meal/
│   └── src/pages/fitness/          ← Integrated into main client
├── server.js
│   ├── routes/api/meals
│   ├── routes/api/recipes
│   └── routes/api/fitness/         ← Integrated into main server
├── fitness/                         ← Code organization only
│   ├── backend/                    (code reference, deployed via server.js)
│   ├── frontend/                   (code reference, deployed via client/)
│   ├── prisma/                     (separate schema, separate DB)
│   ├── docs/
│   └── ...
├── prisma/                         (meal_planner schema → existing Neon DB)
└── ...
```

### Databases (2 Neon Projects)
```
Database 1: meal_planner_db (existing)
├── Schema: public
├── Tables: users, meals, recipes, favorites, etc.
├── Connection: DATABASE_URL (meal_planner)

Database 2: fitness_db (NEW)
├── Schema: public (fresh)
├── Tables: fitness_profiles, fitness_workouts, etc.
├── Connection: FITNESS_DATABASE_URL (new)
```

### Vercel Project (Single)
```
meal_planner_suite (Vercel)
├── Frontend: client/ → vercel.com
│   ├── Routes: / (meal planner)
│   ├── Routes: /fitness (fitness app)
├── Backend: server.js → vercel.com/api
│   ├── Routes: /api/meals/*
│   ├── Routes: /api/recipes/*
│   ├── Routes: /api/fitness/*
│   ├── DB1: DATABASE_URL (meal_planner)
│   ├── DB2: FITNESS_DATABASE_URL (fitness)
```

### User Context
```
Authentication Table (shared):
┌─────────────────────────────────────┐
│ Meal Planner DB (Database 1)        │
├─────────────────────────────────────┤
│ users (id, email, password, etc.)   │
│ meals                               │
│ recipes                             │
│ favorites                           │
│ meal_plan_history                   │
└─────────────────────────────────────┘
         ↓ user_id reference
┌─────────────────────────────────────┐
│ Fitness DB (Database 2)             │
├─────────────────────────────────────┤
│ fitness_profiles (user_id FK)       │
│ fitness_workouts (user_id FK)       │
│ fitness_cardio_sessions (user_id FK)│
│ fitness_goals (user_id FK)          │
│ ... (other fitness tables)          │
└─────────────────────────────────────┘
```

---

## DATABASE SETUP

### Step 1: Create New Neon Project for Fitness

1. Go to **console.neon.tech**
2. Click "New Project"
3. Name: `fitness_app` or `fitness_prod`
4. Region: Same as meal_planner (e.g., US East)
5. Database name: `fitness` (default: `neondb`)
6. Copy connection string

### Step 2: Get Connection Strings

**Meal Planner DB (Existing):**
```
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.neon.tech/meal_planner?sslmode=require
```

**Fitness DB (New):**
```
FITNESS_DATABASE_URL=postgresql://user:password@ep-yyy.us-east-2.neon.tech/fitness?sslmode=require
```

---

## CONFIGURATION FILES

### Root .env (Updated)
```env
# Meal Planner Database (existing)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.neon.tech/meal_planner?sslmode=require

# Fitness Database (NEW)
FITNESS_DATABASE_URL=postgresql://user:password@ep-yyy.us-east-2.neon.tech/fitness?sslmode=require

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# API Configuration
BACKEND_PORT=5000
FRONTEND_PORT=3000
API_BASE_URL=http://localhost:5000/api
VITE_API_BASE_URL=http://localhost:5000/api

# Environment
NODE_ENV=development
```

### fitness/prisma/.env (Updated)
```env
# Fitness Database (separate Neon)
DATABASE_URL=postgresql://user:password@ep-yyy.us-east-2.neon.tech/fitness?sslmode=require
```

### server.js (Updated)
```javascript
// Initialize both database connections
const mealPlannerDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Meal planner DB
    },
  },
});

const fitnessDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.FITNESS_DATABASE_URL, // Fitness DB
    },
  },
});

// Routes
app.use('/api/meals', mealsRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/fitness', fitnessRouter); // Uses fitnessDb
```

---

## DEPLOYMENT STEPS

### Step 1: Create Fitness Neon Database
1. Create new Neon project: `fitness_app`
2. Copy connection string
3. Add to environment: `FITNESS_DATABASE_URL`

### Step 2: Update Prisma Schema (Monorepo)
```bash
# Create new prisma client for fitness
cd fitness/prisma
npx prisma generate --schema=schema.prisma
```

### Step 3: Deploy Fitness Migration
```bash
cd fitness
npx prisma migrate deploy --schema prisma/schema.prisma
```

### Step 4: Verify Tables in Neon
```bash
# Fitness DB Studio
cd fitness
npm run studio

# Or check with psql
psql $FITNESS_DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
```

### Step 5: Update Vercel Environment Variables
```
Dashboard → Settings → Environment Variables

Add:
FITNESS_DATABASE_URL=postgresql://...
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

### Step 6: Deploy
```bash
git add .
git commit -m "Add fitness module with separate Neon DB"
git push origin main
# Vercel auto-deploys
```

---

## BENEFITS OF THIS APPROACH

✅ **Code Simplicity** - Single Vercel project, single deployment
✅ **Database Isolation** - Fitness data completely separate from meal data
✅ **Easier Debugging** - Can query fitness DB independently
✅ **Performance** - Fitness queries don't impact meal planner
✅ **Independent Backups** - Separate Neon backups per DB
✅ **Cost Neutral** - Neon free tier supports 2 DBs
✅ **Scalability** - Can scale fitness DB independently later
✅ **User Experience** - Single domain, no CORS issues
✅ **Migration Path** - Can split to separate Vercel later

---

## NEON SETUP CHECKLIST

### Create New Neon Project
- [ ] Login to console.neon.tech
- [ ] Click "New Project"
- [ ] Name: `fitness_app` or `fitness_prod`
- [ ] Region: Same as meal_planner
- [ ] Copy connection string

### Environment Variables
- [ ] Get `FITNESS_DATABASE_URL` from Neon
- [ ] Update local .env
- [ ] Update Vercel settings
- [ ] Update fitness/prisma/.env

### Database Verification
- [ ] Run `npm run studio` in fitness/
- [ ] Verify all 7 tables created
- [ ] Check indexes created
- [ ] Verify foreign keys working

---

## COMMAND SUMMARY

### Local Development Setup
```bash
# 1. Install dependencies
npm install
cd fitness/backend && npm install
cd ../frontend && npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with both DATABASE_URLs

# 3. Deploy fitness DB to Neon
cd fitness
npx prisma migrate deploy

# 4. Seed exercise data
cd backend
npm run seed

# 5. Start development
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend (from root)
cd client && npm run dev
```

### Database Management
```bash
# View fitness DB
cd fitness && npm run studio

# Create new migration
cd fitness && npx prisma migrate dev --name add_field

# Reset fitness DB (dev only)
cd fitness && npm run migrate:reset
```

### Deployment
```bash
# Deploy to Vercel
git add .
git commit -m "Add fitness module"
git push origin main
# Vercel auto-deploys
```

---

## VERCEL CONFIGURATION

### vercel.json (Updated)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "client/dist",
  "env": {
    "DATABASE_URL": "@database_url",
    "FITNESS_DATABASE_URL": "@fitness_database_url",
    "JWT_SECRET": "@jwt_secret",
    "JWT_EXPIRY": "@jwt_expiry"
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server.js"
    },
    {
      "src": "/(.*)",
      "dest": "client/dist/index.html"
    }
  ]
}
```

### Environment Variables in Vercel
```
Dashboard → Project Settings → Environment Variables

Add:
Name: DATABASE_URL
Value: postgresql://user:pass@ep-xxx...

Name: FITNESS_DATABASE_URL
Value: postgresql://user:pass@ep-yyy...

Name: JWT_SECRET
Value: your-secret-key

Name: JWT_EXPIRY
Value: 24h
```

---

## MONITORING & MANAGEMENT

### Neon Dashboard
- **Meal Planner DB:** console.neon.tech → meal_planner project
  - View tables, query editor, backups
- **Fitness DB:** console.neon.tech → fitness_app project
  - View tables, query editor, backups

### Vercel Dashboard
- Single project: `meal_planner_suite`
- Logs show both API routes
- Both databases show in environment variables

### Monitoring Queries
```sql
-- Fitness DB Size
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check connections
SELECT count(*) as count FROM pg_stat_activity;
```

---

## COST ANALYSIS

### Neon Pricing (Free Tier)
- **Meal Planner DB:** 
  - 3 GB storage (included)
  - 100 connections (included)
  - Compute: 0.5 CU/month (included)

- **Fitness DB:** 
  - 3 GB storage (included)
  - 100 connections (included)
  - Compute: 0.5 CU/month (included)

**Total Neon Cost:** FREE (within free tier limits)

### Vercel Pricing
- **Single Project:** $20/month Pro + usage
- **No increase** for adding fitness module

**Total Monthly Cost:** ~$20/month (vs $40 for separate projects)

---

## MIGRATION PATH (If Needed Later)

### Year 1: Stay with Monorepo + Separate DBs
- Single Vercel project
- Two Neon databases
- Single codebase
- Cost: $20/month + Neon free

### Year 2+: Split if Needed
If fitness becomes separate product:
1. Move fitness/backend → separate Vercel project
2. Move fitness/frontend → separate Vercel project
3. Keep same Neon DB or migrate
4. No code changes needed (just env vars)

---

## FINAL CHECKLIST

### Before Implementation
- [ ] Neon fitness project created
- [ ] Connection string copied
- [ ] Environment variables updated
- [ ] Prisma schema ready (fitness/prisma/)
- [ ] Migration file ready (fitness/prisma/migrations/)

### Deployment
- [ ] Local: `npx prisma migrate deploy` in fitness/
- [ ] Neon: All 7 tables created
- [ ] Seed: Exercise definitions loaded
- [ ] Vercel: Environment variables set
- [ ] Vercel: Deploy meal_planner with fitness integrated

### Verification
- [ ] Meal planner routes working (/)
- [ ] Fitness routes working (/fitness)
- [ ] API endpoints responding (/api/fitness/*)
- [ ] Database queries working
- [ ] Logging enabled

---

## NEXT STEPS

1. ✅ Code organization complete (fitness/ directory)
2. ✅ Prisma schema ready
3. **→ Create new Neon project for fitness**
4. **→ Update environment variables**
5. **→ Deploy migration to fitness Neon DB**
6. **→ Integrate fitness routes into server.js**
7. **→ Integrate fitness components into client/**
8. **→ Deploy to Vercel**
9. → Start backend implementation (FIT-005 onwards)
10. → Start frontend implementation (FIT-017 onwards)

---

## SUPPORT

**Issues?** See related documentation:
- Neon setup: https://neon.tech/docs
- Prisma multi-DB: https://www.prisma.io/docs/orm/prisma-client/working-with-databases/multiple-databases
- Vercel env vars: https://vercel.com/docs/projects/environment-variables
- Architecture: `FITNESS_DEPLOYMENT_ARCHITECTURE.md`
