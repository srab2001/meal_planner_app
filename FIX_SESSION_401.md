# Fix for 401 Error - Session Not Persisting

## The Problem

You're experiencing a **session race condition** where:
1. Google OAuth authenticates successfully
2. Session is created
3. Redirect to frontend happens BEFORE session is saved
4. Frontend checks `/auth/user`
5. Session doesn't exist → 401 error

## The Fix Applied

Updated `server.js` to call `req.session.save()` before redirecting, ensuring the session is persisted before the user arrives at the frontend.

Also added logging to track the OAuth flow.

---

## Deployment Steps

### 1. Pull Latest Changes

```bash
cd /Users/stuartrabinowitz/Library/Mobile\ Documents/com~apple~CloudDocs/gitprojects/meal_planner
git pull origin claude/fix-vercel-google-auth-012EZyXjsmsqHSfnLfjEArGw
```

### 2. Deploy to Render

**Option A: Automatic Deploy (if enabled)**
- Render will automatically deploy when you push to main branch
- Wait for deployment to complete

**Option B: Manual Deploy**
1. Go to https://dashboard.render.com/
2. Find your `meal-planner-app` backend service
3. Click **Manual Deploy** → **Deploy latest commit**
4. Wait for "Live" status

### 3. Watch Render Logs During Testing

This is **critical** - you need to see what's happening:

1. Go to Render dashboard
2. Click on your service
3. Go to **Logs** tab
4. Keep this open while testing

---

## Testing Steps

### Step 1: Clear Everything

**Clear browser data:**
1. Press F12 (DevTools)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Cookies** in left sidebar
4. Delete cookies for:
   - `meal-planner-app-chi.vercel.app`
   - `meal-planner-app-mve2.onrender.com`
5. Also clear **Local Storage** and **Session Storage** for both domains

**Why?** Old session cookies might be causing conflicts.

### Step 2: Test OAuth Flow

1. Visit: `https://meal-planner-app-chi.vercel.app`
2. Open Browser Console (F12 → Console)
3. Open Network Tab (F12 → Network)
4. Click "Start Google login"

### Step 3: Watch What Happens

**In Browser Network Tab:**

Look for these requests in order:
1. `/auth/google` → 302 redirect to Google
2. Google login page
3. `/auth/google/callback` → 302 redirect to Vercel
4. `/auth/user` → Should be 200 OK (not 401!)

**Click on `/auth/google/callback`:**
- Go to **Response Headers**
- Look for `Set-Cookie: connect.sid=...`
- Should have: `SameSite=None; Secure; HttpOnly`

**Click on `/auth/user`:**
- Check **Request Headers**
- Look for `Cookie: connect.sid=...`
- Should match the cookie from callback

**If cookie is missing in `/auth/user` request:**
- This means the browser isn't sending the cookie
- Could be a browser security policy issue

### Step 4: Check Render Logs

**You should see in Render logs:**

```
OAuth callback successful for user: your-email@gmail.com
Session saved, redirecting to frontend
GET /auth/user - Session ID: abc123... User: your-email@gmail.com
```

**If you see:**
```
OAuth callback successful for user: your-email@gmail.com
Session save error: ...
```
→ Session storage issue on Render

**If you see:**
```
OAuth callback successful for user: your-email@gmail.com
Session saved, redirecting to frontend
GET /auth/user - Session ID: xyz789... User: none
```
→ Session IDs are different! Cookie not being sent or session lost

---

## Common Issues and Solutions

### Issue A: Session ID changes between callback and /auth/user

**Symptoms:**
- Render logs show different session IDs
- Cookie set during callback, but different cookie (or no cookie) sent with /auth/user

**Possible Causes:**
1. **Browser blocking third-party cookies**
2. **Domain mismatch in cookie**
3. **Cookie not marked as secure/sameSite=none**

**Solution:**

The cookie settings are already correct in the code:
```javascript
cookie: {
  secure: true,           // Required for sameSite=none
  httpOnly: true,
  sameSite: 'none'        // Required for cross-domain
}
```

**But verify in Render environment variables:**
- `NODE_ENV=production` ← **MUST be set!**

Without `NODE_ENV=production`, the code uses:
- `secure: false` (won't work with HTTPS)
- `sameSite: 'lax'` (won't work cross-domain)

### Issue B: Browser blocking cookies

**Check in Browser Console:**

```javascript
// Run this in console
document.cookie
```

Should show cookies for the current domain.

**Chrome/Edge specific:**
- Go to `chrome://settings/cookies`
- Make sure "Block third-party cookies" is OFF
- Or add exception for `meal-planner-app-mve2.onrender.com`

**Firefox specific:**
- Go to `about:preferences#privacy`
- Set "Enhanced Tracking Protection" to "Standard" (not "Strict")

### Issue C: "Session save error" in logs

**Cause:** In-memory session store issue (default express-session behavior)

**Temporary Fix:**
Restart the Render service to clear stuck sessions

**Long-term Fix (if needed):**
Use a persistent session store like `connect-redis` or `connect-mongodb-session`

For now, the in-memory store should work if Render isn't frequently restarting.

### Issue D: Session works but then disappears

**Cause:** Render service restarted (free tier goes to sleep)

**Solution:**
- Keep the service awake with a health check ping
- Or upgrade to paid tier with persistent services
- Or implement a persistent session store

---

## Verification Checklist

After deploying and testing, verify:

### Backend (Render):
- [ ] Latest code deployed
- [ ] `NODE_ENV=production` is set
- [ ] Logs show: "OAuth callback successful"
- [ ] Logs show: "Session saved, redirecting"
- [ ] Logs show matching session IDs for callback and /auth/user

### Frontend (Vercel):
- [ ] `REACT_APP_API_URL` is set
- [ ] Console shows correct backend URL
- [ ] Network tab shows `/auth/google/callback` sets cookie
- [ ] Network tab shows `/auth/user` sends cookie
- [ ] `/auth/user` returns 200 OK with user data

### Browser:
- [ ] Cookies cleared before testing
- [ ] Third-party cookies not blocked
- [ ] Both domains using HTTPS

---

## Detailed Network Tab Analysis

When you test, capture this information:

### 1. After clicking "Start Google login"

**Request: `/auth/google`**
- Method: GET
- Status: 302
- Location: `https://accounts.google.com/...`

### 2. After Google authentication

**Request: `/auth/google/callback?code=...`**
- Method: GET
- Status: 302
- Location: `https://meal-planner-app-chi.vercel.app`
- **Response Headers** → Look for:
  ```
  Set-Cookie: connect.sid=s%3A...; Path=/; Expires=...; HttpOnly; Secure; SameSite=None
  ```

**⚠️ Important:** Copy the full `Set-Cookie` header and check:
- Has `Secure` flag?
- Has `SameSite=None`?
- Has `HttpOnly`?
- Has valid expiration?

### 3. When frontend loads

**Request: `/auth/user`**
- Method: GET
- **Request Headers** → Look for:
  ```
  Cookie: connect.sid=s%3A...
  ```
- **Response**:
  - Status: 200 OK → ✅ Working!
  - Status: 401 → ❌ Cookie not sent or session lost

**If 401:**
- Check if `Cookie` header exists in request
- Compare cookie value with the one from step 2
- Should be exactly the same

---

## What to Share if Still Broken

If the issue persists after deployment, share:

1. **Screenshot of Browser Network Tab** showing:
   - `/auth/google/callback` response headers (with Set-Cookie)
   - `/auth/user` request headers (with Cookie)
   - `/auth/user` response

2. **Render Logs** showing:
   - Lines with "OAuth callback successful"
   - Lines with "Session saved"
   - Lines with "GET /auth/user"

3. **Render Environment Variables:**
   - Confirm `NODE_ENV=production` is set
   - Confirm all OAuth variables are set

4. **Browser Settings:**
   - Which browser/version?
   - Are third-party cookies blocked?

---

## Quick Test Commands

**Test backend is running:**
```bash
curl https://meal-planner-app-mve2.onrender.com/health
```

**Test with session cookie (after OAuth):**
```bash
# Get session cookie from browser DevTools
# Then test:
curl -H "Cookie: connect.sid=YOUR_COOKIE_VALUE" \
  https://meal-planner-app-mve2.onrender.com/auth/user
```

Should return user data, not 401.

---

## Next Steps

1. **Deploy** the fix to Render
2. **Clear** all cookies and browser data
3. **Test** with DevTools and Render logs open
4. **Check** that session is saved before redirect
5. **Verify** cookie is sent with /auth/user request

The key things to verify:
- ✅ `NODE_ENV=production` in Render
- ✅ Session logs show same session ID
- ✅ Cookie is set with Secure and SameSite=None
- ✅ Cookie is sent with /auth/user request
