# 🚀 NEON BACKEND DEPLOYMENT GUIDE

## Architecture: Vercel Frontend + Neon Backend

```
┌─────────────────────────────────────────┐
│        Vercel (Everything)              │
│  ┌─────────────────────────────────┐   │
│  │  Frontend (React)               │   │
│  │  https://fitness-app.vercel.app │   │
│  └──────────────┬──────────────────┘   │
│                 │                       │
│  ┌──────────────▼──────────────────┐   │
│  │  Serverless API Functions       │   │
│  │  /api/fitness/*                 │   │
│  │  /api/nutrition/*               │   │
│  └──────────────┬──────────────────┘   │
│                 │                       │
└─────────────────┼───────────────────────┘
                  │
                  │ connects to
                  ▼
        ┌──────────────────┐
        │  NEON Database   │
        │  PostgreSQL      │
        │  (Cloud)         │
        └──────────────────┘
```

**Benefits:**
- ✅ Single provider (Vercel)
- ✅ No Render service needed
- ✅ Serverless = cheaper
- ✅ Simpler management
- ✅ API functions in same repo

---

## Step 1: Create Vercel Serverless API Functions

### 1.1 Create API folder structure

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/gitprojects/meal_planner
mkdir -p fitness/api
```

### 1.2 Create Vercel API for fitness endpoints

Create `fitness/api/fitness/profile.js`:

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // JWT verification
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (req.method === 'GET') {
    try {
      const profile = await prisma.fitness_profiles.findUnique({
        where: { user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({
          error: 'profile_not_found',
          message: 'Fitness profile not found',
        });
      }

      return res.status(200).json(profile);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const profile = await prisma.fitness_profiles.upsert({
        where: { user_id: req.user.id },
        update: req.body,
        create: {
          user_id: req.user.id,
          ...req.body,
        },
      });

      return res.status(200).json({
        success: true,
        profile,
      });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
```

### 1.3 Create similar files for other endpoints

- `fitness/api/fitness/workouts.js`
- `fitness/api/fitness/goals.js`
- `fitness/api/nutrition/summary.js`
- `fitness/api/nutrition/weekly.js`
- `fitness/api/nutrition/macro-targets.js`

---

## Step 2: Update Frontend to use API routes

Update `fitness/frontend/src/config/api.js`:

```javascript
const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};

export const fitness = {
  getProfile: () => apiCall('/fitness/profile'),
  createProfile: (data) => apiCall('/fitness/profile', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getWorkouts: () => apiCall('/fitness/workouts'),
  createWorkout: (data) => apiCall('/fitness/workouts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getGoals: () => apiCall('/fitness/goals'),
  createGoal: (data) => apiCall('/fitness/goals', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const nutrition = {
  getSummary: () => apiCall('/nutrition/summary'),
  getWeekly: () => apiCall('/nutrition/weekly'),
  getMacroTargets: () => apiCall('/nutrition/macro-targets'),
};
```

---

## Step 3: Deploy to Vercel

### 3.1 Push code to GitHub

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/gitprojects/meal_planner
git add .
git commit -m "feat: add Vercel serverless API for fitness endpoints"
git push origin main
```

### 3.2 Deploy on Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Select your `meal_planner` repository
4. Fill in:
   - **Build Command**: `cd fitness/frontend && npm run build`
   - **Output Directory**: `fitness/frontend/build`
   - **Root Directory**: `./` (or leave default)

5. Click "Deploy"

### 3.3 Add Environment Variables

1. In Vercel dashboard, go to **Settings** → **Environment Variables**
2. Add:
   ```
   DATABASE_URL = your_neon_connection_string
   JWT_SECRET = your_jwt_secret
   SESSION_SECRET = your_session_secret
   REACT_APP_API_URL = (leave blank - uses relative /api)
   ```

3. Click "Save" and redeploy

---

## Step 4: Test Your Deployment

### 4.1 Test Frontend

Visit: `https://fitness-app-xxxxx.vercel.app`

Should load without errors.

### 4.2 Test API Endpoint

```bash
# Get JWT token first
JWT_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: '550e8400-e29b-41d4-a716-446655440000', email: 'test@example.com' },
  'your_jwt_secret_change_me_in_production_with_long_random_string',
  { expiresIn: '24h' }
);
console.log(token);
")

# Test API
curl https://fitness-app-xxxxx.vercel.app/api/fitness/profile \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
```

Expected response: `{ "error": "profile_not_found", ... }` (expected for new user)

---

## ✅ Your Final Setup

| Component | Service |
|-----------|---------|
| Frontend | Vercel |
| Backend API | Vercel Functions |
| Database | Neon PostgreSQL |
| Domain | fitness-app-xxxxx.vercel.app |

**All in one place, super simple!**

---

## 🔄 Updating Your App

```bash
# Make changes
git add .
git commit -m "your message"
git push origin main
```

Vercel auto-redeploys everything! 🚀

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| API returns 404 | Check API function file path matches route |
| Database connection fails | Verify DATABASE_URL in Vercel env vars |
| Auth fails | Ensure JWT_SECRET matches |
| CORS errors | Check CORS headers in API functions |

---

**You're ready to deploy! 🚀**
