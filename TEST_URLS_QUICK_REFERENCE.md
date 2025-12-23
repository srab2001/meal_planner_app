# 🧪 Application Test URLs - Quick Reference Card

## 🎯 The Essential URLs You Need

### **Main Entry Point**
```
http://localhost:3000       (React Frontend - Meal Planner UI)
```

### **Backend APIs**
```
http://localhost:5000       (Meal Planner Backend)
http://localhost:5001       (Fitness Module Backend)
```

### **Health Checks (No Auth Required)**
```
GET http://localhost:5000/api/health
GET http://localhost:5001/health
```

---

## 🚀 Quick Start (3 Terminal Windows)

### Terminal 1: Meal Planner Backend
```bash
npm start
# Runs on http://localhost:5000
```

### Terminal 2: Fitness Backend
```bash
cd fitness/backend && npm start
# Runs on http://localhost:5001
```

### Terminal 3: React Frontend
```bash
cd client && npm start
# Opens http://localhost:3000
```

**Then open browser:** http://localhost:3000 ✨

---

## 📍 Frontend Routes (React App)

| Page | URL |
|------|-----|
| Home | `http://localhost:3000` |
| Meal Questionnaire | `http://localhost:3000/questionnaire` |
| Meal Plan | `http://localhost:3000/meal-plan` |
| Shopping List | `http://localhost:3000/shopping-list` |
| Account | `http://localhost:3000/account` |

---

## 🔌 API Endpoints Quick List

### Meal Planner (localhost:5000)
```
POST   /api/generate-meals              Generate meal plan
GET    /api/meals                       Get user's meals
POST   /api/save-meal-plan             Save the meal plan
GET    /api/shopping-list              Get shopping list
POST   /api/special-occasion/options   Get special occasion meals
POST   /api/meal/{id}/regenerate-recipe  Regenerate single recipe
GET    /api/favorites                  Get favorite meals
POST   /api/favorites                  Add to favorites
DELETE /api/favorites/{id}             Remove from favorites
```

### Fitness Module (localhost:5001)
```
POST   /api/fitness/profile            Create/update profile
GET    /api/fitness/profile            Get profile
POST   /api/fitness/workouts           Log workout
GET    /api/fitness/workouts           Get workouts
POST   /api/fitness/interview          AI Coach interview
GET    /api/fitness/workout-plan       Get workout plan
GET    /api/nutrition/summary          Nutrition summary
GET    /api/nutrition/weekly           Weekly nutrition
```

---

## 🧪 Testing Commands

### Quick Health Check
```bash
curl http://localhost:5000/api/health | jq
curl http://localhost:5001/health | jq
```

### With Authentication (requires JWT token)
```bash
export JWT_TOKEN="your-token-here"

curl -H "Authorization: Bearer $JWT_TOKEN" \
     http://localhost:5000/api/meals | jq

curl -H "Authorization: Bearer $JWT_TOKEN" \
     http://localhost:5001/api/fitness/profile | jq
```

### Get Token from Browser
1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Copy value of `auth_token`

---

## 📊 Production URLs

```
Frontend:  https://meal-planner-gold-one.vercel.app
Backend:   https://meal-planner-app-mve2.onrender.com
```

---

## 🔑 Key Points

✅ **Frontend** - http://localhost:3000 (Browser)
✅ **Meal Backend** - http://localhost:5000 (API)
✅ **Fitness Backend** - http://localhost:5001 (API)
✅ **Need JWT?** - Login via UI first, get from localStorage
✅ **Testing?** - Use curl or browser DevTools Network tab
✅ **All 3 running?** - App is fully functional!

---

## 📋 Test Workflow

1. **Open** http://localhost:3000
2. **Sign In** (Google OAuth or local)
3. **Fill Form** (Meal preferences)
4. **Generate** Meals
5. **View Plan** at http://localhost:3000/meal-plan
6. **Try Features** (Shopping list, special occasion, etc.)
7. **Watch Network** (F12 → Network tab) to see API calls

---

## 🛠️ Troubleshooting

| Issue | Check |
|-------|-------|
| Can't connect to localhost:3000 | `cd client && npm start` |
| API returns 500 | Check terminal for errors, restart `npm start` |
| "Unauthorized" error | Get JWT token, add to headers |
| Fitness routes 404 | Make sure fitness backend running on :5001 |
| Database error | Check `.env` has correct DATABASE_URL |

---

**Last Updated:** December 23, 2025  
**Print This** for quick reference during testing!
