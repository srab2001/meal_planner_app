# Post-Deployment Verification Checklist

**Deployment Date:** December 24, 2025  
**Commit:** f4adbbe

---

## Phase 1: Monitor Deployments (0-5 minutes)

### GitHub Status
- [ ] Verify commit `f4adbbe` appears on https://github.com/srab2001/meal_planner_app
- [ ] Check that commit message shows our changes
- [ ] Confirm branch is `main`

### Vercel Status  
- [ ] Go to https://vercel.com/dashboard
- [ ] Click "meal_planner_app" project
- [ ] Wait for green checkmark on latest deployment
- [ ] Note deployment time (should be ~2-3 minutes)
- [ ] Click on deployment to see build logs (no errors)

### Render Status
- [ ] Go to https://dashboard.render.com
- [ ] Click "meal-planner-api" service
- [ ] Check "Events" tab for deployment status
- [ ] Look in "Logs" section for:
  - ✅ "Building Docker image..."
  - ✅ "Deployment initiated"
  - ✅ "Migration 015_add_ai_workout_fields.sql running..."
  - ✅ "Migration completed"
  - ✅ "Server listening on port 10000"
- [ ] Service should show "Your service is live"

---

## Phase 2: Test Admin App Feature (After deployment)

### Admin Visibility
- [ ] Log in to app with admin account
- [ ] Go to Switchboard (main menu)
- [ ] Verify 🔐 Admin tile appears
- [ ] Admin tile has correct color (#e91e63)
- [ ] Click Admin tile - loads admin panel

### Admin Panel
- [ ] Admin panel loads without errors
- [ ] Can see user management options
- [ ] Can see settings options
- [ ] No 401 or 403 errors in console

### API Verification
- [ ] Open browser DevTools Network tab
- [ ] Check `/auth/user` response includes:
  ```json
  {
    "user": {
      "id": "...",
      "email": "...",
      "role": "admin",    // ✅ Should be present
      "status": "active"  // ✅ Should be present
    }
  }
  ```
- [ ] Response status is 200 (not 401/403)

---

## Phase 3: Test AI Coach Feature (After deployment)

### Interview Questions Loading
- [ ] Log in to app with any user
- [ ] Navigate to Fitness app
- [ ] Click 🤖 AI Coach button
- [ ] Modal/dialog opens
- [ ] First question appears (auto-seeded defaults)
- [ ] Can see all 5 questions available:
  1. "What type of workout are you interested in?"
  2. "How many days per week can you exercise?"
  3. "What is your current fitness level?"
  4. "Do you have access to gym equipment?"
  5. "How much time can you dedicate per workout?"

### Interview Questions Answering
- [ ] Text question - can type answer ✅
- [ ] Multiple choice - can select option ✅
- [ ] Yes/No question - can select yes or no ✅
- [ ] Range question - can select value ✅
- [ ] Can navigate between questions ✅
- [ ] Submit button appears after all answers

### Workout Generation
- [ ] Click submit/generate button
- [ ] "Creating your personalized workout..." message appears
- [ ] OpenAI API is called (check logs for "Calling OpenAI")
- [ ] Wait 10-15 seconds for response
- [ ] Workout appears with 6 sections:
  - ✅ Warm Up
  - ✅ Strength
  - ✅ Cardio
  - ✅ Agility
  - ✅ Recovery
  - ✅ Closeout

### Workout Data
- [ ] Each section shows: name, duration, exercises
- [ ] Summary section shows: total time, intensity, calories, difficulty
- [ ] No 500 errors in response
- [ ] No JSON parsing errors

### Database Saving
- [ ] Workout saves to database (check Render logs)
- [ ] Look for: "[AI Interview] ✅ Workout saved to database successfully"
- [ ] No database errors in logs

---

## Phase 4: Verify Database Schema

### Check Migrations Ran
- [ ] Render logs show both migrations completed:
  - [ ] "Migration 015_add_ai_workout_fields.sql completed"
  - [ ] "Migration 016_create_interview_responses_table.sql completed"

### Verify Columns Exist
- [ ] Connect to Render PostgreSQL (if you have access)
- [ ] Check `fitness_workouts` table has new columns:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'fitness_workouts'
  ```
- [ ] Verify columns exist:
  - [ ] `workout_data` (JSONB)
  - [ ] `intensity` (VARCHAR)
  - [ ] `calories_burned` (INTEGER)
  - [ ] `difficulty_rating` (INTEGER)
  - [ ] `interview_responses` (JSONB)

### Verify Indexes Created
- [ ] Index on `intensity` exists for fast queries
- [ ] Constraints properly set for validation:
  - [ ] difficulty_rating 1-10
  - [ ] intensity is low/medium/high

---

## Phase 5: Browser Console Verification

### Check for Errors
- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab
- [ ] Reload page
- [ ] No red error messages
- [ ] No CORS errors
- [ ] No "Uncaught" exceptions

### Check Network Tab
- [ ] Verify all API calls succeed (200 status)
- [ ] Check these endpoints return data:
  - [ ] `/auth/user` - returns with role/status
  - [ ] `/api/fitness/admin/interview-questions` - returns 5 questions
  - [ ] `/api/fitness/ai-interview` - returns workout (POST)

---

## Phase 6: Server Logs Verification

### Vercel Logs
- [ ] Go to Vercel deployment details
- [ ] Check build logs - no errors
- [ ] Check runtime logs - no errors
- [ ] Frontend build successful

### Render Logs
- [ ] Check for migration start messages:
  ```
  [SERVER] Starting application...
  [MIGRATIONS] Starting migrations...
  [MIGRATIONS] ▶️  Executing 015_add_ai_workout_fields.sql...
  [MIGRATIONS] ✅ 015_add_ai_workout_fields.sql completed
  [MIGRATIONS] ▶️  Executing 016_create_interview_responses_table.sql...
  [MIGRATIONS] ✅ 016_create_interview_responses_table.sql completed
  [SERVER] ✅ Migrations complete, starting Express app...
  ```
- [ ] No migration errors
- [ ] Server started successfully

---

## Phase 7: Full User Workflow Test

### Admin User
- [ ] [ ] Admin user can log in
- [ ] [ ] Admin tile appears on Switchboard
- [ ] [ ] Admin can click tile and access admin panel
- [ ] [ ] No permission errors

### Regular User with AI Coach
- [ ] [ ] Regular user can log in
- [ ] [ ] Can navigate to Fitness app
- [ ] [ ] Can click AI Coach button
- [ ] [ ] Can answer all 5 interview questions
- [ ] [ ] Can see generated workout
- [ ] [ ] Workout has all 6 sections with data
- [ ] [ ] No errors during entire flow

---

## Phase 8: Data Verification

### Check Saved Workouts
If you have database access:

```sql
-- Check AI-generated workouts
SELECT id, user_id, workout_type, intensity, calories_burned, difficulty_rating
FROM fitness_workouts
WHERE workout_type = 'ai-generated'
ORDER BY created_at DESC
LIMIT 5;
```

- [ ] Results show recent AI workouts
- [ ] All fields have data (not NULL)
- [ ] intensity is one of: low, medium, high
- [ ] difficulty_rating is 1-10
- [ ] workout_data contains full JSON

### Check Interview Responses (Optional)
```sql
-- Check if interview responses are stored
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'fitness_workouts' AND column_name = 'interview_responses';
```

- [ ] `interview_responses` column exists
- [ ] Can query for recent responses

---

## Common Issues & Solutions

### Issue: Admin tile not appearing
**Solution:**
- [ ] Log out and log back in
- [ ] Check `/auth/user` returns `role` in response
- [ ] Verify user in database has role set to 'admin'

### Issue: AI Coach not showing questions
**Solution:**
- [ ] Check Render logs for auto-seed message
- [ ] Verify `/api/fitness/admin/interview-questions` returns 5 questions
- [ ] Clear browser cache and reload

### Issue: Workout generation fails
**Solution:**
- [ ] Check Render logs for OpenAI API errors
- [ ] Verify `OPENAI_API_KEY` is set in Render env vars
- [ ] Check network tab for 500 errors
- [ ] Verify database columns exist (Phase 4)

### Issue: Migrations failed
**Solution:**
- [ ] Check Render logs for SQL error messages
- [ ] Verify database connection is working
- [ ] Check for syntax errors in migration files
- [ ] May need to run migrations manually (rare)

---

## Sign-Off

When all checks pass:

**Date Verified:** _______________  
**Verified By:** _______________  
**Status:** [ ] All Clear ✅ [ ] Issues Found ❌

**Notes:**
```
[Space for notes about any issues or observations]
```

---

## What's Next

After verification:

1. ✅ Deployment is complete and working
2. ✅ Both features (Admin & AI Coach) are live
3. ✅ Database schema is updated
4. ✅ All migrations ran successfully

**Users can now:**
- Use Admin panel (if admin role)
- Generate personalized workouts with AI Coach
- Have workouts saved to their account

**Monitoring:**
- Monitor Render logs for errors over next 24 hours
- Check error rates in analytics
- Monitor database performance

---

## Rollback Info

If you need to rollback, the previous stable commit is:
- **Hash:** 36ff585
- **Date:** [Previous deployment date]

To rollback:
```bash
git revert HEAD
git push origin main
```

---

**Deployment verification started:** _______________  
**All checks completed:** _______________

✅ **Ready for Production!**
