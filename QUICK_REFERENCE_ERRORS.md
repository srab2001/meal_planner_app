# Quick Reference Guide - Error Solutions

## OAuth Redirects Back to Switchboard

### Symptoms
- User logs in successfully
- Gets sent back to switchboard instead of selected app
- Console shows: "Token received" but "currentView: switchboard"

### Quick Fixes (in order)
1. **Check Vercel is deployed**
   - Go to Vercel Dashboard → Deployments
   - Ensure latest deployment is "Ready"
   - If not, wait for auto-deployment or redeploy manually

2. **Check browser localStorage**
   - F12 → Application → localStorage
   - Should have `auth_token` and potentially `redirect_after_login`

3. **Check Render backend is running**
   - Visit https://meal-planner-app-mve2.onrender.com
   - Should see "Available at your primary URL" in logs
   - If shows "Offline", restart the service

4. **Check CORS whitelist**
   - In `server.js` lines 158-195
   - Verify your Vercel URL is included (e.g., `meal-planner-gold-one.vercel.app`)
   - CORS should match exactly or use `*.vercel.app` pattern

### Root Causes & Fixes
| Cause | Solution |
|-------|----------|
| `redirect_after_login` not set before login | Already fixed in LoginPage.js (dynamic redirect param) |
| handleLogin not called | Already fixed in App.js (moved before useEffect) |
| OAuth doesn't preserve redirect | Already fixed in server.js callback (pass in hash) |
| /auth/user request blocked by CORS | Check CORS whitelist, add your Vercel URL |
| Network error during verification | Fallback redirect should still work (see App.js lines 140-178) |

---

## AI Coach Returns Error

### Symptoms
- Click 🤖 AI Coach button
- Modal opens
- AI asks first question
- User sends response
- Error message: "❌ Sorry, I encountered an error. Please try again."

### Quick Fixes (in order)
1. **Check Vercel deployment**
   - Latest code changes deployed?
   - If not, wait or manually redeploy

2. **Check browser console (F12)**
   - Go to Console tab
   - Error should show actual error message
   - Look for "Error in AI interview:" logs
   - Check error.response.status

3. **Common API errors**
   | Status | Meaning | Solution |
   |--------|---------|----------|
   | 503 | OpenAI not available | Restart Render service |
   | 400 | Invalid request format | Check frontend is sending messages array |
   | 401 | Not authenticated | Clear localStorage, re-login |
   | 500 | Server error | Check Render logs for details |

4. **Check Render logs**
   - Go to Render Dashboard → Services → meal-planner-app-mve2
   - Logs tab should show:
     - `[AI Interview] OpenAI client found, making request...`
     - `[AI Interview] OpenAI response received`
   - If not found, OpenAI initialization failed

### Root Causes & Fixes
| Cause | Solution |
|-------|----------|
| OpenAI not in app.locals | Already fixed (server.js line 517) |
| OPENAI_API_KEY not set | Set in Render environment variables |
| OpenAI API error | Check API key validity and rate limits |
| Database error saving workout | Check DATABASE_URL is valid |
| Prisma client not initialized | Already fixed (lazy initialization) |

---

## Database Connection Errors

### Common Errors

#### "getaddrinfo ENOTFOUND base"
**Cause:** DATABASE_URL has `base"` instead of valid URL  
**Fix:** Update DATABASE_URL in Render to correct format:
```
postgresql://meal_planner_user:PASSWORD@internal-host/meal_planner_vo27?sslmode=disable
```

#### "password authentication failed"
**Cause:** Wrong password in DATABASE_URL  
**Fix:**
1. Go to Render PostgreSQL service details
2. Copy the Internal Database URL
3. Extract password from it
4. Update DATABASE_URL in backend service with correct password

#### "DEPTH_ZERO_SELF_SIGNED_CERT"
**Cause:** Using `?sslmode=require` with internal database  
**Fix:** Change to `?sslmode=disable` for internal connection

#### "Too many connections"
**Cause:** Connection pool exhausted  
**Fix:** Reduce max connections or increase database limits

---

## Deployment Issues

### Vercel Frontend

#### Build Fails
**Steps:**
1. Check Vercel build logs (Deployments → Select deployment → Logs)
2. Look for error messages (usually missing dependency or syntax error)
3. Common: "Cannot find module 'axios'" → Add to client/package.json

#### Auto-deploy Not Working
**Steps:**
1. Go to GitHub → Settings → Webhooks
2. Check Vercel webhook is configured
3. Or manually trigger: Vercel Dashboard → Redeploy

### Render Backend

#### Deployment Fails
**Steps:**
1. Check Render build logs (Services → Logs tab)
2. Common issues:
   - `ENOTFOUND database` → DATABASE_URL malformed
   - `Cannot find module` → Missing dependency
   - `DATABASE_URL not set` → Environment variable missing

#### Service Won't Start
**Steps:**
1. Check service is not in "suspended" state
2. Restart service: Render Dashboard → Service → Settings → Restart Service
3. Check recent deploys for errors
4. Verify all required environment variables are set

---

## Environment Variables Checklist

### Render Backend Requires
- [ ] DATABASE_URL - Internal Render PostgreSQL URL
- [ ] FRONTEND_BASE - https://meal-planner-gold-one.vercel.app/
- [ ] GOOGLE_CLIENT_ID - Google OAuth ID
- [ ] GOOGLE_CLIENT_SECRET - Google OAuth secret
- [ ] GOOGLE_CALLBACK_URL - https://meal-planner-app-mve2.onrender.com/auth/google/callback
- [ ] OPENAI_API_KEY - OpenAI API key for AI features
- [ ] SESSION_SECRET - Secret for session management
- [ ] STRIPE_SECRET_KEY - Stripe payment key (optional)

### Vercel Frontend Requires
- [ ] REACT_APP_API_URL - https://meal-planner-app-mve2.onrender.com
- [ ] REACT_APP_OAUTH_URL - https://meal-planner-app-mve2.onrender.com

---

## Recovery Procedures

### If OAuth Completely Broken
1. **Clear browser data**
   - DevTools → Application → Clear Site Data
   - Or open in incognito mode
   
2. **Force fresh login**
   - Delete auth_token from localStorage
   - Refresh page
   - Try login again

3. **Check credentials**
   - Verify GOOGLE_CLIENT_ID is set correctly
   - Verify GOOGLE_CALLBACK_URL matches exactly
   - Both in Render environment variables

### If Database Corrupted
1. **Check migrations ran**
   - Render logs should show all migrations ✅
   - If not, manually run migrations

2. **Recreate database**
   - Delete and recreate on Render PostgreSQL
   - Re-run migrations
   - Note: This will delete all data

3. **Check backups**
   - Render may have automatic backups
   - Can be restored from Render dashboard

### If AI Features Don't Work
1. **Verify OpenAI API key**
   - Go to https://platform.openai.com/api-keys
   - Check key is active and not expired
   - Check usage limits not exceeded
   - Update in Render environment variables

2. **Test OpenAI connectivity**
   - From terminal: `curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models`
   - Should return list of models

3. **Check rate limiting**
   - Render logs may show rate limit exceeded
   - Wait a minute and try again
   - Or increase rate limits in server.js

---

## Monitoring & Health Checks

### Daily Checks
- [ ] Visit https://meal-planner-gold-one.vercel.app - loads?
- [ ] Can login via Google OAuth?
- [ ] Can access all 6 apps from switchboard?
- [ ] Can log workouts in Fitness app?
- [ ] Render service shows "Live" status?

### Weekly Checks
- [ ] Check Vercel deployment history - all successful?
- [ ] Check Render service logs for errors?
- [ ] Monitor OpenAI API usage and costs
- [ ] Review database performance metrics

### Monthly Checks
- [ ] Audit CORS whitelist
- [ ] Review rate limiting thresholds
- [ ] Check for deprecated dependencies
- [ ] Plan feature improvements

---

**Last Updated:** December 22, 2025  
**Maintained By:** GitHub Copilot
