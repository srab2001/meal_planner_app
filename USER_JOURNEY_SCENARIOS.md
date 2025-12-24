# User Journey Scenarios - Real World Examples

## Scenario 1: Completely New User (First Time)

```
┌─────────────────────────────────────────────────────────────────┐
│ FIRST TIME USER - NO ACCOUNT, NO TOKEN                         │
└─────────────────────────────────────────────────────────────────┘

STEP 1: Visit site
────────────────────
URL: https://meal-planner-gold-one.vercel.app/
App.js useEffect checks localStorage.getItem('auth_token')
Result: null (nothing stored yet)
Action: Continue to next step

┌─────────────────────────────────────────┐
│ SWITCHBOARD DISPLAYED                   │
│                                         │
│ ❌ No "Welcome back" message            │
│ ✅ [🚪 Logout] button NOT visible      │
│ ✅ App tiles are clickable              │
│                                         │
│ [🍽️ Meals]  [🥗 Nutrition]             │
│ [🎯 Coach]   [💪 Fitness]               │
│ [🏆 Progress]                           │
│                                         │
└─────────────────────────────────────────┘

Time elapsed: < 1 second


STEP 2: Click Fitness App
──────────────────────────
User clicks: [💪 Fitness]
handleSelectApp('fitness') called
Check: getToken() → returns null
Decision: No token found → Go to login

localStorage.setItem('redirect_after_login', 'fitness')
setCurrentView('login')

┌─────────────────────────────────────┐
│ LOGIN PAGE SHOWN                    │
│                                     │
│ Meal planner login                  │
│                                     │
│ Step 1: start Google login.         │
│                                     │
│ [Start Google login] ← LINK         │
│                                     │
└─────────────────────────────────────┘

Time elapsed: ~1 second


STEP 3: Click Google Login Link
─────────────────────────────────
User clicks: [Start Google login]
Browser navigates to: /auth/google?redirect=fitness
Server redirects to Google OAuth server

┌──────────────────────────┐
│ GOOGLE LOGIN PAGE        │
│                          │
│ Email: [_____________]   │
│ Password: [___________]  │
│                          │
│ [Sign in]                │
│                          │
└──────────────────────────┘

User enters credentials...


STEP 4: Authenticate with Google
──────────────────────────────────
User clicks [Sign in]
Google verifies credentials
Google shows permission screen:

┌──────────────────────────────────┐
│ ASR Digital wants to access:     │
│                                  │
│ ☑ your Google Profile            │
│ ☑ your email address             │
│                                  │
│ [Allow]  [Don't allow]           │
│                                  │
└──────────────────────────────────┘

User clicks [Allow]
Google sends auth code to backend


STEP 5: Backend Creates Account
────────────────────────────────
Backend receives code at /auth/google/callback
Exchanges code for Google profile
Looks up user in database:
  SELECT * FROM users WHERE google_id = 'google-123'
  Result: No rows (new user)

Creates new account:
  INSERT INTO users (google_id, email, display_name, ...)
  Returns: {
    id: 'uuid-456',
    email: 'newuser@gmail.com',
    display_name: 'New User',
    google_id: 'google-123',
    role: 'user',
    status: 'active'
  }

Generates JWT token:
  {
    id: 'uuid-456',
    email: 'newuser@gmail.com',
    displayName: 'New User',
    role: 'user',
    status: 'active',
    exp: 1706121600  (30 days)
  }

Redirects to:
  https://meal-planner-gold-one.vercel.app/
  #token=eyJ0eXA...&redirect=fitness


STEP 6: Frontend Stores Token
──────────────────────────────
Browser URL: ...#token=eyJ0eXA...&redirect=fitness

App.js useEffect detects hash (line 125)
Extracts token: 'eyJ0eXA...'
Stores in localStorage:
  localStorage.setItem('auth_token', 'eyJ0eXA...')

Extracts redirect: 'fitness'
Stores in localStorage:
  localStorage.setItem('redirect_after_login', 'fitness')

Cleans URL:
  window.history.replaceState(null, '', '/')

Calls handleLogin(userData):
  - Sets user state: { id, email, role: 'user', ... }
  - Checks redirect_after_login: 'fitness'
  - Removes redirect from localStorage
  - Calls setCurrentView('fitness')

┌─────────────────────────────────┐
│ FITNESS APP LOADS               │
│                                 │
│ Welcome, New User!              │
│                                 │
│ Your Profile:                   │
│ Age: [ ]                        │
│ Height: [ ]                     │
│ Weight: [ ]                     │
│                                 │
│ [Save Profile]                  │
│                                 │
└─────────────────────────────────┘

Time elapsed: 15-20 seconds (whole OAuth flow)
Token stored: ✅ Yes
Persistence: ✅ Will persist on reload
Next visit: Will go directly to switchboard


TOTAL JOURNEY TIME: ~20 seconds
ACTIONS TAKEN: 3 clicks + 1 credential entry
TOKENS STORED: 1 (reusable for 30 days)
```

---

## Scenario 2: Returning User (Has Token)

```
┌─────────────────────────────────────────────────────────────────┐
│ RETURNING USER - ALREADY HAS TOKEN IN STORAGE                  │
│ (From previous login, still within 30-day expiry)              │
└─────────────────────────────────────────────────────────────────┘

STEP 1: Visit Site (Fresh Browser Tab or New Session)
───────────────────────────────────────────────────────
URL: https://meal-planner-gold-one.vercel.app/
App.js useEffect runs
Check: localStorage.getItem('auth_token')
Result: 'eyJ0eXA...' (found!)

Verify token by calling /auth/user endpoint
Backend verifies JWT signature
Returns: {
  id: 'uuid-456',
  email: 'user@gmail.com',
  displayName: 'John Doe',
  role: 'admin',
  status: 'active'
}

Call handleLogin(userData)
Set user state
Show switchboard

┌──────────────────────────────────────┐
│ SWITCHBOARD DISPLAYED                │
│                                      │
│ Welcome back, John Doe!              │
│ [🚪 Logout]                          │
│                                      │
│ Choose Your App:                     │
│                                      │
│ [🍽️ Meals]  [🥗 Nutrition]          │
│ [🎯 Coach]   [💪 Fitness]            │
│ [🏆 Progress] [🔐 Admin] ← NEW!     │
│                                      │
└──────────────────────────────────────┘

Time elapsed: 1-2 seconds


STEP 2: Click Different App Than Before
─────────────────────────────────────────
User clicks: [🥗 Nutrition]
handleSelectApp('nutrition') called
Check: getToken() → returns 'eyJ0eXA...'
Check: user exists? → Yes
Decision: Token found AND user exists → Go directly!

setCurrentView('nutrition')
NO login page
NO Google OAuth
NO token generation

┌──────────────────────────────────────┐
│ NUTRITION APP LOADS IMMEDIATELY      │
│                                      │
│ Your Nutrition Dashboard             │
│                                      │
│ Today's calories: 1,850 / 2,000      │
│ Protein: 95g / 150g                  │
│ Carbs: 210g / 225g                   │
│ Fat: 65g / 65g                       │
│                                      │
│ [Log Food] [View History]            │
│                                      │
└──────────────────────────────────────┘

Time elapsed: ~0.5 seconds


STEP 3: Check Network Traffic
──────────────────────────────
When Nutrition app makes API calls:

fetch('/api/nutrition/today', {
  headers: {
    'Authorization': 'Bearer eyJ0eXA...'  ← SAME TOKEN
  }
})

Backend receives request:
- Middleware: requireAuth() function
- Extracts token from Authorization header
- Verifies JWT signature
- Decodes token → req.user = { id, email, role, status, ... }
- Proceeds to handle request

Response:
{
  calories: 1850,
  protein: 95,
  carbs: 210,
  fat: 65,
  // ... nutrition data ...
}

NO re-authentication
NO new token generation
SAME token used


STEP 4: User Wants to Try Fitness
──────────────────────────────────
User clicks [Back to Switchboard]
setCurrentView('switchboard')
Back at switchboard (token still in localStorage)

User clicks: [💪 Fitness]
handleSelectApp('fitness') called
Check: getToken() → returns 'eyJ0eXA...'
Check: user exists? → Yes
Decision: Token found AND user exists → Go directly!

setCurrentView('fitness')
NO login page
NO Google OAuth

┌──────────────────────────────────────┐
│ FITNESS APP LOADS IMMEDIATELY        │
│                                      │
│ Your Fitness Dashboard               │
│                                      │
│ This Week's Workouts: 3              │
│ Total Hours: 7.5                     │
│ Calories Burned: 2,850               │
│                                      │
│ [Log Workout] [View Programs]        │
│                                      │
└──────────────────────────────────────┘

Time elapsed: ~0.5 seconds


STEP 5: Same Token Used for Fitness
────────────────────────────────────
When Fitness app makes API calls:

fetch('/api/fitness/profile', {
  headers: {
    'Authorization': 'Bearer eyJ0eXA...'  ← SAME TOKEN AGAIN
  }
})

Backend processes:
- Middleware verifies JWT (same token)
- Extracts user data: role='admin', status='active'
- Since role='admin' → show admin features!

This is why the JWT fix was important!
Token includes role from database
Fitness module can check req.user.role === 'admin'
Admin features become visible


STEP 6: Admin Can Access Admin Panel
──────────────────────────────────────
User (admin) clicks: [🔐 Admin]
Check: getToken() → 'eyJ0eXA...'
Check: role in token? → 'admin' ✓

setCurrentView('admin')

┌──────────────────────────────────────┐
│ ADMIN PANEL LOADS                    │
│                                      │
│ System Administration                │
│                                      │
│ [Manage Users]                       │
│ [View Subscriptions]                 │
│ [Configure Settings]                 │
│ [AI Coach Questions]                 │
│                                      │
└──────────────────────────────────────┘

All admin features work because:
✓ Token includes role field
✓ Frontend can check user.role
✓ Backend can check req.user.role
✓ Same token used everywhere


STEP 7: Logout
──────────────
User clicks: [🚪 Logout]
handleLogout() function:
  localStorage.removeItem('auth_token')
  setUser(null)
  setCurrentView('login')

┌───────────────────────────────┐
│ LOGGED OUT                    │
│                               │
│ [Start Google login]          │
│                               │
│ Redirect button appears       │
│ User must authenticate again  │
│                               │
└───────────────────────────────┘

localStorage is now empty:
- 'auth_token' → deleted
- Next visit → will need to login again


TOTAL JOURNEY TIME: 
  - Initial load: 1-2 seconds
  - App switches: 0.5 seconds each
  - NO authentication needed
  - Token reused for all 5 actions
```

---

## Scenario 3: Admin User with Role-Based Features

```
┌──────────────────────────────────────────────────────────┐
│ ADMIN USER - DIFFERENT PERMISSIONS & VISIBILITY         │
└──────────────────────────────────────────────────────────┘

SETUP: User role='admin' in database
token includes: role: 'admin'


STEP 1: Login (Same as Any User)
─────────────────────────────────
Google OAuth flow (same as scenario 1-2)
Backend database lookup finds:
  SELECT * FROM users WHERE google_id = 'google-789'
  Result: {
    id: 'uuid-789',
    email: 'admin@example.com',
    role: 'admin'  ← KEY DIFFERENCE
  }

JWT token generated:
  {
    id: 'uuid-789',
    email: 'admin@example.com',
    role: 'admin'  ← Included in token
    status: 'active',
    ...
  }


STEP 2: Switchboard Shows Admin Panel
──────────────────────────────────────
Check: user?.role === 'admin'
Result: true
Show admin tile!

┌──────────────────────────────────────┐
│ SWITCHBOARD (ADMIN VIEW)             │
│                                      │
│ Welcome back, Admin User!            │
│ [🚪 Logout]                          │
│                                      │
│ [🍽️ Meals]  [🥗 Nutrition]          │
│ [🎯 Coach]   [💪 Fitness]            │
│ [🏆 Progress]                        │
│ [🔐 Admin] ← VISIBLE ONLY FOR ADMINS│
│                                      │
│ Admin Features:                      │
│ ├─ User Management                   │
│ ├─ AI Coach Questions                │
│ ├─ System Settings                   │
│ └─ Reports & Analytics               │
│                                      │
└──────────────────────────────────────┘


STEP 3: Access Fitness Admin Features
──────────────────────────────────────
User clicks: [💪 Fitness]
Fitness app loads
Makes API call:
  GET /api/fitness/admin/interview-questions
  Headers: { 'Authorization': 'Bearer {token}' }

Backend middleware (requireAuth):
  Verifies JWT
  Sets req.user = { role: 'admin', ... }

Route handler (fitness/routes/fitness.js):
  if (req.user.role === 'admin') {
    // Show special admin form
    // Allow question editing
    // Show view counts
  }

┌──────────────────────────────────────┐
│ FITNESS ADMIN FEATURES VISIBLE       │
│                                      │
│ Interview Questions                  │
│ ┌────────────────────────────────┐  │
│ │ Q: What's your fitness goal?   │  │
│ │ Views: 1,234  Avg Response: 8/10
│ │ [Edit] [Delete] [View Stats]    │  │
│ └────────────────────────────────┘  │
│ ┌────────────────────────────────┐  │
│ │ Q: How many days per week?     │  │
│ │ Views: 987  Avg Response: 7/10 │  │
│ │ [Edit] [Delete] [View Stats]    │  │
│ └────────────────────────────────┘  │
│                                      │
│ [+ Add Question]                     │
│                                      │
└──────────────────────────────────────┘


STEP 4: Access Admin Panel
───────────────────────────
User clicks: [🔐 Admin]
Admin module loads
Makes API calls with token

┌──────────────────────────────────────┐
│ ADMIN PANEL                          │
│                                      │
│ [Manage Users]                       │
│   Count: 1,234 users                │
│   New this week: 23                 │
│   [View All]                         │
│                                      │
│ [View Subscriptions]                 │
│   Free: 890                          │
│   Premium: 344                       │
│   [Manage Plans]                     │
│                                      │
│ [System Settings]                    │
│   Feature Flags                      │
│   Rate Limits                        │
│   Analytics                          │
│                                      │
│ [AI Coach Config]                    │
│   Questions Editor                   │
│   Response Analysis                  │
│   Model Selection                    │
│                                      │
└──────────────────────────────────────┘


KEY ADMIN ABILITIES:
✓ Manage user accounts (role, status, permissions)
✓ Edit AI Coach questions across fitness module
✓ View analytics and usage stats
✓ Configure system settings
✓ Access all user data (with care)
✓ Manage subscriptions & payments
✓ View & delete inappropriate content


ALL POWERED BY: role field in JWT token


PERMISSION FLOW:
  Meal Planner: Checks req.session.user.role
  Fitness: Checks req.user.role (from JWT)
  Admin: Checks user?.role === 'admin' (frontend)
  
  All three check the SAME role value
  All use the SAME token
```

---

## Key Learnings From These Scenarios

### ✅ What Happens:

1. **Initial load:** Always shows switchboard (auth status doesn't matter)
2. **App selection:** Checks for token, then decides login or direct access
3. **Token persistence:** Stored in localStorage, lasts 30 days
4. **Multi-app usage:** Same token used for all apps
5. **Permission checking:** Role field in token enables feature visibility
6. **Seamless switching:** Users can jump between apps without re-auth

### 🎯 Why This Design:

- **Simple UX:** No confusing login flows, just click an app
- **Efficient:** Don't force login until user wants to use an app
- **Persistent:** Token stays in localStorage across sessions
- **Scalable:** Token works for all current and future apps
- **Secure:** JWT includes role/status from database
- **Flexible:** Permissions can change by updating user's role in DB

### 🔑 The Most Important Insight:

The authentication isn't global—it's per-app-selection. The token just makes it persistent.

User sees switchboard → clicks app → system checks for token → if no token, show login → after login, use that token for everything.
