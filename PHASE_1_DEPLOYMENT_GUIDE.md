# Phase 1 Deployment Guide
## PostgreSQL Migration - Step-by-Step Instructions

**Status:** ✅ Code Complete - Ready to Deploy
**Estimated Time:** 30-45 minutes
**Cost:** $7/month for PostgreSQL Starter plan

---

## 🎯 What This Accomplishes

**Security Fixes:**
- ✅ Resolves 6 critical security issues from audit
- ✅ Eliminates file-based storage vulnerabilities
- ✅ Adds automated database backups
- ✅ Enables proper user session management

**Features Enabled:**
- ✅ User subscription tracking (free vs premium)
- ✅ Usage quotas (10 meal plans/month for free tier)
- ✅ Foundation for advertising features (Phase 2)
- ✅ Analytics and reporting capabilities

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Render account (same account where backend is deployed)
- [ ] Access to your backend service on Render
- [ ] PostgreSQL CLI tools installed locally (optional, for testing)

---

## Step 1: Create PostgreSQL Database on Render

**Time:** 5 minutes

### 1.1 Log in to Render Dashboard
Visit: https://dashboard.render.com

### 1.2 Create New PostgreSQL Database
1. Click **"New +"** button in top right
2. Select **"PostgreSQL"**

### 1.3 Configure Database

Fill in the following:

```
Name: meal-planner-db
Database: meal_planner
User: meal_planner_user
Region: Oregon (US West) - or closest to your backend
PostgreSQL Version: 16 (latest)
Plan: Starter ($7/month)
```

**Plan Details:**
- Storage: 1 GB
- RAM: 256 MB
- Connections: 22 concurrent
- Backups: Automated daily

### 1.4 Create Database

Click **"Create Database"**

⏱️ Render will provision your database in ~2 minutes.

---

## Step 2: Get Database Connection URL

**Time:** 2 minutes

### 2.1 Wait for Database to be Ready

You'll see: ✅ **Available** in green when ready

### 2.2 Copy Connection Strings

On your database page, you'll see two connection strings:

**Internal Database URL** (use this for production):
```
postgresql://meal_planner_user:XXXX@dpg-xxxxx-a/meal_planner
```

**External Database URL** (use for local development):
```
postgresql://meal_planner_user:XXXX@dpg-xxxxx-a.oregon-postgres.render.com/meal_planner
```

⚠️ **Important:** Keep these URLs secure - they contain your database password!

### 2.3 Save Both URLs

Copy both URLs to a secure location. You'll need them for:
- Production deployment (internal URL)
- Local testing (external URL)

---

## Step 3: Run Database Schema Migration

**Time:** 5 minutes

### Option A: Using Render Shell (Recommended)

1. **Connect to Database via Render:**
   - On your database page, click **"Connect"** tab
   - Click **"PSQL Command"**
   - You'll see a command like:
   ```bash
   PGPASSWORD=xxx psql -h dpg-xxx-a.oregon-postgres.render.com -U meal_planner_user meal_planner
   ```

2. **Run the command in your terminal**
   - This opens a PostgreSQL shell

3. **Load the schema:**
   ```sql
   \i migrations/001_initial_schema.sql
   ```

4. **Verify tables created:**
   ```sql
   \dt
   ```

   You should see 10 tables:
   - users
   - subscriptions
   - usage_stats
   - favorites
   - meal_plan_history
   - discount_codes
   - discount_usage
   - ad_impressions
   - ad_clicks
   - affiliate_conversions

5. **Exit:**
   ```sql
   \q
   ```

### Option B: Using Database URL Directly

If you have `psql` installed locally:

```bash
# Set the database URL (use External URL)
export DATABASE_URL="postgresql://meal_planner_user:XXXX@dpg-xxxxx-a.oregon-postgres.render.com/meal_planner"

# Run schema migration
psql $DATABASE_URL < migrations/001_initial_schema.sql

# Verify
psql $DATABASE_URL -c "\dt"
```

---

## Step 4: Configure Environment Variables

**Time:** 3 minutes

### 4.1 Add DATABASE_URL to Render Backend Service

1. Go to your backend service (meal-planner-api or similar)
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add:

```
Key: DATABASE_URL
Value: <paste Internal Database URL>
```

**Example:**
```
postgresql://meal_planner_user:abc123xyz@dpg-c1a2b3c4d5e6-a/meal_planner
```

⚠️ **Important:** Use the **Internal** URL (without `.oregon-postgres.render.com`) for production!

### 4.2 Save Changes

Click **"Save Changes"**

Your backend service will automatically redeploy with the new environment variable.

---

## Step 5: Deploy Updated Code

**Time:** 5-10 minutes

### 5.1 Push Code to Repository

If you haven't already:

```bash
git push origin claude/fix-vercel-google-auth-012EZyXjsmsqHSfnLfjEArGw
```

### 5.2 Deploy to Render

**Option A: Auto-Deploy (if enabled)**
- Render will automatically detect the push and redeploy
- Watch the deploy logs on Render dashboard

**Option B: Manual Deploy**
1. Go to your backend service on Render
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

### 5.3 Monitor Deployment

Watch the logs for:
```
✅ PostgreSQL connected
Rate limiting enabled
server listening on port 5000
```

If you see these messages, PostgreSQL is working! ✅

---

## Step 6: Verify Database Connection

**Time:** 5 minutes

### 6.1 Test API Endpoints

**Test authentication:**
```bash
curl https://your-backend.onrender.com/health
```

Should return: `{"status":"ok"}`

**Test database-powered endpoint (after logging in):**

Visit your frontend and:
1. Log in with Google
2. Generate a meal plan
3. Add a meal to favorites
4. Check if it appears in favorites

### 6.2 Check Render Logs

Go to your backend service → **Logs** tab

Look for:
```
✅ PostgreSQL connected
✅ New user created: your@email.com
✅ Usage: 1/10 meal plans this month
❤️  your@email.com saved favorite: Meal Name
```

If you see these messages, everything is working! ✅

---

## Step 7: Migrate Existing Data (Optional)

**Time:** 5-10 minutes

If you have existing users with favorites/history in JSON files:

### 7.1 SSH into Render Service

On your backend service page:
1. Click **"Shell"** tab
2. This opens a terminal on your Render instance

### 7.2 Run Migration Script

```bash
node migrations/migrate_data.js
```

You'll see:
```
🚀 Starting data migration from JSON to PostgreSQL...

📁 Migrating favorites.json...
   Found 5 users with favorites
   ✅ Migrated 23 favorites

📁 Migrating history.json...
   Found 5 users with history
   ✅ Migrated 15 history entries

✅ Migration completed successfully!
```

### 7.3 Verify Data Migrated

Data will be linked to users when they log in next.

**Note:** Old JSON files are not deleted automatically - they're kept as backup.

---

## Step 8: Test Free Tier Limits

**Time:** 2 minutes

### 8.1 Generate 10 Meal Plans

As a free user:
1. Generate 10 meal plans (any configuration)
2. On the 11th attempt, you should see:

```json
{
  "error": "Free tier limit reached",
  "message": "You have generated 10 meal plans this month. Upgrade to Premium for unlimited access.",
  "usageCount": 10,
  "limit": 10,
  "planType": "free",
  "upgradeUrl": "/pricing"
}
```

If you see this message, usage tracking is working! ✅

---

## ✅ Deployment Checklist

Confirm each item:

- [ ] PostgreSQL database created on Render
- [ ] Database schema loaded (10 tables created)
- [ ] DATABASE_URL added to backend environment variables
- [ ] Code pushed and deployed to Render
- [ ] Backend logs show "✅ PostgreSQL connected"
- [ ] Can log in with Google (user created in database)
- [ ] Can generate meal plans
- [ ] Can add favorites
- [ ] Free tier limit enforced at 10 plans/month
- [ ] (Optional) Old data migrated from JSON files

---

## 🐛 Troubleshooting

### Issue: "error: connection refused"

**Cause:** DATABASE_URL not set or incorrect

**Fix:**
1. Verify DATABASE_URL in Render Environment tab
2. Use Internal URL (without external hostname)
3. Redeploy backend service

---

### Issue: "relation 'users' does not exist"

**Cause:** Schema migration not run

**Fix:**
1. Connect to database: `psql $DATABASE_URL`
2. Run migration: `\i migrations/001_initial_schema.sql`
3. Verify: `\dt`

---

### Issue: "password authentication failed"

**Cause:** Incorrect database password in connection string

**Fix:**
1. Go to Render database page
2. Copy connection string again (password may have changed)
3. Update DATABASE_URL environment variable
4. Redeploy

---

### Issue: No logs showing "PostgreSQL connected"

**Cause:** Database connection failing silently

**Fix:**
1. Check Render logs for error messages
2. Verify DATABASE_URL format is correct
3. Test connection manually: `psql $DATABASE_URL`

---

## 📊 What's Next

### Phase 1 Complete! ✅

You now have:
- ✅ Secure PostgreSQL database
- ✅ User subscription tracking
- ✅ Usage quotas enforced
- ✅ Foundation for advertising

### Phase 2: Revenue Features (Next)

Ready to implement:
1. Google AdSense integration ($100-200/month)
2. Instacart affiliate integration ($100-200/month)

**Expected revenue:** $200-400/month
**Break-even:** Week 2
**Time to implement:** 4-6 hours

---

## 💰 Cost Breakdown

**Current Monthly Costs:**

| Service | Cost | Notes |
|---------|------|-------|
| Render Backend | $7-25 | Depends on plan |
| Vercel Frontend | $0-20 | Free tier available |
| OpenAI API | $50-500 | Variable usage |
| **PostgreSQL** | **$7** | **New - Starter plan** |
| **Total** | **$64-552** | **+ $7/month** |

**After Phase 2 Revenue:**

| Timeline | Revenue | Net Profit |
|----------|---------|------------|
| Week 2 | $200-400 | $136-336 ✅ |
| Month 3 | $700-1400 | $636-1336 ✅ |

**Break-even:** Week 2 of Phase 2

---

## 📞 Support

**Issues?**

1. Check Render logs first
2. Verify environment variables
3. Test database connection manually
4. Review error messages carefully

**Need Help?**

Refer to:
- [POSTGRESQL_MIGRATION_STRATEGY.md](POSTGRESQL_MIGRATION_STRATEGY.md) - Full technical details
- [IMPLEMENTATION_OPTIONS_DECISION_GUIDE.md](IMPLEMENTATION_OPTIONS_DECISION_GUIDE.md) - Strategic overview

---

**Document Version:** 1.0
**Last Updated:** December 2, 2025
**Status:** Phase 1 Complete - Phase 2 Ready
