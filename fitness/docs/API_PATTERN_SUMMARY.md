# 📊 API Pattern Analysis - Summary Report

## Analysis Scope

**Source:** `server.js` (3,862 lines of production Express.js code)  
**Duration:** Comprehensive review of established patterns  
**Output:** 2 new reference documents created  

---

## Key Discoveries

### 1️⃣ Authentication Architecture
```
JWT Token Flow:
┌─────────────────────────────────────┐
│ Client Sends Authorization Header   │
│ Authorization: Bearer <token>       │
└──────────┬──────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ requireAuth() Middleware             │
│ - Extract token from header or query │
│ - Verify token signature             │
│ - Decode user info                   │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ req.user = {                         │
│   id: "uuid",                        │
│   email: "user@email.com",           │
│   full_name: "Name",                 │
│   picture: "https://..."             │
│ }                                    │
└──────────────────────────────────────┘
```

### 2️⃣ User Data Scoping Pattern
```javascript
// Every query includes: WHERE user_id = $N

SELECT:   WHERE user_id = $1
INSERT:   VALUES (..., $1, ...) with $1 = req.user.id
UPDATE:   WHERE id = $1 AND user_id = $2
DELETE:   WHERE id = $1 AND user_id = $2

✅ Prevents cross-user data access
✅ Ensures audit trail (user_id in all tables)
```

### 3️⃣ Error Handling Standard
```
HTTP Status Codes:
├─ 400: Input validation failed
├─ 401: Missing/invalid token
├─ 404: Resource not found
├─ 429: Rate limit exceeded
└─ 500: Server error

Response Format:
{
  "error": "Short title",
  "details": "error.message"
}
```

### 4️⃣ Rate Limiting Tiers
```
┌─────────────────────────────────────┐
│ General Rate Limiter                │
│ 100 requests per 15 minutes         │
│ Applied globally to all routes      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Auth Rate Limiter                   │
│ 20 attempts per 15 minutes          │
│ /auth/google, /auth/google/callback │
│ skipSuccessfulRequests: true        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ AI Rate Limiter                     │
│ 30 requests per 15 minutes          │
│ /api/generate-meals (OpenAI calls)  │
│ /api/regenerate-meal                │
│ /api/custom-item-prices             │
└─────────────────────────────────────┘
```

### 5️⃣ Logging Standards
```
Success:  ✅ ❤️  💾 💳 📊 📝 🎲 📋 📅
Error:    ❌ ❌ [CONTEXT] Error message
Audit:    Always include req.user.email
Debug:    Include full error object
```

---

## 6 Route Patterns Found

### Pattern 1: Simple GET (No DB)
```javascript
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email, ... });
});
```
**Usage:** `/api/auth/user`

### Pattern 2: GET List (User-Scoped)
```javascript
app.get('/api/endpoint', requireAuth, async (req, res) => {
  const result = await db.query(`
    SELECT * FROM table WHERE user_id = $1
  `, [req.user.id]);
  res.json({ items: result.rows });
});
```
**Usage:** `/api/favorites`, `/api/meal-plan-history`

### Pattern 3: POST Create (with Validation)
```javascript
app.post('/api/endpoint', requireAuth, async (req, res) => {
  const { field } = req.body;
  if (!field) return res.status(400).json({ error: '...' });
  
  const result = await db.query(`
    INSERT INTO table (user_id, field) VALUES ($1, $2)
  `, [req.user.id, field]);
  res.json({ success: true, resource: result.rows[0] });
});
```
**Usage:** `/api/favorites/add`, `/api/save-meal-plan`

### Pattern 4: POST Upsert (Insert or Update)
```javascript
app.post('/api/endpoint', requireAuth, async (req, res) => {
  const result = await db.query(`
    INSERT INTO table (user_id, field1, field2)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, field1)
    DO UPDATE SET field2 = EXCLUDED.field2
    RETURNING *
  `, [req.user.id, ...]);
  res.json({ success: true });
});
```
**Usage:** `/api/shopping-list-state`

### Pattern 5: DELETE User-Scoped
```javascript
app.delete('/api/endpoint/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await db.query(`
    DELETE FROM table WHERE id = $1 AND user_id = $2
  `, [id, req.user.id]);  // ← ALWAYS check user_id
  res.json({ success: true });
});
```
**Usage:** `/api/favorites/:id`

### Pattern 6: POST with Rate Limiting (Expensive)
```javascript
app.post('/api/expensive', aiLimiter, requireAuth, async (req, res) => {
  const result = await expensiveOperation();
  // Track usage
  await db.query(`
    INSERT INTO usage_stats VALUES ($1, ...)
  `, [req.user.id, ...]);
  res.json(result);
});
```
**Usage:** `/api/generate-meals`, `/api/regenerate-meal`

---

## Security Principles Enforced

### 🔒 Principle 1: Never Trust User Input IDs
```
❌ DON'T:  app.get('/api/users/:id', (req, res) => {
             db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
           });

✅ DO:     app.get('/api/profile', requireAuth, (req, res) => {
             res.json(req.user);  // Use authenticated user
           });
```

### 🔒 Principle 2: Always Verify Authorization
```
❌ DON'T:  DELETE FROM favorites WHERE id = $1
✅ DO:     DELETE FROM favorites WHERE id = $1 AND user_id = $2
```

### 🔒 Principle 3: Parameterized Queries Only
```
❌ DON'T:  query = `SELECT * WHERE id = ${userId}`;
✅ DO:     query(`SELECT * WHERE id = $1`, [userId]);
```

### 🔒 Principle 4: Validate All Input
```
✅ Check field exists
✅ Check field type
✅ Check field range/values
✅ Return 400 if invalid
```

### 🔒 Principle 5: Rate Limit Expensive Operations
```
✅ AI endpoints: 30 per 15 min
✅ Auth endpoints: 20 per 15 min
✅ General: 100 per 15 min
```

---

## Middleware Execution Order

```
Request arrives at Express
        ↓
Rate Limiter (most restrictive)
        ↓
Authentication (requireAuth)
        ↓
Route Handler
        ↓
Database Query
        ↓
Response
```

**Why This Order?**
- Rate limit first = reject bad actors early
- Auth second = verify identity
- Handler last = only reach business logic after checks

---

## Response Format Summary

| Use Case | Format |
|----------|--------|
| Simple success | `{ success: true }` |
| Return resource | `{ success: true, resource: {...} }` |
| Return list | `{ resources: [...] }` |
| Status check | `{ hasPaidAccess: true }` |
| Complex response | `{ total, items, pagination, summary }` |

---

## Database Patterns

### Pattern: Parameterized Queries
```javascript
// Use $1, $2, $3, etc. for parameters
db.query('SELECT * FROM table WHERE user_id = $1 AND id = $2', [userId, itemId]);
```

### Pattern: ON CONFLICT (Upsert)
```javascript
INSERT INTO table (...) VALUES (...) 
ON CONFLICT (unique_field) 
DO UPDATE SET field = EXCLUDED.field
```

### Pattern: RETURNING Clause
```javascript
INSERT INTO ... RETURNING *  // Get the inserted row
UPDATE ... RETURNING *       // Get the updated row
```

---

## Logging Best Practices

```javascript
// Success Operations
console.log(`❤️  ${req.user.email} saved favorite: ${name}`);
console.log(`💾 ${req.user.email} saved shopping list state`);
console.log(`✅ Token verified for user: ${email}`);

// Errors
console.error('[POST /api/route] Error message:', error.message);
console.error('[POST /api/route] User ID:', req.user?.id);

// Data Operations
console.log(`📊 Usage tracked for ${req.user.email}`);
console.log(`🔍 Validating shopping list...'`);
console.log(`🎲 Randomly selected: ${choice}`);
```

---

## Files Created

### 📄 EXPRESS_API_PATTERNS_REVIEW.md
- 10 detailed sections
- 6 route pattern examples
- Security checklist
- Middleware chain order
- Database patterns
- Request/response examples

**Location:** `fitness/docs/EXPRESS_API_PATTERNS_REVIEW.md`

### 📄 API_PATTERN_ANALYSIS_COMPLETE.md
- Executive summary
- 5 key findings
- 5 complete code examples
- Security best practices
- Pattern checklist
- Next steps

**Location:** `fitness/docs/API_PATTERN_ANALYSIS_COMPLETE.md`

---

## Recommendations for Fitness Routes

### ✅ DO:
```javascript
app.post('/api/fitness/workouts', requireAuth, async (req, res) => {
  const { duration_minutes } = req.body;
  if (!duration_minutes) return res.status(400).json({ error: '...' });
  
  const result = await prisma.fitness_workouts.create({
    data: {
      user_id: req.user.id,  // ← Always include
      duration_minutes,
      ...
    }
  });
  res.json({ success: true, workout: result });
});
```

### ❌ DON'T:
```javascript
// No auth, no user scoping, no validation
app.get('/api/fitness/:id', async (req, res) => {
  const workout = await prisma.fitness_workouts.findUnique({
    where: { id: req.params.id }  // ← Could be anyone's!
  });
  res.json(workout);
});
```

---

## Implementation Checklist

For each Fitness route, verify:

- [ ] Uses `requireAuth` middleware
- [ ] Filters queries by `req.user.id`
- [ ] Validates all input (400 errors)
- [ ] Includes user_id in DELETE/UPDATE WHERE clause
- [ ] Wraps async in try-catch
- [ ] Logs with emoji + email
- [ ] Response format matches patterns
- [ ] Error response includes `error` + `details`
- [ ] Uses parameterized queries
- [ ] No hardcoded IDs

---

## Status

✅ **Pattern Analysis:** COMPLETE  
✅ **Reference Docs:** CREATED  
✅ **Security Review:** PASSED  

⏳ **Next:** Implement `/fitness/backend/routes/fitness.js` using these patterns  

---

**Analysis Date:** December 21, 2025  
**Source:** server.js (3,862 lines, production code)  
**Routes Analyzed:** 25+ endpoints across 5 modules
