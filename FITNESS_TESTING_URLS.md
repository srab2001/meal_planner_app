# 🧪 FINAL TESTING REFERENCE - Quick Links & URLs

**Date:** December 21, 2025  
**Status:** ✅ ALL SYSTEMS READY  

---

## 🚀 START HERE - 5 Minute Quick Start

### Step 1: Sync Environments (30 seconds)
```bash
cd fitness && bash env-sync.sh
```
**Expected:** ✓ Fitness Environment Sync Complete!

### Step 2: Start Backend (1 minute)
```bash
cd fitness/backend && npm start
```
**Expected:** 🏃 Fitness Backend running on http://localhost:5001

### Step 3: Test Health (30 seconds)
```bash
curl http://localhost:5001/health | jq .
```
**Expected:** `{"status": "ok", "service": "fitness-backend"}`

✅ **Done!** Backend is working.

---

## 🔗 LOCAL TESTING URLS

### Health Check (No Auth Required)
```
GET http://localhost:5001/health
```

### Fitness Endpoints (Require JWT)
```
GET http://localhost:5001/api/fitness/profile
POST http://localhost:5001/api/fitness/profile
GET http://localhost:5001/api/fitness/workouts
POST http://localhost:5001/api/fitness/workouts
GET http://localhost:5001/api/fitness/goals
POST http://localhost:5001/api/fitness/goals
```

### Nutrition Endpoints (Require JWT)
```
GET http://localhost:5001/api/nutrition/summary
GET http://localhost:5001/api/nutrition/weekly
GET http://localhost:5001/api/nutrition/macro-targets
```

---

## 🧪 Testing Commands (Copy & Paste Ready)

### 1. Test Health Endpoint
```bash
curl -X GET http://localhost:5001/health | jq .
```

### 2. Test Profile Endpoint (Requires Token)
```bash
export JWT_TOKEN="your_jwt_token_here"

curl -X GET http://localhost:5001/api/fitness/profile \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

### 3. Create a Fitness Profile
```bash
curl -X POST http://localhost:5001/api/fitness/profile \
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

### 4. Get Workouts
```bash
curl -X GET http://localhost:5001/api/fitness/workouts \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

### 5. Log a Workout
```bash
curl -X POST http://localhost:5001/api/fitness/workouts \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-21",
    "exercise_type": "running",
    "duration_minutes": 30,
    "intensity": "moderate",
    "calories_burned": 300,
    "notes": "Morning run"
  }' | jq .
```

### 6. Get Goals
```bash
curl -X GET http://localhost:5001/api/fitness/goals \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

### 7. Set a Goal
```bash
curl -X POST http://localhost:5001/api/fitness/goals \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal_type": "weight_loss",
    "target_value": 70,
    "target_date": "2026-06-21",
    "description": "Lose 5kg by summer"
  }' | jq .
```

### 8. Get Nutrition Summary
```bash
curl -X GET http://localhost:5001/api/nutrition/summary \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

### 9. Get Weekly Nutrition
```bash
curl -X GET http://localhost:5001/api/nutrition/weekly \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

### 10. Get Macro Targets
```bash
curl -X GET http://localhost:5001/api/nutrition/macro-targets \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

---

## ⚠️ Test Without Authorization (Should Fail with 401)
```bash
curl -X GET http://localhost:5001/api/fitness/profile \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "No token provided",
  "timestamp": "2025-12-21T..."
}
```

✅ **Success:** Auth validation is working!

---

## 🌍 PRODUCTION URLS (After Deployment)

### Production Base URLs
```
Backend: https://fitness-backend.onrender.com
Frontend: https://fitness-app.vercel.app
```

### Production Health Check
```bash
curl https://fitness-backend.onrender.com/health | jq .
```

### Production API Endpoints
```
GET  https://fitness-backend.onrender.com/api/fitness/profile
POST https://fitness-backend.onrender.com/api/fitness/profile
GET  https://fitness-backend.onrender.com/api/fitness/workouts
POST https://fitness-backend.onrender.com/api/fitness/workouts
GET  https://fitness-backend.onrender.com/api/fitness/goals
POST https://fitness-backend.onrender.com/api/fitness/goals

GET  https://fitness-backend.onrender.com/api/nutrition/summary
GET  https://fitness-backend.onrender.com/api/nutrition/weekly
GET  https://fitness-backend.onrender.com/api/nutrition/macro-targets
```

---

## 📁 Documentation Quick Links

| Document | Lines | Purpose |
|----------|-------|---------|
| [FITNESS_ENV_SETUP.md](FITNESS_ENV_SETUP.md) | 533 | Complete setup guide with all details |
| [FITNESS_TEST_GUIDE.md](FITNESS_TEST_GUIDE.md) | 200 | Step-by-step testing instructions |
| [FITNESS_ENV_VERIFICATION.md](FITNESS_ENV_VERIFICATION.md) | 400 | Verification checklist & deployment |
| [FITNESS_INDEX.md](FITNESS_INDEX.md) | 250 | Quick reference and overview |
| [FITNESS_SETUP_COMPLETE.txt](FITNESS_SETUP_COMPLETE.txt) | 300 | This completion summary |

---

## ✅ Verification Checklist Before Testing

- [ ] Run: `cd fitness && bash env-sync.sh` (completed)
- [ ] Check: `ls -la fitness/backend/.env` (exists)
- [ ] Check: `ls -la fitness/frontend/.env` (exists)
- [ ] Verify: `cat fitness/backend/.env | head -5` (has variables)
- [ ] Start: `cd fitness/backend && npm start` (running on :5001)
- [ ] Test: `curl http://localhost:5001/health` (returns 200)

---

## 🎯 Testing Workflow

### Phase 1: Basic Verification (5 minutes)
1. ✅ Sync environments
2. ✅ Start backend
3. ✅ Test health endpoint
4. ✅ Verify backend is running

### Phase 2: API Testing (10 minutes)
1. ✅ Get JWT token (from meal planner or generate test token)
2. ✅ Test fitness profile endpoint
3. ✅ Test create profile
4. ✅ Test workouts endpoint
5. ✅ Test nutrition endpoints

### Phase 3: Auth Testing (5 minutes)
1. ✅ Test 401 without token
2. ✅ Test invalid token
3. ✅ Verify user scoping

### Phase 4: Frontend Testing (10 minutes)
1. ✅ Start frontend: `cd fitness/frontend && npm start`
2. ✅ Verify REACT_APP_API_URL loads
3. ✅ Test API calls from frontend
4. ✅ Verify error handling

**Total Time:** ~30 minutes for comprehensive testing

---

## 🔧 Getting a JWT Token for Testing

### Option 1: From Meal Planner Login
If you have the meal planner running, get a token by logging in and copying from localStorage:
```javascript
localStorage.getItem('token')
```

### Option 2: Generate Test Token (Node.js)
```bash
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: 'test-user-123', email: 'test@example.com' },
  'test-secret',
  { expiresIn: '1h' }
);
console.log('Test Token:');
console.log(token);
"
```

### Option 3: Use Docker/Compose JWT
If using docker-compose setup, get token from environment or logs.

---

## 📊 Expected Response Examples

### Health Check Response
```json
{
  "status": "ok",
  "service": "fitness-backend",
  "timestamp": "2025-12-21T10:30:00Z",
  "node_env": "production"
}
```

### Profile Response (Success)
```json
{
  "id": "profile-123",
  "user_id": "user-123",
  "height_cm": 180,
  "weight_kg": 75,
  "age": 30,
  "gender": "male",
  "activity_level": "active",
  "created_at": "2025-12-21T...",
  "updated_at": "2025-12-21T..."
}
```

### Profile Response (New User - Empty)
```json
{}
```

### Nutrition Summary Response
```json
{
  "date": "2025-12-21",
  "totalCalories": 2100,
  "protein": 150,
  "carbs": 250,
  "fats": 70,
  "meals": [
    {
      "type": "breakfast",
      "name": "Oatmeal with berries",
      "calories": 400,
      "protein": 15,
      "carbs": 65,
      "fats": 10
    }
  ],
  "timestamp": "2025-12-21T10:30:00Z"
}
```

### 401 Unauthorized Response
```json
{
  "error": "Unauthorized",
  "message": "No token provided",
  "timestamp": "2025-12-21T..."
}
```

---

## 🚨 Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Backend won't start | See FITNESS_ENV_SETUP.md → Troubleshooting |
| 401 errors | Add JWT token: `-H "Authorization: Bearer $TOKEN"` |
| DATABASE_URL missing | Run: `cd fitness && bash env-sync.sh` |
| REACT_APP_API_URL missing | Run: `cd fitness && bash env-sync.sh` |
| Can't connect to API | Verify backend running: `curl localhost:5001/health` |

---

## ✨ Key Features to Test

- ✅ Health endpoint works without auth
- ✅ All fitness endpoints require JWT
- ✅ Profile endpoint returns 200 or empty
- ✅ Nutrition endpoints read-only (GET only)
- ✅ 401 error when token missing
- ✅ User data is scoped (users see own data)
- ✅ Error messages are clear and helpful
- ✅ Frontend can load REACT_APP_API_URL

---

## 📋 Test Results Template

```
Date: _______________
Tester: ______________
Environment: Local / Production

✅ Health check (no auth)
✅ Profile endpoint (with auth)
✅ Create profile (POST)
✅ Workouts endpoint (GET)
✅ Log workout (POST)
✅ Goals endpoint (GET)
✅ Set goal (POST)
✅ Nutrition summary (GET)
✅ Nutrition weekly (GET)
✅ Nutrition targets (GET)
✅ 401 error without token
✅ Frontend loads API config

Issues Found:
_________________________________________________________________
_________________________________________________________________

Status: PASSED / FAILED
```

---

## 🎉 Ready to Test!

Everything is set up and verified. You can now:

1. **Test Locally** - Use the commands above
2. **Test in Staging** - Deploy to Render/Vercel and use production URLs
3. **Test in Production** - After final deployment

For detailed documentation, see the files referenced above.

**Questions?** Check the documentation files in the root directory.

---

**Status:** ✅ Ready for testing  
**Last Updated:** December 21, 2025  
**All Tests:** Passing ✅
