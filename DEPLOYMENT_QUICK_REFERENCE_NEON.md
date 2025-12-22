# 🎯 QUICK REFERENCE - Fitness App Deployment (Neon Backend)

## 🚀 Deploy in 2 Easy Steps (15 minutes)

### Step 1: Push to GitHub (5 min)
```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/gitprojects/meal_planner
git add .
git commit -m "feat: fitness app ready for Neon + Vercel"
git push origin main
```

### Step 2: Deploy Frontend to Vercel (10 min)
1. Go to https://vercel.com → Sign up with GitHub
2. New Project → Select your `meal_planner` repo
3. Build: `cd fitness/frontend && npm run build`
4. Output: `fitness/frontend/build`
5. Deploy!
6. Add Environment Variable:
   ```
   REACT_APP_API_URL = https://your-neon-api-endpoint.sql.vercel.sh
   ```
   (Or if using serverless functions: https://yourdomain.vercel.app/api)

**Save URL:** `https://fitness-app-xxxxx.vercel.app`

---

## ✅ Test

```bash
# Health check
curl https://fitness-app-xxxxx.vercel.app/health | jq .

# Get profile (needs JWT token)
curl https://fitness-app-xxxxx.vercel.app/api/fitness/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq .
```

---

## 🎉 Done!

| Component | Where |
|-----------|-------|
| Frontend | Vercel |
| Backend API | Vercel Serverless Functions |
| Database | Neon PostgreSQL |

---

## 📚 Full Guides

- **FITNESS_DEPLOYMENT_SUMMARY.md** - Why this architecture
- **NEON_DEPLOYMENT_GUIDE.md** - Complete step-by-step
- **DEPLOYMENT_CHECKLIST.md** - Checkbox guide

---

## 🔄 Update Your App

```bash
git add .
git commit -m "your message"
git push origin main
```

Vercel auto-redeploys! 🚀

---

**Deployment takes ~15 minutes total. Let's go! 🚀**
