# Authentication Flow - Quick Visual Guide

## The Complete Journey in Sequence

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                    USER JOURNEY - STEP BY STEP                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


1️⃣  USER LANDS ON SITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    https://meal-planner-gold-one.vercel.app/
                         ↓
    App.js useEffect runs (line 117)
    Checks: localStorage.getItem('auth_token')
                         ↓
    ┌──────────────────────────────────────────┐
    │ Has token in localStorage?                │
    └──────────────────────────────────────────┘
            ↙                              ↖
         YES                              NO
        ↙                                  ↖
    Go to                              Go to
    Switchboard                        Switchboard
    (Already logged in)                (Not logged in)
    
    ⚠️  BOTH show switchboard on initial load!


2️⃣  SWITCHBOARD DISPLAYED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ┌────────────────────────────────────────────────────┐
    │  ASR Digital Services                              │
    │  Welcome back!  [🚪 Logout]                        │
    │                                                    │
    │  Choose Your App:                                  │
    │                                                    │
    │  [🍽️ Meals]  [🥗 Nutrition]  [🎯 Coach]          │
    │  [💪 Fitness]  [🏆 Progress]  [🔐 Admin]          │
    │                                                    │
    └────────────────────────────────────────────────────┘
                         ↓
    User clicks one of the app tiles
    (e.g., clicks [💪 Fitness])


3️⃣  CHECK IF AUTHENTICATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    handleSelectApp('fitness') called (App.js:402)
                         ↓
    ┌──────────────────────────────────────────┐
    │ const token = getToken()                  │
    │ Check if token exists in localStorage    │
    └──────────────────────────────────────────┘
            ↙                              ↖
      HAS TOKEN                         NO TOKEN
        ↙                                  ↖
    Go to                          Save destination
    Fitness                         & Show Login Page
    directly!
                              localStorage.setItem(
                               'redirect_after_login',
                               'fitness')


4️⃣  SCENARIO A: HAS TOKEN (Already logged in)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Token found in localStorage
                         ↓
    ✅ User goes DIRECTLY to Fitness app
                         ↓
    Fitness app sends API requests:
    
    fetch('/api/fitness/profile', {
      headers: {
        'Authorization': 'Bearer eyJ0eXA...'
      }
    })
                         ↓
    Backend receives token, verifies it
    Extract role/status from JWT payload
    Return user's fitness data
                         ↓
    Fitness app loads with user's data
    
    ✨ NO LOGIN NEEDED - authentication is PERSISTENT!


5️⃣  SCENARIO B: NO TOKEN (Not logged in)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    No token in localStorage
                         ↓
    Save destination: localStorage.setItem(
                       'redirect_after_login',
                       'fitness')
                         ↓
    Show LoginPage
    
    ┌──────────────────────────────────────┐
    │  Meal planner login                  │
    │                                      │
    │  Step 1: start Google login.         │
    │                                      │
    │  [Start Google login] ← CLICK THIS   │
    │                                      │
    └──────────────────────────────────────┘
                         ↓
    Link goes to: /auth/google?redirect=fitness
                         ↓
    Browser redirects to Google OAuth Server


6️⃣  GOOGLE AUTHENTICATION FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ┌─────────────┐
    │   GOOGLE    │  User sees Google login page
    │   OAuth     │  User enters email & password
    │             │  User grants permission
    │   ↓         │  ↓
    │   ✅ Auth   │
    │   Success   │  Redirects back to Render backend
    └─────────────┘  /auth/google/callback?code=...


7️⃣  BACKEND PROCESSES AUTHENTICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    server.js /auth/google/callback (lines 453-477)
                         ↓
    ┌─────────────────────────────────────────────────┐
    │  1. Receive auth code from Google               │
    │  2. Exchange for user profile info              │
    │  3. Query database for user:                    │
    │     SELECT * FROM users WHERE google_id = $1   │
    │  4. If new user → create account               │
    │  5. If existing → load user with role/status   │
    │  6. Generate JWT token (server.js:395-404)     │
    │     Payload includes:                           │
    │     - id, email, displayName, picture           │
    │     - role: 'user' or 'admin'                   │
    │     - status: 'active'                          │
    │  7. Redirect to frontend with token             │
    └─────────────────────────────────────────────────┘
                         ↓
    Response: Redirect to
    https://meal-planner-gold-one.vercel.app/
    #token=eyJ0eXA...&redirect=fitness


8️⃣  FRONTEND RECEIVES TOKEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    App.js useEffect detects URL hash (line 125)
                         ↓
    ┌──────────────────────────────────────────────────┐
    │  1. Extract token from hash                      │
    │  2. Store in localStorage:                       │
    │     localStorage.setItem('auth_token',           │
    │      'eyJ0eXA...')                               │
    │  3. Extract redirect destination ('fitness')     │
    │  4. Load user profile from token                 │
    │  5. Call handleLogin(userData)                   │
    │  6. handleLogin() extracts redirect_after_login  │
    │  7. Redirect to saved app ('fitness')            │
    │  8. Clean up URL hash                            │
    └──────────────────────────────────────────────────┘
                         ↓
    ✅ User now at Fitness app
    ✅ Token stored in localStorage
    ✅ Ready to use app


9️⃣  TOKEN IS NOW PERSISTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    User at Fitness app
    Clicks [Back to Switchboard]
                         ↓
    Back at Switchboard (same token still in localStorage)
                         ↓
    User clicks [🥗 Nutrition]
                         ↓
    handleSelectApp('nutrition') checks for token
    ✅ Token found!
                         ↓
    Go DIRECTLY to Nutrition app
    ❌ NO login needed
    ❌ NO Google OAuth needed
                         ↓
    Nutrition app makes API calls with same token:
    Authorization: Bearer eyJ0eXA...
                         ↓
    User can switch between ANY app freely
    Same token works everywhere!


🔟  LOGOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    User clicks [🚪 Logout] button
                         ↓
    handleLogout() in App.js:
    
    localStorage.removeItem('auth_token')
    setUser(null)
    setCurrentView('login')
                         ↓
    ✅ Token removed from localStorage
    ✅ User cleared from state
    ✅ Redirected to login page
                         ↓
    Next time user lands on site:
    No token in localStorage
    Back to square one (steps 1-5)


```

---

## Key Takeaways

### ✅ The Real Authentication Flow:

```
Switchboard (initial) → Click App → Check Token
                                      ├─ Has Token? → Go to App (persistent)
                                      └─ No Token? → Login Page → Google OAuth
                                                     → Get Token → Go to App
```

### 🎯 One Token, All Apps:

```
After first login:
- Token in localStorage
- Can switch apps freely
- Same token used for all
- No re-authentication needed
- Logout clears token
```

### 📍 Where Token is Stored:

```
NEVER in cookies (for now)
ALWAYS in localStorage as 'auth_token'
SENT in Authorization header as 'Bearer {token}'
```

### ⏱️ How Long Does it Last:

```
Token expires in: 30 days (set in server.js:402)
localStorage persists: Until user logs out
Session survives: Page refresh, tab close, browser close
```

### 🔒 What Token Contains:

```
JWT Payload:
{
  id: 'user-uuid',
  email: 'user@example.com',
  displayName: 'John Doe',
  picture: 'https://...',
  role: 'admin' or 'user',         ← Used for admin features
  status: 'active' or 'suspended',  ← Used for access control
  iat: 1703443200,
  exp: 1706121600  ← 30 days
}
```

---

## The Most Important Insight

**There is NO multiple login flows.** 

There is ONE authentication architecture that works like this:

1. User always sees switchboard first (regardless of login status)
2. User selects an app
3. System checks if they have a token
4. If no token → user logs in once via Google
5. Token is saved to localStorage
6. Token persists across all app switches
7. User can navigate between apps freely until logout

That's it. Simple, elegant, persistent.
