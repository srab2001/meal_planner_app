# Technical Reference - Architecture & Implementation

## System Architecture

```
┌─────────────────────────────────┐
│  Frontend (Vercel)              │
│  React + 6 Modules              │
│  meal-planner-gold-one.vercel.app
└────────────┬────────────────────┘
             │ HTTPS (CORS)
             ▼
┌─────────────────────────────────┐
│  Backend (Render)               │
│  Express.js + OpenAI            │
│  meal-planner-app-mve2.onrender │
└────────┬──────────┬─────────────┘
         │          │
         ▼          ▼
    PostgreSQL   OAuth/OpenAI
    (Internal)   (External)
```

## OAuth Flow (Fixed)

```
1. App.js → handleSelectApp('meal-planner')
   └─ localStorage.setItem('redirect_after_login', 'zip')
   └─ setCurrentView('login')

2. LoginPage.js → Builds OAuth URL with redirect
   └─ `${OAUTH_BASE}/auth/google?redirect=${encodeURIComponent('zip')}`
   └─ User clicks link

3. Render Backend → Google OAuth
   └─ Google authenticates user
   └─ Callback to /auth/google/callback
   
4. server.js → generateToken()
   └─ Extract redirect from query: req.query.redirect
   └─ Redirect to frontend with token AND redirect
   └─ `${frontend}#token=${token}&redirect=${redirect}`

5. App.js → useEffect processes hash
   └─ Extract token from hash
   └─ Extract redirect from hash
   └─ localStorage.setItem('redirect_after_login', redirect)
   └─ Call fetch /auth/user

6. App.js → handleLogin() called
   └─ Read localStorage.getItem('redirect_after_login')
   └─ setCurrentView(redirectTo)
   └─ User now in selected app ✅
```

## AI Coach Flow

```
1. User clicks 🤖 AI Coach button
   └─ setShowAIInterview(true)

2. AIWorkoutInterview component mounts
   └─ startInterview() → sends first AI message

3. User types response
   └─ handleSendMessage()
   └─ POST /api/fitness/ai-interview
   └─ body: { messages: [], userProfile: user }

4. Backend processes request
   └─ requireAuth middleware verifies JWT
   └─ getDb() initializes Prisma client
   └─ openai = req.app.locals.openai
   └─ openai.chat.completions.create()
   
5. OpenAI generates response
   └─ System prompt guides workout generation
   └─ Response may include <WORKOUT_JSON>...</WORKOUT_JSON>
   └─ If included: workout generated ✅

6. If workout generated
   └─ Parse JSON from response
   └─ getDb().fitness_workouts.create()
   └─ Return { message, workoutGenerated: true, workout }

7. Frontend receives response
   └─ If workoutGenerated: call onWorkoutGenerated(workout)
   └─ Close modal
   └─ Redirect to dashboard

8. Workout appears in Fitness log ✅
```

## Database Schema (Key Tables)

### fitness_profiles
```
id: UUID primary key
user_id: UUID (references auth_users)
height_cm: DECIMAL
weight_kg: DECIMAL
age: INTEGER
gender: VARCHAR
activity_level: VARCHAR
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### fitness_workouts
```
id: UUID primary key
user_id: UUID (references auth_users)
exercise_type: VARCHAR
duration_minutes: INTEGER
calories_burned: INTEGER
intensity: VARCHAR (low|medium|high)
notes: TEXT
workout_date: TIMESTAMP
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### fitness_goals
```
id: UUID primary key
user_id: UUID (references auth_users)
goal_type: VARCHAR
target_value: DECIMAL
target_date: TIMESTAMP
status: VARCHAR
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/user` - Verify token and get user

### Fitness Endpoints
- `GET /api/fitness/profile` - Get user profile
- `POST /api/fitness/profile` - Create/update profile
- `GET /api/fitness/workouts` - List workouts
- `POST /api/fitness/workouts` - Create workout
- `GET /api/fitness/goals` - List goals
- `POST /api/fitness/goals` - Create goal
- `POST /api/fitness/ai-interview` - AI conversation

## Key Code Locations

### OAuth & Auth
- `server.js:157-160` - OpenAI initialization
- `server.js:158-195` - CORS configuration
- `server.js:517-518` - Mount fitness routes with OpenAI
- `server.js:420-450` - OAuth callback handler
- `App.js:82-100` - handleLogin function
- `App.js:115-145` - OAuth hash parsing
- `LoginPage.js:14-30` - Dynamic OAuth URL building

### Fitness Module
- `FitnessApp.js:1-190` - Main fitness component
- `FitnessDashboard.js:1-410` - Dashboard with AI button
- `AIWorkoutInterview.js:1-150` - AI interview modal
- `fitness/backend/routes/fitness.js:625-750` - AI interview endpoint

### Database
- `server.js:25-100` - Migration runner
- `migrations/` - SQL migration files
- `fitness/backend/routes/fitness.js:25-45` - Lazy Prisma initialization

## Error Handling Patterns

### Try-Catch Pattern
```javascript
try {
  // Attempt operation
} catch (error) {
  console.error('[Component] Error:', error);
  console.error('[Component] Details:', {
    message: error.message,
    status: error.status,
    code: error.code
  });
  
  // Return user-friendly error
  res.status(500).json({
    error: 'error_code',
    message: 'User-friendly message',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

### Fallback Pattern (OAuth)
```javascript
// If verification fails but we have redirect
if (redirect) {
  console.log('Fallback: Using stored redirect');
  setCurrentView(redirect);
} else {
  removeToken();
  setCurrentView('login');
}
```

### Lazy Initialization Pattern
```javascript
let client = null;

function getClient() {
  if (!client) {
    const config = process.env.CONFIG_URL;
    if (!config) throw new Error('CONFIG_URL not set');
    client = new Client(config);
  }
  return client;
}

// Usage: client = getClient();
```

## Configuration Files

### .env (Render Backend)
```
DATABASE_URL=postgresql://...
FRONTEND_BASE=https://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OPENAI_API_KEY=...
SESSION_SECRET=...
```

### Vercel Environment
```
REACT_APP_API_URL=https://...
REACT_APP_OAUTH_URL=https://...
```

### CORS Whitelist (server.js:158-195)
- Current production: `meal-planner-gold-one.vercel.app`
- Wildcard for previews: `*.vercel.app`
- Local development: `localhost:3000`

## Performance Considerations

### Database
- Connection pooling via pgPool
- Lazy Prisma initialization reduces startup time
- Indexed queries on user_id for fast lookups
- Internal Render database for lower latency

### Frontend
- React lazy loading for modules
- localStorage for token caching
- Fallback redirects prevent blank pages
- CSS animations use GPU (will-change, transform)

### Backend
- Rate limiting prevents API abuse
- OpenAI calls cached in conversation history
- Workout creation transactional (atomic)
- JWT tokens verified on every request

## Logging Strategy

### Frontend Console
- `App.js` logs: OAuth flow, auth verification, redirects
- `AIWorkoutInterview.js` logs: API calls, responses
- Format: `[Component] Message` for easy filtering

### Backend Logs (Render)
- `server.js` logs: Startup, migrations, OAuth
- `fitness.js` logs: Every AI interview step
- Format: `[Module] Level - Message` for organization
- Include error details in development mode only

## Security Measures

- **Authentication**: JWT tokens with SESSION_SECRET
- **Authorization**: requireAuth middleware on all fitness routes
- **CORS**: Whitelist specific origins, block unknown domains
- **Rate Limiting**: 
  - General: 100 req/15min
  - Auth: 20 req/15min
  - AI: 30 req/15min
- **HTTPS**: All connections encrypted
- **SQL**: Prisma ORM prevents SQL injection
- **Environment**: Secrets in environment variables, not code

---

**Last Updated:** December 22, 2025
