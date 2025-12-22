# Fitness Module - Deployment Guide

**Status:** Ready for Deployment  
**Date:** December 21, 2025  
**Deployment Targets:** Vercel (Frontend) + Render (Backend)  

---

## 📋 Pre-Deployment Checklist

- [ ] All code committed to git
- [ ] Environment variables configured
- [ ] Tests passing (if applicable)
- [ ] Backend running locally without errors
- [ ] Frontend building without errors
- [ ] API endpoints tested and working
- [ ] Database migrations applied
- [ ] CORS configured
- [ ] Error handling in place
- [ ] Logging configured

---

## 🚀 Backend Deployment (Render)

### 1. Prepare Backend

```bash
# Navigate to root directory
cd /Users/stuartrabinowitz/Library/Mobile\ Documents/com~apple~CloudDocs/gitprojects/meal_planner

# Commit all changes
git add .
git commit -m "Add fitness module - backend and frontend"

# Verify server starts
npm start
# Should see: Server running on port 3001
```

### 2. Configure Render.yaml

Already configured in project root. Verify file exists:

```bash
ls -la render.yaml
```

### 3. Deploy to Render

The project is already configured for Render with the existing `render.yaml`. 

**Option A: Automatic Deployment (Recommended)**

1. Push to GitHub:
   ```bash
   git push origin main
   ```

2. Render automatically deploys based on `render.yaml` configuration

**Option B: Manual Deployment**

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service
3. Click "Manual Deploy"
4. Select "deploy latest commit"

### 4. Verify Backend Deployment

```bash
# Test deployed endpoint
curl https://your-render-service.onrender.com/api/fitness/workouts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return 200 with JSON response
```

---

## 🎨 Frontend Deployment (Vercel)

### 1. Build Frontend

```bash
# Navigate to frontend directory
cd fitness/frontend

# Install dependencies (if needed)
npm install

# Build production bundle
npm run build

# Verify build succeeds
ls -la build/
# Should see index.html, static/, etc.
```

### 2. Configure Environment Variables for Vercel

Create `.env.production`:

```bash
REACT_APP_API_BASE_URL=https://your-render-service.onrender.com
REACT_APP_FITNESS_ENDPOINT=/api/fitness
```

### 3. Deploy to Vercel

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Navigate to frontend directory
cd fitness/frontend

# Deploy
vercel --prod

# Follow prompts:
# - Link to Vercel account
# - Confirm project settings
# - Confirm environment variables
```

**Option B: GitHub Integration (Recommended)**

1. Connect GitHub repo to Vercel:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import GitHub repo
   - Select `fitness/frontend` as root directory

2. Configure Environment Variables:
   - Go to Project Settings → Environment Variables
   - Add:
     ```
     REACT_APP_API_BASE_URL = https://your-render-service.onrender.com
     REACT_APP_FITNESS_ENDPOINT = /api/fitness
     ```

3. Deploy:
   - Push to GitHub
   - Vercel automatically builds and deploys

### 4. Verify Frontend Deployment

```bash
# Visit your Vercel deployment URL
# Should see fitness app loading

# Test API connection
# Open DevTools → Network
# Try logging a workout
# Should see successful API requests
```

---

## 🗄️ Database Deployment (Neon)

Already configured during initial setup. Verify:

```bash
# Check environment variables
grep DATABASE_URL .env
grep FITNESS_DATABASE_URL .env

# Test connection
node -e "require('dotenv').config(); console.log(process.env.FITNESS_DATABASE_URL ? 'Connected' : 'Not set')"
```

---

## 🔐 Environment Variables

### Backend (.env in root)

```env
# Database
DATABASE_URL=postgresql://user:password@host/database
FITNESS_DATABASE_URL=postgresql://user:password@host/fitness_database

# JWT
JWT_SECRET=your-secret-key-min-32-characters

# Server
PORT=3001
NODE_ENV=production

# CORS
CORS_ORIGIN=https://your-vercel-deployment.vercel.app

# API Keys (if applicable)
# Add any additional keys needed
```

### Frontend (.env.production or Vercel settings)

```env
REACT_APP_API_BASE_URL=https://your-render-service.onrender.com
REACT_APP_FITNESS_ENDPOINT=/api/fitness
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (Automatic Testing & Deployment)

Create `.github/workflows/fitness-deploy.yml`:

```yaml
name: Fitness Module Deployment

on:
  push:
    branches: [main]
    paths:
      - 'fitness/**'
      - 'server.js'
      - 'package.json'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Check server syntax
        run: node -c server.js
      
      - name: Build frontend
        run: cd fitness/frontend && npm install && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Render
        run: |
          curl https://api.render.com/deploy/srv-YOUR_SERVICE_ID?key=${{ secrets.RENDER_DEPLOY_KEY }}
      
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }} fitness/frontend
```

---

## 📊 Post-Deployment Testing

### 1. Health Checks

```bash
# Backend health
curl https://your-render-service.onrender.com/health

# Frontend loads
curl https://your-vercel-deployment.vercel.app | head -20
```

### 2. API Integration Test

```bash
# Get auth token from meal_planner app
TOKEN="your-jwt-token"

# Test create workout
curl -X POST https://your-render-service.onrender.com/api/fitness/workouts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workoutDate": "2025-12-21",
    "workoutName": "Test Workout",
    "exercises": [],
    "notes": "Testing deployment"
  }'
```

### 3. UI Testing

1. Open deployed frontend: `https://your-vercel-deployment.vercel.app`
2. Log in with test account
3. Navigate to fitness module
4. Test core features:
   - [ ] Log workout form displays
   - [ ] Date picker works
   - [ ] Add exercise button opens modal
   - [ ] Exercise modal search works
   - [ ] Exercise modal category filters work
   - [ ] Can add sets to exercise
   - [ ] Save button submits to API
   - [ ] Success message displays
   - [ ] Can view logged workout

### 4. Performance Test

```bash
# Lighthouse audit
# Open deployed site in browser
# Run Lighthouse (DevTools → Lighthouse)
# Target scores:
# - Performance: > 80
# - Accessibility: > 90
# - Best Practices: > 90
# - SEO: > 90
```

---

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check Node version (should be 18+)
node --version

# Check for port conflicts
lsof -i :3001

# Check logs
npm start 2>&1 | tail -50
```

### Frontend Won't Build

```bash
# Clear cache
rm -rf fitness/frontend/node_modules
rm fitness/frontend/package-lock.json

# Reinstall
cd fitness/frontend
npm install
npm run build
```

### API Errors (401 Unauthorized)

```bash
# Check token is valid
# Verify JWT_SECRET matches between:
# - Backend (.env)
# - Token generation code
# - Any token verification code
```

### CORS Errors

```javascript
// Check CORS_ORIGIN in backend .env
// Should match frontend deployment URL:
CORS_ORIGIN=https://your-vercel-deployment.vercel.app

// Verify in server.js:
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true
};
```

### Database Connection Issues

```bash
# Verify connection strings
echo $DATABASE_URL
echo $FITNESS_DATABASE_URL

# Test connection
psql $FITNESS_DATABASE_URL -c "SELECT 1"

# Check Neon dashboard for active connections limit
```

---

## 📈 Monitoring & Logs

### Render Logs
```
Render Dashboard → Your Service → Logs
```

### Vercel Logs
```
Vercel Dashboard → Project → Deployments → View Logs
```

### Application Monitoring

Add to `server.js`:

```javascript
// Simple request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});
```

---

## 🔄 Rollback Procedure

### If Something Goes Wrong

**Backend (Render):**
1. Go to Render Dashboard
2. Select Service
3. Click "Deployments"
4. Find previous successful deployment
5. Click "Redeploy"

**Frontend (Vercel):**
1. Go to Vercel Dashboard
2. Select Project
3. Click "Deployments"
4. Find previous successful deployment
5. Click "Redeploy"

**Git Rollback (if needed):**
```bash
# See previous commits
git log --oneline -10

# Revert to previous commit
git revert HEAD

# Or reset to specific commit
git reset --hard <commit-hash>
git push origin main
```

---

## 📋 Deployment Checklist - Final

- [ ] All code committed
- [ ] Environment variables set
- [ ] Backend builds and runs locally
- [ ] Frontend builds without errors
- [ ] All API endpoints tested
- [ ] CORS configured correctly
- [ ] Database migrations applied
- [ ] Render deployment successful
- [ ] Vercel deployment successful
- [ ] Backend health check passes
- [ ] Frontend loads in browser
- [ ] API requests work from frontend
- [ ] Authentication working
- [ ] Error handling working
- [ ] Performance acceptable
- [ ] Monitoring configured
- [ ] Logs accessible
- [ ] Team notified of deployment

---

## 🎉 Post-Deployment

### Update Documentation
- [ ] Update deployment URL in README
- [ ] Update API base URL in team docs
- [ ] Share testing credentials with team

### Monitor Performance
- [ ] Check logs for errors
- [ ] Monitor response times
- [ ] Track user reports
- [ ] Set up alerts for critical errors

### Gather Feedback
- [ ] User testing
- [ ] Performance feedback
- [ ] Feature requests
- [ ] Bug reports

---

## 📞 Support Links

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Express Docs:** https://expressjs.com/
- **React Docs:** https://react.dev/

---

**Last Updated:** December 21, 2025  
**Version:** 1.0.0  
**Status:** Ready for Deployment ✅
