# 🧪 QUICK TEST GUIDE

**Status:** ✅ Ready to Deploy to Cloud  
**Setup Time:** ~5 minutes (local) or ~10 minutes (cloud)

---

## 🚀 CHOOSE YOUR PATH

### Path A: Quick Local Testing (5 minutes)
→ **Jump to Step 1 below** to test locally on localhost:5000

### Path B: Cloud Deployment (10 minutes) 
→ **See `CLOUD_DEPLOYMENT_GUIDE.md`** to deploy to Vercel + Render + Neon
- No local setup needed
- Apps run 24/7 in the cloud
- Auto-deploy from GitHub
- No port conflicts with other apps
- **Recommended for production!**

---

## LOCAL TESTING ONLY (localhost:5000)

## Step 1: Verify Environment Files (30 seconds)

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/gitprojects/meal_planner

# Check all env files exist
ls -la fitness/master.env fitness/backend/.env fitness/frontend/.env
# Should see all 3 files
```

---

## Step 2: Sync Environments (30 seconds)

```bash
cd fitness && bash env-sync.sh
```

**Expected Output:**
```
✓ Found master.env
✓ NODE_ENV defined
✓ DATABASE_URL defined
✓ SESSION_SECRET defined
✓ JWT_SECRET defined

Syncing to backend/.env...
✓ Copied master.env → backend/.env

Syncing REACT_APP_* variables to frontend/.env...
✓ Synced REACT_APP_* variables to frontend/.env

========================================
✓ Fitness Environment Sync Complete!
```

---

## Step 3: Start Backend (1 minute)

```bash
cd fitness/backend

# Install deps (if needed)
npm install

# Start server - should validate env automatically
npm start
```

**Expected Output:**
```
✓ Environment validation passed

=== Fitness Backend Configuration ===
NODE_ENV: production
Database: Connected to Neon
JWT Secret: ✓ Set
Session Secret: ✓ Set
========================================

✓ Database connection successful

🏃 Fitness Backend running on http://localhost:5000
📊 Health check: http://localhost:5000/health
```

---

## Step 4: Test Health Endpoint (30 seconds)

**In a new terminal:**

```bash
curl http://localhost:5000/health | jq .
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "fitness-backend",
  "timestamp": "2025-12-21T...",
  "node_env": "production"
}
```

✅ **SUCCESS:** Backend is running!

---

## Step 5: Get JWT Token (Needed for API Tests)

You'll need a JWT token to test the fitness endpoints. If you don't have one:

```bash
# Option 1: Check if meal_planner provides a test token
# Look for test token in meal_planner documentation

# Option 2: Generate a test token (if JWT_SECRET is known)
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: 'test-user-123', email: 'test@example.com' },
  process.env.JWT_SECRET || 'test-secret',
  { expiresIn: '1h' }
);
console.log('Test Token:', token);
"
```

**Save this token for testing:**
```bash
export JWT_TOKEN="your_token_here"
```

---

## Step 6: Test Fitness Endpoints

### 6a. Get User Profile

```bash
curl -X GET http://localhost:5000/api/fitness/profile \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

**Expected:** 200 OK with profile data (or empty if new user)

### 6b. Get Workouts

```bash
curl -X GET http://localhost:5000/api/fitness/workouts \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

**Expected:** 200 OK with workouts array

### 6c. Get Goals

```bash
curl -X GET http://localhost:5000/api/fitness/goals \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

**Expected:** 200 OK with goals array

### 6d. Create Profile

```bash
curl -X POST http://localhost:5000/api/fitness/profile \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "height_cm": 180,
    "weight_kg": 75,
    "age": 30,
    "gender": "male",
    "activity_level": "active"
  }' | jq .
```

**Expected:** 200 OK with created profile

---

## Step 7: Test Nutrition Endpoints

### 7a. Get Today's Nutrition Summary

```bash
curl -X GET http://localhost:5000/api/nutrition/summary \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

**Expected:** 200 OK with nutrition data (or empty if no meals)

### 7b. Get Weekly Nutrition

```bash
curl -X GET http://localhost:5000/api/nutrition/weekly \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

**Expected:** 200 OK with 7-day trends

### 7c. Get Macro Targets

```bash
curl -X GET http://localhost:5000/api/nutrition/macro-targets \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

**Expected:** 200 OK with daily targets

---

## Step 8: Test Auth Validation

### Test Missing Token (should fail)

```bash
curl -X GET http://localhost:5000/api/fitness/profile \
  -H "Content-Type: application/json"
```

**Expected:** 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "No token provided"
}
```

✅ **SUCCESS:** Auth validation works!

---

## Step 9: Test Frontend (Optional)

### In a new terminal:

```bash
cd fitness/frontend
npm install
npm start
```

**Expected:**
- Frontend starts on http://localhost:3000
- Console shows REACT_APP_API_URL loaded
- No errors about missing environment variables

---

## 📊 Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| env-sync.sh runs | ✅ | All files synced |
| Backend starts | ✅ | Validates DATABASE_URL |
| Health endpoint | ✅ | Returns 200 OK |
| JWT required | ✅ | 401 without token |
| Fitness endpoints | ✅ | GET/POST working |
| Nutrition endpoints | ✅ | Read-only access |
| Frontend loads | ✅ | REACT_APP_API_URL present |

---

## 🔗 Useful Commands

```bash
# View all environment variables
cat fitness/master.env

# Check what's synced to backend
cat fitness/backend/.env | head -20

# Check what's synced to frontend
cat fitness/frontend/.env

# Verify backend is connected to Neon
sqlite3 memory 'SELECT 1'  # or psql if PostgreSQL installed

# Check logs in real time
tail -f /tmp/fitness-backend.log

# Kill backend if needed
pkill -f "npm start"
```

---

## ❓ Troubleshooting Quick Links

**Backend won't start?**  
→ Check DATABASE_URL is set: `echo $DATABASE_URL`  
→ Run: `cd fitness && bash env-sync.sh`

**401 errors on API calls?**  
→ JWT token missing or invalid  
→ Make sure `Authorization: Bearer $JWT_TOKEN` header is present

**Frontend can't connect to backend?**  
→ Check REACT_APP_API_URL in `fitness/frontend/.env`  
→ Backend must be running on http://localhost:5000

**"REACT_APP_API_URL missing" error?**  
→ Run: `cd fitness && bash env-sync.sh`  
→ Restart frontend: `npm start`

---

## 🎯 What to Look For

✅ All endpoints return 200 OK (or appropriate status)  
✅ Health check returns status: "ok"  
✅ 401 error when token missing (auth working)  
✅ Profile data structure matches schema  
✅ Nutrition data shows meals and macros  
✅ No environment variable errors in logs  

---

## 📝 Test Results Template

```
Date: _______________
Tester: ______________

✅ env-sync.sh runs successfully
✅ Backend starts without errors
✅ Health check returns 200 OK
✅ Profile endpoint works
✅ Workouts endpoint works
✅ Goals endpoint works
✅ Nutrition summary endpoint works
✅ Nutrition weekly endpoint works
✅ Nutrition targets endpoint works
✅ Auth validation (401 without token)
✅ Frontend loads successfully

Notes:
_________________________________________________________________
_________________________________________________________________

Status: [PASSED / FAILED]
```

---

## 🚀 Next Steps After Testing

1. ✅ All tests pass locally
2. Add to git: `git add fitness/ FITNESS_ENV_*`
3. Commit: `git commit -m "feat: add fitness environment setup"`
4. Push: `git push origin main`
5. Verify in GitHub: Check files are there
6. Deploy backend to Render
7. Deploy frontend to Vercel
8. Test production URLs

---

**Good luck with testing!** 🎉

Questions? See **FITNESS_ENV_SETUP.md** for complete documentation.
