# Corrected Authentication Flow - How Users Actually Log In

## The Real Flow (Verified in Code)

### Initial Load
```
User visits: https://meal-planner-gold-one.vercel.app/
                          ↓
        App.js useEffect checks localStorage
                          ↓
        Has auth_token? ────┬──→ YES → Load Switchboard (already logged in)
                            │
                            └──→ NO → Load Switchboard OR Login Page
```

The key point: **The switchboard is shown FIRST, regardless of auth status.**

---

## Step 1: User at Switchboard (Authenticated or Not)

```
┌─────────────────────────────────────────────────────────────────┐
│  https://meal-planner-gold-one.vercel.app/                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │            ASR Digital Services Switchboard              │ │
│  │                                                           │ │
│  │                  Welcome back, User!                     │ │
│  │                    [🚪 Logout]                           │ │
│  │                                                           │ │
│  │  Choose Your App:                                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │  🍽️ Meals    │  │  🥗 Nutrition│ │  🎯 Coach   │     │ │
│  │  │             │  │             │  │             │     │ │
│  │  │  Click here │  │  Click here │  │ Click here  │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │  💪 Fitness │  │  🏆 Progress│  │  🔐 Admin   │     │ │
│  │  │             │  │             │  │             │     │ │
│  │  │ Click here  │  │ Click here  │  │(Admins Only)│     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

CODE: client/src/components/AppSwitchboard.js
- Shows all app tiles
- onSelectApp prop passed from App.js
```

---

## Step 2: User Clicks on an App (e.g., "Meals")

```
┌──────────────────────────────────────────────────────────┐
│ User clicks: [🍽️ Meals]                                  │
│                    ↓                                     │
│ handleSelectApp('meal-planner') called                  │
│ (App.js line 402)                                       │
│                    ↓                                     │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Check if user has token:                           │ │
│ │   const token = getToken()                         │ │
│ │   if (token && user)                               │ │
│ │       → Go to ZIP code entry page                  │ │
│ │   else                                             │ │
│ │       → Save destination + Go to login page        │ │
│ │         localStorage.setItem(                       │ │
│ │          'redirect_after_login', 'zip')            │ │
│ └────────────────────────────────────────────────────┘ │
│                    ↓                                     │
│            TWO PATHS:                                   │
│      ┌─────────────┬─────────────┐                     │
│      │             │             │                     │
│   HAS TOKEN    NO TOKEN      (persistent)              │
│      │             │             │                     │
│      ▼             ▼                                    │
│  ZIP Code     Login Page                               │
│  Page         Shows                                    │
│              Google Login                              │
└──────────────────────────────────────────────────────────┘

CODE: App.js handleSelectApp() lines 402-471
- Each app tile checks for token
- If missing, saves app as 'redirect_after_login'
```

---

## Step 3: NO TOKEN - User Sees Login Page

```
┌─────────────────────────────────────────────────────┐
│  LOGIN PAGE                                          │
│                                                     │
│  Meal planner login                                 │
│                                                     │
│  Step 1: start Google login.                        │
│                                                     │
│  [Start Google login] ← LINK, not button            │
│                                                     │
│  URL: https://meal-planner-app-mve2.onrender.com/  │
│       auth/google                                   │
│       ?redirect=zip                                 │
│                      ↓                              │
│           REDIRECT HAPPENS AUTOMATICALLY            │
│                      ↓                              │
│           Google OAuth Server                       │
│                                                     │
└─────────────────────────────────────────────────────┘

CODE: client/src/components/LoginPage.js
- Retrieves 'redirect_after_login' from localStorage
- Builds OAuth URL with ?redirect= parameter
- Link target: /auth/google?redirect=zip
```

---

## Step 4: Google OAuth Flow

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  STEP 1: Redirect to Google                               │
│  └─→ User is taken to Google's login page                │
│                                                            │
│  STEP 2: User authenticates with Google                  │
│  └─→ User enters email/password                          │
│  └─→ User grants permission to app                       │
│                                                            │
│  STEP 3: Google redirects back to Render backend         │
│  └─→ /auth/google/callback?code={AUTH_CODE}             │
│                                                            │
│  STEP 4: Backend processes auth code                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │ POST /auth/google/callback                       │   │
│  │                                                  │   │
│  │ 1. Exchange code for Google profile             │   │
│  │    {email, displayName, id, photos}             │   │
│  │                                                  │   │
│  │ 2. Lookup user in Render PostgreSQL:            │   │
│  │    SELECT * FROM users WHERE google_id = $1    │   │
│  │                                                  │   │
│  │ 3. User found?                                  │   │
│  │    YES → Return existing user with role/status │   │
│  │    NO → Create new user (role='user')           │   │
│  │                                                  │   │
│  │ 4. Generate JWT token (server.js:395-404)      │   │
│  │    Token payload:                               │   │
│  │    {                                             │   │
│  │      id, email, displayName, picture,           │   │
│  │      role: user.role || 'user',   ← ADDED!     │   │
│  │      status: user.status || 'active'← ADDED!   │   │
│  │    }                                             │   │
│  │                                                  │   │
│  │ 5. Redirect back to frontend with token        │   │
│  │    ├─ Token in URL hash (more secure)          │   │
│  │    ├─ Redirect destination from query param    │   │
│  │    └─ FINAL REDIRECT:                          │   │
│  │        https://meal-planner-gold-one.vercel.app/   │
│  │        #token={JWT}&redirect=zip                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘

CODE: server.js lines 453-477
- Passport Google Strategy validates credentials
- generateToken() creates JWT with role & status
- res.redirect() sends token via hash
```

---

## Step 5: Frontend Receives Token

```
┌─────────────────────────────────────────────────┐
│ Browser receives URL with token in hash:        │
│ https://meal-planner-gold-one.vercel.app/      │
│ #token=eyJ0eXA...&redirect=zip                 │
│                                                 │
│ App.js useEffect detects hash (line 125)       │
│ ┌──────────────────────────────────────────┐  │
│ │ 1. Extract token from hash               │  │
│ │ 2. Store in localStorage:                │  │
│ │    localStorage.setItem('auth_token',    │  │
│ │     'eyJ0eXA...')                         │  │
│ │ 3. Extract redirect destination          │  │
│ │    e.g., 'zip'                           │  │
│ │ 4. Save redirect to localStorage:        │  │
│ │    localStorage.setItem(                 │  │
│ │     'redirect_after_login', 'zip')       │  │
│ │ 5. Clean up URL hash                     │  │
│ │ 6. Verify token & load user              │  │
│ │ 7. Call handleLogin(userData)            │  │
│ └──────────────────────────────────────────┘  │
│                                                 │
│ handleLogin() (line 95-115):                  │
│ ┌──────────────────────────────────────────┐  │
│ │ ✓ Set user state                         │  │
│ │ ✓ Check for redirect_after_login         │  │
│ │ ✓ Redirect to saved destination ('zip')  │  │
│ │ ✓ Hide splash screen                     │  │
│ └──────────────────────────────────────────┘  │
│                                                 │
│ Result: User automatically goes to ZIP page   │
│                                                 │
└─────────────────────────────────────────────────┘

CODE: App.js useEffect lines 125-173
- Parses URL hash for token
- Stores token and redirect destination
- Calls handleLogin() with user data
```

---

## Step 6: Token is NOW PERSISTENT

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│ KEY POINT:                                          │
│ ═════════════════════════════════════════════════  │
│                                                     │
│ Token is stored in localStorage:                   │
│ localStorage.getItem('auth_token')                 │
│ Returns: 'eyJ0eXA...'  (JWT token)                │
│                                                     │
│ This token PERSISTS across:                        │
│ ✓ Browser tabs/windows                            │
│ ✓ Page refreshes                                   │
│ ✓ Navigating between apps                         │
│ ✓ Coming back to switchboard                       │
│                                                     │
│ Token is sent with EVERY API call:                │
│ fetch(url, {                                       │
│   headers: {                                       │
│     'Authorization': 'Bearer eyJ0eXA...'          │
│   }                                                │
│ })                                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Step 7: User Navigates Between Apps (SAME TOKEN)

```
Scenario: User logged in, went to ZIP page.
Now user clicks back to go to switchboard
and tries a different app (e.g., Fitness)

┌─────────────────────────────────────────────────┐
│ ZIP CODE PAGE                                    │
│                                                 │
│ [Back to Switchboard]  ← Click this             │
│        ↓                                        │
│ handleGoToSwitchboard() triggered              │
│        ↓                                        │
│ setCurrentView('switchboard')                  │
│        ↓                                        │
│ ┌──────────────────────────────────────────┐  │
│ │ Back at Switchboard                      │  │
│ │                                          │  │
│ │ [🍽️ Meals] [🥗 Nutrition] [🎯 Coach]  │  │
│ │ [💪 Fitness] [🏆 Progress] [🔐 Admin]  │  │
│ │                                          │  │
│ │ Now click [💪 Fitness]                   │  │
│ └──────────────────────────────────────────┘  │
│        ↓                                        │
│ handleSelectApp('fitness') called              │
│        ↓                                        │
│ ┌──────────────────────────────────────────┐  │
│ │ Check if token exists:                   │  │
│ │                                          │  │
│ │ const token = getToken()  ← Returns JWT! │  │
│ │ if (token && user) {                     │  │
│ │   setCurrentView('fitness')  ← GO HERE! │  │
│ │ }                                        │  │
│ │                                          │  │
│ │ ✓ NO redirect needed                    │  │
│ │ ✓ NO OAuth flow needed                  │  │
│ │ ✓ Just goes directly to fitness app      │  │
│ └──────────────────────────────────────────┘  │
│        ↓                                        │
│ FITNESS APP LOADS                               │
│                                                 │
│ Sends JWT token with requests:                │
│ Authorization: Bearer eyJ0eXA...              │
│                                                 │
│ Fitness backend verifies token is valid        │
│ and user has permissions                       │
│                                                 │
└─────────────────────────────────────────────────┘

CODE: App.js handleSelectApp() line 436-453
- When selecting fitness app
- getToken() retrieves JWT from localStorage
- Token is fresh and valid
- No need to re-authenticate
```

---

## Summary: The ACTUAL Authentication Architecture

### Three Distinct Phases:

#### 1️⃣ **BEFORE LOGIN** (No Token)
- User at switchboard
- Clicks any app tile
- App checks for token → NOT FOUND
- Stores app destination in localStorage
- Redirects to LoginPage
- User goes through Google OAuth
- Token acquired and stored

#### 2️⃣ **AFTER FIRST LOGIN** (Has Token)
- Token stored in localStorage
- Switchboard fully accessible
- All apps available
- Token sent with every API request

#### 3️⃣ **PERSISTENT SESSION** (Token Remains)
- User can navigate between apps freely
- Token automatically sent with each request
- No re-authentication needed
- Single token works for ALL apps
- Logout clears token from localStorage

---

## Key Code References

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Initial load & token check | `client/src/App.js` | 117-213 | Check localStorage for token, handle OAuth callback |
| Switchboard | `client/src/components/AppSwitchboard.js` | 1-168 | Show app tiles, trigger app selection |
| App selection handler | `client/src/App.js` | 402-471 | Check token, redirect to login if needed, or go to app |
| Login page | `client/src/components/LoginPage.js` | 1-43 | Build Google OAuth URL with redirect destination |
| OAuth callback handler | `server.js` | 453-477 | Generate JWT, redirect to frontend with token |
| Token generation | `server.js` | 395-404 | Create JWT with role/status fields |
| API authentication | `server.js` | 419-436 | Verify JWT token on API requests |

---

## The Most Important Points

### ✅ What ACTUALLY Happens:

1. **Switchboard shown first** (whether logged in or not)
2. **User clicks app tile** → checks for token
3. **No token?** → goes to LoginPage, triggers Google OAuth
4. **Has token?** → goes directly to that app
5. **After OAuth** → token stored in localStorage
6. **Token persists** → all future apps use same token
7. **Can switch apps freely** → no new OAuth needed

### ❌ What DOES NOT Happen:

- ~~User doesn't see a login page on initial load~~
- ~~Each app has its own separate login flow~~
- ~~User needs to authenticate for each app~~
- ~~Multiple tokens are created for different apps~~

---

## Token Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│  TOKEN LIFECYCLE                                        │
│                                                         │
│  1. CREATED                                             │
│     └─ at: server.js generateToken() after OAuth       │
│     └─ contains: id, email, role, status, expiry       │
│                                                         │
│  2. SENT TO FRONTEND                                    │
│     └─ via: URL hash (#token=...)                      │
│     └─ secure: HTTPS, HttpOnly not needed              │
│                                                         │
│  3. STORED                                              │
│     └─ location: localStorage                          │
│     └─ key: 'auth_token'                               │
│     └─ persistence: survives page reload               │
│                                                         │
│  4. USED                                                │
│     └─ sent with: every API request                    │
│     └─ header: Authorization: Bearer {token}           │
│     └─ optional: query param for ws/special cases      │
│                                                         │
│  5. VERIFIED                                            │
│     └─ by: server.js requireAuth() middleware          │
│     └─ check: JWT signature & expiration               │
│     └─ result: set req.user from decoded payload       │
│                                                         │
│  6. CLEARED (LOGOUT)                                    │
│     └─ when: user clicks [🚪 Logout]                   │
│     └─ action: localStorage.removeItem('auth_token')   │
│     └─ result: must login again to get new token       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Why This Design Works

1. **Single OAuth Flow** - One login for all apps
2. **Token-Based** - JWT sent with requests, no sessions needed
3. **Persistent** - localStorage keeps user logged in
4. **Cross-App** - Same token works everywhere
5. **Secure** - Token includes role/status from database
6. **Stateless Backend** - No session storage overhead
