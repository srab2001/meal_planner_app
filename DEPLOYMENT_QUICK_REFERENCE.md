# 🎯 QUICK REFERENCE - Fitness App Deployment

## 🚀 Deploy in 3 Easy Steps

### Step 1: Push to GitHub (5 min)
```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/gitprojects/meal_planner_app
git add .
git commit -m "feat: add fitness app"
git push origin main
```

### Step 2: Deploy Backend (10 min)
1. Go to https://render.com → Sign up
2. New Web Service → Select your repo
3. Build: `cd fitness/backend && npm install`
4. Start: `cd fitness/backend && npm start`
5. Environment vars: DATABASE_URL, JWT_SECRET, SESSION_SECRET, etc
6. Deploy!

**Save URL:** `https://fitness-backend-xxxxx.onrender.com`

### Step 3: Deploy Frontend (10 min)
1. Go to https://vercel.com → Sign up
2. New Project → Select your repo
3. Build: `cd fitness/frontend && npm run build`
4. Env var: `REACT_APP_API_URL=https://fitness-backend-xxxxx.onrender.com`
5. Deploy!

**Save URL:** `https://fitness-app-xxxxx.vercel.app`

---

## ✅ Test

```bash
# Health check
curl https://fitness-backend-xxxxx.onrender.com/health | jq .

# Get profile (needs JWT token)
curl https://fitness-backend-xxxxx.onrender.com/api/fitness/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq .
```

---

## 🎉 Done!

| Component | URL |
|-----------|-----|
| Frontend | https://fitness-app-xxxxx.vercel.app |
| Backend | https://fitness-backend-xxxxx.onrender.com |
| Database | Neon (automatic) |

---

## 📚 Full Guides

- **FITNESS_DEPLOYMENT_SUMMARY.md** - Why cloud deployment
- **CLOUD_DEPLOYMENT_GUIDE.md** - Detailed step-by-step
- **DEPLOYMENT_CHECKLIST.md** - Checkbox guide + troubleshooting
- **FITNESS_TEST_GUIDE.md** - Testing and local dev

---

## 🔄 Update Your App

1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "your message"
   git push origin main
   ```
3. Vercel and Render auto-redeploy! 🚀

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't deploy | Check Render logs. Verify DATABASE_URL env var is set. |
| Frontend can't connect API | Verify REACT_APP_API_URL is correct in Vercel env vars. |
| Database errors | Test DATABASE_URL. Check Neon dashboard. |
| Auth fails | Ensure JWT_SECRET matches between Render and token generator. |

---

**Everything ready! Deployment takes ~25 minutes total. Let's go! 🚀**
