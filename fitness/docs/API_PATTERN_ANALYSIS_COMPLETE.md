# 🔍 API Pattern Analysis - Meal Planner Review Complete

## Executive Summary

Analyzed the existing Express.js patterns in `server.js` (3,863 lines) to establish best practices for the Fitness module API routes.

---

## Key Findings

### 1. ✅ Authentication is Consistent & Secure
- **Pattern:** JWT token via `Authorization: Bearer <token>` header
- **Middleware:** Custom `requireAuth()` function (lines 384-400)
- **User Context:** Token decoded into `req.user` object containing:
  - `id` (UUID)
  - `email`
  - `full_name`
  - `picture` (avatar)

### 2. ✅ User Data Scoping is Enforced
- **Always:** Filter database queries by `req.user.id`
- **Security:** All DELETE/UPDATE operations include `AND user_id = $N`
- **Example:** `/api/favorites/:id` won't delete if user_id doesn't match
- **Prevents:** Data leakage between users

### 3. ✅ Error Handling is Standardized
```javascript
// HTTP Status Codes:
400 - Bad request / validation error
401 - Unauthorized (no token)
404 - Not found
429 - Rate limited
500 - Server error

// Response Format:
{
  "error": "Human readable error",
  "details": "error.message"
}
```

### 4. ✅ Logging Uses Consistent Format
```
✅ Success: "❤️  user@email.com saved favorite: Pasta"
❌ Error:   "Error removing favorite:" + error.message
📧 Data:    User ID logged for audit trail
```

### 5. ✅ Rate Limiting is Three-Tiered
1. **General:** 100 requests per 15 min (applied globally)
2. **Auth:** 20 attempts per 15 min (login/OAuth)
3. **Expensive AI:** 30 requests per 15 min (OpenAI calls)

### 6. ✅ Response Formats Follow Patterns
- **Simple:** `{ success: true }`
- **With Data:** `{ success: true, resource: {...} }`
- **Lists:** `{ resources: [...] }`
- **Status Checks:** `{ hasPaidAccess: true }`

---

## API Route Pattern Examples Found

### Pattern 1: Simple GET (User-Scoped)
**Route:** `GET /api/profile`
```javascript
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.full_name
  });
});
```
✅ Requires auth  
✅ Returns user's own data  
✅ No database query needed (from token)

---

### Pattern 2: POST with Validation
**Route:** `POST /api/favorites/add`
```javascript
app.post('/api/favorites/add', requireAuth, async (req, res) => {
  try {
    const { meal, mealType, servings_adjustment } = req.body;
    
    // Input validation
    if (!meal || !meal.name) {
      return res.status(400).json({ error: 'Invalid meal data' });
    }
    
    if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
      return res.status(400).json({ error: 'Invalid meal type' });
    }
    
    // Create with user context
    const result = await db.query(`
      INSERT INTO favorites (user_id, meal_type, meal_data, meal_name, ...)
      VALUES ($1, $2, $3, $4, ...)
      ON CONFLICT (user_id, meal_name, meal_type)
      DO UPDATE SET servings_adjustment = EXCLUDED.servings_adjustment
      RETURNING *
    `, [req.user.id, mealType, JSON.stringify(meal), meal.name, ...]);
    
    console.log(`❤️  ${req.user.email} saved favorite: ${meal.name}`);
    res.json({ success: true, favorite: result.rows[0] });
    
  } catch (error) {
    console.error('[POST /api/favorites/add] Error:', error.message);
    res.status(500).json({ error: 'Failed to add favorite', details: error.message });
  }
});
```
✅ Requires auth  
✅ Validates input (400 errors)  
✅ Inserts with user_id  
✅ Handles conflicts gracefully  
✅ Logs with emoji + email  
✅ Returns created resource

---

### Pattern 3: GET List with User Scoping
**Route:** `GET /api/favorites`
```javascript
app.get('/api/favorites', requireAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM favorites
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [req.user.id]);
    
    // Transform rows to frontend format
    const favorites = result.rows.map(row => ({
      id: row.id,
      meal: row.meal_data || { name: row.meal_name || 'Unnamed' },
      mealType: row.meal_type,
      savedAt: row.created_at
    }));
    
    res.json({ favorites });
    
  } catch (error) {
    console.error('[GET /api/favorites] Error:', error.message);
    res.status(500).json({ error: 'Failed to read favorites', details: error.message });
  }
});
```
✅ Requires auth  
✅ Filters by user_id  
✅ Transforms data for frontend  
✅ Error logging with route

---

### Pattern 4: DELETE with User Verification
**Route:** `DELETE /api/favorites/:id`
```javascript
app.delete('/api/favorites/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // CRITICAL: Include user_id in WHERE to prevent unauthorized deletion
    await db.query(`
      DELETE FROM favorites
      WHERE id = $1 AND user_id = $2
    `, [id, req.user.id]);  // ← Always add user_id check
    
    console.log(`🗑️  ${req.user.email} removed favorite: ${id}`);
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});
```
✅ Requires auth  
✅ User verification in WHERE clause  
✅ Prevents cross-user deletion  
✅ Logs with emoji

---

### Pattern 5: POST with Rate Limiting
**Route:** `POST /api/generate-meals`
```javascript
app.post('/api/generate-meals', aiLimiter, requireAuth, async (req, res) => {
  try {
    const { preferences, cuisines, selectedDays } = req.body;
    
    // Validate
    if (!preferences) {
      return res.status(400).json({ error: 'Preferences required' });
    }
    
    // Business logic
    const mealPlan = await openai.chat.completions.create({...});
    
    // Track usage
    await db.query(`
      INSERT INTO usage_stats (user_id, action_type, metadata)
      VALUES ($1, 'meal_plan_generated', $2)
    `, [req.user.id, JSON.stringify({...})]);
    
    console.log(`📊 Usage tracked for ${req.user.email}`);
    res.json(mealPlan);
    
  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({
      error: 'Failed to generate meal plan',
      details: error.message
    });
  }
});
```
✅ Rate limited (aiLimiter)  
✅ Requires auth  
✅ Validates input  
✅ Tracks usage  
✅ Returns complex data

---

## Middleware Chain Order

**Correct sequence (most restrictive first):**
```javascript
app.post(
  '/api/endpoint',
  rateLimiter,      // 1. Check rate limit first
  requireAuth,      // 2. Verify authentication
  async (req, res) => { // 3. Business logic
    // ...
  }
);
```

---

## Security Best Practices Found

1. **🔒 Never trust user input for IDs**
   ```javascript
   // ❌ WRONG - User could request other user's data
   db.query('SELECT * FROM favorites WHERE id = $1', [req.body.id]);
   
   // ✅ RIGHT - Use authenticated user's ID
   db.query('SELECT * FROM favorites WHERE id = $1 AND user_id = $2', [id, req.user.id]);
   ```

2. **🔒 Always use parameterized queries**
   ```javascript
   // ✅ Safe - Parameters separated
   db.query('SELECT * WHERE user_id = $1', [userId]);
   
   // ❌ Unsafe - SQL injection risk
   const query = `SELECT * WHERE user_id = ${userId}`;
   ```

3. **🔒 Validate all input**
   ```javascript
   if (!type || !['breakfast', 'lunch', 'dinner'].includes(type)) {
     return res.status(400).json({ error: 'Invalid type' });
   }
   ```

4. **🔒 Verify authorization on mutations**
   ```javascript
   // Both DELETE and UPDATE must check user_id
   DELETE FROM table WHERE id = $1 AND user_id = $2
   UPDATE table SET field = $1 WHERE id = $2 AND user_id = $3
   ```

---

## Pattern Checklist for Fitness Routes

Created **EXPRESS_API_PATTERNS_REVIEW.md** in `fitness/docs/` with:

- ✅ Authentication middleware patterns
- ✅ User scoping security patterns
- ✅ Error handling standardization
- ✅ Response format examples (5 types)
- ✅ Rate limiting configurations
- ✅ Middleware chain order
- ✅ Database interaction patterns
- ✅ Request/response body patterns
- ✅ Recommended patterns for Fitness
- ✅ 12-point implementation checklist

---

## Next Steps

1. **Create `/fitness/backend/routes/fitness.js`** using these patterns
2. **Implement 21 API endpoints** (see FITNESS_API_SPECIFICATION.md)
3. **Test user scoping** - Verify users can only access own data
4. **Add rate limiting** - Especially for expensive operations
5. **Integrate into server.js** - Mount fitness routes at `/api/fitness/*`

---

## Reference Files

- **Main Review:** `fitness/docs/EXPRESS_API_PATTERNS_REVIEW.md` (10 sections)
- **API Spec:** `fitness/docs/FITNESS_API_SPECIFICATION.md` (21 endpoints)
- **Component Arch:** `fitness/docs/FITNESS_COMPONENT_ARCHITECTURE.md` (45 components)
- **Neon Config:** Database deployed and validated ✅

---

**Status:** Ready to implement backend routes! 🚀
