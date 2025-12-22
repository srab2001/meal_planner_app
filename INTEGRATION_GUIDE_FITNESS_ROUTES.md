# 🔗 Integration Checklist: Fitness Routes into Server.js

**Status:** Ready to integrate  
**Complexity:** Low (3 lines of code)  
**Time:** 5 minutes  

---

## ✅ Pre-Integration Verification

- ✅ Fitness routes file exists: `/fitness/backend/routes/fitness.js`
- ✅ All 6 endpoints created and tested
- ✅ All patterns verified against meal_planner
- ✅ Prisma schema deployed to Neon
- ✅ Environment variables configured

---

## 📋 Integration Steps

### Step 1: Add Require Statement
**File:** `/meal_planner/server.js`  
**Location:** Top of file with other requires (around line 1-30)

```javascript
// Add this line with other route requires:
const fitnessRoutes = require('./fitness/backend/routes/fitness');
```

**Where to add:**
```javascript
// Lines 1-30 of server.js:
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
// ... other requires ...

// ADD THIS LINE:
const fitnessRoutes = require('./fitness/backend/routes/fitness');

const app = express();
```

---

### Step 2: Mount the Router
**File:** `/meal_planner/server.js`  
**Location:** After middleware setup (around line 270-290)

**Find this block:**
```javascript
// Around line 270-290, after CORS and body parser setup:
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiters setup...
app.use(generalLimiter);

// Your existing routes:
app.get('/api/profile', requireAuth, async (req, res) => {
  // existing profile endpoint
});
```

**Add this line:**
```javascript
// After rate limiters and middleware, before existing routes:
app.use(generalLimiter);

// Mount fitness routes
app.use('/api/fitness', fitnessRoutes);

// Existing routes continue here:
app.get('/api/profile', requireAuth, async (req, res) => {
```

**Result:**
All fitness routes will be available at:
- `GET /api/fitness/profile`
- `POST /api/fitness/profile`
- `GET /api/fitness/workouts`
- `POST /api/fitness/workouts`
- `GET /api/fitness/goals`
- `POST /api/fitness/goals`

---

## 🧪 Verification After Integration

### Test 1: Server Starts Without Errors
```bash
# In terminal, from /meal_planner directory:
npm start

# Should see:
# ✅ Server running on port 3001
# ✅ (Should NOT see errors about fitnessRoutes)
```

**If error:** Check that require path is correct: `./fitness/backend/routes/fitness`

---

### Test 2: GET /api/fitness/profile Endpoint

**Using curl:**
```bash
# Replace YOUR_TOKEN with actual JWT from login
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/fitness/profile
```

**Expected response:**
```json
{
  "success": true,
  "profile": {
    "user_id": "123...",
    "height_cm": null,
    "weight_kg": null,
    "age": null,
    "gender": null,
    "activity_level": "moderate",
    "fitness_goal": null,
    "created_at": "2024-12-20T...",
    "updated_at": "2024-12-20T..."
  }
}
```

**Or using Postman:**
1. Open Postman
2. Create GET request: `http://localhost:3001/api/fitness/profile`
3. Go to Headers tab
4. Add header: `Authorization: Bearer YOUR_TOKEN`
5. Click Send
6. Should get 200 response with profile object

---

### Test 3: POST /api/fitness/profile Endpoint

**Using curl:**
```bash
curl -X POST http://localhost:3001/api/fitness/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "height_cm": 180,
    "weight_kg": 75,
    "age": 30,
    "gender": "male",
    "activity_level": "high"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "profile": {
    "user_id": "123...",
    "height_cm": 180,
    "weight_kg": 75,
    "age": 30,
    "gender": "male",
    "activity_level": "high",
    "created_at": "2024-12-20T...",
    "updated_at": "2024-12-20T..."
  }
}
```

---

### Test 4: Verify User Scoping

**Step 1:** Create profile as User A with token A
```bash
# Get profile as User A
curl -H "Authorization: Bearer TOKEN_A" \
  http://localhost:3001/api/fitness/profile

# Result: { profile: { user_id: 'A' } }
```

**Step 2:** Verify User B cannot see User A's profile
```bash
# Try to get with User B's token
curl -H "Authorization: Bearer TOKEN_B" \
  http://localhost:3001/api/fitness/profile

# Result: { profile: { user_id: 'B' } } - Different user!
```

**This confirms:** User scoping is working ✅

---

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot find module 'fitness/backend/routes/fitness'"

**Solution:**
Check path in require statement. Should be:
```javascript
const fitnessRoutes = require('./fitness/backend/routes/fitness');
```

Not:
```javascript
// ❌ WRONG:
const fitnessRoutes = require('fitness/backend/routes/fitness');
const fitnessRoutes = require('./fitness/routes/fitness');
```

---

### Issue 2: "requireAuth is not defined"

**Solution:**
The requireAuth function must be defined in server.js BEFORE fitness routes are required/mounted.

Check that requireAuth is defined around line 385:
```javascript
async function requireAuth(req, res, next) {
  // auth logic here
}
```

---

### Issue 3: Get 401 Unauthorized on all requests

**Solution:**
Verify you're sending valid JWT token:

```bash
# WRONG - No token:
curl http://localhost:3001/api/fitness/profile
# Result: 401

# CORRECT - With token:
curl -H "Authorization: Bearer VALID_JWT_TOKEN" \
  http://localhost:3001/api/fitness/profile
# Result: 200
```

To get a valid token, login first:
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Returns: { token: "eyJhbGc..." }
```

---

### Issue 4: Database error "user_id does not exist"

**Solution:**
Ensure Neon database migration was run:

```bash
# From /fitness directory:
npx prisma migrate deploy --skip-generate

# Should show:
# Applying migration `20241220_initial`
# ✅ All migrations have been successfully applied
```

---

## 📊 Integration Success Criteria

Check all boxes before deploying:

- [ ] `npm start` runs without errors
- [ ] No "Cannot find module" errors
- [ ] No "requireAuth is not defined" errors
- [ ] GET /api/fitness/profile returns 200
- [ ] POST /api/fitness/profile creates profile
- [ ] GET /api/fitness/workouts returns 200
- [ ] POST /api/fitness/workouts creates workout
- [ ] GET /api/fitness/goals returns 200
- [ ] POST /api/fitness/goals creates goal
- [ ] Requests without token return 401
- [ ] Different users see different data

---

## 🚀 Next Steps

After successful integration:

1. **Deploy to Render:**
   ```bash
   git add .
   git commit -m "feat: integrate fitness routes into API"
   git push origin main
   # Render auto-deploys
   ```

2. **Create Frontend Components:**
   - Fitness profile component
   - Workout tracker component
   - Goal setting component

3. **Add Additional Endpoints:**
   - PATCH endpoints for updates
   - DELETE endpoints for removal
   - Advanced filtering/search endpoints

4. **Connect Frontend to Backend:**
   - Fetch profile on login
   - Show fitness dashboard
   - Allow users to log workouts

---

## 📞 Support References

**If you need help with:**

- **API Pattern questions:** See `API_PATTERN_ANALYSIS_COMPLETE.md`
- **Fitness route documentation:** See `fitness/docs/FITNESS_BACKEND_ROUTES_DOCUMENTATION.md`
- **Database schema:** See `fitness/prisma/schema.prisma`
- **Environment variables:** See `/meal_planner/.env`
- **Express patterns:** See `EXPRESS_API_PATTERNS_REVIEW.md`

---

**Integration Status:** ✅ Ready to proceed  
**Complexity Level:** 1/5 (Very simple)  
**Estimated Time:** 5-10 minutes  
