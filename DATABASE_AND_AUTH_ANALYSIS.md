# Database & Authentication Architecture Analysis

**Last Updated:** December 31, 2025

## Executive Summary

**Architecture:** Two databases serve different purposes:
1. **Render PostgreSQL** - Production users, auth, meals, favorites
2. **Neon PostgreSQL** - CORE features (pantry, households) via `CORE_DATABASE_URL`

**CRITICAL:** Admin roles must be updated in the **Render database**, NOT Neon!

**Status:** ✅ JWT token generation now includes `role` and `status` fields.

---

## Current Architecture

### Database Setup

| Component | Database | Connection String | Purpose |
|-----------|----------|-------------------|---------|
| **Main App** | Render PostgreSQL | `DATABASE_URL` | Users, meals, admin, auth |
| **Fitness App** | Render PostgreSQL | `DATABASE_URL` | Fitness profiles, workouts, goals |
| **CORE Features** | Neon PostgreSQL | `CORE_DATABASE_URL` | Pantry, households |

**Key Finding:** Production auth uses Render PostgreSQL. Admin roles must be updated there!

```
# Render PostgreSQL (for admin roles)
Host: dpg-d4nj6demcj7s73dfvie0-a.oregon-postgres.render.com
Database: meal_planner_vo27
```

### File References

**Server.js Configuration:**
- Line 14: `const db = require('./db');` - Uses `DATABASE_URL` 
- Line 43: `connectionString: process.env.DATABASE_URL` - Render PostgreSQL
- Line 60: SSL enabled in production

**Fitness Routes Configuration:**
- Line 44: `const dbUrl = process.env.DATABASE_URL;` - ALSO uses Render!
- Line 51: Creates Prisma client with same `DATABASE_URL`
- Line 53: "admin_interview_questions table is in the main Render database, not the Neon fitness database"
- **Comment indicates intention to use Neon, but never implemented**

---

## Authentication & User Context Flow

### Step 1: Google OAuth Login
```
User clicks "Login with Google"
    ↓
Redirects to /auth/google (line 450)
    ↓
Google verifies credentials
    ↓
Redirects to /auth/google/callback (line 458)
```

### Step 2: User Record Lookup
**File:** server.js, lines 316-390 (Google Strategy callback)

```javascript
async (accessToken, refreshToken, profile, done) => {
  // profile contains: { id, displayName, emails, photos }
  
  // Looks up user in Render DB by google_id
  const user = await db.query(
    'SELECT id, email, role, status FROM users WHERE google_id = $1',
    [profile.id]
  );
  
  // User found in Render DB
  // Returns user object to Passport
}
```

Database includes: `id`, `email`, `role`, `status`, `google_id`, `picture_url`, etc.

### Step 3: Token Generation (✅ FIXED)
**File:** server.js, lines 457-471

```javascript
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      googleId: user.googleId,        // ✅ Included
      displayName: user.displayName,  // ✅ Included
      picture: user.picture,          // ✅ Included
      role: user.role || 'user',      // ✅ Included
      status: user.status || 'active' // ✅ Included
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}
```

**Note:** Role is baked into JWT at login time. After updating database, user must log out and back in.

### Step 4: Token Usage

**In Main App (server.js):**
- Endpoints use session via `req.session.user`
- Not dependent on JWT token fields
- **Main app works fine for admin users**

**In Fitness App (fitness.js, line 696):**
```javascript
function requireAuth(req, res, next) {
  const token = getTokenFromHeader();
  const decoded = verifyToken(token);  // Decodes JWT
  req.user = decoded;  // Sets req.user to: { id, email, googleId, displayName, picture }
  next();
}
```

**Problem:** `req.user` never has `role` or `status` fields!

---

## Why Admin Users Don't See Admin Features

### Scenario 1: Admin in Main App ✅ WORKS
```
User logs in with Google
    ↓
Database lookup finds user with role='admin'
    ↓
Main app uses req.session.user (from DB, has role)
    ↓
Admin button appears (checks user.role === 'admin')
```

**Why it works:** Main app checks `role` from session/database, not from JWT token.

### Scenario 2: Admin in Fitness App ❌ FAILS (if it checks role)
```
User logs in with Google
    ↓
JWT token generated (MISSING role field)
    ↓
Fitness app uses req.user from decoded JWT
    ↓
req.user = { id, email, googleId, displayName, picture }
    ↓
req.user.role = undefined
    ↓
No admin features available in fitness
```

**Why it fails:** Fitness routes set `req.user` from JWT token, which doesn't include `role`.

### Scenario 3: AI Coach ⚠️ POTENTIALLY FAILS
**File:** fitness.js, lines 696-950

The AI Coach endpoint:
1. Uses `requireAuth` middleware ✅ (validates user exists)
2. Gets `userId` from `req.user.id` ✅ (works, ID is in token)
3. Accesses OpenAI API ✅ (available via `req.app.locals.openai`)
4. Saves workout to Render DB ✅ (uses same DATABASE_URL)

**IF the AI Coach checks user.role or user.status:**
- This would fail silently because those fields are undefined
- **Likely cause:** AI Coach might have permission checks that fail

---

## Database Conflict Analysis

### Question: Do user records in Render and Neon conflict?

**Answer: NO - They don't exist in Neon at all!**

Both apps query Render PostgreSQL:
- Main app uses `DATABASE_URL` → Render
- Fitness app uses `DATABASE_URL` → Render
- **Neon is never queried by either app**

### Database Schema Check

**Render PostgreSQL has:**
- ✅ users table (with id, email, google_id, role, status)
- ✅ fitness_profiles, fitness_goals, fitness_workouts
- ✅ meal_plan_history, favorites
- ✅ admin_interview_questions
- ✅ All other tables

**Neon has:**
- ✅ Copies of all tables (if you ran migrations there)
- ❌ But NEVER QUERIED by the application

### Conclusion on Database Conflicts

✅ **NO CONFLICTS** - Both apps use the same database (Render)
✅ **NO INTERFERENCE** - User data is consistent because it's all in one place
❌ **WASTED SETUP** - Neon is configured but unused

---

## Why AI Coach Might Not Work

### Possibility 1: Missing OpenAI Client ❌
**File:** fitness.js, lines 715-721

```javascript
const openai = req.app.locals.openai;
if (!openai) {
  return res.status(503).json({
    error: 'service_unavailable',
    message: 'AI service is not available'
  });
}
```

**Check:** Is OpenAI initialized in server.js?
- Line 160-163: `const openai = new OpenAI({ apiKey: OPENAI_API_KEY });`
- Line 1358: `app.locals.openai = openai;` - Passed to fitness routes

✅ **Should work IF OPENAI_API_KEY is set**

### Possibility 2: User Record Missing
AI Coach needs user to exist in fitness_profiles table.

**File:** fitness.js, check if endpoint queries fitness_profiles:
- Line 706: Creates fitness_profiles record if missing ✅

✅ **Should create automatically**

### Possibility 3: Permission Check Fails ❌
If AI Coach has any permission check like:
```javascript
if (req.user.role !== 'admin') {
  // Only admins can use AI coach
}
```

**This would FAIL** because req.user.role = undefined

---

## The Root Problem: Token Generation

**Current token in local storage (`auth_token`):**
```json
{
  "id": "uuid-12345",
  "email": "user@example.com",
  "googleId": "google-id-abc",
  "displayName": "User Name",
  "picture": "https://...",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Should be:**
```json
{
  "id": "uuid-12345",
  "email": "user@example.com",
  "googleId": "google-id-abc",
  "displayName": "User Name",
  "picture": "https://...",
  "role": "admin",           // ← MISSING
  "status": "active",        // ← MISSING
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Recommended Fixes

### Fix 1: Include Role & Status in JWT Token
**File:** server.js, lines 396-404

**Current:**
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

**Fixed:**
```javascript
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      googleId: user.googleId,
      displayName: user.displayName,
      picture: user.picture,
      role: user.role || 'user',           // ← ADD THIS
      status: user.status || 'active'      // ← ADD THIS
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}
```

**Impact:**
- ✅ Admin users will have `req.user.role = 'admin'` in fitness routes
- ✅ Admin features work consistently across all modules
- ✅ User status is available for permission checks

### Fix 2: Ensure Passport Returns Full User Object
**File:** server.js, lines 316-390

The Passport strategy must return user with `role` and `status`.

Check what's being returned:
```javascript
done(null, {
  id: user.rows[0].id,
  email: user.rows[0].email,
  googleId: profile.id,
  displayName: profile.displayName,
  picture: profile.photos?.[0]?.value,
  role: user.rows[0].role,           // ← Make sure this is included
  status: user.rows[0].status         // ← Make sure this is included
});
```

### Fix 3: Query User Details When Needed (Alternative)
If you want to keep the token minimal, fitness routes can query the database:

```javascript
async function requireAuth(req, res, next) {
  const token = getTokenFromHeader();
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });
  
  // Query database for full user details
  const user = await db.query(
    'SELECT id, email, role, status FROM users WHERE id = $1',
    [decoded.id]
  );
  
  if (!user.rows[0]) return res.status(401).json({ error: 'User not found' });
  
  req.user = user.rows[0];  // Has role & status
  next();
}
```

**Trade-off:** Slightly slower (database query on every request) but more flexible.

---

## Neon Database Questions

### Should We Use Neon?

**Current Setup:**
- Render PostgreSQL: All data
- Neon: Empty (or copy of data)

**Options:**

1. **Keep Render Only** (Recommended)
   - Simpler architecture
   - Single source of truth
   - No sync issues
   - Already working

2. **Migrate to Neon**
   - Would need to change DATABASE_URL to Neon
   - Update FITNESS_DATABASE_URL to Neon
   - Update Render to Neon
   - All would use Neon

3. **Split Databases** (Advanced)
   - Main app on Render
   - Fitness app on Neon
   - Requires user sync logic between databases
   - Not recommended unless there's a specific reason

**Recommendation:** Stick with Render. The setup is working, and Neon adds unnecessary complexity.

---

## Verification Steps

### Step 1: Check JWT Token Contents
1. Open app and log in
2. Open Developer Console → Application → Local Storage
3. Find `auth_token`
4. Paste value at jwt.io or use console to decode:
   ```javascript
   const token = localStorage.getItem('auth_token');
   const [header, payload, sig] = token.split('.');
   const decoded = JSON.parse(atob(payload));
   console.log(decoded);
   ```
5. **Look for `role` and `status` fields**

**Expected output for admin:**
```
{
  id: "...",
  email: "admin@example.com",
  role: "admin",        // ← Should be present
  status: "active",     // ← Should be present
  ...
}
```

### Step 2: Check Database User Record
```sql
SELECT id, email, role, status, google_id 
FROM users 
WHERE email = 'admin@example.com';
```

**Expected:**
```
id    | email              | role  | status
------|-------------------|-------|--------
abc   | admin@example.com  | admin | active
```

### Step 3: Test Fitness API
```bash
# Get the token from localStorage
TOKEN="your_token_here"

# Test AI Interview endpoint
curl -X POST https://your-api.com/api/fitness/ai-interview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "hello"}]}'
```

**Expected:** Should work without 401 errors

### Step 4: Check Browser Console
After logging in, run:
```javascript
fetch('/api/profile', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
}).then(r => r.json()).then(console.log);
```

**Should return with `role` field:**
```json
{
  "id": "...",
  "email": "...",
  "full_name": "...",
  "role": "admin"
}
```

---

## Summary Table

| Issue | Cause | Location | Impact | Fix |
|-------|-------|----------|--------|-----|
| Admin users don't see admin features in fitness | JWT token missing `role` field | server.js:396-404 generateToken() | Fitness routes can't check admin status | Add role/status to JWT |
| AI Coach might fail | Token missing fields for permission checks | fitness.js:696 requireAuth | AI Coach fails if it checks permissions | Add role/status to JWT |
| Database conflicts | None - only using Render DB | Multiple locations | None - no actual conflicts | No action needed |
| Neon database unused | Never integrated | Environment config | Wasted resources | Delete or ignore |
| User state inconsistent | Same data in DB, but JWT doesn't reflect it | Token vs Database | Confusion about user permissions | Sync JWT with DB |

---

## Action Items (Priority Order)

### 🔴 HIGH PRIORITY
1. **Fix generateToken() function** in server.js (lines 396-404)
   - Add `role` and `status` fields to JWT
   - Test by logging in and checking token contents

2. **Verify Passport returns full user object** in Google Strategy (lines 316-390)
   - Ensure `role` and `status` are retrieved from database
   - Pass them to done() callback

3. **Clear local storage and test**
   - Old tokens without role/status need to be refreshed
   - Users must log out and log back in after fix

### 🟡 MEDIUM PRIORITY
4. **Test AI Coach** after fix
   - Verify it works with updated tokens
   - Check browser console for errors

5. **Document which database is used**
   - Update comments to clarify Render is primary
   - Consider removing Neon references if not using it

### 🟢 LOW PRIORITY
6. **Consider removing Neon** if not using it
   - Reduces confusion
   - Saves resources

---

## Conclusion

✅ **Your databases are NOT conflicting**
❌ **Your JWT tokens are missing user role/status fields**
✅ **Fix is straightforward: Update generateToken() function**

Both your main app and fitness app use the same Render PostgreSQL database, so there's no data conflict. The issue is that the JWT token generated during Google OAuth login doesn't include the `role` and `status` fields, even though they exist in the database. This causes fitness routes (and potentially AI Coach) to not know that a user is an admin.

**The fix:** Include `role` and `status` in the JWT token when it's generated during OAuth callback. Then users will maintain their admin privileges throughout the application.
