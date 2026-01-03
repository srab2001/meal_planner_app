# Render Manual Deployment Guide

## Current Issue
Render's auto-deployment has not triggered despite multiple commits pushed to main branch. This could be due to:
- Auto-deploy webhook not configured
- Auto-deploy disabled in Render dashboard
- GitHub webhook not firing
- Build errors preventing deployment

## Steps to Manually Deploy via Render Dashboard

### Method 1: Render Web Dashboard (Easiest)
1. **Login to Render**: https://dashboard.render.com
2. **Find Service**: Look for "meal-planner-app" or "meal-planner-app-mve2"
3. **Click Service Name** to open details page
4. **Click "Manual Deploy"** button (usually in top-right area)
5. **Select Branch**: Ensure "main" is selected
6. **Click "Deploy"** button
7. **Monitor**: Watch the deployment progress in the "Logs" tab
8. **Verify**: Deployment complete when you see "✓ Service is live"

### Method 2: Git Deploy (Alternative)
If manual deploy button not visible:
1. Go to service settings
2. Check "Auto Deploy" is enabled and set to "main" branch
3. If disabled, enable it
4. Make a new commit and push to trigger webhook

### Method 3: Check Render Configuration
Before deploying, verify settings:
1. **Service Type**: Web Service
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. **Environment Variables**: All set correctly:
   - `DATABASE_URL` ✅
   - `GOOGLE_CLIENT_ID` ✅
   - `GOOGLE_CLIENT_SECRET` ✅
   - `JWT_SECRET` ✅
   - `OPENAI_API_KEY` ✅
   - `NODE_ENV` = "production"
5. **Branch**: main

## Verification After Deployment

Once Render completes deployment, verify:

```bash
# Check health endpoint
curl -s https://meal-planner-app-mve2.onrender.com/health

# Expected output:
# {"status":"ok"}

# Check new /auth/test-token endpoint
curl -X POST https://meal-planner-app-mve2.onrender.com/auth/test-token \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected output:
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","expiresIn":2592000}
```

## Troubleshooting

### Error: "Cannot POST /auth/test-token"
- **Cause**: Old code still running
- **Solution**: 
  1. Check that `/auth/test-token` exists in server.js (line 588)
  2. Verify main branch has the commit with this endpoint
  3. Manually trigger deployment in Render dashboard
  4. Wait 5-15 minutes for build and deploy
  5. Re-check endpoint

### Error: Service won't start / Build fails
- **Solution**:
  1. Check Render logs for error messages
  2. Verify all environment variables are set
  3. Check that database migrations completed
  4. Ensure PostgreSQL is accessible
  5. Check Node.js version compatibility

### Deployment seems stuck
- **Solution**:
  1. Click "Cancel Deployment" 
  2. Wait 30 seconds
  3. Click "Manual Deploy" again
  4. If still stuck, contact Render support

## Code Change Details

The /auth/test-token endpoint was added in commit: `66799e8 feat: add development test token endpoint for E2E testing`

**Location**: `server.js`, lines 588-620

**Functionality**:
```javascript
app.post('/auth/test-token', (req, res) => {
  if (NODE_ENV === 'production') {
    // Blocked in production for security
    return res.status(403).json({
      error: 'test_endpoint_disabled',
      message: 'Test token endpoint is disabled in production'
    });
  }
  
  // Generates a valid JWT token for testing
  // No external dependencies needed
  // Returns token valid for 30 days
});
```

## Quick Status Check

Run this to see if deployment was successful:

```bash
#!/bin/bash
echo "Checking Render deployment..."
RESPONSE=$(curl -s -X POST https://meal-planner-app-mve2.onrender.com/auth/test-token \
  -H "Content-Type: application/json" -d '{}')

if echo "$RESPONSE" | grep -q "token"; then
  echo "✅ DEPLOYED - /auth/test-token is working!"
  echo "Response: $RESPONSE"
else
  echo "⏳ NOT YET - Still on old code"
  echo "Response: $RESPONSE"
fi
```

## Next Steps

1. **Deploy Manually**: Go to Render dashboard and click "Manual Deploy"
2. **Wait**: 5-15 minutes for build and deploy
3. **Verify**: Run the quick status check above
4. **Run Tests**: Once verified, run smoke tests:
   ```bash
   cd meal_planner_app
   node scripts/smoke-test.js \
     --url https://client-hqpdn7to6-stus-projects-458dd35a.vercel.app \
     --backend https://meal-planner-app-mve2.onrender.com
   ```

---
**Status**: Awaiting manual deployment on Render  
**Last Trigger**: January 3, 2026, 18:22 EST  
**Priority**: HIGH - Blocking E2E smoke tests
