# DEPLOYMENT ARCHITECTURE - SEPARATE VS MONOREPO

**Analysis:** Fitness app deployment options in Vercel

---

## OPTION A: SEPARATE VERCEL PROJECTS (Recommended)

### Structure
```
Vercel Project 1: meal_planner
├── Frontend: meal_planner/client → vercel.com/meal-planner
└── Backend: meal_planner/server.js → api.meal-planner.com

Vercel Project 2: fitness
├── Frontend: fitness/frontend → vercel.com/fitness-app
└── Backend: fitness/backend → api.fitness-app.com
```

### Pros
✅ **Independent Scaling** - Fitness can scale separately from meal app
✅ **Isolated Deployments** - Changes to fitness don't trigger meal_planner builds
✅ **Separate Analytics** - Own Vercel dashboards, metrics, logs
✅ **Team Ownership** - Separate teams can own each project
✅ **Distinct Domains** - fitness-app.com separate from meal-planner.com
✅ **Independent Rollbacks** - Hotfix one without affecting other
✅ **Different Deployment Cadences** - Fitness can release faster/slower
✅ **Cost Transparency** - Each project shows own usage/cost
✅ **Easier Testing** - Staging/production per project

### Cons
❌ SSO/Auth Integration - Must share JWT/session across domains
❌ Duplicate Vercel Setup - 2 projects to configure
❌ Cross-Domain CORS - Requires CORS headers
❌ Subdomain Management - Multiple DNS records

### Cost
- **Fitness Project:** $20/month (Pro) + usage
- **Meal Planner Project:** $20/month (Pro) + usage
- **Total:** ~$40/month base + usage

### Setup Complexity: Medium
- 2 separate git branches/repos possible
- Independent CI/CD pipelines
- Separate environment variables per project

---

## OPTION B: MONOREPO WITHIN SAME VERCEL PROJECT (Simpler)

### Structure
```
Vercel Project: meal_planner_suite
├── Frontend
│   ├── meal_planner/client → /
│   └── fitness/frontend → /fitness
├── Backend (Single)
│   └── server.js (handles both routes)
│       ├── /api/meals/*
│       ├── /api/fitness/*
│       ├── /api/recipes/*
│       └── /api/users/*
└── Database (Shared Neon)
```

### Pros
✅ **Single Project Management** - One Vercel dashboard
✅ **No CORS Issues** - Same domain for everything
✅ **Shared Auth** - Single JWT, single session
✅ **Single Database Connection** - Same Neon instance
✅ **Simpler DNS** - Single domain
✅ **Unified Monitoring** - One observability dashboard
✅ **Lower Cost** - Single Vercel project
✅ **Easier Onboarding** - New devs see full stack

### Cons
❌ **Coupled Deployments** - Bug in meal app blocks fitness release
❌ **Scaling Limitations** - Can't independently scale fitness
❌ **Shared Resources** - Fitness traffic affects meal app
❌ **Analytics Mixed** - Can't isolate fitness usage metrics
❌ **Larger Deployment** - All code deploys together
❌ **Build Times** - Single monolithic build

### Cost
- **Single Project:** $20/month (Pro) + usage
- **Total:** ~$20/month base + usage

### Setup Complexity: Low
- Single git repo (current)
- Single CI/CD pipeline
- Shared environment variables

---

## HYBRID: SEPARATE BACKENDS, SHARED FRONTEND (Best Balance)

### Structure
```
Vercel Project 1: meal_planner_web
├── Frontend (Monorepo)
│   ├── /meal (Meal Planner UI)
│   ├── /fitness (Fitness UI)
│   ├── /shared (Common components)
│   └── /auth (Shared auth)
└── Points to APIs: meal-api.vercel.app + fitness-api.vercel.app

Vercel Project 2: meal_api
└── Node.js/Express
    ├── /api/meals/*
    ├── /api/recipes/*
    └── /api/users/*

Vercel Project 3: fitness_api
└── Node.js/Express
    ├── /api/workouts/*
    ├── /api/cardio/*
    ├── /api/exercises/*
    └── /api/progress/*
```

### Pros
✅ **Independent Backend Scaling**
✅ **Unified Frontend** - Single domain, same UI experience
✅ **Separate API Deployments** - Backend updates independent
✅ **Shared Auth** - Single login covers all features
✅ **Team Flexibility** - Frontend team builds both UIs, separate backend teams
✅ **Cost Balanced** - 3 projects but better control

### Cons
❌ Cross-domain API calls (but same origin for UI)
❌ More complex setup than monorepo
❌ 3 Vercel projects to manage

### Cost
- **Frontend:** $0-20/month (static/dynamic)
- **Meal API:** $20/month
- **Fitness API:** $20/month
- **Total:** ~$40-60/month

---

## RECOMMENDATION: OPTION B (MONOREPO) FOR NOW

### Why?
1. **You're starting fitness** - Can migrate later if needed
2. **Same database** - Already using shared Neon
3. **Same auth** - Single JWT system
4. **Team size** - Single team likely building both
5. **Cost** - Half the price of separate projects
6. **Simplicity** - Lower operational overhead
7. **Easy migration path** - Can split later if needed

### Implementation
```
meal_planner/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── meal/
│   │   │   └── fitness/          ← New section
│   │   └── components/
│   │       ├── meal/
│   │       └── fitness/          ← New section
│   └── ...
├── server.js
│   ├── routes/api/meals
│   ├── routes/api/recipes
│   ├── routes/api/fitness        ← New routes
│   └── routes/api/users
├── fitness/ (kept for code organization)
│   ├── backend/ (code but deployed via main server)
│   ├── frontend/ (code but deployed via main client)
│   └── ...
└── ...
```

### Vercel Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "client/dist",
  "env": {
    "DATABASE_URL": "@db_neon_fitness"
  },
  "routes": [
    { "src": "/api/(.*)", "dest": "server.js" },
    { "src": "/(.*)", "dest": "client/dist/index.html" }
  ]
}
```

### URL Structure
```
UI:      app.vercel.app/
  - app.vercel.app/meal-planner
  - app.vercel.app/fitness

API:     app.vercel.app/api/
  - app.vercel.app/api/meals/*
  - app.vercel.app/api/fitness/*
```

---

## MIGRATION PATH IF NEEDED

If fitness grows and needs separation:

**Week 1:** Move fitness backend to separate Vercel project
- Deploy fitness/backend to separate fitness-api.vercel.app
- Update frontend API_BASE_URL via environment variable
- No frontend changes needed (same domain still works)

**Week 2:** Move fitness frontend to separate Vercel project
- Create fitness-ui.vercel.app project
- Deploy fitness/frontend separately
- Add CORS headers if needed

**Result:** Full separation with zero code changes (just env vars)

---

## DECISION MATRIX

| Factor | Separate | Monorepo | Hybrid |
|--------|----------|----------|--------|
| Simplicity | ❌ Medium | ✅ High | ⚠️ Medium |
| Cost | ❌ $40+/mo | ✅ $20/mo | ⚠️ $40/mo |
| Scaling | ✅ Independent | ❌ Coupled | ✅ Independent |
| Deployment | ✅ Fast | ✅ Fast | ⚠️ Medium |
| Auth | ❌ CORS needed | ✅ Same domain | ✅ Same domain |
| Team Size | ✅ Large teams | ✅ Small teams | ⚠️ Medium |
| Time to Market | ❌ 3-4 days setup | ✅ 1 day | ⚠️ 2 days |

---

## FINAL RECOMMENDATION

**START WITH OPTION B (MONOREPO)**

### Timeline
- **Now:** Deploy fitness within meal_planner Vercel project
- **Later (6+ months):** If fitness grows significantly, migrate to separate project (Option A or Hybrid)

### Benefits
- Ship fitness 2 weeks faster
- Save $20/month initially
- Single deployment pipeline
- Easier user experience (no cross-domain redirects)
- Can always split later

### Action Items
1. Keep fitness code in `/fitness/` directory (organizational)
2. Integrate routes into main `server.js`
3. Integrate components into main `client/`
4. Deploy as single Vercel project
5. Use environment variables to switch between UI sections

---

## IF YOU STILL WANT SEPARATE PROJECTS

### Setup Required
1. Create separate Vercel project: `fitness-app`
2. Point to `/fitness/` directory in git
3. Set up separate environment variables
4. Add CORS headers in main meal_planner server
5. Update frontend to use separate API endpoint

**Would take:** 3-4 days additional setup

---

## DEPLOYMENT CHECKLIST (MONOREPO APPROACH)

### Before Deployment
- [ ] Fitness routes added to server.js
- [ ] Fitness components added to client/
- [ ] Environment variables configured
- [ ] Database migration deployed to Neon
- [ ] All tests passing (meal + fitness)
- [ ] Build succeeds: `npm run build`

### Vercel Configuration
- [ ] Set buildCommand: `npm run build`
- [ ] Set outputDirectory: `client/dist`
- [ ] Set DATABASE_URL environment variable
- [ ] Configure serverless routes
- [ ] Enable automatic deployments on main branch

### Post-Deployment
- [ ] Meal planner routes still working (/)
- [ ] Fitness routes accessible (/fitness)
- [ ] API endpoints working (/api/fitness/*)
- [ ] Database migrations applied
- [ ] Monitoring & error tracking active

---

## QUESTIONS TO DECIDE

1. **Will fitness be separate product/brand?**
   - If YES: Consider separate project (Option A)
   - If NO: Keep monorepo (Option B)

2. **Different scaling patterns?**
   - If YES: Separate (Option A)
   - If NO: Monorepo (Option B)

3. **Different teams?**
   - If YES: Separate (Option A) or Hybrid (Option C)
   - If NO: Monorepo (Option B)

4. **Timeline pressure?**
   - If tight: Monorepo (Option B) - 1 day integration
   - If flexible: Separate (Option A) - 3-4 days setup

---

## RECOMMENDATION: OPTION B ✅

**Go with monorepo (same Vercel project) for fastest time to market.**

Cost savings, faster deployment, simpler setup. Can always split later if fitness becomes its own brand/product.
