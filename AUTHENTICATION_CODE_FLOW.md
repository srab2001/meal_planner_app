# Authentication Flow - Code References & Execution Path

## Complete Code Path - From Initial Load to Authenticated

### Phase 1: Initial Page Load

```
USER VISITS: https://meal-planner-gold-one.vercel.app/
                              ↓
┌─────────────────────────────────────────────────────────┐
│ FILE: client/src/App.js                                 │
│ FUNCTION: App() component                               │
│ FLOW: useEffect hook (line 117)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  useEffect(() => {                                     │
│    // Line 121-128: Check for public routes            │
│    if (window.location.pathname === '/admin') {        │
│      setShowSplash(false);                              │
│      setCurrentView('admin');                           │
│      return;                                            │
│    }                                                    │
│                                                         │
│    // Line 130-136: Check for token in URL hash        │
│    const hash = window.location.hash;                  │
│    if (hash && hash.includes('token=')) {              │
│      const token = hash.split('token=')[1]             │
│        .split('&')[0];                                 │
│      setToken(token);  ← Store in localStorage         │
│      // Extract redirect destination                   │
│      const redirectMatch = hash.match(                 │
│        /redirect=([^&]*)/                              │
│      );                                                 │
│      if (redirectMatch && redirectMatch[1]) {          │
│        const redirect =                                │
│          decodeURIComponent(redirectMatch[1]);         │
│        localStorage.setItem(                           │
│          'redirect_after_login', redirect              │
│        );                                              │
│      }                                                 │
│      window.history.replaceState(null, '',             │
│        window.location.pathname);                      │
│    }                                                    │
│                                                         │
│    // Line 168-213: Check for existing token           │
│    const token = getToken();                           │
│    if (token) {                                        │
│      // Verify token is still valid                    │
│      fetch(`${API_BASE}/auth/user`, {                │
│        headers: {                                      │
│          'Authorization': `Bearer ${token}`            │
│        }                                               │
│      })                                                │
│        .then(res => res.json())                        │
│        .then(data => {                                 │
│          if (data.user) {                              │
│            handleLogin(data.user);  ← Call handler     │
│          } else {                                      │
│            removeToken();                              │
│          }                                             │
│        })                                              │
│        .catch(err => {                                 │
│          console.error('Error checking auth:', err);   │
│          removeToken();                                │
│        });                                             │
│    }                                                    │
│                                                         │
│  }, []);                                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
                              ↓
                    OUTCOME:
        - If token exists → Verify it
        - If verified → Call handleLogin()
        - handleLogin() → Show Switchboard
        - If no token → Show Switchboard (not logged in)
```

---

### Phase 2: Switchboard Display

```
OUTCOME FROM PHASE 1: Show Switchboard
                              ↓
┌──────────────────────────────────────────────────────────┐
│ FILE: client/src/components/AppSwitchboard.js            │
│ FUNCTION: AppSwitchboard component                       │
│ PROPS: user, onSelectApp, onLogout                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ export default function AppSwitchboard({                │
│   onSelectApp, user, onLogout                           │
│ }) {                                                    │
│   const isAdmin = user?.role === 'admin';              │
│   const apps = [                                       │
│     {                                                  │
│       id: 'meal-planner',                              │
│       name: 'Meal Planner',                            │
│       icon: '🍽️',                                       │
│       available: true                                  │
│     },                                                 │
│     {                                                  │
│       id: 'nutrition',                                 │
│       name: 'Nutrition',                               │
│       icon: '🥗',                                       │
│       available: true                                  │
│     },                                                 │
│     {                                                  │
│       id: 'fitness',                                   │
│       name: 'Fitness',                                 │
│       icon: '💪',                                       │
│       available: true                                  │
│     },                                                 │
│     // ... more apps ...                               │
│   ];                                                   │
│                                                          │
│   const handleAppClick = (app) => {                     │
│     if (app.available && onSelectApp) {                │
│       onSelectApp(app.id);  ← Call parent handler      │
│     }                                                  │
│   };                                                   │
│                                                          │
│   return (                                             │
│     <div className="switchboard-container">           │
│       {/* Render header with logout button */}         │
│       {/* Render app tiles */}                         │
│       {apps.map((app) => (                            │
│         <button                                        │
│           onClick={() => handleAppClick(app)}         │
│         >                                              │
│           {app.icon} {app.name}                        │
│         </button>                                      │
│       ))}                                              │
│     </div>                                             │
│   );                                                   │
│ }                                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
                              ↓
      USER CLICKS APP TILE (e.g., "Fitness")
                              ↓
          handleAppClick(app) → onSelectApp(app.id)
                              ↓
          Parent App.js.handleSelectApp() called
```

---

### Phase 3: Check Authentication Status

```
TRIGGER: User clicks app tile in switchboard
                              ↓
┌──────────────────────────────────────────────────────────┐
│ FILE: client/src/App.js                                  │
│ FUNCTION: handleSelectApp()                              │
│ LOCATION: Line 402-471                                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ const handleSelectApp = (appId) => {                    │
│   console.log('Selected app:', appId);                  │
│                                                          │
│   switch (appId) {                                      │
│     case 'meal-planner': {                              │
│       const token = getToken();  ← Check localStorage  │
│       if (token && user) {                              │
│         // User is authenticated                        │
│         setCurrentView('zip');  ← Go to app directly   │
│       } else {                                          │
│         // User needs to log in                         │
│         localStorage.setItem(                           │
│           'redirect_after_login', 'zip'                │
│         );                                              │
│         setCurrentView('login');  ← Go to LoginPage     │
│       }                                                 │
│       break;                                            │
│     }                                                   │
│                                                          │
│     case 'nutrition': {                                 │
│       const nutritionToken = getToken();                │
│       if (nutritionToken && user) {                     │
│         setCurrentView('nutrition');                    │
│       } else {                                          │
│         localStorage.setItem(                           │
│           'redirect_after_login', 'nutrition'           │
│         );                                              │
│         setCurrentView('login');                        │
│       }                                                 │
│       break;                                            │
│     }                                                   │
│                                                          │
│     case 'fitness': {                                   │
│       const fitnessToken = getToken();                  │
│       if (fitnessToken && user) {                       │
│         setCurrentView('fitness');  ← Go to app         │
│       } else {                                          │
│         localStorage.setItem(                           │
│           'redirect_after_login', 'fitness'             │
│         );                                              │
│         setCurrentView('login');  ← Go to LoginPage     │
│       }                                                 │
│       break;                                            │
│     }                                                   │
│                                                          │
│     // ... more apps ...                                │
│                                                          │
│   }                                                     │
│ };                                                      │
│                                                          │
│ // Helper functions (top of file):                      │
│ const getToken = () =>                                  │
│   localStorage.getItem('auth_token');                   │
│                                                          │
│ const setToken = (token) =>                             │
│   localStorage.setItem('auth_token', token);            │
│                                                          │
│ const removeToken = () =>                               │
│   localStorage.removeItem('auth_token');                │
│                                                          │
└──────────────────────────────────────────────────────────┘
                              ↓
                    TWO OUTCOMES:
        ┌────────────────────┬────────────────────┐
        │                    │                    │
        ▼                    ▼                    │
    HAS TOKEN          NO TOKEN                 │
        │                    │                    │
        ▼                    ▼                    │
    Go to app          Go to LoginPage           │
        │                    │                    │
        └────────────────────┴────────────────────┘
```

---

### Phase 4A: With Token - Go Directly to App

```
CONDITION: Token exists in localStorage
                              ↓
    setCurrentView('fitness')  ← Skip login entirely
                              ↓
    React renders FitnessApp component
                              ↓
    FitnessApp makes API calls:
    
    const fetchWithAuth = async (url) => {
      const token = getToken();  ← Retrieve from localStorage
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`  ← Send with request
        }
      });
      return response;
    };
                              ↓
    Backend verifies JWT token in middleware:
    
    FILE: server.js, Line 419-436
    function requireAuth(req, res, next) {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : req.query.token;
      
      if (!token) {
        return res.status(401).json({
          error: 'not_authenticated',
          message: 'No token provided'
        });
      }
      
      const decoded = verifyToken(token);  ← Verify signature
      if (!decoded) {
        return res.status(401).json({
          error: 'invalid_token',
          message: 'Invalid or expired token'
        });
      }
      
      req.user = decoded;  ← Extract user from payload
      next();
    }
                              ↓
    ✅ User authenticated, request processed
    ✅ No login flow needed
    ✅ Token is persistent
```

---

### Phase 4B: No Token - Show LoginPage

```
CONDITION: No token in localStorage
                              ↓
    setCurrentView('login')
                              ↓
    React renders LoginPage component
                              ↓
┌──────────────────────────────────────────────────────────┐
│ FILE: client/src/components/LoginPage.js                 │
│ FUNCTION: LoginPage component                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ function LoginPage() {                                  │
│   const [loginUrl, setLoginUrl] = useState('');        │
│                                                          │
│   useEffect(() => {                                     │
│     // Line 9: Get redirect destination                 │
│     const redirect = localStorage.getItem(              │
│       'redirect_after_login'                             │
│     );                                                   │
│     // ← This was set in handleSelectApp()             │
│                                                          │
│     // Line 10: Build OAuth URL with redirect param    │
│     const state = redirect                              │
│       ? `?redirect=${encodeURIComponent(redirect)}`     │
│       : '';                                             │
│     const url =                                         │
│       `${OAUTH_BASE}/auth/google${state}`;             │
│     // Example URL:                                     │
│     // https://meal-planner-app-mve2.onrender.com/     │
│     // auth/google?redirect=fitness                    │
│                                                          │
│     setLoginUrl(url);                                   │
│   }, []);                                               │
│                                                          │
│   return (                                              │
│     <div>                                               │
│       <h1>Meal planner login</h1>                       │
│       <p>Step 1: start Google login.</p>                │
│       {loginUrl ? (                                     │
│         <a href={loginUrl}>                             │
│           Start Google login                            │
│         </a>                                             │
│       ) : (                                             │
│         <span>Loading...</span>                         │
│       )}                                                │
│     </div>                                              │
│   );                                                    │
│ }                                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
                              ↓
    USER CLICKS [Start Google login]
                              ↓
    Browser navigates to:
    /auth/google?redirect=fitness
                              ↓
    REDIRECTS TO GOOGLE OAUTH SERVER
```

---

### Phase 5: Google OAuth Flow

```
USER CLICKS LOGIN LINK
                              ↓
    Browser redirects to Google OAuth
                              ↓
┌──────────────────────────────────────────────────────────┐
│ FILE: server.js, Line 445-450                            │
│ ROUTE: GET /auth/google                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ app.get(                                                │
│   '/auth/google',                                       │
│   authLimiter,                                          │
│   passport.authenticate('google', {                     │
│     scope: ['profile', 'email']                         │
│   })                                                    │
│ );                                                      │
│                                                          │
│ // Passport redirects to Google OAuth server            │
│ // User logs in at Google                              │
│ // Google redirects back with auth code                │
│                                                          │
└──────────────────────────────────────────────────────────┘
                              ↓
    GOOGLE REDIRECTS BACK TO:
    /auth/google/callback?code={AUTH_CODE}
                              ↓
    BACKEND PROCESSES CALLBACK
```

---

### Phase 6: Backend Processes OAuth Callback

```
GOOGLE REDIRECT: /auth/google/callback?code=...
                              ↓
┌──────────────────────────────────────────────────────────┐
│ FILE: server.js, Line 453-477                            │
│ ROUTE: GET /auth/google/callback                         │
│ MIDDLEWARE: Passport Google Strategy + requireAuth       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ // Passport automatically handles code exchange         │
│ // and calls the GoogleStrategy function                │
│                                                          │
│ passport.use(                                            │
│   new GoogleStrategy(                                   │
│     {                                                   │
│       clientID: GOOGLE_CLIENT_ID,                       │
│       clientSecret: GOOGLE_CLIENT_SECRET,               │
│       callbackURL: GOOGLE_CALLBACK_URL                  │
│     },                                                  │
│     async (accessToken, refreshToken,                  │
│             profile, done) => {                         │
│       try {                                             │
│         const email = profile.emails?.[0]?.value;       │
│                                                          │
│         // Query database for user                      │
│         const userResult = await db.query(              │
│           'SELECT * FROM users WHERE google_id = $1',   │
│           [profile.id]                                  │
│         );                                              │
│                                                          │
│         let user;                                       │
│                                                          │
│         if (userResult.rows.length === 0) {            │
│           // CREATE NEW USER                            │
│           const insertResult = await db.query(`         │
│             INSERT INTO users                           │
│             (google_id, email, display_name,            │
│              picture_url, last_login)                   │
│             VALUES ($1, $2, $3, $4,                     │
│             CURRENT_TIMESTAMP)                          │
│             RETURNING *                                 │
│           `, [profile.id, email,                       │
│               profile.displayName,                      │
│               profile.photos?.[0]?.value]);             │
│           user = insertResult.rows[0];                  │
│           // Default role='user'                        │
│         } else {                                        │
│           // EXISTING USER                              │
│           user = userResult.rows[0];                    │
│           // Has role from database!                    │
│         }                                               │
│                                                          │
│         // Return user object                           │
│         done(null, {                                    │
│           id: user.id,                                  │
│           googleId: user.google_id,                     │
│           email: user.email,                            │
│           displayName: user.display_name,               │
│           picture: user.picture_url,                    │
│           role: user.role,  ← FROM DATABASE             │
│           status: user.status  ← FROM DATABASE          │
│         });                                             │
│       } catch (err) {                                   │
│         done(err);                                      │
│       }                                                 │
│     }                                                   │
│   )                                                     │
│ );                                                      │
│                                                          │
│ // After passport verification, this handler runs:    │
│ app.get(                                                │
│   '/auth/google/callback',                              │
│   authLimiter,                                          │
│   passport.authenticate('google', {                     │
│     failureRedirect: '/login?error=1',                  │
│     session: false  ← NO SESSION, using JWT             │
│   }),                                                   │
│   (req, res) => {                                       │
│     // req.user now contains verified user data        │
│     // from GoogleStrategy above                        │
│                                                          │
│     // GENERATE JWT TOKEN                              │
│     const token = generateToken(req.user);             │
│     // Token includes: id, email, role, status         │
│                                                          │
│     // Get redirect from query param                   │
│     const redirect = req.query.redirect                │
│       ? `&redirect=${encodeURIComponent(                │
│           req.query.redirect                           │
│         )}`                                             │
│       : '';                                             │
│     // ← This was ?redirect=fitness from URL           │
│                                                          │
│     // REDIRECT TO FRONTEND WITH TOKEN                 │
│     const frontend = FRONTEND_BASE ||                  │
│                      'http://localhost:3000';           │
│     res.redirect(                                       │
│       `${frontend}#token=${token}${redirect}`          │
│     );                                                  │
│     // Redirect to:                                    │
│     // https://meal-planner-gold-one.vercel.app/      │
│     // #token=eyJ0eXA...&redirect=fitness             │
│   }                                                     │
│ );                                                      │
│                                                          │
│ // JWT generation function (Line 395-404):             │
│ function generateToken(user) {                          │
│   return jwt.sign(                                      │
│     {                                                   │
│       id: user.id,                                      │
│       email: user.email,                                │
│       googleId: user.googleId,                          │
│       displayName: user.displayName,                    │
│       picture: user.picture,                            │
│       role: user.role || 'user',  ← KEY FIX!          │
│       status: user.status || 'active'  ← KEY FIX!      │
│     },                                                  │
│     JWT_SECRET,                                         │
│     { expiresIn: '30d' }                                │
│   );                                                    │
│ }                                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
                              ↓
    SERVER REDIRECTS BROWSER TO:
    https://meal-planner-gold-one.vercel.app/
    #token=eyJ0eXA...&redirect=fitness
                              ↓
    FRONTEND RECEIVES TOKEN
```

---

### Phase 7: Frontend Receives Token & Stores It

```
BROWSER REDIRECTS TO:
https://meal-planner-gold-one.vercel.app/#token=...&redirect=fitness
                              ↓
    App.js useEffect triggers (line 125)
                              ↓
┌──────────────────────────────────────────────────────────┐
│ FILE: client/src/App.js                                  │
│ LOCATION: useEffect, Line 125-156                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   // Check for token in URL hash                        │
│   const hash = window.location.hash;                    │
│   if (hash && hash.includes('token=')) {                │
│     // Line 130: Extract token                          │
│     const token = hash.split('token=')[1]              │
│       .split('&')[0];                                   │
│     // token = 'eyJ0eXA...'                             │
│                                                          │
│     // Line 131: Store in localStorage                  │
│     setToken(token);  ← localStorage.setItem(           │
│                          'auth_token', token)           │
│                                                          │
│     // Line 134-145: Extract redirect destination       │
│     const redirectMatch = hash.match(                   │
│       /redirect=([^&]*)/                                │
│     );                                                  │
│     if (redirectMatch && redirectMatch[1]) {            │
│       const redirect =                                  │
│         decodeURIComponent(redirectMatch[1]);           │
│       // redirect = 'fitness'                           │
│       localStorage.setItem(                             │
│         'redirect_after_login', redirect                │
│       );                                                │
│     }                                                    │
│                                                          │
│     // Line 147: Clean URL                              │
│     window.history.replaceState(null, '',               │
│       window.location.pathname);                        │
│   }                                                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
                              ↓
    localStorage now contains:
    - 'auth_token': 'eyJ0eXA...'
    - 'redirect_after_login': 'fitness'
                              ↓
    Continue with existing token check (line 168)
    Verify token at /auth/user endpoint
                              ↓
    Call handleLogin(userData)
```

---

### Phase 8: Call handleLogin - Redirect to App

```
TOKEN STORED IN localStorage
                              ↓
    Verify token by calling /auth/user endpoint
                              ↓
┌──────────────────────────────────────────────────────────┐
│ FILE: server.js, Line 480-495                            │
│ ROUTE: GET /auth/user                                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ app.get('/auth/user', (req, res) => {                   │
│   const authHeader = req.headers.authorization;         │
│   const token = authHeader?.startsWith('Bearer ')       │
│     ? authHeader.substring(7)                           │
│     : null;                                             │
│                                                          │
│   if (!token) {                                         │
│     return res.status(401).json({ user: null });        │
│   }                                                     │
│                                                          │
│   const decoded = verifyToken(token);                   │
│   if (!decoded) {                                       │
│     return res.status(401).json({                       │
│       user: null, error: 'invalid_token'                │
│     });                                                 │
│   }                                                     │
│                                                          │
│   res.json({ user: decoded });                          │
│   // Returns: {                                         │
│   //   id, email, displayName, picture,                │
│   //   role: 'user' or 'admin',                        │
│   //   status: 'active'                                │
│   // }                                                  │
│ });                                                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
                              ↓
    Frontend receives verified user data
                              ↓
┌──────────────────────────────────────────────────────────┐
│ FILE: client/src/App.js                                  │
│ FUNCTION: handleLogin()                                  │
│ LOCATION: Line 95-115                                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ const handleLogin = (userData) => {                     │
│   console.log('handleLogin called, user:',              │
│     userData?.email);                                   │
│   setUser(userData);  ← Set React state                │
│                                                          │
│   // Check if redirect was stored                       │
│   const redirectTo = localStorage.getItem(              │
│     'redirect_after_login'                              │
│   );                                                    │
│   // redirectTo = 'fitness'                             │
│                                                          │
│   if (redirectTo) {                                     │
│     console.log('Redirecting to:', redirectTo);        │
│     localStorage.removeItem(                            │
│       'redirect_after_login'  ← Clean up                │
│     );                                                  │
│     setCurrentView(redirectTo);  ← Show app!            │
│     // setCurrentView('fitness')                        │
│   } else {                                              │
│     setShowSplash(false);  ← Hide splash screen         │
│     setCurrentView('switchboard');  ← Default behavior  │
│   }                                                     │
│ };                                                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
                              ↓
    ✅ User now at Fitness app
    ✅ Token in localStorage
    ✅ User data in React state
    ✅ Token will be sent with all API requests
```

---

## Summary: Token Persistence & Reuse

```
AFTER SUCCESSFUL LOGIN:
                              ↓
    localStorage contains 'auth_token'
                              ↓
    User can navigate away from Fitness
    Back to Switchboard
                              ↓
    Click another app (e.g., Nutrition)
                              ↓
    handleSelectApp('nutrition') checks token
    const token = getToken()  ← Found in localStorage!
                              ↓
    Token still valid (hasn't expired)
                              ↓
    Go DIRECTLY to Nutrition app
    ✅ NO login needed
    ✅ NO Google OAuth needed
    ✅ Same token used for all requests
                              ↓
    Token persists until:
    - User clicks Logout button (removeToken())
    - Browser clears localStorage
    - Token expires (30 days)
```

---

## File & Function Reference Map

| Component | File | Function | Lines | Purpose |
|-----------|------|----------|-------|---------|
| App Init | `client/src/App.js` | useEffect | 117-213 | Check token, handle OAuth callback |
| Login Handler | `client/src/App.js` | handleLogin() | 95-115 | Set user state, redirect to app |
| App Selection | `client/src/App.js` | handleSelectApp() | 402-471 | Check token, route to login or app |
| Switchboard | `client/src/components/AppSwitchboard.js` | - | 1-168 | Show app tiles |
| Login Page | `client/src/components/LoginPage.js` | - | 1-43 | Build OAuth link, show login |
| OAuth Route | `server.js` | GET /auth/google | 445-450 | Initiate Google OAuth |
| OAuth Strategy | `server.js` | GoogleStrategy | 315-400 | Validate Google profile, create/find user |
| OAuth Callback | `server.js` | GET /auth/google/callback | 453-477 | Generate JWT, redirect to frontend |
| Token Generation | `server.js` | generateToken() | 395-404 | Create JWT with user data |
| Token Verification | `server.js` | verifyToken() | 407-414 | Decode and validate JWT |
| Auth Middleware | `server.js` | requireAuth() | 419-436 | Check token on API requests |
| User Endpoint | `server.js` | GET /auth/user | 480-495 | Return authenticated user data |

