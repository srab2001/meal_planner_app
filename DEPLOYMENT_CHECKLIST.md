# ✅ DEPLOYMENT CHECKLIST - Fitness App

## Before You Start
- [ ] You have a Render account (https://render.com)
- [ ] You have a Vercel account (https://vercel.com)
- [ ] Your code is pushed to GitHub
- [ ] You have your Neon database URL
- [ ] You have JWT_SECRET and SESSION_SECRET values

---

## 🚀 STEP 1: Deploy Backend to Render

- [ ] Go to https://render.com
- [ ] Click **New +** → **Web Service**
- [ ] Select `meal_planner_app` repository
- [ ] Set Name: `fitness-backend`
- [ ] Set Build Command: `cd fitness/backend && npm install`
- [ ] Set Start Command: `cd fitness/backend && npm start`
- [ ] Click **Create Web Service**
- [ ] Wait for deployment (2-3 minutes)
- [ ] Add Environment Variables in Render:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=5000`
  - [ ] `DATABASE_URL=your_neon_url`
  - [ ] `JWT_SECRET=your_secret`
  - [ ] `SESSION_SECRET=your_secret`
  - [ ] `FRONTEND_BASE=https://fitness-app-xxxxx.vercel.app`
- [ ] Redeploy (Render will rebuild with new vars)
- [ ] Test health endpoint: `curl https://fitness-backend-xxxxx.onrender.com/health`
- [ ] ✅ Backend is live! Save the URL.

**Your Backend URL:** `https://fitness-backend-xxxxx.onrender.com`

---

## 🎨 STEP 2: Deploy Frontend to Vercel

- [ ] Go to https://vercel.com
- [ ] Click **New Project**
- [ ] Select `meal_planner_app` repository
- [ ] Set Build Command: `cd fitness/frontend && npm run build`
- [ ] Set Output Directory: `fitness/frontend/build`
- [ ] Click **Deploy**
- [ ] Wait for deployment (1-2 minutes)
- [ ] Add Environment Variables in Vercel:
  - [ ] `REACT_APP_API_URL=https://fitness-backend-xxxxx.onrender.com`
  - [ ] (Use your Render backend URL from Step 1)
- [ ] Click **Save and Redeploy**
- [ ] Wait for redeployment
- [ ] Visit your frontend URL and test
- [ ] ✅ Frontend is live!

**Your Frontend URL:** `https://fitness-app-xxxxx.vercel.app`

---

## 🧪 STEP 3: Test Production

- [ ] Generate JWT token:
  ```bash
  node -e "
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { id: '550e8400-e29b-41d4-a716-446655440000', email: 'test@example.com' },
    'your_jwt_secret',
    { expiresIn: '24h' }
  );
  console.log(token);
  "
  ```

- [ ] Test backend health:
  ```bash
  curl https://fitness-backend-xxxxx.onrender.com/health | jq .
  ```

- [ ] Test profile endpoint:
  ```bash
  curl https://fitness-backend-xxxxx.onrender.com/api/fitness/profile \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq .
  ```

- [ ] Visit frontend URL in browser
- [ ] Check console for API errors
- [ ] ✅ All tests passed!

---

## 📝 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't deploy | Check Render logs. Ensure DATABASE_URL is set. |
| Frontend can't connect to API | Verify REACT_APP_API_URL is correct in Vercel. Check CORS. |
| Database errors | Verify DATABASE_URL works. Test with psql or Neon dashboard. |
| Authentication fails | Check JWT_SECRET matches in Render and your token generation. |

---

## 🎉 You're Done!

Your fitness app is now:
- ✅ Running in the cloud
- ✅ Connected to Neon database
- ✅ Auto-deployed from GitHub
- ✅ Accessible 24/7
- ✅ No local port conflicts

**Production URLs:**
- Frontend: https://fitness-app-xxxxx.vercel.app
- Backend: https://fitness-backend-xxxxx.onrender.com
- Database: Neon (automatically connected)

---

## 🔄 Updating Your App

To update the app:

1. Make changes locally
2. Test locally (optional)
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "feat: update fitness app"
   git push origin main
   ```
4. Vercel and Render automatically redeploy! 🚀

---

## 📚 Additional Resources

- **CLOUD_DEPLOYMENT_GUIDE.md** - Detailed deployment walkthrough
- **FITNESS_TEST_GUIDE.md** - Testing commands and endpoints
- **fitness/master.env** - Environment variables reference
- **Render Dashboard** - https://dashboard.render.com
- **Vercel Dashboard** - https://vercel.com/dashboard
- **Neon Console** - https://console.neon.tech

---

**Questions? Check the guides above or review the backend/frontend code!**
