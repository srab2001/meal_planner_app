# Authentication Fix: Test Token Endpoint

## Problem Identified

The previous E2E test failures were caused by **invalid JWT tokens**. The backend properly validates JWTs using the `JWT_SECRET` environment variable, but the tokens being tested were not actual JWTs signed with that secret.

### Root Cause Analysis
- User provided JWT tokens from browser localStorage
- These tokens were generated during previous sessions or were invalid
- Backend's `requireAuth` middleware correctly rejected them with 401 "invalid_token"
- The issue was not with Vercel rewrites or CORS — the backend auth logic was correct

## Solution Implemented

### 1. New Development Test Token Endpoint

**File:** `server.js` (lines 555-597)

A new POST endpoint has been added:

```javascript
POST /auth/test-token
```

**Features:**
- ✅ Only available in **development** (blocked in production with 403)
- ✅ Generates a **valid JWT** signed with the backend's `JWT_SECRET`
- ✅ Returns a complete response with token, user info, and expiration
- ✅ No Google OAuth required (perfect for automated E2E testing)

**Response Example:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "test-user-id-1767477231304",
    "email": "test@example.com",
    "displayName": "Test User",
    "picture": null,
    "googleId": "test-google-id",
    "role": "user",
    "status": "active"
  },
  "expiresIn": "30d",
  "message": "Test token created. Valid for 30 days. Use with: Authorization: Bearer ..."
}
```

### 2. Updated Smoke Test Script

**File:** `scripts/smoke-test.js`

Enhanced to automatically obtain a test token if none is provided:

```bash
# Auto-generates test token, then runs E2E flow
node scripts/smoke-test.js --url https://your-frontend.vercel.app

# Or provide explicit backend for token generation
node scripts/smoke-test.js --url https://your-frontend.vercel.app --backend https://your-backend.onrender.com

# Or use existing token
node scripts/smoke-test.js --url https://your-frontend.vercel.app --token YOUR_JWT
```

**Features:**
- Calls `POST /auth/test-token` to generate valid JWT
- Uses token for all subsequent API calls
- Runs full interview flow: **questions → submit → generate-plan**
- Clear error messages if any step fails

## How to Test Locally

### Prerequisites
1. Backend server running with fresh code (Render deployment completed)
2. Frontend deployed to Vercel
3. Node.js 18+ available locally

### Steps

1. **Wait for Render deployment** (auto-deploys from GitHub push)
   - Check Render dashboard for deployment status
   - Backend URL: `https://meal-planner-app-mve2.onrender.com`

2. **Run smoke test once deployment is ready:**
   ```bash
   cd /path/to/meal_planner_app
   
   # Test against production frontend/backend
   node scripts/smoke-test.js --url https://client-hqpdn7to6-stus-projects-458dd35a.vercel.app
   ```

3. **Expected output:**
   ```
   Running smoke tests against: https://client-hqpdn7to6-stus-projects-458dd35a.vercel.app
   No token provided, attempting to generate test token...
   
   Generating test token via https://meal-planner-app-mve2.onrender.com/auth/test-token...
   ✅ Test token generated successfully
      User: test@example.com
      Expires: 30d
   
   1) Fetch questions... OK (15 questions)
   2) Submit interview responses... OK (response_id=12345)
   3) Generate plan (this calls OpenAI) ... OK (plan_id=67890)
   
   Smoke tests passed ✅
   ```

## Testing the Token Endpoint Manually

### Via cURL (once Render deploys)

```bash
# Generate test token
curl -X POST https://meal-planner-app-mve2.onrender.com/auth/test-token \
  -H "Content-Type: application/json" \
  -d '{}'

# Use token to verify auth works
TOKEN="eyJhbGc..." # Token from response above
curl -X GET https://meal-planner-app-mve2.onrender.com/auth/user \
  -H "Authorization: Bearer $TOKEN"
```

### Expected Result
```json
{
  "user": {
    "id": "test-user-id-1767477231304",
    "email": "test@example.com",
    "displayName": "Test User",
    "picture": null,
    "role": "user",
    "status": "active"
  }
}
```

## Production Safety

The test token endpoint is **disabled in production**:

```javascript
if (NODE_ENV === 'production') {
  return res.status(403).json({
    error: 'test_endpoint_disabled',
    message: 'Test token endpoint is disabled in production'
  });
}
```

**Result when accessed in production:**
```json
{
  "error": "test_endpoint_disabled",
  "message": "Test token endpoint is disabled in production"
}
```

## Git Changes

**Commit:** `feat: add development test token endpoint for E2E testing`

**Files Modified:**
1. `server.js` — Added `/auth/test-token` endpoint
2. `scripts/smoke-test.js` — Enhanced to auto-generate token

**Files Changed:** 2
**Insertions:** ~70 lines

## Next Steps

1. **Wait for Render deployment** (auto-triggered by git push)
2. **Run smoke test:** `node scripts/smoke-test.js --url https://client-hqpdn7to6-stus-projects-458dd35a.vercel.app`
3. **Verify full E2E flow works:** questions → submit → generate-plan
4. **Monitor OpenAI API usage** in your OpenAI dashboard

## Troubleshooting

### "Cannot POST /auth/test-token"
- Backend hasn't deployed yet to Render
- Check Render dashboard for deployment status
- Wait 2-5 minutes after git push

### "Invalid or expired token"
- Token expired (max 30 days)
- Generate new token via `/auth/test-token`
- Check JWT_SECRET matches between backend and token generation

### "401 Unauthorized on /api/fitness-interview/questions"
- Authorization header not forwarded (Vercel rewrite issue)
- Check `client/vercel.json` rewrites are configured correctly
- Headers should be automatically forwarded by Vercel

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│ Client (React Frontend)                         │
│ - Stores token in localStorage                  │
│ - Sends Authorization: Bearer <token> header    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Vercel (Frontend Proxy)                         │
│ - Rewrites /api/* to backend                    │
│ - Automatically forwards headers                │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Render (Backend API Server)                     │
│ - requireAuth middleware validates JWT          │
│ - POST /auth/test-token generates valid JWT     │
│ - All /api/* endpoints protected with requireAuth
└─────────────────────────────────────────────────┘
```

## Summary

✅ **Root cause fixed:** Added `/auth/test-token` for generating valid JWTs
✅ **E2E testing enabled:** Smoke test script automatically obtains token
✅ **Production safe:** Endpoint disabled when `NODE_ENV=production`
✅ **Ready for testing:** Once Render deploys, run smoke test to verify full flow

