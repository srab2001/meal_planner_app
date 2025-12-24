# 🗂️ AI Coach Implementation - Code Map & Reference

## Quick Navigation

### OpenAI Initialization
📍 **File:** `server.js`
- **Lines 12:** `const OpenAI = require('openai');`
- **Lines 129:** Load OPENAI_API_KEY from environment
- **Lines 160-163:** Initialize OpenAI client
- **Lines 522-525:** Pass to fitness routes via `app.locals.openai`

### AI Interview Endpoint  
📍 **File:** `fitness/backend/routes/fitness.js`
- **Lines 690-950:** Complete endpoint implementation
  - **Line 696:** `router.post('/ai-interview', requireAuth, ...)`
  - **Lines 700-720:** Input validation
  - **Lines 723-730:** OpenAI client availability check
  - **Lines 733-810:** System prompt construction
  - **Lines 814-830:** OpenAI API call with gpt-3.5-turbo
  - **Lines 833-845:** WORKOUT_JSON parsing from response
  - **Lines 848-885:** Database save with retry logic
  - **Lines 888-905:** Error handling

### Frontend Component
📍 **File:** `fitness/frontend/src/components/AICoach.jsx`
- **Lines 1-35:** Component setup and hooks
- **Lines 20-28:** Fetch interview questions
- **Lines 68-90:** Submit answers and call endpoint
- **Lines 85:** API call with JWT token in Authorization header
- **Lines 95-130:** Display workout plan

### Configuration
📍 **File:** `fitness/frontend/src/config/api.js`
- **Line 56:** `INTERVIEW_QUESTIONS: '/api/fitness/admin/interview-questions'`
- **Line 59:** `AI_WORKOUT_PLAN: '/api/fitness/ai-interview'`

### Authentication
📍 **File:** `server.js`
- **Lines 409-417:** `verifyToken()` function
- **Lines 418-437:** `requireAuth` middleware
- **Line 136:** `JWT_SECRET = SESSION_SECRET`

---

## Complete Implementation Flow

### 1. User Submits Interview Answers
```
AICoach.jsx (line 68-90)
  ↓
fetch(`${API_BASE}/api/fitness/ai-interview`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer <JWT_TOKEN>' },
  body: JSON.stringify(payload)
})
```

### 2. Backend Receives Request
```
server.js (line 525)
  ↓
app.use('/api/fitness', requireAuth, fitnessRoutes)
  ↓
requireAuth middleware (server.js:418-437)
  ↓
verifyToken() validates JWT (server.js:409-417)
```

### 3. Endpoint Processes Request
```
fitness.js (line 696)
  ↓
router.post('/ai-interview', requireAuth, async (req, res) => {
  // Validate input
  // Get OpenAI client
  // Build system prompt
  // Call OpenAI API
})
```

### 4. OpenAI Call
```
fitness.js (line 814-830)
  ↓
await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [...systemPrompt, ...userMessages],
  temperature: 0.7,
  max_tokens: 500
})
```

### 5. Parse Response
```
fitness.js (line 833-845)
  ↓
Extract <WORKOUT_JSON>...</WORKOUT_JSON>
  ↓
JSON.parse(workoutMatch[1])
  ↓
Validate 6-section structure
```

### 6. Save to Database
```
fitness.js (line 848-885)
  ↓
getDb().fitness_workouts.create({
  user_id: userId,
  workout_data: JSON.stringify(workout),
  intensity: workout.summary.intensity_level,
  duration_minutes: parseInt(workout.summary.total_duration),
  calories_burned: workout.summary.calories_burned_estimate,
  difficulty_rating: workout.summary.difficulty_rating,
  workout_date: new Date()
})
  ↓
Retry 3 times with exponential backoff (1s, 2s, 3s)
```

### 7. Return Response
```
fitness.js (line 888-895)
  ↓
res.json({
  message: cleanMessage,
  workoutGenerated: true,
  workout: workout
})
  ↓
AICoach.jsx receives and displays
```

---

## Key Code Snippets

### OpenAI Initialization (server.js:160-163)
```javascript
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});
```

### Make OpenAI Available (server.js:523)
```javascript
app.locals.openai = openai;
```

### OpenAI API Call (fitness.js:814-830)
```javascript
const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: systemPrompt },
    ...messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }))
  ],
  temperature: 0.7,
  max_tokens: 500
});
```

### Extract Workout JSON (fitness.js:833-835)
```javascript
const workoutMatch = aiMessage.match(/<WORKOUT_JSON>([\s\S]*?)<\/WORKOUT_JSON>/);
if (workoutMatch) {
  workout = JSON.parse(workoutMatch[1]);
  workoutGenerated = true;
}
```

### Save with Retries (fitness.js:848-870)
```javascript
let saveAttempts = 0;
const maxAttempts = 3;

while (saveAttempts < maxAttempts && !savedWorkout) {
  try {
    saveAttempts++;
    savedWorkout = await getDb().fitness_workouts.create({
      data: {
        user_id: userId,
        workout_data: JSON.stringify(workout),
        intensity: workout.summary?.intensity_level || 'medium',
        duration_minutes: parseInt(workout.summary?.total_duration) || 60,
        calories_burned: workout.summary?.calories_burned_estimate || 0,
        difficulty_rating: workout.summary?.difficulty_rating || 5,
        workout_date: new Date()
      }
    });
  } catch (dbError) {
    if (saveAttempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000 * saveAttempts));
    }
  }
}
```

### Frontend API Call (AICoach.jsx:85-90)
```javascript
const response = await fetch(`${API_BASE}${ENDPOINTS.AI_WORKOUT_PLAN}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});
```

---

## File Structure Summary

```
meal_planner/
├── server.js                                    [OpenAI initialization]
│   ├── Line 12: require('openai')
│   ├── Line 129: Load OPENAI_API_KEY
│   ├── Line 160-163: Create OpenAI instance
│   ├── Line 523: app.locals.openai = openai
│   └── Line 525: Register fitness routes with requireAuth
│
├── fitness/
│   ├── backend/
│   │   ├── routes/
│   │   │   └── fitness.js                       [AI interview endpoint]
│   │   │       ├── Line 696: router.post('/ai-interview')
│   │   │       ├── Line 814-830: OpenAI API call
│   │   │       ├── Line 833-845: Parse workout JSON
│   │   │       └── Line 848-885: Save to database
│   │   │
│   │   └── prisma/
│   │       ├── schema.prisma                    [Database schema]
│   │       └── migrations/...                   [Database migrations]
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   └── AICoach.jsx                  [React component]
│       │   │       ├── Line 20-28: Fetch questions
│       │   │       └── Line 68-90: Submit answers
│       │   │
│       │   └── config/
│       │       └── api.js                       [API endpoints]
│       │           ├── Line 56: INTERVIEW_QUESTIONS
│       │           └── Line 59: AI_WORKOUT_PLAN
│       │
│       └── .env                                 [Frontend config]
│
├── routes/
│   └── admin.js                                 [Interview questions CRUD]
│
├── migrations/
│   ├── 00X_*_*.sql                             [Schema migrations]
│   └── (includes fitness_workouts table)
│
└── .env                                         [Environment variables]
    ├── OPENAI_API_KEY
    ├── SESSION_SECRET (= JWT_SECRET)
    └── DATABASE_URL
```

---

## Database Schema (fitness_workouts table)

```sql
CREATE TABLE fitness_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  workout_data JSONB NOT NULL,           -- Full 6-section workout
  intensity VARCHAR(20),                 -- 'low', 'medium', 'high'
  duration_minutes INTEGER,              -- Total duration
  calories_burned FLOAT,                 -- Estimated calories
  difficulty_rating FLOAT,               -- 1-10 scale
  workout_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Environment Variables Required

```bash
# In .env (root directory)
OPENAI_API_KEY=sk-svcacct-...
SESSION_SECRET=d8daa69d6b1d...
DATABASE_URL=postgresql://...
FRONTEND_BASE=https://...vercel.app

# In fitness/.env (fitness module directory)
REACT_APP_API_URL=https://...onrender.com
```

---

## Version Information

| Component | Version | Notes |
|-----------|---------|-------|
| OpenAI SDK | Latest | `require('openai')` |
| Model | gpt-3.5-turbo | ChatGPT model |
| Node.js | 18+ | Backend runtime |
| React | 18+ | Frontend framework |
| Prisma | 5+ | ORM for database |
| PostgreSQL | 12+ | Database |

---

## Error Handling Locations

| Error Type | Location | Status Code | Recovery |
|-----------|----------|------------|----------|
| Invalid input | fitness.js:700-720 | 400 | User feedback |
| Missing OpenAI | fitness.js:723-730 | 503 | Check environment |
| Token invalid | server.js:431 | 401 | User re-authentication |
| OpenAI API error | fitness.js:900-905 | 500 | Retry or log |
| Database error | fitness.js:878-884 | Auto-retry | 3 attempts |

---

## Testing Code Locations

```
Root directory:
├── test-ai-coach.js                    [Simple test]
├── test-ai-coach-advanced.js           [Advanced test]
└── AI_COACH_*.md                       [Documentation]
```

---

## Monitoring Points

These locations should be monitored in production:

1. **OpenAI API Calls:**
   - fitness.js:814-830
   - Monitor: Response time, token usage, errors

2. **Database Operations:**
   - fitness.js:848-885  
   - Monitor: Write latency, failed writes, retry frequency

3. **Error Rates:**
   - fitness.js:900-905
   - Monitor: 500 errors, invalid tokens, API failures

4. **Frontend Requests:**
   - AICoach.jsx:85-90
   - Monitor: Request frequency, success rate, latency

---

## Quick Debug Checklist

- [ ] OpenAI API key is set in .env
- [ ] SESSION_SECRET is set in .env
- [ ] OpenAI client is created (server.js:160-163)
- [ ] Client is passed to routes (server.js:523)
- [ ] Endpoint is registered (server.js:525)
- [ ] JWT middleware is working (requireAuth)
- [ ] OpenAI model is gpt-3.5-turbo
- [ ] System prompt is being set correctly
- [ ] Workout JSON is being extracted
- [ ] Database table exists (fitness_workouts)
- [ ] User has valid JWT token

---

## Contact Points for Integration

| Component | File | Line | Integration Point |
|-----------|------|------|-------------------|
| Frontend -> Backend | AICoach.jsx | 85-90 | fetch with JWT |
| Backend -> OpenAI | server.js | 160-163 | initialize client |
| Backend -> Database | fitness.js | 848 | save workout |
| Auth Check | server.js | 418-437 | middleware validation |

---

**Last Updated:** December 23, 2025  
**Status:** ✅ All locations verified and documented
