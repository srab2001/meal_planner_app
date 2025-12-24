# Debugging Guide: Admin Panel & AI Coach Not Working

## Quick Diagnosis

If the fixes haven't taken effect yet, it's likely due to one of these reasons:

### 1. **Deployment Not Complete Yet** ⏳
Commits 5da7b33 and 4df5625 were just pushed. Vercel and Render may still be building.

**Check Status:**
- Vercel: https://vercel.com/dashboard
- Render: https://dashboard.render.com

Look for "Ready" and "Live" statuses respectively.

---

### 2. **User Token Doesn't Have Role Field** 🔑
Even though the code was fixed, existing users who logged in BEFORE the fix have old tokens without the role field.

**Solution:** Log out and log back in to get a fresh token with the role field included.

```
1. Click Logout in the app
2. Go to https://meal-planner-gold-one.vercel.app/
3. Log in again with your admin account
4. Check if Admin tile appears now
```

---

### 3. **User in Database Doesn't Have Role Set** 👤
The database might have users with NULL role values.

**Check:**
If you have database access, run:
```sql
SELECT email, role FROM users WHERE email = 'your-email@example.com';
```

If role is NULL, it needs to be set to 'admin':
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## Step-by-Step Debugging

### Step 1: Verify Deployment

**For Vercel Frontend:**
1. Go to https://vercel.com/dashboard
2. Find "meal-planner" project
3. Look for deployment status:
   - ✅ "Ready" = Deployed successfully
   - ⏳ "Building" or "Queued" = Still deploying
   - ❌ "Failed" = Deployment error

**For Render Backend:**
1. Go to https://dashboard.render.com
2. Find "meal-planner-api" service
3. Look for status:
   - ✅ "Live" = Running successfully
   - ⏳ "Building" = Still deploying
   - ❌ "Failed" = Deployment error

If either shows "Failed", check the logs for error messages.

---

### Step 2: Check User Authentication

**Open Browser Developer Tools (F12 or Cmd+Option+I)**

**Go to Application → LocalStorage → https://meal-planner-gold-one.vercel.app**

Look for key: `auth_token`

Copy the token value and go to https://jwt.io and paste it in the "Encoded" field.

In the Decoded "payload" section, you should see:
```json
{
  "id": "...",
  "email": "your-email",
  "role": "admin",    // ← THIS SHOULD BE HERE
  "status": "active", // ← THIS TOO
  ...
}
```

**If role is missing:**
- User logged in BEFORE the fix
- Log out and log back in to get a new token
- See Section 2 above

---

### Step 3: Check Admin Tile Logic

**In the app, with Developer Tools open:**

1. Open Browser Console (F12 → Console tab)
2. Type this:
```javascript
// Check if user object has role
console.log('User object:', {user});

// Better yet, check what's passed to AppSwitchboard
// This requires looking at the actual App component
```

If you see `role: undefined`, the token is missing the role field.

---

### Step 4: Check API Endpoints

**Test the /auth/user endpoint:**

In your browser, go to:
```
https://meal-planner-app-mve2.onrender.com/auth/user
```

You should see an error like:
```json
{"user": null}
```

This is expected because you need to send your auth token. Instead, open the Console (F12) and run:

```javascript
const token = localStorage.getItem('auth_token');
fetch('https://meal-planner-app-mve2.onrender.com/auth/user', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json()).then(console.log);
```

You should see:
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "role": "admin",    // ← SHOULD BE HERE
    "status": "active", // ← SHOULD BE HERE
    ...
  }
}
```

---

### Step 5: Check AI Coach Endpoint

**Test the interview questions endpoint:**

In the Console (F12), run:

```javascript
const token = localStorage.getItem('auth_token');
fetch('https://meal-planner-app-mve2.onrender.com/api/fitness/admin/interview-questions?active=true', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

You should see:
```json
{
  "questions": [
    {
      "id": 1,
      "question_text": "What type of workout are you interested in?",
      "question_type": "text",
      ...
    },
    ...
  ]
}
```

If you get an error like `"relation 'admin_interview_questions' does not exist"`, the migrations haven't run yet on Render.

---

## Common Issues & Fixes

### Issue: Admin Tile Not Appearing

**Possible Causes:**
1. ❌ Deployment not complete
   - **Fix:** Wait 5 minutes, refresh browser
2. ❌ User has old token without role field
   - **Fix:** Log out, clear localStorage, log back in
3. ❌ User in database doesn't have role set to 'admin'
   - **Fix:** Update database: `UPDATE users SET role = 'admin' WHERE ...`
4. ❌ Role field not being returned by /auth/user
   - **Fix:** Check server.js OAuth fix is deployed (commit 5da7b33)

---

### Issue: AI Coach Questions Don't Load

**Possible Causes:**
1. ❌ FitnessApp using wrong API URL
   - **Fix:** Should be using Render URL, not localhost
   - **Check:** Verify FitnessApp.js imports API_BASE (commit 5da7b33)
2. ❌ fitness_workouts table doesn't exist
   - **Fix:** Migration 015 should create it
   - **Check:** Run migration manually if needed (commit 4df5625)
3. ❌ Endpoint not mounted in server.js
   - **Fix:** Fitness routes should be mounted at `/api/fitness`
   - **Check:** `app.use('/api/fitness', requireAuth, fitnessRoutes);`
4. ❌ No admin_interview_questions table
   - **Fix:** Auto-seeding should create default questions
   - **Check:** Run `SELECT * FROM admin_interview_questions;`

---

## What Each Commit Fixed

### Commit 5da7b33 - "Fix API routing and admin role issues"

**File:** `client/src/modules/fitness/FitnessApp.js`
- Changed from: `const API_URL = 'localhost:5000'`
- Changed to: `const API_URL = API_BASE` (Render URL)
- Effect: Fitness app now connects to correct backend

**File:** `server.js` (OAuth strategy)
- Added: `role: user.role || 'user'`
- Added: `status: user.status || 'active'`
- Effect: Users logging in get role in token

### Commit 4df5625 - "Fix migration 015: Create fitness_workouts table if missing"

**File:** `migrations/015_add_ai_workout_fields.sql`
- Added: `CREATE TABLE IF NOT EXISTS fitness_workouts`
- Effect: Table is created for new deployments, columns added for existing ones

---

## Complete Testing Checklist

After deployment completes:

- [ ] Vercel shows "Ready"
- [ ] Render shows "Live"
- [ ] Log out and log back in
- [ ] Check auth_token in localStorage (F12 → Application → LocalStorage)
- [ ] Verify token has "role": "admin" (jwt.io)
- [ ] Check /auth/user endpoint returns role field
- [ ] Refresh page, check if Admin tile appears
- [ ] Click Fitness tile
- [ ] Click AI Coach button
- [ ] Verify questions load
- [ ] Answer questions
- [ ] Verify workout generates

---

## If It Still Doesn't Work

Run these diagnostic commands in Browser Console (F12):

```javascript
// 1. Check authentication
console.log('Token:', localStorage.getItem('auth_token'));

// 2. Check user object
const token = localStorage.getItem('auth_token');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Token Payload:', payload);

// 3. Test /auth/user endpoint
const response = await fetch('https://meal-planner-app-mve2.onrender.com/auth/user', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log('/auth/user Response:', data);

// 4. Test interview questions endpoint
const qresponse = await fetch('https://meal-planner-app-mve2.onrender.com/api/fitness/admin/interview-questions', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const qdata = await qresponse.json();
console.log('Questions Response:', qdata);
```

Copy the output and share it for debugging.

---

## Expected Behavior After Fix

✅ **Admin Panel Should Appear:**
1. Log in
2. Go to Switchboard
3. 🔐 Admin tile visible
4. Click to manage admin features

✅ **AI Coach Should Work:**
1. Click Fitness tile
2. Click 🤖 AI Coach button
3. See 5 interview questions load
4. Answer questions
5. Workout generates from ChatGPT
6. Workout displays with all sections

✅ **Database Should Unify:**
- Fitness and Meal Plan use same Render PostgreSQL
- No data inconsistencies
- Role field properly set for admins

---

## When to Try Each Fix

1. **Try first (likely issue):**
   - Wait for deployment to complete (5-10 minutes)
   - Log out and log back in
   - Refresh browser

2. **Try second (if still not working):**
   - Clear localStorage: `localStorage.clear()` in console
   - Log back in
   - Check if role appears

3. **Try third (if database issue):**
   - Connect to database
   - Check if user has role='admin'
   - Update if NULL

4. **Try fourth (if migrationissue):**
   - Check Render logs for migration errors
   - Manually run migrations if needed
   - Contact support if persistent

---

## Success Indicators

When everything is working:

- ✅ Token contains role field
- ✅ /auth/user returns role field
- ✅ Admin tile appears in Switchboard
- ✅ Fitness app loads data
- ✅ AI Coach loads 5 questions
- ✅ Workouts generate and save
- ✅ No 500 errors in logs
- ✅ Browser console is clean (no red errors)

---

## Resources

- Deployment Status: https://vercel.com/dashboard & https://dashboard.render.com
- App URL: https://meal-planner-gold-one.vercel.app
- Backend URL: https://meal-planner-app-mve2.onrender.com
- JWT Debugger: https://jwt.io
- Browser DevTools: F12 or Cmd+Option+I (Mac)

