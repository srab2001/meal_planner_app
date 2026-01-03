# Lessons Learned: SSO Authentication Implementation

## Project Context
- **Apps:** Meal Planner (switchboard) + Fitness App (separate deployment)
- **Auth Method:** Google OAuth via backend, JWT tokens
- **Platforms:** Vercel (frontend), Render (backend)

---

## Issue 1: URL Parameter Persistence

### What Happened
The `?returnTo=fitness` URL parameter persisted through OAuth, causing all logins to redirect to fitness.

### Why It Happened
- OAuth redirect URL included `?returnTo=fitness`
- After OAuth callback, URL still had the param
- Every login checked URL and redirected to fitness

### Lesson Learned
> **Never pass transient state through OAuth redirect URLs. Use localStorage instead.**

### Best Practice
```javascript
// BAD: Passing state in URL
redirectUrl = `/callback?returnTo=${returnTo}`;

// GOOD: Store in localStorage, clear URL
localStorage.setItem('sso_return_to', returnTo);
window.history.replaceState(null, '', pathname);
redirectUrl = `/callback`;
```

---

## Issue 2: URL Hash Format Mismatch

### What Happened
Fitness app expected `#auth=token=xxx&user=xxx` but received `#token=xxx`.

### Why It Happened
- Backend OAuth callback used `#token=xxx` format
- Different code paths produced different formats
- No fallback handling for alternate formats

### Lesson Learned
> **Always handle multiple input formats when integrating systems.**

### Best Practice
```javascript
// Handle multiple formats
if (hash.startsWith('#auth=')) {
  // Preferred format with user data
} else if (hash.startsWith('#token=')) {
  // Fallback: verify with API to get user
}
```

---

## Issue 3: Environment Variable Misconfiguration

### What Happened
`VITE_API_BASE_URL` was set to database URL instead of API URL.

### Why It Happened
- Copy/paste error during Vercel setup
- Similar-looking URLs (both from Render)
- No validation of environment variables

### Lesson Learned
> **Validate environment variables at app startup. Log them (safely) for debugging.**

### Best Practice
```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE || !API_BASE.startsWith('https://')) {
  console.error('Invalid API_BASE:', API_BASE?.substring(0, 20));
}
console.log('API_BASE:', API_BASE); // Log for debugging
```

---

## Issue 4: State Not Cleared After Use

### What Happened
`sso_return_to` in localStorage wasn't cleared, causing repeated redirects.

### Why It Happened
- State was set but not consumed
- Multiple code paths could set the value
- No cleanup on error paths

### Lesson Learned
> **Always clear transient state after consuming it, including error paths.**

### Best Practice
```javascript
const returnTo = localStorage.getItem('sso_return_to');
localStorage.removeItem('sso_return_to'); // Clear FIRST

if (returnTo === 'fitness') {
  // Handle redirect
}
// State is cleared regardless of outcome
```

---

## Issue 5: Vercel Deployment Configuration

### What Happened
Vercel couldn't find `fitness/frontend` directory, builds failed repeatedly.

### Why It Happened
- Root Directory setting conflicts with custom build commands
- Cached configuration from previous deployments
- Project settings vs Production Overrides mismatch

### Lesson Learned
> **When Vercel config is corrupted, delete and recreate the project.**

### Best Practice
For monorepo deployments:
```
Root Directory: fitness/frontend
Framework: Vite
Build Command: (default)
Output Directory: build
```

---

## Issue 6: CORS Configuration

### What Happened
Fitness app couldn't call backend API due to CORS errors.

### Why It Happened
- New fitness app URL not in CORS whitelist
- Old URL was deleted when project was recreated

### Lesson Learned
> **When deploying new frontends, immediately update backend CORS.**

### Best Practice
```javascript
const allowedOrigins = [
  process.env.FRONTEND_BASE,
  'https://meal-planner-gold-one.vercel.app',
  'https://meal-planner-app-8hnw.vercel.app', // New fitness app
];
```

---

## Summary: SSO Implementation Checklist

### Before Implementation
- [ ] Define auth flow for each app entry point
- [ ] Document expected URL formats
- [ ] List all environment variables needed

### During Implementation
- [ ] Use localStorage for transient state, not URLs
- [ ] Handle multiple input formats
- [ ] Clear state after consumption
- [ ] Log key values for debugging

### Deployment
- [ ] Verify all environment variables
- [ ] Update CORS for new URLs
- [ ] Test both direct and SSO login flows
- [ ] Clear browser storage before testing

### Debugging
- [ ] Check browser console for auth logs
- [ ] Check Network tab for failed requests
- [ ] Verify localStorage values
- [ ] Check URL for unexpected params

---

## Quick Reference: Auth Flow

```
MEAL PLANNER DIRECT LOGIN:
1. User → meal-planner.vercel.app
2. Click Google → OAuth
3. Return to /switchboard#token=xxx
4. Extract token, verify, show switchboard

FITNESS APP SSO:
1. User → fitness-app.vercel.app
2. Click "Sign in via Portal"
3. → meal-planner.vercel.app?returnTo=fitness
4. Store returnTo in localStorage, clear URL
5. Click Google → OAuth
6. Return to /switchboard#token=xxx
7. Extract token, verify, check localStorage
8. Found sso_return_to=fitness → redirect to fitness#auth=token&user
9. Fitness app extracts auth, user logged in
```
