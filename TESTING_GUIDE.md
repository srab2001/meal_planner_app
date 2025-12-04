# Testing & Development Environment Guide

This guide explains how to use the test environment for the Meal Planner application.

## 🏗️ Architecture Overview

```
Production Environment:
├── Frontend: Vercel (meal-planner-app-chi.vercel.app)
├── Backend: Render (meal-planner-app-mve2.onrender.com)
└── Database: Render PostgreSQL (Production DB)

Test Environment:
├── Frontend: Vercel Preview Deployments (auto-generated per PR)
├── Backend: Render Test Instance (optional)
├── Database: Separate Test Database
└── CI/CD: GitHub Actions

Local Development:
├── Frontend: localhost:3000 (React Dev Server)
├── Backend: localhost:5000 (Node.js + Docker)
└── Database: Docker PostgreSQL (localhost:5432)
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended for Testing)

**Start everything:**
```bash
docker-compose up -d
```

**Check status:**
```bash
docker-compose ps
```

**View logs:**
```bash
docker-compose logs -f backend
```

**Stop everything:**
```bash
docker-compose down
```

**Start with pgAdmin:**
```bash
docker-compose --profile tools up -d
# Access pgAdmin at http://localhost:5050
# Email: admin@mealplanner.local
# Password: admin
```

### Option 2: Local Development (No Docker)

**1. Start PostgreSQL locally:**
```bash
# macOS with Homebrew
brew services start postgresql@15

# Linux
sudo systemctl start postgresql

# Windows
# Start PostgreSQL service from Services app
```

**2. Create databases:**
```bash
createdb meal_planner_dev
createdb meal_planner_test
```

**3. Start backend:**
```bash
npm install
npm run dev
```

**4. Start frontend (separate terminal):**
```bash
cd client
npm install
npm start
```

---

## 🧪 Running Tests

### Local Testing

**Run all tests:**
```bash
npm test
```

**Run backend tests only:**
```bash
npm test --prefix .
```

**Run frontend tests only:**
```bash
npm test --prefix client
```

**Run tests with coverage:**
```bash
npm test -- --coverage
```

### CI/CD Testing (GitHub Actions)

Tests run automatically when you:
1. Create a pull request
2. Push to main/master branch

**View test results:**
- Go to GitHub → Actions tab
- Click on the latest workflow run
- View job logs for detailed results

---

## 📋 Development Workflow

### Feature Development Process

```
1. Create branch:
   git checkout -b feature/my-new-feature

2. Make changes and test locally:
   docker-compose up -d
   # Make your changes
   npm test

3. Commit and push:
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/my-new-feature

4. Create Pull Request:
   - GitHub Actions runs tests automatically
   - Vercel creates preview deployment
   - Review changes on preview URL

5. Code review and approval:
   - Team reviews code
   - Tests must pass
   - Approve and merge

6. Auto-deploy to production:
   - Merge to main triggers production deploy
   - Vercel deploys frontend
   - Render deploys backend
```

---

## 🔒 Environment Variables

### Required for Testing

Create `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

**Minimum required for local testing:**
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/meal_planner_dev
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/meal_planner_test
SESSION_SECRET=local-dev-secret
JWT_SECRET=local-dev-jwt-secret
OPENAI_API_KEY=your_key_here
```

### GitHub Secrets (for CI/CD)

Add these secrets in GitHub Settings → Secrets:
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

## 🐛 Debugging

### Backend Issues

**View backend logs:**
```bash
docker-compose logs -f backend
```

**Connect to backend container:**
```bash
docker exec -it meal-planner-backend sh
```

**Test database connection:**
```bash
docker exec -it meal-planner-backend node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : res.rows);
  pool.end();
});
"
```

### Database Issues

**Connect to PostgreSQL:**
```bash
docker exec -it meal-planner-db psql -U postgres -d meal_planner_dev
```

**View all tables:**
```sql
\dt
```

**Check database connections:**
```sql
SELECT * FROM pg_stat_activity;
```

**Reset test database:**
```bash
docker-compose down postgres-test
docker-compose up -d postgres-test
```

### Frontend Issues

**Clear React cache:**
```bash
cd client
rm -rf node_modules .cache build
npm install
npm start
```

---

## 📊 Test Coverage

### Current Coverage (Update as tests are added)

- Backend Unit Tests: 0% (to be added)
- Frontend Unit Tests: 0% (to be added)
- Integration Tests: 0% (to be added)
- E2E Tests: 0% (to be added)

### Adding Tests

**Backend tests (Jest):**
Create `server.test.js`:
```javascript
const request = require('supertest');
const app = require('./server');

describe('API Tests', () => {
  test('GET / returns 200', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });
});
```

**Frontend tests (React Testing Library):**
Create `App.test.js`:
```javascript
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app', () => {
  render(<App />);
  expect(screen.getByText(/meal planner/i)).toBeInTheDocument();
});
```

---

## 🔄 Database Migrations

### Running Migrations

**Apply all migrations:**
```bash
npm run migrate up
```

**Rollback last migration:**
```bash
npm run migrate down
```

**Create new migration:**
```bash
npm run migrate create my-migration-name
```

---

## 🌐 Preview Deployments (Vercel)

Every pull request automatically gets a preview URL:

1. Push to branch → Vercel builds frontend
2. Preview URL generated: `meal-planner-app-git-branch-name.vercel.app`
3. Test changes on preview URL
4. Preview URL updates on every push

**Preview environment uses:**
- Test backend (if configured)
- Test database
- Same code as your branch

---

## ✅ Checklist Before Merging

- [ ] All tests pass locally
- [ ] GitHub Actions workflow passes
- [ ] Preview deployment works
- [ ] No console errors in browser
- [ ] Database migrations tested
- [ ] Environment variables updated (if needed)
- [ ] Code reviewed by team member
- [ ] Documentation updated (if needed)

---

## 🆘 Common Issues

### "Cannot connect to database"
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres
```

### "Port 5000 already in use"
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Tests fail on GitHub but pass locally"
- Check Node version matches (18.x)
- Check environment variables in GitHub Secrets
- Review GitHub Actions logs for specific errors

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Preview Deployments](https://vercel.com/docs/concepts/deployments/preview-deployments)
- [Jest Testing Framework](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)

---

## 🤝 Contributing

1. Always work in feature branches
2. Write tests for new features
3. Keep commits small and focused
4. Use conventional commit messages
5. Update documentation as needed

**Commit message format:**
```
feat: add user authentication
fix: resolve database connection issue
docs: update testing guide
chore: update dependencies
```

---

## 📞 Getting Help

If you encounter issues:
1. Check this guide first
2. Review GitHub Actions logs
3. Check Docker/Vercel logs
4. Ask the team in Slack/Discord
5. Create an issue on GitHub
