# Quick Fix: Add Role & Status to JWT Token

## Problem
Admin users lose their admin privileges when accessing the fitness module because the JWT token doesn't include `role` and `status` fields.

## Solution
Update the `generateToken()` function in `server.js` to include role and status.

---

## Code Change

### File: `server.js`

**Location:** Lines 396-404

**Current Code:**
```javascript
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      googleId: user.googleId,
      displayName: user.displayName,
      picture: user.picture
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}
```

**New Code:**
```javascript
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      googleId: user.googleId,
      displayName: user.displayName,
      picture: user.picture,
      role: user.role || 'user',
      status: user.status || 'active'
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}
```

**What Changed:**
- Line 7: Added `role: user.role || 'user'` - defaults to 'user' if not in database
- Line 8: Added `status: user.status || 'active'` - defaults to 'active' if not in database

---

## Verification Checklist

### After Making the Change:

1. **Save the file** and ensure your server restarts (auto-restart on save)

2. **Clear browser data:**
   - Open Developer Tools (F12)
   - Go to Application → Local Storage
   - Find `auth_token` and delete it
   - Also clear cookies if you see any auth-related cookies

3. **Log out** of the app (if not done by clearing storage)

4. **Log back in** with your admin account
   - Google OAuth will be triggered
   - New token will be generated with updated fields

5. **Verify the fix:**
   ```javascript
   // In browser console, run:
   const token = localStorage.getItem('auth_token');
   const [header, payload, sig] = token.split('.');
   const decoded = JSON.parse(atob(payload));
   console.log(decoded);
   ```
   
   **Expected output should include:**
   ```javascript
   {
     id: "...",
     email: "your-admin@example.com",
     role: "admin",      // ← This should be "admin"
     status: "active",   // ← This should be "active"
     ...
   }
   ```

6. **Test admin features:**
   - Admin button should appear in app switcher
   - Fitness admin features should be accessible
   - AI Coach should work properly

---

## If Still Not Working

### Check 1: Verify Database Has Role Data
```sql
SELECT id, email, role, status FROM users WHERE email = 'your-admin@email.com';
```

**Expected Result:**
```
id                   | email                  | role  | status
---------------------|------------------------|-------|--------
550e8400-e29b-41d4..| your-admin@email.com   | admin | active
```

If `role` is NULL or 'user', run:
```sql
UPDATE users SET role = 'admin', status = 'active' 
WHERE email = 'your-admin@email.com';
```

### Check 2: Verify Passport Returns Full User
Add this debugging to server.js around line 320:

**Find this code:**
```javascript
async (accessToken, refreshToken, profile, done) => {
```

**Add logging right after it:**
```javascript
async (accessToken, refreshToken, profile, done) => {
  console.log('[GOOGLE STRATEGY] Profile:', {
    id: profile.id,
    email: profile.emails?.[0]?.value,
    displayName: profile.displayName
  });
```

**Then find where the user is passed to done():**
```javascript
done(null, user);
```

**Add logging before it:**
```javascript
console.log('[GOOGLE STRATEGY] User object being returned:', user);
done(null, user);
```

Restart server and check server logs when you log in. Should show the user object with `role` and `status` fields.

### Check 3: Verify Token Generation Is Called
Add logging to generateToken():

**Find:**
```javascript
function generateToken(user) {
  return jwt.sign(
```

**Change to:**
```javascript
function generateToken(user) {
  console.log('[TOKEN GENERATION] Creating token for user:', {
    email: user.email,
    role: user.role,
    status: user.status
  });
  return jwt.sign(
```

Restart server. After login, you should see in server logs:
```
[TOKEN GENERATION] Creating token for user: { email: '...', role: 'admin', status: 'active' }
```

---

## Testing the AI Coach

Once the token fix is applied:

1. **Navigate to Fitness Module**
   - Admin button should be visible
   - Fitness features should be accessible

2. **Try AI Coach:**
   - Open browser console (F12)
   - Go to Network tab
   - Click on AI Coach / AI Interview button
   - Verify request to `/api/fitness/ai-interview` succeeds (200 status)

3. **Check for errors:**
   - If you see 401 errors → token not being sent properly
   - If you see 503 errors → OpenAI not configured
   - If it works → AI Coach should generate workouts

---

## Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Update generateToken() in server.js | 1 min |
| 2 | Save and let server restart | 30 sec |
| 3 | Clear browser storage | 1 min |
| 4 | Log back in | 1 min |
| 5 | Verify token has role/status | 2 min |
| 6 | Test admin features | 2 min |

**Total Time:** ~10 minutes

---

## Files Modified
- ✅ server.js (lines 396-404)
- No other files need changes

## What This Fixes
- ✅ Admin users see admin features in fitness module
- ✅ Admin role persists across all modules
- ✅ AI Coach has access to user role/status if needed
- ✅ Consistent user context across application

## What This Doesn't Fix
- Neon database remains unused (not a problem, just inefficient)
- No changes to database schema (role/status already exist)
- Existing tokens remain invalid (users must log out/in)
