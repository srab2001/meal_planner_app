# Debugging 401 Error on Vercel Google Auth

## Issue Fixed in Code

✅ **Fixed**: The `/auth/user` endpoint was returning inconsistent response formats, causing the frontend to not recognize authenticated users.

**You need to redeploy your backend on Render** for this fix to take effect.

---

## Step-by-Step Debugging Guide

### 1. Check Your Browser Console

Open your Vercel app: `https://meal-planner-app-chi.vercel.app`

Press **F12** to open Developer Tools, go to **Console** tab.

**Look for:**
```
API_BASE in browser: https://meal-planner-app-mve2.onrender.com
LoginPage API_BASE: https://meal-planner-app-mve2.onrender.com
```

**❌ If you see:**
```
API_BASE in browser: http://localhost:5000
```
or
```
API_BASE in browser: undefined
```

**Problem**: `REACT_APP_API_URL` is not set in Vercel.

**Fix**: Go to Vercel → Settings → Environment Variables → Add `REACT_APP_API_URL=https://meal-planner-app-mve2.onrender.com`

---

### 2. Check Network Tab for the 401 Error

In Browser DevTools, go to **Network** tab, then:

1. Refresh the page
2. Look for a request to `/auth/user`
3. Click on it

**Check the Request URL:**
- ✅ Should be: `https://meal-planner-app-mve2.onrender.com/auth/user`
- ❌ If it's: `http://localhost:5000/auth/user` → Vercel env var not set
- ❌ If it's: `undefined/auth/user` → Vercel env var not set

**Check the Response:**
- Click on the `/auth/user` request
- Go to **Response** tab
- Should see: `{"user":null}` (before login)

---

### 3. Test the OAuth Flow

Click "Start Google login" and watch the URL bar:

**Expected flow:**
1. `https://meal-planner-app-chi.vercel.app` (your Vercel app)
2. `https://meal-planner-app-mve2.onrender.com/auth/google` (redirect to backend)
3. `https://accounts.google.com/...` (Google login page)
4. `https://meal-planner-app-mve2.onrender.com/auth/google/callback` (callback to backend)
5. `https://meal-planner-app-chi.vercel.app` (back to Vercel app, now logged in)

**If stuck at step 3:**
- Problem: Session/cookie not being saved
- Check Network tab for `auth/google/callback` request
- Look at Response Headers → `Set-Cookie`

---

### 4. Check Render Backend Logs

Go to your Render dashboard and check the logs:

**Good logs should show:**
```
GOOGLE_CLIENT_ID present: true
GOOGLE_CALLBACK_URL: https://meal-planner-app-mve2.onrender.com/auth/google/callback
FRONTEND_BASE: https://meal-planner-app-chi.vercel.app
server listening on port 5000
```

**During login attempt, look for:**
```
GET /auth/google 302
GET /auth/google/callback 302
```

**If you see errors:**
- Check that all environment variables are set correctly
- Verify `NODE_ENV=production`

---

### 5. Common Issues and Fixes

#### Issue A: "Error checking auth: TypeError: Failed to fetch"

**Problem**: Frontend can't reach backend (CORS or network issue)

**Check:**
1. Is Render backend running? Visit: `https://meal-planner-app-mve2.onrender.com/health`
   - Should return: `{"status":"ok"}`
2. Check Render hasn't shut down due to inactivity (free tier)
3. Check CORS settings in Render logs

**Fix:**
- Restart Render service if needed
- Verify `FRONTEND_BASE=https://meal-planner-app-chi.vercel.app` in Render

#### Issue B: "Redirect URI mismatch" from Google

**Problem**: Google OAuth callback URL doesn't match

**Fix:**
1. Go to Google Cloud Console
2. Navigate to APIs & Services → Credentials
3. Click your OAuth 2.0 Client ID
4. Verify **Authorized redirect URIs** includes:
   ```
   https://meal-planner-app-mve2.onrender.com/auth/google/callback
   ```
5. Save changes and wait a few minutes for Google to propagate

#### Issue C: Cookie not being saved (session issues)

**Problem**: Session cookie blocked by browser

**Symptoms:**
- Login redirects work
- But user is not authenticated after redirect
- 401 error on `/auth/user` after successful Google login

**Check in Network tab:**
1. Find the `/auth/google/callback` request
2. Look at Response Headers
3. Should see `Set-Cookie: connect.sid=...`

**If Set-Cookie is missing or has issues:**

**Fix in Render environment variables:**
- Make sure `NODE_ENV=production` (NOT `development`)
- This enables `secure: true` and `sameSite: 'none'` for cookies

**Browser blocking third-party cookies:**
- This shouldn't be an issue since frontend and backend are different domains
- Both must use HTTPS in production
- The session cookie settings in server.js are already correct

#### Issue D: Backend returns 401 with `{"user":null}` after login

**Problem**: Session is not persisting between requests

**Possible causes:**
1. `SESSION_SECRET` not set in Render
2. `credentials: 'include'` not working (CORS issue)

**Fix:**
1. Verify Render has `SESSION_SECRET` set
2. Check that backend CORS config allows credentials:
   ```javascript
   cors({
     origin: true,
     credentials: true
   })
   ```
   (Already configured correctly in server.js)

---

## Immediate Action Items

### For Backend (Render):

1. **Redeploy your Render service** to get the authentication fix
   - Go to Render dashboard
   - Manual Deploy → Deploy latest commit
   - Wait for deployment to complete

2. **Verify environment variables:**
   - `NODE_ENV=production`
   - `GOOGLE_CALLBACK_URL=https://meal-planner-app-mve2.onrender.com/auth/google/callback`
   - `FRONTEND_BASE=https://meal-planner-app-chi.vercel.app`
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
   - `SESSION_SECRET` is set

### For Frontend (Vercel):

1. **Check if environment variable is set:**
   - Vercel → Settings → Environment Variables
   - Should have: `REACT_APP_API_URL=https://meal-planner-app-mve2.onrender.com`

2. **If not set, add it and redeploy:**
   - Add the environment variable
   - Go to Deployments → Latest → ⋮ → Redeploy

### For Google Cloud Console:

1. **Verify redirect URIs:**
   - Should include: `https://meal-planner-app-mve2.onrender.com/auth/google/callback`

---

## Testing After Fixes

1. Clear your browser cookies for both domains
2. Visit `https://meal-planner-app-chi.vercel.app`
3. Open DevTools Console
4. Verify you see the correct API_BASE URL
5. Click "Start Google login"
6. Complete Google authentication
7. Should redirect back to Vercel app and be logged in

---

## Still Having Issues?

If the 401 persists after:
- ✅ Redeploying Render with the fix
- ✅ Setting `REACT_APP_API_URL` in Vercel
- ✅ Redeploying Vercel

**Share these details:**
1. Screenshot of browser console
2. Screenshot of Network tab showing `/auth/user` request details
3. Render backend logs during login attempt
4. Whether the URL redirects work (does it go through all 5 steps?)
