# How to Run Seed Script on Render

## Option 1: Via Render Shell (Easiest)

1. Go to your Render Dashboard: https://dashboard.render.com
2. Select your backend service: `meal-planner-app-mve2`
3. Click the **"Shell"** tab at the top
4. Run this command:
```bash
npm run seed:fitness
```

Or run directly:
```bash
node scripts/seed-fitness-interview.js
```

Expected output:
```
Seeding fitness interview questions...
Upserted question main_goal => 1
Upserted question primary_objectives => 2
...
Fitness interview seed complete
```

## Option 2: Via Render CLI (Advanced)

If you have Render CLI installed:
```bash
render shell meal-planner-app-mve2 -- node scripts/seed-fitness-interview.js
```

## Option 3: Add to package.json (For Future)

Add this to `package.json` under `scripts`:
```json
{
  "scripts": {
    "seed:fitness": "node scripts/seed-fitness-interview.js",
    "seed:all": "npm run seed:fitness"
  }
}
```

Then you can run:
```bash
npm run seed:fitness
```

## Option 4: Via Render Build Hook

Add a build command to run seed automatically:

In `render.yaml` or via dashboard:
```yaml
buildCommand: "npm install && npm run seed:fitness"
startCommand: "npm start"
```

## Step-by-Step for Shell Access

1. **Login to Render Dashboard**
   - Go to: https://dashboard.render.com
   - Sign in with your account

2. **Select Backend Service**
   - Find "meal-planner-app-mve2"
   - Click on it

3. **Open Shell**
   - Click "Shell" tab
   - Wait for connection

4. **Check Current Directory**
   ```bash
   pwd
   ls -la scripts/
   ```

5. **Run Seed Script**
   ```bash
   node scripts/seed-fitness-interview.js
   ```

6. **Verify Success**
   - Should see messages about upserting questions
   - Should see "Fitness interview seed complete"
   - No errors

## Troubleshooting

**Error: Cannot find module**
- Make sure you're in the correct directory (`/app` or root)
- Check that `scripts/seed-fitness-interview.js` exists

**Error: ECONNREFUSED**
- Script is trying to connect to local database
- DATABASE_URL env var should be set automatically on Render
- Run: `echo $DATABASE_URL` to verify it's set

**Error: Connection timeout**
- Database might be overloaded
- Try again in a few minutes
- Check Render dashboard for database status

## After Running

1. Verify questions in database:
```bash
psql $DATABASE_URL -c "SELECT id, key, label FROM fitness_interview_questions;"
```

2. Check if options were seeded:
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM fitness_interview_options;"
```

Should show:
- 8 questions
- 40+ options total

## Next Steps

After seeding:
1. ✅ Seed script completed
2. Build & deploy frontend to Vercel
3. Run smoke test to verify E2E flow
