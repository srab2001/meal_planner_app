# Quick Deployment Guide

**Version:** 2.0.0
**Status:** Ready to Deploy
**Time Required:** 30-45 minutes

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Verify environment variables
./verify-env.sh

# 2. Run deployment script
./deploy.sh

# 3. Monitor and test (manual)
# - Watch Render dashboard
# - Watch Vercel dashboard
# - Run post-deployment tests
```

---

## 📋 Pre-Deployment (5 minutes)

### Step 1: Verify Environment Variables

Run the verification script:

```bash
cd fitness
./verify-env.sh
```

This will prompt you to confirm:
- ✓ Render: 4 environment variables
- ✓ Vercel: 2 environment variables
- ✓ Vercel: Build settings

### Step 2: Review CORS Configuration

Ensure your backend `server.js` or `app.js` includes:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://meal-planner-gold-one.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

---

## 🚀 Deployment (10 minutes)

### Run Deployment Script

```bash
cd fitness
./deploy.sh
```

The script will:
1. ✅ Verify git repository
2. ✅ Check critical files
3. ✅ Confirm environment variables (manual)
4. ✅ Verify CORS configuration (manual)
5. ✅ Run automated tests
6. ✅ Test production build
7. ✅ Show git status
8. ✅ Commit all changes
9. ✅ Push to main branch
10. ✅ Display monitoring instructions

---

## 👀 Monitoring (15-20 minutes)

### Render (Backend) - 5-10 minutes

1. Go to: https://dashboard.render.com
2. Select: `meal-planner-app-mve2`
3. Watch: Deployment logs
4. Wait for: "Live" status

**Common Issues:**
- If deployment fails, check environment variables
- If build fails, check package.json scripts
- If runtime errors, check logs for missing dependencies

### Vercel (Frontend) - 3-5 minutes

1. Go to: https://vercel.com/dashboard
2. Select: `meal-planner-gold-one`
3. Watch: Build logs
4. Wait for: "Ready" status

**Common Issues:**
- If build fails, check build settings
- If preview works but production fails, check environment variables
- If 404 errors, check output directory setting

---

## 🧪 Post-Deployment Testing (10 minutes)

### 1. Backend Health Check

```bash
curl https://meal-planner-app-mve2.onrender.com/api/health
```

**Expected:** `{"status": "ok"}` or similar

### 2. Exercise Library Check

```bash
export JWT_TOKEN="your-jwt-token-here"

curl https://meal-planner-app-mve2.onrender.com/api/fitness/exercise-definitions \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Expected:** JSON with 40 exercises

### 3. Frontend Manual Test

Visit: https://meal-planner-gold-one.vercel.app

**Test Checklist:**
- [ ] Login works
- [ ] Dashboard loads
- [ ] Navigate to "Log Workout"
- [ ] Click "Add Exercise" button
- [ ] Exercise selector shows 40 exercises
- [ ] Can filter by category (chest, back, legs)
- [ ] Can add exercise to workout
- [ ] Can add sets (reps, weight)
- [ ] Can save workout
- [ ] Navigate to workout detail page
- [ ] Can edit workout
- [ ] Can delete workout
- [ ] Navigate to AI Coach
- [ ] AI Coach loads questions
- [ ] Can generate workout plan
- [ ] Browser back/forward works
- [ ] No console errors

### 4. Create Workout Test (API)

```bash
export JWT_TOKEN="your-jwt-token-here"

curl https://meal-planner-app-mve2.onrender.com/api/fitness/workouts \
  -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workout_date": "2025-12-25",
    "workout_name": "Deployment Test",
    "workout_type": "strength"
  }'
```

**Expected:** 200 OK with workout data

---

## ✅ Success Criteria

**Deployment is successful when ALL are true:**

1. ✅ Backend responds to `/api/health`
2. ✅ Exercise library returns 40 exercises
3. ✅ Frontend loads without errors
4. ✅ Can create workout
5. ✅ Can add exercises from library
6. ✅ Can add sets (reps, weight)
7. ✅ Can save workout
8. ✅ Can view workout detail
9. ✅ Can edit workout
10. ✅ Can delete workout
11. ✅ AI Coach generates workouts
12. ✅ Navigation works (React Router)
13. ✅ No console errors in browser
14. ✅ Mobile responsive design works
15. ✅ No 500 errors in backend logs

---

## 🔄 Rollback (If Needed)

### Backend Rollback (Render)

1. Go to Render dashboard
2. Navigate to Deployments
3. Find previous working deployment
4. Click "Redeploy"
5. Wait for deployment (~5 min)

### Frontend Rollback (Vercel)

1. Go to Vercel dashboard
2. Navigate to Deployments
3. Find previous working deployment
4. Click "Promote to Production"
5. Wait for deployment (~2 min)

### Database Rollback

**NOT NEEDED** - Migration 003 is additive (no destructive changes)

---

## 📞 Troubleshooting

### Issue 1: Backend 500 errors

**Check:**
- Render logs for error details
- Environment variables are set correctly
- Database connection string is valid

**Fix:**
```bash
# Verify DATABASE_URL in Render dashboard
# Should be: postgresql://neondb_owner:npg_...@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Issue 2: Frontend CORS errors

**Check:**
- Browser console for CORS error message
- Backend CORS configuration

**Fix:**
- Update backend `server.js` or `app.js` with Vercel domain
- Redeploy backend

### Issue 3: Exercise library empty

**Check:**
- Database migration was applied
- Exercise count in database

**Verify:**
```bash
export DATABASE_URL="$FITNESS_DATABASE_URL"
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM exercise_definitions;"
```

**Expected:** 40

**Fix:**
```bash
# Re-run migration
cd fitness
export DATABASE_URL="$FITNESS_DATABASE_URL"
npx prisma db execute --file prisma/migrations/003_add_exercise_library/migration.sql
```

### Issue 4: Frontend build fails

**Check:**
- Vercel build logs
- package.json scripts
- Build settings (output directory)

**Common Causes:**
- Wrong output directory (should be `fitness/frontend/build` or `fitness/frontend/dist`)
- Missing dependencies
- Environment variables not set

### Issue 5: AI Coach not working

**Check:**
- OPENAI_API_KEY is set in Render
- Backend logs for OpenAI API errors
- API key is valid

**Test:**
```bash
export JWT_TOKEN="your-jwt-token"
curl https://meal-planner-app-mve2.onrender.com/api/fitness/ai-interview \
  -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Test"}],
    "interview_answers": {},
    "userProfile": {"age": 28, "fitness_level": "intermediate"}
  }'
```

---

## 📚 Additional Resources

**Documentation:**
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) - Current deployment status
- [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md) - Detailed checklist
- [LESSONS_LEARNED.md](LESSONS_LEARNED.md) - Technical issues & solutions
- [API_INTEGRATION_GUIDE.md](docs/API_INTEGRATION_GUIDE.md) - API reference

**Scripts:**
- `./verify-env.sh` - Verify environment variables
- `./deploy.sh` - Full deployment script
- `./test-api.js` - Automated API tests

---

## 🎯 Timeline

| Phase | Duration | Activity |
|-------|----------|----------|
| **Pre-Deployment** | 5 min | Verify environment variables & CORS |
| **Deployment** | 10 min | Run deploy script (commit + push) |
| **Monitoring** | 15-20 min | Watch Render & Vercel deployments |
| **Testing** | 10 min | Run post-deployment tests |
| **Total** | **40-45 min** | Complete deployment cycle |

---

## 🎉 Completion

After all success criteria are met:

1. ✅ Mark deployment as complete
2. ✅ Update team/stakeholders
3. ✅ Monitor for 24-48 hours
4. ✅ Collect user feedback
5. ✅ Plan next iteration

---

**Status:** Ready to Deploy ✅
**Confidence:** HIGH (95%)
**Risk:** LOW

**Prepared:** December 25, 2025
**Version:** 2.0.0
