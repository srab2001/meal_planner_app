# Fitness App - Deployment Guide

**Status:** ✅ Deployed to Production
**Last Updated:** December 26, 2025
**Version:** 2.0.0

---

## 🌐 Live URLs

**Frontend:** https://frontend-pftblprwl-stus-projects-458dd35a.vercel.app
**Backend API:** https://meal-planner-app-mve2.onrender.com/api/fitness
**Database:** Render PostgreSQL

---

## 🏗️ Architecture

### Deployment Stack

- **Frontend:** Vercel (React SPA)
- **Backend:** Render (Node.js/Express)
- **Database:** Render PostgreSQL (shared with main meal planner app)
- **AI:** OpenAI API (configured in Render)

### Database Configuration

All fitness tables are in the **main Render PostgreSQL database** (`meal_planner_vo27`):

- `fitness_profiles`
- `fitness_goals`
- `fitness_workouts`
- `fitness_workout_exercises`
- `fitness_workout_sets`
- `exercise_definitions` (40 exercises seeded)
- `admin_interview_questions`

Migration 017 created all these tables.

---

## 🔑 Environment Variables

### Render Backend

Required environment variables in Render dashboard:

```bash
# Database (Render PostgreSQL)
DATABASE_URL=postgresql://meal_planner_user:VJaFF2BeiisVJm7Fip4IHwL4q5gObQ40@dpg-d4nj6demcj7s73dfvie0-a.oregon-postgres.render.com/meal_planner_vo27?sslmode=require

# OpenAI API
OPENAI_API_KEY=[Your-OpenAI-API-Key]

# Authentication
SESSION_SECRET=[Your-Session-Secret]
JWT_SECRET=[Your-JWT-Secret]

# Environment
NODE_ENV=production
```

### Vercel Frontend

Required environment variable in Vercel project settings:

```bash
VITE_API_BASE_URL=https://meal-planner-app-mve2.onrender.com
```

---

## 🚀 Deployment Process

### Backend (Render)

1. **Automatic deployment on git push:**
   ```bash
   git push origin main
   ```

2. **Render automatically:**
   - Detects the push
   - Runs `npm install`
   - Starts the server
   - Deploys to production (~5 minutes)

3. **Monitor deployment:**
   - Visit https://dashboard.render.com
   - Select `meal-planner-app-mve2`
   - View logs in "Logs" tab

### Frontend (Vercel)

1. **Deploy from local machine:**
   ```bash
   cd fitness/frontend
   npx vercel --prod --yes
   ```

2. **Or auto-deploy via GitHub:**
   - Connect Vercel to GitHub repo
   - Set build command: `npm run build`
   - Set output directory: `build`
   - Auto-deploys on push to main

---

## 🗄️ Database Migrations

Migration 017 has been applied to Render PostgreSQL with:
- 7 fitness tables created
- 40 exercises seeded across 7 categories

To apply future migrations:

```bash
# Set the Render database URL
export DATABASE_URL="postgresql://meal_planner_user:VJaFF2BeiisVJm7Fip4IHwL4q5gObQ40@dpg-d4nj6demcj7s73dfvie0-a.oregon-postgres.render.com/meal_planner_vo27?sslmode=require"

# Apply migration
PGPASSWORD="VJaFF2BeiisVJm7Fip4IHwL4q5gObQ40" psql "$DATABASE_URL" -f migrations/XXX_migration_name.sql
```

---

## ✅ Post-Deployment Testing

### 1. Test AI Coach
- Visit: https://frontend-pftblprwl-stus-projects-458dd35a.vercel.app
- Click "AI Coach" tab
- Should load 5 interview questions
- Submit interview
- Verify workout is generated

### 2. Test Create Goal
- Go to Dashboard
- Click "Create Goal" button
- Fill form and submit
- Goal should appear in list

### 3. Test Exercise Library
- Navigate to "Log Workout"
- Click "Add Exercise"
- Should show 40 exercises in dropdown

### 4. Test Manual Workout Logging
- Create a new workout
- Add exercises and sets
- Save workout
- Verify it appears in history

---

## 🔍 Troubleshooting

### Backend Logs
```bash
# View Render logs
Visit: https://dashboard.render.com
Select: meal-planner-app-mve2
Click: Logs tab
```

### Frontend Logs
```bash
# View Vercel deployment logs
npx vercel inspect --logs
```

### Database Connection Issues
```bash
# Test database connection
PGPASSWORD="VJaFF2BeiisVJm7Fip4IHwL4q5gObQ40" psql "postgresql://meal_planner_user:VJaFF2BeiisVJm7Fip4IHwL4q5gObQ40@dpg-d4nj6demcj7s73dfvie0-a.oregon-postgres.render.com/meal_planner_vo27?sslmode=require" -c "SELECT COUNT(*) FROM exercise_definitions;"
```

Expected output: `40`

---

## 📊 Monitoring

- **Render Dashboard:** Monitor backend health, logs, and metrics
- **Vercel Analytics:** Monitor frontend performance and visits
- **Database:** Use Render database dashboard for queries and monitoring

---

## 🔄 Redeployment

### Trigger backend redeploy:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

### Trigger frontend redeploy:
```bash
cd fitness/frontend
npx vercel --prod --yes
```

---

**Documentation:** All fitness app docs are in `/fitness/` directory
**Support:** Check Render and Vercel dashboards for deployment status
