# 🏋️ Express API Route Patterns - Meal Planner Review

## Overview
Analysis of existing Express API patterns in meal_planner app to establish standards for new Fitness module routes.

---

## 1. AUTHENTICATION MIDDLEWARE

### Pattern: `requireAuth` Middleware
**Location:** `server.js` lines 384-400

```javascript
function requireAuth(req, res, next) {
  // Check for token in Authorization header or query parameter
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'not_authenticated', message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'invalid_token', message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}
```

### Key Features:
✅ **Token Extraction:** Accepts JWT from `Authorization: Bearer <token>` header or query param  
✅ **Token Verification:** Uses `verifyToken()` helper function  
✅ **Error Response:** Returns 401 with error code and message  
✅ **User Context:** Attaches decoded user to `req.user` for downstream use  

### Decoded User Object Contains:
- `req.user.id` - UUID of the user
- `req.user.email` - User's email address
- `req.user.full_name` - User's display name
- `req.user.displayName` - Alternative name field
- `req.user.picture` - Avatar URL

---

## 2. ROUTE AUTHORIZATION & USER SCOPING

### Pattern: Scope All Queries to User
**Examples:**

#### A. GET - Fetch User's Own Data
```javascript
app.get('/api/favorites', requireAuth, async (req, res) => {
  const result = await db.query(`
    SELECT * FROM favorites
    WHERE user_id = $1
    ORDER BY created_at DESC
  `, [req.user.id]);  // ← User scoped via req.user.id
  
  res.json({ favorites });
});
```

#### B. DELETE - User-Scoped Deletion
```javascript
app.delete('/api/favorites/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  
  // IMPORTANT: Always include user_id in WHERE clause
  await db.query(`
    DELETE FROM favorites
    WHERE id = $1 AND user_id = $2
  `, [id, req.user.id]);  // ← Prevents user from deleting other users' data
  
  res.json({ success: true });
});
```

#### C. POST - Create with User Context
```javascript
app.post('/api/favorites/add', requireAuth, async (req, res) => {
  const { meal, mealType, servings_adjustment, user_notes } = req.body;
  
  const result = await db.query(`
    INSERT INTO favorites (
      user_id, meal_type, meal_data, meal_name,
      servings_adjustment, user_notes
    )
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    req.user.id,  // ← Always insert user_id
    mealType,
    JSON.stringify(meal),
    meal.name,
    servings_adjustment || null,
    user_notes || null
  ]);
  
  res.json({ success: true, favorite: result.rows[0] });
});
```

### Critical Security Pattern:
🔒 **NEVER trust user-provided IDs** - Always use `req.user.id` from JWT token  
🔒 **Always include user_id in WHERE clauses** for DELETE/UPDATE operations  
🔒 **Prevent data leakage** by scoping all queries to authenticated user  

---

## 3. ERROR HANDLING PATTERNS

### Pattern: Standardized Error Response

```javascript
try {
  // Business logic here
  const result = await db.query(sql, params);
  res.json({ success: true, data: result.rows[0] });
  
} catch (error) {
  // Log with context
  console.error('[POST /api/route-name] Error message:', error.message);
  console.error('[POST /api/route-name] Full error:', error);
  console.error('[POST /api/route-name] User ID:', req.user?.id);
  
  // Respond with consistent error format
  res.status(500).json({
    error: 'Human-readable error title',
    details: error.message
  });
}
```

### Error Status Codes Used:
- **400** - Bad request / validation error
- **401** - Unauthorized (no token or invalid token)
- **404** - Not found
- **429** - Rate limited (too many requests)
- **500** - Server error (database, AI API, etc.)

### Example Validation Errors:
```javascript
app.post('/api/some-endpoint', requireAuth, async (req, res) => {
  const { meal, mealType } = req.body;
  
  // Validate input
  if (!meal || !meal.name) {
    return res.status(400).json({ error: 'Invalid meal data' });
  }
  
  if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
    return res.status(400).json({ error: 'Invalid meal type' });
  }
  
  // Continue if validation passes
  // ...
});
```

### Logging Best Practices:
✅ Use format: `[METHOD /api/route] Error message`  
✅ Log full error object for debugging  
✅ Log user ID for audit trail  
✅ Use descriptive console.log for success cases with emoji indicators  

**Success Logging Examples:**
```javascript
console.log(`❤️  ${req.user.email} saved favorite: ${meal.name}`);
console.log(`💾 ${req.user.email} saved shopping list state`);
console.log(`✅ Token verified for user: ${decoded.email}`);
console.log(`❌ Invalid discount code attempted: ${normalizedCode}`);
```

---

## 4. RESPONSE FORMAT PATTERNS

### Pattern A: Simple Success Response
```javascript
res.json({ success: true });
```

### Pattern B: Success with Data
```javascript
res.json({ success: true, favorite: result.rows[0] });
// or
res.json({ favorites }); // Direct property
```

### Pattern C: List Response
```javascript
const favorites = result.rows.map(row => ({
  id: row.id,
  meal: row.meal_data || { name: row.meal_name || 'Unnamed Meal' },
  meal_name: row.meal_name,
  mealType: row.meal_type,
  savedAt: row.created_at
}));

res.json({ favorites });
```

### Pattern D: Status Check
```javascript
res.json({ hasPaidAccess: true });
// or
res.json({ user: { id, email, displayName, picture } });
```

### Pattern E: Complex Data with Metadata
```javascript
res.json({
  totalRecords: 25,
  items: [...],
  summary: {
    totalCount: 25,
    avgValue: 100
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 3
  }
});
```

---

## 5. RATE LIMITING PATTERNS

### Three Tier Rate Limiting Strategy:

```javascript
// Tier 1: General API requests (100 per 15 min)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the request limit. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});
app.use(generalLimiter); // Apply globally

// Tier 2: Authentication endpoints (20 per 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true  // Don't count successful auth
});
app.get('/auth/google', authLimiter, ...);

// Tier 3: Expensive API calls like AI (30 per 15 min)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30
});
app.post('/api/generate-meals', aiLimiter, requireAuth, ...);
```

### Usage in Routes:
```javascript
// AI endpoint = most restrictive
app.post('/api/endpoint', aiLimiter, requireAuth, async (req, res) => { ... });

// Regular endpoint = default (generalLimiter applied globally)
app.get('/api/endpoint', requireAuth, async (req, res) => { ... });

// Auth endpoint = moderate
app.post('/auth/endpoint', authLimiter, async (req, res) => { ... });
```

---

## 6. MIDDLEWARE CHAIN ORDER

### Correct Order (Most Restrictive First):
```javascript
app.post(
  '/api/expensive-operation',
  aiLimiter,           // 1. Rate limit (most restrictive)
  requireAuth,         // 2. Authentication
  async (req, res) => { // 3. Request handler
    // Business logic
  }
);
```

### Why This Order?
1. **Rate limiting first** - Reject bad actors before doing authentication work
2. **Authentication second** - Verify user identity
3. **Handler last** - Only reach business logic after passing filters

---

## 7. DATABASE INTERACTION PATTERNS

### Pattern: Prepared Statements with Parameters
```javascript
// ✅ GOOD - Prevents SQL injection
await db.query(`
  INSERT INTO table_name (user_id, field1, field2)
  VALUES ($1, $2, $3)
`, [req.user.id, value1, value2]);

// ❌ BAD - Vulnerable to SQL injection
const query = `INSERT INTO table_name VALUES (${req.user.id})`;
```

### Pattern: ON CONFLICT for Upsert
```javascript
const result = await db.query(`
  INSERT INTO favorites (user_id, meal_name, meal_type, ...)
  VALUES ($1, $2, $3, ...)
  ON CONFLICT (user_id, meal_name, meal_type)
  DO UPDATE SET
    field = EXCLUDED.field
  RETURNING *
`, [...]);
```

### Pattern: Transaction-Like Behavior
```javascript
// Check if exists, then insert or update
const result = await db.query(`
  SELECT * FROM table WHERE user_id = $1 AND id = $2
`, [req.user.id, itemId]);

if (result.rows.length > 0) {
  // Update
} else {
  // Insert
}
```

---

## 8. REQUEST/RESPONSE BODY PATTERNS

### POST - Create Resource
```javascript
// Request Body:
{
  "meal": { name: "Pasta", ... },
  "mealType": "lunch",
  "servings_adjustment": 2,
  "user_notes": "Add extra garlic"
}

// Response:
{
  "success": true,
  "favorite": {
    "id": "uuid",
    "user_id": "uuid",
    "meal_name": "Pasta",
    "meal_type": "lunch",
    "created_at": "2025-12-21T10:00:00Z"
  }
}
```

### GET - Fetch Data
```javascript
// Request Query:
GET /api/shopping-list-state?mealPlanDate=2025-12-21

// Response:
{
  "checkedItems": {
    "tomatoes": true,
    "lettuce": false
  },
  "lastUpdated": "2025-12-21T10:00:00Z"
}
```

### DELETE - Remove Resource
```javascript
// Request:
DELETE /api/favorites/resource-id

// Response:
{
  "success": true
}
```

---

## 9. RECOMMENDED PATTERNS FOR FITNESS ROUTES

Based on the meal_planner app standards, here are recommendations for Fitness module:

### ✅ Route Authentication
```javascript
// ALWAYS use requireAuth for fitness endpoints
app.get('/api/fitness/workouts', requireAuth, async (req, res) => {
  // Fetch only this user's workouts
  const result = await prisma.fitness_workouts.findMany({
    where: { user_id: req.user.id }
  });
  res.json({ workouts: result });
});
```

### ✅ User Scoping
```javascript
// ALWAYS filter by req.user.id
app.post('/api/fitness/workouts', requireAuth, async (req, res) => {
  const { workout_date, workout_type, duration_minutes, notes } = req.body;
  
  const workout = await prisma.fitness_workouts.create({
    data: {
      user_id: req.user.id,  // ← Always include
      workout_date,
      workout_type,
      duration_minutes,
      notes
    }
  });
  
  res.json({ success: true, workout });
});
```

### ✅ Error Handling
```javascript
try {
  const result = await prisma.fitness_goals.create({...});
  res.json({ success: true, goal: result });
} catch (error) {
  console.error('[POST /api/fitness/goals] Error:', error.message);
  console.error('[POST /api/fitness/goals] User:', req.user?.id);
  res.status(500).json({ error: 'Failed to create goal', details: error.message });
}
```

### ✅ Input Validation
```javascript
const { goal_type, target_value } = req.body;

if (!goal_type || typeof goal_type !== 'string') {
  return res.status(400).json({ error: 'Invalid goal_type' });
}

if (!target_value || typeof target_value !== 'number') {
  return res.status(400).json({ error: 'Invalid target_value' });
}

// Continue if validation passes...
```

### ✅ Consistent Logging
```javascript
// Success
console.log(`✅ Workout created for ${req.user.email}: ${workout.id}`);

// Error
console.error(`❌ Failed to update goal for ${req.user.email}`);

// Data operations
console.log(`💾 Saved 5 workout sets for ${req.user.email}`);
```

---

## 10. SUMMARY - PATTERN CHECKLIST

Use this checklist for each new Fitness route:

- [ ] All routes use `requireAuth` middleware
- [ ] All database queries filter by `req.user.id`
- [ ] DELETE/UPDATE operations include `AND user_id = $N` in WHERE clause
- [ ] Input validation returns 400 with clear error message
- [ ] Try-catch wraps all async operations
- [ ] Error responses include `error` and `details` fields
- [ ] Success responses include `success: true`
- [ ] Console logging uses emoji indicators
- [ ] Logging includes username/email for audit trail
- [ ] No hardcoded IDs - use `req.user.id` from JWT
- [ ] Response format matches existing patterns
- [ ] Rate limiting applied to expensive operations
- [ ] Parameterized queries used (no string interpolation)

---

## FILES TO REVIEW

For reference, key sections in server.js:
- **Lines 384-400:** `requireAuth` middleware
- **Lines 483-490:** `/api/profile` (simple GET)
- **Lines 1540-1580:** `/api/favorites/add` (POST with validation)
- **Lines 1590-1620:** `/api/favorites` (GET with user scoping)
- **Lines 1625-1640:** `/api/favorites/:id` (DELETE with user scoping)
- **Lines 1645-1680:** `/api/shopping-list-state` (POST upsert)
- **Lines 1690-1720:** `/api/shopping-list-state` (GET with defaults)

---

**Ready to implement Fitness routes using these patterns!**
