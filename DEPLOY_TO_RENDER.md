# Deploy Latest Code to Render

## Current Status

✅ **Latest code is merged to main branch** (commit: 417f08f)
❌ **Render is on old commit** (417f08f shows as latest but endpoints missing)
🎯 **Need to redeploy Render to get the new endpoints**

## What This Fixes

Deploying the latest code will enable:
- ✅ `/api/find-stores` endpoint (store finder with optional store name search)
- ✅ `/api/generate-meals` endpoint (AI-powered meal plan generation)
- ✅ All the latest authentication fixes

## Step-by-Step Deployment

### 1. Go to Render Dashboard

Visit: https://dashboard.render.com/

### 2. Find Your Backend Service

Look for: `meal-planner-app` (or similar name)

### 3. Manual Deploy

1. Click on your service name
2. Click **"Manual Deploy"** button (top right)
3. Select branch: **main**
4. Click **"Deploy latest commit"**

### 4. Wait for Deployment

Watch the logs - you'll see:
```
Building...
Installing dependencies...
Starting server...
```

Wait until status shows: **"Live"** (green indicator)

This typically takes 2-5 minutes.

### 5. Verify Deployment

Once "Live", check the logs for:
```
GOOGLE_CLIENT_ID present: true
GOOGLE_CALLBACK_URL: https://meal-planner-app-mve2.onrender.com/auth/google/callback
FRONTEND_BASE: https://meal-planner-app-chi.vercel.app
server listening on port 5000
```

Also verify the commit hash in the deployment log matches `417f08f` or shows the merge commit.

### 6. Test the Application

1. Clear browser cookies for both domains:
   - `meal-planner-app-chi.vercel.app`
   - `meal-planner-app-mve2.onrender.com`

2. Visit: https://meal-planner-app-chi.vercel.app

3. Test the full flow:
   - ✅ Login with Google (should already work)
   - ✅ Enter ZIP code
   - ✅ Optionally enter store name (e.g., "Whole Foods")
   - ✅ Click "Find Stores" (should work now)
   - ✅ Select a store
   - ✅ Fill out questionnaire
   - ✅ Generate meal plan (should work now)

## Troubleshooting

### If deployment fails:

**Check Environment Variables in Render:**

Required variables:
- `NODE_ENV=production`
- `GOOGLE_CLIENT_ID=<your-client-id>`
- `GOOGLE_CLIENT_SECRET=<your-client-secret>`
- `GOOGLE_CALLBACK_URL=https://meal-planner-app-mve2.onrender.com/auth/google/callback`
- `FRONTEND_BASE=https://meal-planner-app-chi.vercel.app` (NO trailing slash)
- `SESSION_SECRET=<your-secret>`
- `OPENAI_API_KEY=<your-api-key>`

### If still getting 401 errors after deployment:

1. Check Render logs during the API call
2. Look for the request to `/api/find-stores`
3. Should see: `Finding stores for ZIP: <zipcode>`
4. If you see 401, check authentication is working (login first)

### If store finder works but meal plan fails:

1. Check Render logs for `/api/generate-meals`
2. Verify `OPENAI_API_KEY` is set correctly
3. Check for any error messages in logs

## Expected Timeline

- **Manual deploy**: ~3-5 minutes
- **Testing**: ~5 minutes
- **Total**: ~10 minutes

## Next Steps After Deployment

Once deployed and tested successfully:

1. Verify all features work end-to-end
2. Monitor Render logs for any errors
3. Consider setting up auto-deploy from main branch (optional)

---

**Ready to deploy?** Go to https://dashboard.render.com/ and follow the steps above!
