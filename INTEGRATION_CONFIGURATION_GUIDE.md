# 🔧 Fitness Module Integration Configuration Guide

**Date:** December 21, 2025  
**Status:** Ready to Integrate  
**Files to Modify:** 2 (server.js, .env)  

---

## 📋 Configuration Checklist

This guide covers all configuration needed to integrate the fitness module into your meal_planner app.

### What You Have ✅
- [x] Fitness routes created (`/fitness/backend/routes/fitness.js`)
- [x] Fitness database deployed (Neon, 5 tables)
- [x] FITNESS_DATABASE_URL in `.env`
- [x] API documentation complete
- [x] Prisma schema validated

### What You Need to Do ⏳
- [ ] Import fitness routes in `server.js`
- [ ] Mount fitness routes at `/api/fitness`
- [ ] Verify `DATABASE_URL` vs `databse_url` typo
- [ ] Test JWT middleware availability
- [ ] Verify environment variables

---

## 🚨 Critical Issue Found

Your `.env` file has a typo:
```
databse_url=postgresql://...   ❌ TYPO (missing 'a')
```

Should be:
```
DATABASE_URL=postgresql://...   ✅ CORRECT
```

This is likely why `npx prisma migrate deploy` failed in root directory.

---

## 🔧 Configuration Steps

### Step 1: Fix the DATABASE_URL Typo

**File:** `/meal_planner/.env`

**Current (Wrong):**
```
databse_url=postgresql://meal_planner_user:VJaFF2BeiisVJm7Fip4IHwL4q5gObQ4@dpg-d4nj6demcj7s73dfvie0-a.oregon-postgres.render.com:5432/meal_planner_vo27?sslmode=require
```

**Should be:**
```
DATABASE_URL=postgresql://meal_planner_user:VJaFF2BeiisVJm7Fip4IHwL4q5gObQ4@dpg-d4nj6demcj7s73dfvie0-a.oregon-postgres.render.com:5432/meal_planner_vo27?sslmode=require
```

**Why:** Prisma looks for `DATABASE_URL` (uppercase), not `databse_url` (lowercase typo).

---

### Step 2: Add FITNESS_DATABASE_URL (Already Done ✅)

**File:** `/meal_planner/.env`

Your `.env` already has:
```
FITNESS_DATABASE_URL="postgresql://neondb_owner:npg_CWXAK5daMiL8@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

✅ **This is correct and ready.**

---

### Step 3: Verify All Environment Variables

**File:** `/meal_planner/.env`

Your current environment variables:
```
✅ NODE_ENV=production
✅ PORT=5000
✅ SESSION_SECRET=<secret>
⚠️  databse_url=... (NEEDS FIX - see Step 1)
✅ FITNESS_DATABASE_URL=<neon-connection>
✅ GOOGLE_CLIENT_ID=<id>
✅ GOOGLE_CLIENT_SECRET=<secret>
✅ GOOGLE_CALLBACK_URL=<url>
✅ FRONTEND_BASE=<url>
✅ OPENAI_API_KEY=<key>
⚠️  STRIPE_SECRET_KEY=sk_live_xxx (should be actual key)
⚠️  STRIPE_PUBLISHABLE_KEY=<empty> (needs key if using Stripe)
```

---

### Step 4: Update server.js - Import Fitness Routes

**File:** `/meal_planner/server.js`

**Location:** Around line 15, after other route imports

**Find this section:**
```javascript
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const jwt = require('jsonwebtoken');
const pgSession = require('connect-pg-simple')(session);
```

**Add after this (before migrations section):**
```javascript
// Fitness module routes
const fitnessRoutes = require('./fitness/backend/routes/fitness');
```

---

### Step 5: Update server.js - Mount Fitness Routes

**File:** `/meal_planner/server.js`

**Location:** Around line 400-500 (after middleware setup, before other routes)

**Find this section (search for where other routes are mounted):**
```javascript
// Example of existing route mounting:
app.use('/auth', require('./...'));
app.use('/api/recipes', require('./...'));
```

**Add this after middleware but BEFORE other routes:**
```javascript
// Mount fitness module routes
app.use('/api/fitness', fitnessRoutes);
```

---

### Step 6: Verify requireAuth Middleware

**File:** `/meal_planner/server.js`

The fitness routes file expects a `requireAuth` middleware to be available globally.

**Check:** Search for `requireAuth` definition in server.js

**Expected:** Should be a middleware function that:
1. Checks for JWT token in `Authorization: Bearer <token>` header
2. Verifies token and sets `req.user` with decoded data
3. Calls `next()` on success or returns 401 on failure

**If not found:** Define it in fitness.js or export from server.js:

```javascript
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## 📝 Environment Variables Summary

### Required Variables (All in `.env`)
| Variable | Value | Status | Required |
|----------|-------|--------|----------|
| DATABASE_URL | meal_planner Render DB | ❌ Wrong key name | YES |
| FITNESS_DATABASE_URL | Neon fitness_app DB | ✅ Correct | YES |
| NODE_ENV | production | ✅ Present | YES |
| PORT | 5000 | ✅ Present | YES |
| SESSION_SECRET | long hex string | ✅ Present | YES |
| GOOGLE_CLIENT_ID | OAuth ID | ✅ Present | YES |
| GOOGLE_CLIENT_SECRET | OAuth secret | ✅ Present | YES |
| GOOGLE_CALLBACK_URL | OAuth redirect | ✅ Present | YES |
| FRONTEND_BASE | Vercel app URL | ✅ Present | YES |
| OPENAI_API_KEY | API key | ✅ Present | YES |

### Optional Variables
| Variable | Status |
|----------|--------|
| STRIPE_SECRET_KEY | Needs real value or remove |
| STRIPE_PUBLISHABLE_KEY | Needs real value or remove |

---

## 🔌 Integration Architecture

```
server.js (main Express app)
  ↓
  ├── Authentication middleware (JWT)
  ├── Routes mounting:
  │   ├── /auth/... (existing)
  │   ├── /api/recipes/... (existing)
  │   └── /api/fitness/... ← NEW (Fitness routes)
  │       ├── GET /profile
  │       ├── POST /profile
  │       ├── GET /workouts
  │       ├── POST /workouts
  │       ├── GET /goals
  │       └── POST /goals
  │
  ├── Database connections:
  │   ├── prisma (meal_planner DB via DATABASE_URL)
  │   └── fitnessDb (fitness_app DB via FITNESS_DATABASE_URL)
  │       via Prisma client in fitness/backend/routes/fitness.js
```

---

## 🧪 Testing After Configuration

### 1. Verify server starts without errors
```bash
npm start
```

Expected output:
```
[SERVER] Starting application...
[MIGRATIONS] Starting migrations...
[MIGRATIONS] ✅ All migrations completed successfully
[SERVER] ✅ Migrations complete, starting Express app...
Server is running on port 5000
```

### 2. Test fitness endpoint with curl
```bash
# First, get a valid JWT token from your auth system
TOKEN="your-jwt-token-here"

# Test GET profile (should return 404 if not created yet)
curl -X GET http://localhost:5000/api/fitness/profile \
  -H "Authorization: Bearer $TOKEN"

# Should return:
# {"error":"fitness_profile_not_found",...}
# OR
# {"success":true,"resource":{...}}
```

### 3. Test POST profile
```bash
curl -X POST http://localhost:5000/api/fitness/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "height_cm": 180,
    "weight_kg": 75,
    "age": 30,
    "gender": "M",
    "activity_level": "moderate"
  }'
```

### 4. Verify database connection
```bash
# Should see fitness tables in database
psql "$FITNESS_DATABASE_URL" -c "\dt public.fitness*"
```

---

## ⚠️ Common Issues & Fixes

### Issue 1: Cannot find module './fitness/backend/routes/fitness'
**Cause:** Wrong path in require statement  
**Fix:** Ensure path is relative to server.js location:
```javascript
const fitnessRoutes = require('./fitness/backend/routes/fitness');
```

### Issue 2: requireAuth is not defined
**Cause:** Middleware not exported or available  
**Fix:** Check that requireAuth is defined in server.js before mounting fitness routes

### Issue 3: 401 Unauthorized on all requests
**Cause:** Token verification failing  
**Fix:** Verify JWT_SECRET/SESSION_SECRET matches token generation

### Issue 4: 500 Database connection error
**Cause:** FITNESS_DATABASE_URL not loaded  
**Fix:** Verify .env file has FITNESS_DATABASE_URL and correct connection string

### Issue 5: Cannot GET /api/fitness/profile
**Cause:** Routes not mounted  
**Fix:** Verify `app.use('/api/fitness', fitnessRoutes)` is in server.js

---

## 📊 Configuration Verification Checklist

Run this checklist before testing:

- [ ] Fixed `databse_url` → `DATABASE_URL` typo in `.env`
- [ ] FITNESS_DATABASE_URL present in `.env`
- [ ] Fitness routes file exists at `/fitness/backend/routes/fitness.js`
- [ ] Imported fitness routes in server.js: `const fitnessRoutes = require(...)`
- [ ] Mounted fitness routes in server.js: `app.use('/api/fitness', fitnessRoutes)`
- [ ] Verified `requireAuth` middleware is available (defined in server.js)
- [ ] Verified Prisma schema in `/fitness/prisma/schema.prisma` is correct
- [ ] Verified `fitness/.env` exists with FITNESS_DATABASE_URL (if running separately)
- [ ] All environment variables loaded with `require('dotenv').config()`
- [ ] Database connections use correct URLs and SSL settings

---

## 🚀 Next Steps

1. **Apply configurations** (see steps 1-6 above)
2. **Start server** and verify no errors
3. **Test endpoints** with curl or Postman
4. **Check database** for table creation
5. **Frontend development** can begin

---

## 📞 Support

### Files to Reference
- **Routes:** `/fitness/backend/routes/fitness.js`
- **Documentation:** `/fitness/docs/FITNESS_BACKEND_ROUTES_DOCUMENTATION.md`
- **API Patterns:** `/fitness/docs/EXPRESS_API_PATTERNS_REVIEW.md`
- **Schema:** `/fitness/prisma/schema.prisma`

### Quick Links
- Neon DB: `postgresql://neondb_owner:npg_CWXAK5daMiL8@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb`
- Fitness Routes Docs: See `/fitness/docs/FITNESS_BACKEND_ROUTES_DOCUMENTATION.md`

---

**Configuration Status:** 📋 PENDING (Awaiting steps 1, 4, 5)  
**Expected Completion Time:** 10-15 minutes  
**Testing Time:** 5-10 minutes  

👉 **Start with:** Fix the DATABASE_URL typo in `.env`
