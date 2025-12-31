# SSO Authentication Fix Documentation

## Overview

This document details the SSO (Single Sign-On) authentication issues encountered between the Meal Planner (switchboard) and Fitness App, and how they were resolved.

## Problem Description

### Symptom
When logging into the Meal Planner via Google OAuth, users were being incorrectly redirected to the Fitness App instead of staying on the switchboard.

### Root Cause
The `?returnTo=fitness` URL parameter was persisting through the OAuth flow:

1. User visits fitness app → clicks "Sign in via ASR Portal"
2. Redirected to meal planner with `?returnTo=fitness`
3. User clicks Google login
4. **Bug:** The `?returnTo=fitness` was passed through OAuth redirect URL
5. After OAuth, meal planner saw `returnTo=fitness` and redirected to fitness
6. On subsequent visits, URL still had `?returnTo=fitness`, causing infinite redirect loop

## Architecture

### Two Separate Apps
| App | URL | Purpose |
|-----|-----|---------|
| Meal Planner | `https://meal-planner-gold-one.vercel.app` | Main portal/switchboard |
| Fitness App | `https://meal-planner-app-8hnw.vercel.app` | Workout tracking |

### SSO Flow (Correct Behavior)

**Flow A: Direct Meal Planner Login**
```
User → meal-planner-gold-one.vercel.app
     → Click "Sign in with Google"
     → Google OAuth
     → Return to switchboard (logged in)
```

**Flow B: Fitness App SSO Login**
```
User → meal-planner-app-8hnw.vercel.app
     → Click "Sign in via ASR Portal"
     → meal-planner-gold-one.vercel.app?returnTo=fitness
     → Click "Sign in with Google"
     → Google OAuth
     → Return to meal planner
     → Detect returnTo=fitness
     → Redirect to fitness app with auth token
```

## Files Modified

### 1. `client/src/components/AppSwitchboard.js`

**Before (Bug):**
```javascript
const handleGoogleLogin = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const returnTo = urlParams.get('returnTo');

  let redirectUrl = `${window.location.origin}/switchboard`;
  if (returnTo) {
    redirectUrl += `?returnTo=${returnTo}`;  // BUG: Passes in URL
  }

  window.location.href = `${API}/auth/google?redirect=${encodeURIComponent(redirectUrl)}`;
};
```

**After (Fixed):**
```javascript
const handleGoogleLogin = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const returnTo = urlParams.get('returnTo');

  // Store returnTo in localStorage, not URL
  if (returnTo) {
    localStorage.setItem('sso_return_to', returnTo);
    window.history.replaceState(null, '', window.location.pathname);
  }

  // Clean redirect URL (no returnTo param)
  const redirectUrl = `${window.location.origin}/switchboard`;
  window.location.href = `${API}/auth/google?redirect=${encodeURIComponent(redirectUrl)}`;
};
```

### 2. `client/src/App.js`

**Changes:**
- OAuth callback stores `returnTo` from URL to `localStorage.sso_return_to`
- Clears URL completely after OAuth (hash AND query params)
- `handleLogin()` reads from `localStorage.sso_return_to` instead of URL
- Clears `sso_return_to` after use to prevent loops

```javascript
const handleLogin = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData));
  setUser(userData);

  // Read from localStorage (not URL)
  const returnTo = localStorage.getItem('sso_return_to');
  if (returnTo === 'fitness') {
    localStorage.removeItem('sso_return_to');  // Clear after use
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const params = new URLSearchParams({ token, user: userStr });
      window.location.href = `${FITNESS_APP_URL}#auth=${params.toString()}`;
      return;
    }
  }
  localStorage.removeItem('sso_return_to');  // Clear stale values
  // ... continue to switchboard
};
```

### 3. `fitness/frontend/src/hooks/useAuth.js`

**Issue:** Fitness app expected `#auth=token=xxx&user=xxx` format but received `#token=xxx`

**Fix:** Handle both URL hash formats:

```javascript
// Handle #auth=token=xxx&user=xxx format (preferred)
if (hash && hash.startsWith('#auth=')) {
  // Parse and use directly
}

// Handle #token=xxx format (fallback - verify with API)
if (hash && hash.startsWith('#token=')) {
  const urlToken = hash.substring(7).split('&')[0];
  // Verify token with backend API to get user info
  fetch(`${API_BASE}/auth/user`, {
    headers: { 'Authorization': `Bearer ${urlToken}` }
  })
  .then(res => res.json())
  .then(data => {
    if (data.user) {
      localStorage.setItem('token', urlToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setToken(urlToken);
    }
  });
}
```

## Environment Variable Issue

### Problem
Fitness app's `VITE_API_BASE_URL` was incorrectly set to database URL:
```
postgresql://meal_planner_user:xxx@dpg-xxx.render.com/meal_planner
```

### Fix
Changed to correct API URL:
```
https://meal-planner-app-mve2.onrender.com
```

## Testing Checklist

- [ ] Meal Planner: Login stays on switchboard
- [ ] Meal Planner: Can access all apps after login
- [ ] Fitness App: SSO redirects to meal planner
- [ ] Fitness App: After OAuth, redirects back to fitness
- [ ] Fitness App: User is logged in after redirect
- [ ] Both: Logout clears session properly
- [ ] Both: No redirect loops

## Git Commits

| Commit | Description |
|--------|-------------|
| `810ef18` | Fix SSO: Handle both #auth= and #token= URL formats |
| `d97ce76` | Fix SSO: Clear returnTo param after use to prevent redirect loop |
| `bd17dd2` | Fix SSO: Store returnTo in localStorage before OAuth, not in URL |

## Key Learnings

1. **Don't persist sensitive params in URLs** - Use localStorage for cross-page state
2. **Clear state after use** - Prevents loops and stale data issues
3. **Handle multiple formats** - Different redirect sources may use different formats
4. **Verify environment variables** - Wrong API URL caused silent failures
5. **Test both flows** - Direct login vs SSO have different requirements
