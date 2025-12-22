# 🚀 CLOUD DEPLOYMENT GUIDE - Fitness App

## Architecture: Vercel + Render + Neon

```
┌─────────────────────────────────────────────┐
│  Your Local Machine (Only for development) │
│  - Git repository                           │
│  - Code editor (VS Code)                    │
└─────────────────────────────────────────────┘
                    │
                    │ git push
                    ▼
┌─────────────────────────────────────────────┐
│           GitHub Repository                 │
│  (meal_planner_app)                         │
└─────────────────────────────────────────────┘
      │                           │
      │ auto-deploy              │ auto-deploy
      ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│ Vercel Frontend  │      │ Render Backend   │
│ (React App)      │      │ (Express API)    │
│ localhost:3000   │──API─►│ localhost:5000  │
└──────────────────┘      └──────────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │ Neon Database    │
                        │ PostgreSQL Cloud │
                        └──────────────────┘
```

---

## ✅ STEP 1: Deploy Backend to Render

### 1.1 Push Code to GitHub

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/gitprojects/meal_planner_app
git add .
git commit -m "feat: add fitness module with backend and frontend"
git push origin main
```

### 1.2 Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended for automatic deployments)
3. Authorize Render to access your repositories

### 1.3 Deploy Backend Service

1. In Render dashboard, click **New +** → **Web Service**
2. Select your `meal_planner_app` repository
3. Configure service:
   ```
   Name:           fitness-backend
   Environment:    Node
   Region:         (select closest to you)
   Branch:         main
   Build Command:  cd fitness/backend && npm install
   Start Command:  cd fitness/backend && npm start
   ```
4. Click **Create Web Service**

### 1.4 Set Environment Variables in Render

In the Render dashboard for your service:

1. Go to **Environment** section
2. Add these variables:

```
NODE_ENV                production
PORT                    5000
DATABASE_URL            postgresql://neondb_owner:npg_CWXAK5daMiL8@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET              your_jwt_secret_here
SESSION_SECRET          your_session_secret_here
FRONTEND_BASE           https://fitness-app.vercel.app
```

3. Click **Save**
4. Render will automatically redeploy with new variables

### 1.5 Wait for Deployment

- Deployment takes 2-5 minutes
- Check the **Logs** tab to see build progress
- Once complete, you'll see: `Server running on port 5000`

### 1.6 Test Your Backend

```bash
# Get your Render URL from the dashboard
# It looks like: https://fitness-backend-xxxxx.onrender.com

# Test health endpoint
curl https://fitness-backend-xxxxx.onrender.com/health | jq .

# Expected response:
{
  "status": "ok",
  "service": "fitness-backend",
  "node_env": "production"
}
```

✅ **Backend is now live!**

Save your Render URL: `https://fitness-backend-xxxxx.onrender.com`

---

## ✅ STEP 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### 2.2 Deploy Frontend

1. In Vercel dashboard, click **New Project**
2. Select your `meal_planner_app` repository
3. Configure:
   ```
   Framework:      Next.js (or React if you used CRA)
   Build Command:  cd fitness/frontend && npm run build
   Output Dir:     fitness/frontend/build
   Install Cmd:    npm install
   ```

### 2.3 Set Environment Variables in Vercel

1. Go to **Settings** → **Environment Variables**
2. Add:
   ```
   REACT_APP_API_URL    https://fitness-backend-xxxxx.onrender.com
   ```
   (Replace with your actual Render backend URL from Step 1.6)

3. Click **Save**
4. Redeploy or push a new commit to trigger redeployment

### 2.4 Wait for Deployment

- Deployment takes 1-3 minutes
- Once complete, you'll get a URL like: `https://fitness-app-xxxxx.vercel.app`

### 2.5 Test Your Frontend

1. Visit `https://fitness-app-xxxxx.vercel.app`
2. App should load without errors
3. Check browser console for any API errors

✅ **Frontend is now live!**

---

## ✅ STEP 3: Test Full Integration

### 3.1 Generate JWT Token

```bash
# Use any JWT generator or run locally:
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: '550e8400-e29b-41d4-a716-446655440000', email: 'test@example.com' },
  'your_jwt_secret_here',
  { expiresIn: '24h' }
);
console.log('JWT_TOKEN=' + token);
"
```

### 3.2 Test Backend Endpoints

```bash
# Replace with your actual Render URL and token
export BACKEND_URL="https://fitness-backend-xxxxx.onrender.com"
export JWT_TOKEN="your_token_here"

# Test health (no auth)
curl $BACKEND_URL/health | jq .

# Test API with auth
curl -X GET $BACKEND_URL/api/fitness/profile \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .

# Create profile
curl -X POST $BACKEND_URL/api/fitness/profile \
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

### 3.3 Test Frontend

1. Visit your Vercel URL
2. Try to:
   - Load the app
   - Navigate pages
   - Make API calls (should connect to Render backend)

---

## 🔗 Production URLs

Once deployed, you'll have:

```
Frontend:  https://fitness-app-xxxxx.vercel.app
Backend:   https://fitness-backend-xxxxx.onrender.com
Database:  Connected to Neon automatically
```

---

## 📋 Summary

| Component | Local | Cloud |
|-----------|-------|-------|
| Frontend | http://localhost:3000 | https://fitness-app-xxxxx.vercel.app |
| Backend | http://localhost:5000 | https://fitness-backend-xxxxx.onrender.com |
| Database | Neon (cloud) | Neon (cloud) |

**Everything is cloud-based = single instance, no local conflicts!**

---

## ⚡ Benefits of This Setup

✅ **No local ports** - No port 5000/3000 conflicts  
✅ **Always on** - Apps run 24/7 in the cloud  
✅ **Auto-deploy** - Push to GitHub → auto-deploys  
✅ **Scalable** - Easy to upgrade instances  
✅ **Monitoring** - Logs and metrics in dashboards  
✅ **Multiple apps** - Render/Vercel handle isolation  

---

## 🆘 Troubleshooting

**Frontend can't connect to backend?**
- Check REACT_APP_API_URL is set correctly
- Verify backend is running (check Render logs)
- Check CORS is enabled in backend

**Backend won't start?**
- Check DATABASE_URL is correct (Neon)
- Check JWT_SECRET and SESSION_SECRET are set
- View Render logs for errors

**Database connection failing?**
- Verify DATABASE_URL in Render environment
- Check Neon dashboard for connection issues
- Make sure IP restrictions aren't blocking Render

---

**Next: Push to GitHub and deploy! 🚀**
