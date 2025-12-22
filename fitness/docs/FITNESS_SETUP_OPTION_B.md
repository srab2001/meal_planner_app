# SETUP GUIDE - OPTION B + SEPARATE NEON DATABASE

**Status:** ✅ Ready to Configure
**Date:** 2025-12-21

---

## QUICK REFERENCE

### Deployment Model
- **Code:** Single monorepo (meal_planner/)
- **Frontend:** Single Vercel project
- **Backend:** Single Node.js server
- **Databases:** 2 separate Neon instances
  - **DB1:** meal_planner (existing)
  - **DB2:** fitness_app (new)

### URL Structure
```
UI:   app.vercel.app/
      ├─ / → Meal Planner
      └─ /fitness → Fitness App

API:  app.vercel.app/api/
      ├─ /api/meals/*
      ├─ /api/recipes/*
      └─ /api/fitness/*
```

---

## STEP-BY-STEP SETUP

### Step 1: Create New Neon Project for Fitness

**Estimated Time:** 5 minutes

1. Go to **console.neon.tech**
2. Click "New Project"
3. Fill in:
   - **Project name:** `fitness_app` or `fitness_prod`
   - **Region:** Same as meal_planner (e.g., `us-east-1`)
   - **Database name:** `fitness` (default: `neondb`)
4. Click "Create"
5. In **Connection Details**, select:
   - Database: `fitness`
   - Role: `neondb_owner`
   - SSL Mode: `require`
6. Copy the connection string:
   ```
   postgresql://user:password@ep-yyy.us-east-1.neon.tech/fitness?sslmode=require
   ```
7. Save as `FITNESS_DATABASE_URL`

### Step 2: Update Local Environment Variables

**File:** `.env` (root)

```env
# Existing
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.neon.tech/meal_planner?sslmode=require

# NEW - Add this
FITNESS_DATABASE_URL=postgresql://user:password@ep-yyy.us-east-1.neon.tech/fitness?sslmode=require

# Rest of existing variables...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
etc.
```

**File:** `fitness/prisma/.env`

```env
DATABASE_URL=postgresql://user:password@ep-yyy.us-east-1.neon.tech/fitness?sslmode=require
```

### Step 3: Deploy Fitness Database Schema

```bash
# From meal_planner root
cd fitness

# Generate Prisma client
npx prisma generate

# Deploy migration to Neon
npx prisma migrate deploy

# Verify tables created
npm run studio
# Opens http://localhost:5555
# Check all 7 fitness_* tables exist
```

### Step 4: Seed Exercise Definitions

```bash
cd fitness/backend
npm run seed
# Loads ~200 exercise definitions into fitness_exercises table
```

### Step 5: Update Vercel Environment Variables

**Dashboard URL:** https://vercel.com/dashboard

1. Go to **meal_planner project settings**
2. **Environment Variables** tab
3. Add new variables:
   ```
   NAME: FITNESS_DATABASE_URL
   VALUE: postgresql://user:password@ep-yyy.us-east-1.neon.tech/fitness?sslmode=require
   ENVIRONMENTS: Production, Preview, Development
   ```
4. Save
5. No redeploy needed yet (code changes come next)

### Step 6: Integrate Fitness into Meal Planner Codebase

This is where the actual code integration happens:

#### Update server.js

Add fitness database connection:
```javascript
import { PrismaClient as PrismaClientFitness } from '../fitness/prisma/generated/client/index.js';

// Existing meal planner connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// NEW - Fitness connection
const fitnessDb = new PrismaClientFitness({
  datasources: {
    db: {
      url: process.env.FITNESS_DATABASE_URL,
    },
  },
});

// Routes
app.use('/api/meals', mealsRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/fitness', fitnessRouter(fitnessDb)); // Use fitnessDb
```

#### Create Fitness Router

**File:** `routes/api/fitness.js`

```javascript
import express from 'express';

export default function createFitnessRouter(db) {
  const router = express.Router();

  // Workout routes (FIT-006 to FIT-010)
  router.post('/workouts', async (req, res) => {
    // POST /api/fitness/workouts
  });

  router.get('/workouts', async (req, res) => {
    // GET /api/fitness/workouts
  });

  // ... more routes

  return router;
}
```

#### Update Client Components

**File:** `client/src/pages/fitness/Dashboard.jsx` (new)
```javascript
import { useEffect, useState } from 'react';
import { fetchWorkouts } from '../../services/api';

export default function Dashboard() {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    fetchWorkouts().then(setWorkouts);
  }, []);

  return (
    <div>
      <h1>Fitness Dashboard</h1>
      {/* Components */}
    </div>
  );
}
```

### Step 7: Deploy to Vercel

```bash
git add .
git commit -m "feat: integrate fitness module with separate Neon DB"
git push origin main
# Vercel auto-deploys
```

**Wait for deployment to complete (2-5 minutes)**

### Step 8: Verify Deployment

```bash
# Test APIs
curl https://app.vercel.app/api/fitness/exercises
# Should return: { data: [...exercise definitions] }

curl https://app.vercel.app/api/meals
# Should return: { data: [...meal data] }
```

---

## FILE CHECKLIST

### To Update
- [ ] `.env` - Add FITNESS_DATABASE_URL
- [ ] `fitness/prisma/.env` - Add DATABASE_URL (fitness)
- [ ] `server.js` - Add fitnessDb connection
- [ ] `routes/api/fitness.js` - Create (or move from fitness/backend/)
- [ ] `client/src/pages/fitness/` - Create pages
- [ ] `client/src/components/fitness/` - Create components
- [ ] `vercel.json` - Add routes for /api/fitness/*
- [ ] Vercel Settings - Add FITNESS_DATABASE_URL env var

### Already Created
- ✅ `fitness/prisma/schema.prisma`
- ✅ `fitness/prisma/migrations/001_*.sql`
- ✅ `fitness/backend/package.json`
- ✅ `fitness/frontend/package.json`
- ✅ `.env.example` (updated with FITNESS_DATABASE_URL)

---

## TESTING LOCALLY

### Start Development

```bash
# Terminal 1: Backend
npm run dev
# Runs http://localhost:5000

# Terminal 2: Frontend
cd client && npm run dev
# Runs http://localhost:3000
```

### Test API Endpoints

```bash
# Meal planner endpoint
curl http://localhost:5000/api/meals

# Fitness endpoint
curl http://localhost:5000/api/fitness/exercises

# Should both return data
```

### View Database

```bash
# Meal planner DB
npm run studio
# (uses DATABASE_URL)

# Fitness DB
cd fitness && npm run studio
# (uses FITNESS_DATABASE_URL)
```

---

## NEON DATABASE MANAGEMENT

### Monitor Usage

1. **Console:** https://console.neon.tech
2. **Projects:** List both `meal_planner` and `fitness_app`
3. **Fitness Project → Storage:** See DB size
4. **Backups:** Automated daily backups

### Database Info

```bash
# Query fitness DB
psql $FITNESS_DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"

# Count records
psql $FITNESS_DATABASE_URL -c "SELECT COUNT(*) FROM fitness_exercises;"
```

---

## TROUBLESHOOTING

### Migration Failed
```bash
# Check connection
psql $FITNESS_DATABASE_URL -c "SELECT version();"

# View pending migrations
cd fitness && npx prisma migrate status

# Force deploy
cd fitness && npx prisma migrate deploy --force-skip-validation
```

### Prisma Client Out of Sync
```bash
cd fitness && npx prisma generate
# Then restart backend
```

### Vercel Deployment Failed
1. Check build logs: Dashboard → Deployments → Details
2. Verify environment variables set
3. Ensure both DATABASE_URLs present
4. Check server.js doesn't have typos

### API Not Responding
```bash
# Verify fitness routes exist
curl -I http://localhost:5000/api/fitness/exercises

# Check error logs
# Vercel: https://vercel.com/dashboard → meal_planner → Logs
# Local: Terminal output
```

---

## COST ANALYSIS

### Current Setup
| Service | Cost | Notes |
|---------|------|-------|
| Neon (Meal Planner DB) | FREE | Within free tier |
| Neon (Fitness DB) | FREE | Within free tier |
| Vercel Pro | $20/month | Single project |
| **Total** | **~$20/month** | Free DBs, paid hosting |

### If Separated to Multiple Vercel Projects
| Service | Cost | Notes |
|---------|------|-------|
| Vercel (Meal Planner) | $20/month | Pro tier |
| Vercel (Fitness) | $20/month | Pro tier |
| Vercel (API Gateway) | $20/month | Optional |
| **Total** | **~$60/month** | 3x more expensive |

**Current approach is 50% cheaper** ✅

---

## NEXT STEPS

1. ✅ Create new Neon project for fitness
2. ✅ Get FITNESS_DATABASE_URL connection string
3. **→ Update .env files with both DATABASE_URLs**
4. **→ Run `npx prisma migrate deploy` in fitness/**
5. **→ Run `npm run seed` to load exercises**
6. **→ Integrate fitness router into server.js**
7. **→ Add fitness pages/components to client/**
8. **→ Update Vercel env vars**
9. **→ Deploy to Vercel**
10. **→ Start backend implementation (FIT-005 onwards)**

---

## DOCUMENTATION

**For more details, see:**
- `FITNESS_MONOREPO_SEPARATE_DB.md` - Full architecture
- `FITNESS_PROJECT_STRUCTURE.md` - Directory layout
- `FITNESS_IMPLEMENTATION_BUILD_SEQUENCE.md` - Build order (126 tickets)
- `FITNESS_API_SPECIFICATION.md` - API endpoints (21 total)

---

**Ready to proceed? Start with Step 1: Create Neon fitness project.**
