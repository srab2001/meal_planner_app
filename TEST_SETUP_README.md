# 🧪 Test Environment Setup - Quick Start Guide

This guide will help you set up your testing environment in **15 minutes**.

---

## ✅ What We're Setting Up

- **Local Development**: Docker containers for database and backend
- **Automated Testing**: GitHub Actions for continuous integration
- **Preview Deployments**: Vercel automatic previews for every PR
- **Test Database**: Separate database to keep test data isolated

---

## 🚀 Step 1: Local Development Setup (5 minutes)

### 1.1 Install Docker Desktop

**macOS/Windows:**
Download from [docker.com](https://www.docker.com/products/docker-desktop/)

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 1.2 Start Test Environment

```bash
# Start all services (database, backend)
npm run docker:up

# Wait ~30 seconds for services to start

# Check if services are running
docker-compose ps
```

You should see:
```
meal-planner-db       running    0.0.0.0:5432->5432
meal-planner-backend  running    0.0.0.0:5000->5000
```

### 1.3 Test Backend

```bash
curl http://localhost:5000/health
# Should return: {"status":"ok"}
```

### 1.4 Start Frontend (separate terminal)

```bash
cd client
npm install
npm start
```

Frontend will open at: `http://localhost:3000`

---

## 🔧 Step 2: GitHub Actions Setup (3 minutes)

### 2.1 Add GitHub Secrets

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

Click **"New repository secret"** and add:

| Secret Name | Value | Where to Get |
|-------------|-------|--------------|
| `OPENAI_API_KEY` | Your OpenAI key | [platform.openai.com](https://platform.openai.com/api-keys) |
| `GOOGLE_CLIENT_ID` | Your Google OAuth ID | [console.cloud.google.com](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth secret | [console.cloud.google.com](https://console.cloud.google.com) |

### 2.2 Verify Workflow

```bash
# Commit the workflow files
git add .github/
git commit -m "ci: add GitHub Actions workflow"
git push
```

Go to: **GitHub Repository → Actions** tab

You should see the workflow running!

---

## 🗄️ Step 3: Test Database Setup (2 minutes)

### Option A: Using Render (Recommended - Free Tier)

1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in:
   - **Name**: `meal-planner-test`
   - **Database**: `meal_planner_test`
   - **User**: (auto-generated)
   - **Region**: (choose closest)
   - **Plan**: **Free**
4. Click **"Create Database"**
5. Copy the **External Database URL**
6. Add to Render environment as `TEST_DATABASE_URL`

### Option B: Using Docker (Local Testing Only)

Already done! Docker Compose creates `postgres-test` automatically.

```bash
# Test database connection
docker exec -it meal-planner-db-test psql -U postgres -d meal_planner_test
```

---

## 🎯 Step 4: Create Test Backend (Optional - 5 minutes)

If you want a separate backend for testing (recommended):

### 4.1 Create Test Backend on Render

1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **"New +"** → **"Web Service"**
3. Fill in:
   - **Name**: `meal-planner-test`
   - **Environment**: **Node**
   - **Region**: (same as production)
   - **Branch**: `test` or `develop`
   - **Plan**: **Free**
4. Add environment variables:
   - `NODE_ENV`: `test`
   - `TEST_DATABASE_URL`: (from Step 3)
   - All other variables from production
5. Click **"Create Web Service"**

### 4.2 Update Vercel Preview Configuration

Create `/client/vercel.json` for preview deployments:

```json
{
  "env": {
    "preview": {
      "REACT_APP_API_URL": "https://meal-planner-test.onrender.com"
    }
  }
}
```

---

## ✅ Step 5: Verify Everything Works

### 5.1 Test Local Environment

```bash
# Backend health check
curl http://localhost:5000/health

# Database connection
npm run setup:test
```

### 5.2 Test GitHub Actions

```bash
# Create a test branch
git checkout -b test/verify-ci

# Make a small change
echo "# Test" >> README.md

# Push and create PR
git add .
git commit -m "test: verify CI pipeline"
git push origin test/verify-ci
```

Go to GitHub → Create PR → Watch Actions run!

### 5.3 Test Vercel Preview

Push to any branch and Vercel will create a preview URL automatically.

---

## 🎉 You're Done!

### What You Now Have:

✅ **Local Development**:
- Docker containers for easy setup
- Hot reload for backend
- Isolated test database

✅ **Automated Testing**:
- Tests run on every PR
- Linting and code quality checks
- Security audits

✅ **Preview Deployments**:
- Automatic preview for every branch
- Test changes before merging
- Shareable URLs for reviews

✅ **Deployment Pipeline**:
- Merge to main → Auto-deploy to production
- All tests must pass before merge
- Rollback capability

---

## 🔄 Daily Workflow

```bash
# Morning: Start dev environment
npm run docker:up
cd client && npm start

# Make changes...

# Before committing: Run tests
npm test

# Create PR
git checkout -b feature/my-feature
git add .
git commit -m "feat: add new feature"
git push

# Tests run automatically on GitHub
# Preview URL created by Vercel
# Review, approve, merge!

# Evening: Stop containers
npm run docker:down
```

---

## 📚 Next Steps

1. **Add Tests**: See `TESTING_GUIDE.md` for how to add unit tests
2. **Monitor**: Set up error tracking (Sentry, LogRocket)
3. **Performance**: Add performance monitoring
4. **E2E Tests**: Add Playwright or Cypress for end-to-end testing

---

## 🆘 Troubleshooting

**Docker won't start:**
```bash
docker-compose down
docker system prune -a
docker-compose up -d
```

**Database connection fails:**
```bash
npm run db:reset
```

**Tests fail on GitHub but pass locally:**
- Check Node version (should be 18.x)
- Check GitHub Secrets are set correctly
- Review GitHub Actions logs

**Still stuck?**
- Check `TESTING_GUIDE.md` for detailed debugging
- Review Docker logs: `npm run docker:logs`
- Open an issue on GitHub

---

## 📝 Useful Commands

```bash
# Start everything
npm run docker:up

# Stop everything
npm run docker:down

# View logs
npm run docker:logs

# Restart services
npm run docker:restart

# Reset database
npm run db:reset

# Run tests
npm test

# Setup test database
npm run setup:test
```

---

## 🎓 Learn More

- [Full Testing Guide](./TESTING_GUIDE.md)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Vercel Previews](https://vercel.com/docs/concepts/deployments/preview-deployments)
