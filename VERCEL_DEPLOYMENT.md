# Vercel Deployment Guide for Meal Planner App

This guide explains how to configure Google OAuth authentication when deploying the frontend to Vercel.

## Architecture Overview

- **Frontend**: Deployed on Vercel (React app in `/client` directory)
- **Backend**: Deployed separately (e.g., Render, Railway, or other Node.js hosting)
- **Authentication**: Google OAuth flow between frontend and backend

## Prerequisites

1. A Google Cloud Project with OAuth 2.0 credentials configured
2. Backend server deployed and accessible via HTTPS
3. Vercel account for frontend deployment

## Step 1: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Add **Authorized redirect URIs**:
   ```
   https://your-backend-url.com/auth/google/callback
   ```
   ⚠️ **Important**: This must point to your BACKEND server, not Vercel

## Step 2: Configure Backend Environment Variables

On your backend hosting platform (e.g., Render), set these environment variables:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend-url.com/auth/google/callback

# Frontend URL (where users will be redirected after login)
FRONTEND_BASE=https://your-app.vercel.app

# Session & API
SESSION_SECRET=your-random-secret-key-at-least-32-chars
OPENAI_API_KEY=sk-...
NODE_ENV=production
PORT=5000
```

### Important Backend URLs:
- `GOOGLE_CALLBACK_URL`: Your backend URL + `/auth/google/callback`
- `FRONTEND_BASE`: Your Vercel deployment URL (no trailing slash)

## Step 3: Configure Vercel Environment Variables

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add the following variable:

```bash
REACT_APP_API_URL=https://your-backend-url.com
```

⚠️ **Critical**: This must point to your BACKEND server (where server.js runs), NOT your Vercel URL.

### How to set in Vercel:
- **Key**: `REACT_APP_API_URL`
- **Value**: `https://your-backend-url.com` (no trailing slash)
- **Environment**: Production (and Preview if needed)

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel CLI

```bash
cd client
vercel --prod
```

### Option B: Deploy via Vercel Dashboard

1. Connect your GitHub repository
2. Set **Root Directory** to `client`
3. Set **Build Command** to `npm run build`
4. Set **Output Directory** to `build`
5. Deploy

## Step 5: Verify Configuration

### Test the OAuth Flow:

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Click "Start Google login"
3. You should be redirected to: `https://your-backend-url.com/auth/google`
4. After Google authentication: redirected to `https://your-backend-url.com/auth/google/callback`
5. Finally redirected back to: `https://your-app.vercel.app`

### If OAuth fails, check:

1. **Browser Console** (`F12` → Console tab):
   ```
   Look for: API_BASE in browser: https://...
   ```
   This should show your backend URL, not undefined

2. **Network Tab** (`F12` → Network tab):
   - Check if `/auth/google` request goes to correct backend
   - Verify redirect URLs in response headers

3. **Backend Logs**:
   - Check if OAuth callback is being received
   - Look for errors in authentication flow

## Common Issues & Solutions

### Issue 1: "Redirect URI mismatch" error from Google

**Cause**: Google OAuth callback URL doesn't match what's configured in Google Cloud Console

**Solution**:
- Verify `GOOGLE_CALLBACK_URL` in backend matches Google Cloud Console exactly
- Must be: `https://your-backend-url.com/auth/google/callback`

### Issue 2: Frontend shows "undefined/auth/google"

**Cause**: `REACT_APP_API_URL` not set in Vercel

**Solution**:
1. Go to Vercel → Settings → Environment Variables
2. Add `REACT_APP_API_URL` with your backend URL
3. Redeploy the application

### Issue 3: CORS errors

**Cause**: Backend CORS not configured to allow Vercel domain

**Solution**: Backend already has `origin: true, credentials: true` which should work. If issues persist:
```javascript
// In server.js, replace the cors config with:
app.use(
  cors({
    origin: process.env.FRONTEND_BASE,
    credentials: true
  })
);
```

### Issue 4: Session not persisting after login

**Cause**: Cookie settings incompatible with cross-domain setup

**Solution**: The backend is already configured with:
```javascript
cookie: {
  secure: NODE_ENV === 'production',  // HTTPS only in production
  httpOnly: true,                      // Prevents XSS
  sameSite: 'none'                     // Required for cross-domain
}
```

Ensure `NODE_ENV=production` is set on your backend.

### Issue 5: Can't login, stuck on login page

**Cause**: Session cookie domain mismatch

**Solution**: Make sure both frontend and backend use HTTPS in production.

## Environment Variables Checklist

### Backend (e.g., Render):
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_CALLBACK_URL` (backend URL + /auth/google/callback)
- [ ] `FRONTEND_BASE` (Vercel URL)
- [ ] `SESSION_SECRET`
- [ ] `OPENAI_API_KEY`
- [ ] `NODE_ENV=production`

### Frontend (Vercel):
- [ ] `REACT_APP_API_URL` (backend URL)

### Google Cloud Console:
- [ ] Authorized redirect URI: `https://your-backend-url.com/auth/google/callback`

## Testing Locally Before Deployment

To test the full flow locally:

1. **Terminal 1 - Backend**:
   ```bash
   # In project root
   npm install
   # Create .env with all backend variables
   node server.js
   ```

2. **Terminal 2 - Frontend**:
   ```bash
   cd client
   npm install
   # Create .env with: REACT_APP_API_URL=http://localhost:5000
   npm start
   ```

3. Test at `http://localhost:3000`

## Security Notes

- Always use HTTPS in production
- Keep `SESSION_SECRET` truly random and secret (use `openssl rand -base64 32`)
- Never commit `.env` files to git
- Rotate secrets periodically
- Use environment-specific OAuth credentials (separate for dev/prod)

## Support

If you continue to have issues:
1. Check browser console for errors
2. Check backend logs for authentication errors
3. Verify all URLs are correct (no typos, correct protocols)
4. Ensure Google Cloud Console redirect URIs are exact matches
