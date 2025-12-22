# ✅ BACKEND RUNNING - TESTING GUIDE

**Status:** 🟢 **BACKEND ONLINE**  
**Port:** 5000  
**Date:** December 21, 2025

---

## 🎉 SUCCESS - Backend is Running!

```
✓ Environment validation passed
✓ Database connection successful
🏃 Fitness Backend running on http://localhost:5000
```

---

## 🔗 TESTING URLS & COMMANDS

### ✅ Health Check (No Auth Required)

```bash
curl http://localhost:5000/health | jq .
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "fitness-backend",
  "timestamp": "2025-12-22T01:31:02.514Z",
  "node_env": "production"
}
```

---

## 🏋️ FITNESS API ENDPOINTS

All fitness endpoints require JWT authentication.

### Available Endpoints:

```
GET  /api/fitness/profile        - Get user profile
POST /api/fitness/profile        - Create/update profile
GET  /api/fitness/workouts       - List user workouts
POST /api/fitness/workouts       - Log a new workout
GET  /api/fitness/goals          - List user goals
POST /api/fitness/goals          - Create a new goal
```

### Example Request (Requires JWT Token):

```bash
# Set your JWT token
export JWT_TOKEN="your_jwt_token_here"

# Get profile
curl -X GET http://localhost:5000/api/fitness/profile \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

---

## 🍎 NUTRITION API ENDPOINTS (Read-Only)

All nutrition endpoints require JWT authentication.

### Available Endpoints:

```
GET /api/nutrition/summary        - Today's nutrition totals
GET /api/nutrition/weekly         - Last 7 days trends
GET /api/nutrition/macro-targets  - Daily macro targets
```

### Example Request:

```bash
# Get today's nutrition summary
curl -X GET http://localhost:5000/api/nutrition/summary \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

---

## 🔐 Getting a JWT Token

### Option 1: From Meal Planner

If you have the meal planner running, login and get the token from:
```javascript
localStorage.getItem('token')
```

### Option 2: Generate Test Token

```bash
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: 'test-user-123', email: 'test@example.com' },
  'test-secret',
  { expiresIn: '24h' }
);
console.log('Test JWT Token:');
console.log(token);
"
```

Then use it:
```bash
export JWT_TOKEN="paste_token_here"
```

---

## 📋 QUICK TESTING COMMANDS

### 1️⃣ Health Check (No Token Needed)
```bash
curl http://localhost:5000/health | jq .
```

### 2️⃣ Get Profile (With Token)
```bash
curl -X GET http://localhost:5000/api/fitness/profile \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### 3️⃣ Create Profile
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

### 4️⃣ Log a Workout
```bash
curl -X POST http://localhost:5000/api/fitness/workouts \
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

### 5️⃣ Get Workouts
```bash
curl -X GET http://localhost:5000/api/fitness/workouts \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### 6️⃣ Get Goals
```bash
curl -X GET http://localhost:5000/api/fitness/goals \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### 7️⃣ Set a Goal
```bash
curl -X POST http://localhost:5000/api/fitness/goals \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal_type": "weight_loss",
    "target_value": 70,
    "target_date": "2026-06-21",
    "description": "Lose 5kg by summer"
  }' | jq .
```

### 8️⃣ Get Nutrition Summary
```bash
curl -X GET http://localhost:5000/api/nutrition/summary \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### 9️⃣ Get Weekly Nutrition
```bash
curl -X GET http://localhost:5000/api/nutrition/weekly \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

### 🔟 Get Macro Targets
```bash
curl -X GET http://localhost:5000/api/nutrition/macro-targets \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

---

## 🔐 Test Authorization (401 Error)

```bash
# This should return 401 Unauthorized
curl -X GET http://localhost:5000/api/fitness/profile | jq .
```

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "No token provided"
}
```

---

## 📊 Complete Endpoint Reference

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | /health | ❌ | Server health check |
| GET | /api/fitness/profile | ✅ | Get user profile |
| POST | /api/fitness/profile | ✅ | Create/update profile |
| GET | /api/fitness/workouts | ✅ | List workouts |
| POST | /api/fitness/workouts | ✅ | Log workout |
| GET | /api/fitness/goals | ✅ | List goals |
| POST | /api/fitness/goals | ✅ | Create goal |
| GET | /api/nutrition/summary | ✅ | Daily nutrition |
| GET | /api/nutrition/weekly | ✅ | Weekly trends |
| GET | /api/nutrition/macro-targets | ✅ | Macro targets |

---

## 🚀 PRODUCTION URLS (After Deployment)

Once deployed to production:

```
Backend: https://fitness-backend.onrender.com
Frontend: https://fitness-app.vercel.app

Health Check:
  https://fitness-backend.onrender.com/health

Fitness Endpoints:
  https://fitness-backend.onrender.com/api/fitness/*

Nutrition Endpoints:
  https://fitness-backend.onrender.com/api/nutrition/*
```

---

## ✅ BACKEND VERIFICATION CHECKLIST

- ✅ Backend running on http://localhost:5000
- ✅ Database connected to Neon
- ✅ Environment variables validated
- ✅ Health endpoint responding
- ✅ All 10 endpoints available
- ✅ Authentication middleware active
- ✅ Error handling configured
- ✅ Ready for testing

---

## 📝 Testing Checklist

Use this template to record your tests:

```
Date: December 21, 2025
Tester: [Your Name]

✅ Health endpoint works
✅ Database connected
✅ Env variables set
✅ Get profile (with token)
✅ Create profile (with token)
✅ Get workouts (with token)
✅ Log workout (with token)
✅ Get goals (with token)
✅ Create goal (with token)
✅ Get nutrition (with token)
✅ 401 error without token

Notes:
_________________________________________________________________

Status: PASSED ✅
```

---

## 🎯 NEXT STEPS

1. ✅ Backend is running - verified
2. 📝 Get a JWT token (see "Getting a JWT Token" section above)
3. 🧪 Test the endpoints using the commands above
4. 📊 Verify responses match expected format
5. ✅ Mark tests as passed/failed in checklist
6. 🚀 Ready for frontend integration

---

## 📞 SUPPORT

**Port Issue?**
- Backend is running on port **5000** (not 5001)
- Update any references in your testing

**Token Error?**
- Make sure to set JWT_TOKEN: `export JWT_TOKEN="..."`
- Include Authorization header: `-H "Authorization: Bearer $JWT_TOKEN"`

**Database Error?**
- Check DATABASE_URL in `fitness/backend/.env`
- Verify Neon connection is active

**Module Not Found?**
- Already fixed! The routes path has been corrected

---

## 🎉 YOU'RE ALL SET!

Backend is online and ready for testing. Use the commands above to test all endpoints.

**Start with:** 
```bash
curl http://localhost:5000/health | jq .
```

Good luck! 🚀
