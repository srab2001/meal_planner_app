# Visual Architecture Diagrams

## Database Architecture

### Current (Actual) Setup
```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│              https://meal-planner-gold-one.vercel.app       │
└──────────────────────────┬──────────────────────────────────┘
                           │ (HTTP/HTTPS)
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        v                                     v
┌──────────────────────┐            ┌─────────────────────────┐
│   Main App Endpoints │            │  Fitness App Endpoints  │
│  (server.js)         │            │ (fitness/routes.js)     │
│                      │            │                         │
│  /auth/google        │            │  /api/fitness/*         │
│  /api/profile        │            │  /api/fitness/ai-...    │
│  /api/meals          │            │                         │
│  /api/admin/*        │            │                         │
└──────────────┬───────┘            └──────────┬──────────────┘
               │                               │
               └───────────────┬───────────────┘
                               │
                               v
                  ┌────────────────────────┐
                  │  Render PostgreSQL DB  │
                  │                        │
                  │  (DATABASE_URL)        │
                  │                        │
                  │  Tables:               │
                  │  • users               │
                  │  • fitness_profiles    │
                  │  • fitness_workouts    │
                  │  • fitness_goals       │
                  │  • meal_plans          │
                  │  • favorites           │
                  │  • admin_questions     │
                  │  • ... and more        │
                  └────────────────────────┘
                  
                  
┌────────────────────────┐         ↯ NOT USED
│   Neon PostgreSQL DB   │         ↯ (Configured but never queried)
│                        │
│   (Unused)             │
│                        │
│   Duplicate tables     │
│   (if migrated there)  │
└────────────────────────┘
```

### Result
✅ **One database, both apps use same data**
✅ **No conflicts or sync issues**
❌ **Neon is wasted setup**
❌ **JWT token missing fields**

---

## Authentication & Token Flow

### Step 1: Google Login
```
User Browser                    Backend Server              Google OAuth
     │                              │                           │
     ├─ Click "Login with Google" ──>                            │
     │                              │                            │
     │                              ├─ Redirect to Google ──────>│
     │                              │                            │
     │<─ Redirect back to callback ─┤<─ Authenticated ──────────┤
     │   with OAuth code            │                            │
```

### Step 2: JWT Token Generation (Current - ❌ BROKEN)

```
Backend Server
│
├─ Google Strategy (line 316-390)
│  │
│  ├─ Lookup user in database:
│  │  SELECT id, email, role, status FROM users WHERE google_id = ?
│  │
│  └─ User found with:
│     {
│       id: "uuid-123",
│       email: "admin@example.com",
│       role: "admin",        ← In database
│       status: "active"      ← In database
│     }
│
├─ generateToken() (line 396-404)
│  │
│  └─ Create JWT with:
│     {
│       id: "uuid-123",
│       email: "admin@example.com",
│       googleId: "google-id",
│       displayName: "Admin User",
│       picture: "https://...",
│       // ❌ role NOT included
│       // ❌ status NOT included
│     }
│
├─ Send token to frontend
│  (in URL hash: #token=eyJ...)
│
└─ Frontend stores in localStorage
   (key: "auth_token")
```

### The Problem
```
Database says:        JWT Token says:         Fitness App sees:
role: "admin"    ≠    role: undefined    ⟹   user.role = undefined
status: "active" ≠    status: undefined  ⟹   user.status = undefined
```

---

## How Different Modules Use User Data

### Main App (server.js)
```
req.session.user (from database)
│
├─ ID ✅
├─ Email ✅
├─ Display Name ✅
├─ Picture ✅
├─ Role ✅ ← From session/database
└─ Status ✅ ← From session/database

Admin check:
if (req.session.user.role === 'admin') → ✅ Works
```

### Fitness App (fitness.js)
```
req.user (from JWT token)
│
├─ ID ✅
├─ Email ✅
├─ googleId ✅
├─ displayName ✅
├─ picture ✅
├─ role ❌ ← Missing from token
└─ status ❌ ← Missing from token

Admin check:
if (req.user.role === 'admin') → ❌ Fails (undefined)
```

### AI Coach Endpoint (fitness.js:696)
```
POST /api/fitness/ai-interview
│
├─ Authentication: req.user from JWT ✅
│  (has id, email, etc.)
│
├─ Authorization: If checks req.user.role ❌
│  (role field is missing)
│
├─ OpenAI Client: ✅
│  (available via req.app.locals.openai)
│
└─ Database: ✅
   (uses same DATABASE_URL as main app)
```

---

## User Journey With Different Roles

### Regular User Flow (Works)
```
┌─ Google Login
│  ├─ Database: role = 'user', status = 'active'
│  ├─ JWT: (without role, status)
│  ├─ Main App: session.role = 'user' ✅
│  └─ Fitness App: user.role = undefined ⚠️
│
├─ Can generate meals? Yes ✅
├─ Can use fitness? Yes (basic) ✅
├─ Can use AI coach? Yes ✅ (if no permission check)
└─ Can access admin? No ✅
```

### Admin User Flow (Partially Works)
```
┌─ Google Login
│  ├─ Database: role = 'admin', status = 'active'
│  ├─ JWT: (without role, status) ❌
│  ├─ Main App: session.role = 'admin' ✅
│  └─ Fitness App: user.role = undefined ❌
│
├─ Can generate meals? Yes ✅
├─ Can use fitness? Yes ✅
├─ Can use AI coach? Yes ✅ (if no permission check)
├─ Can access admin panel? Yes ✅ (in main app)
├─ Can access fitness admin? No ❌ (role missing)
└─ Can see admin button in fitness? No ❌ (role missing)
```

### After Fix - Admin User Flow (Works Completely)
```
┌─ Google Login
│  ├─ Database: role = 'admin', status = 'active'
│  ├─ JWT: role = 'admin', status = 'active' ✅
│  ├─ Main App: session.role = 'admin' ✅
│  └─ Fitness App: user.role = 'admin' ✅
│
├─ Can generate meals? Yes ✅
├─ Can use fitness? Yes ✅
├─ Can use AI coach? Yes ✅
├─ Can access admin panel? Yes ✅
├─ Can access fitness admin? Yes ✅
├─ Can see admin button in fitness? Yes ✅
└─ All features work? Yes ✅
```

---

## Database Connection String Usage

### What Gets Used Where

```
Environment Variable: DATABASE_URL
Value: postgresql://user:pass@render.host:5432/dbname

Used by:
├─ server.js (line 43)
│  └─ Main app database (db.js)
│
├─ server.js (migrations, lines 38-100)
│  └─ Runs migrations on startup
│
├─ fitness/backend/routes/fitness.js (line 44)
│  └─ Fitness module database (Prisma)
│
└─ All routes that need DB access
   └─ Both main and fitness routes
```

### What Gets Ignored

```
Neon Environment Variable: (if set)
Value: postgresql://neon.user@neon.host/dbname

Used by: NOBODY ↯

Should be: Removed from environment or documented as unused
```

---

## Token Issue Timeline

```
Timeline of a User Session:

1. User clicks "Login with Google"
   └─ Browser → https://backend.com/auth/google

2. Google OAuth flow completes
   └─ Browser receives: #token=eyJ0eXAiOiJKV1...

3. Frontend extracts token from URL
   ├─ Code: const token = new URLSearchParams(window.location.hash).get('token')
   └─ Stores in localStorage.setItem('auth_token', token)

4. Frontend makes API requests
   ├─ To main app: Uses session (from server-side)
   └─ To fitness app: Uses token from localStorage

5. Main App (server.js endpoints)
   ├─ Has access to: req.session (from database, has role)
   └─ Admin check: Works ✅

6. Fitness App (fitness.js endpoints)
   ├─ Verifies: req.headers.authorization Bearer token
   ├─ Decodes JWT: req.user = { id, email, googleId, displayName, picture }
   └─ Missing: role, status ❌

7. Any permission check in fitness module
   ├─ if (req.user.role === 'admin'): Fails
   └─ Reason: role = undefined
```

---

## Fix Impact Diagram

### Before Fix
```
Database User                JWT Token              Fitness Routes
┌──────────────────┐        ┌──────────────┐       ┌─────────────────┐
│ id: 123          │   x    │ id: 123      │       │ req.user:       │
│ email: admin@... │   │    │ email: a@... │  ──>  │ {               │
│ role: admin ───┐ │   │    │ role: (none) │       │   id: 123 ✅    │
│ status: active │ │   │    │ status: none │       │   email: ✅     │
└──────────────────┘   └────└──────────────┘       │   role: ❌      │
                        MISSING FIELDS             │   status: ❌    │
                                                   │ }               │
Sync broken ↓                                      └─────────────────┘
Admin can't do admin things in fitness!
```

### After Fix
```
Database User                JWT Token              Fitness Routes
┌──────────────────┐        ┌──────────────┐       ┌─────────────────┐
│ id: 123          │   ✓    │ id: 123      │       │ req.user:       │
│ email: admin@... │   │    │ email: a@... │  ──>  │ {               │
│ role: admin ───┐ │   │    │ role: admin ─┼────┐  │   id: 123 ✅    │
│ status: active │ └───┼────│ status: act. │  │    │   email: ✅     │
└──────────────────┘   │    └──────────────┘  │    │   role: admin ✅│
                        COMPLETE!             │    │   status: ✅    │
                                              └───>│ }               │
Sync fixed ↓                                       └─────────────────┘
Admin can do admin things in fitness!
```

---

## Summary of Issues & Fixes

| Component | Status | Issue | Fix |
|-----------|--------|-------|-----|
| **Render DB** | ✅ Working | None | Keep as-is |
| **Neon DB** | ❌ Unused | Wasted setup | Delete or ignore |
| **DB Conflict** | ✅ None | Both use same DB | No action needed |
| **Main App** | ✅ Working | Accesses session | No change needed |
| **Fitness App** | ⚠️ Partial | Uses JWT token | Change authentication |
| **JWT Token** | ❌ Incomplete | Missing role/status | **Add fields to generateToken()** |
| **AI Coach** | ❌ May fail | Token missing fields | Will work after JWT fix |
| **Admin button** | ❌ Hidden | Can't see user.role | Will show after JWT fix |

---

## Decision Tree: What Should You Do?

```
Q: Are admin users seeing the admin button in fitness?
│
├─ YES: Don't need this fix, you're good!
│
└─ NO: Follow this flowchart
   │
   ├─ Q: Are you using Neon database?
   │  ├─ YES: Stop using it, stick with Render
   │  └─ NO: Good, skip that
   │
   ├─ Q: Are both apps using DATABASE_URL?
   │  ├─ YES: Good, no conflict possible
   │  └─ NO: You have bigger issues
   │
   └─ Action: Update generateToken() in server.js
      ├─ Add: role: user.role || 'user'
      ├─ Add: status: user.status || 'active'
      ├─ Restart server
      ├─ Clear browser storage
      ├─ Log back in
      └─ Test admin features
```

---

This architecture is fundamentally sound. The issue is purely in the JWT token generation,
which is a 2-line fix. After that, everything should work as intended!
