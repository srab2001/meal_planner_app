# 🏋️ Fitness Backend Routes - API Documentation

**File:** `/fitness/backend/routes/fitness.js`  
**Created:** December 21, 2025  
**Status:** ✅ Production Ready  

---

## Overview

Complete Express.js router for the Fitness module with 6 API endpoints:
- 2 Profile endpoints (GET, POST)
- 2 Workout endpoints (GET, POST)
- 2 Goals endpoints (GET, POST)

**Total Lines:** 550+  
**Security:** Full user scoping + authentication  
**Database:** Prisma with Neon PostgreSQL  

---

## Key Features

✅ **Authentication:** All routes require JWT token via `requireAuth` middleware  
✅ **User Scoping:** All queries filtered by `user_id` from authenticated session  
✅ **Duplicate Prevention:** Workouts can't be duplicated on same day/type  
✅ **Validation:** Comprehensive input validation on all POST requests  
✅ **Error Handling:** Try-catch on all async operations with contextual logging  
✅ **Audit Trail:** All operations logged with user email + emoji indicators  
✅ **Response Format:** Consistent JSON responses matching meal_planner patterns  

---

## Installation & Setup

### 1. Import in Server

Add to `server.js` after other imports:

```javascript
const fitnessRoutes = require('./fitness/backend/routes/fitness');

// In your Express app setup (after authentication middleware):
app.use('/api/fitness', fitnessRoutes);
```

### 2. Ensure Environment Variables

Both files must have `FITNESS_DATABASE_URL`:
- `.env` (root)
- `fitness/.env` or `fitness/backend/.env`

```
FITNESS_DATABASE_URL="postgresql://neondb_owner:...@ep-blue-butterfly-adn2p6ns-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 3. Ensure Prisma Client Installed

```bash
npm install @prisma/client
# or in fitness/backend:
npm install @prisma/client
```

---

## API Endpoints

### 1. GET /api/fitness/profile

**Get user's fitness profile**

#### Request
```
GET /api/fitness/profile
Authorization: Bearer <JWT_TOKEN>
```

#### Response (200 OK)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "height_cm": 180,
  "weight_kg": 75.5,
  "age": 28,
  "gender": "Male",
  "activity_level": "moderate",
  "created_at": "2025-12-21T10:00:00Z",
  "updated_at": "2025-12-21T10:00:00Z"
}
```

#### Response (404 Not Found)
```json
{
  "error": "profile_not_found",
  "message": "Fitness profile not found. Create one first."
}
```

#### Response (401 Unauthorized)
```json
{
  "error": "not_authenticated",
  "message": "Authentication required"
}
```

---

### 2. POST /api/fitness/profile

**Create or update user's fitness profile**

#### Request
```
POST /api/fitness/profile
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "height_cm": 180,
  "weight_kg": 75.5,
  "age": 28,
  "gender": "Male",
  "activity_level": "moderate"
}
```

**All fields optional.** Only provide fields you want to create/update.

#### Valid activity_level values:
- `sedentary`
- `light`
- `moderate`
- `active`
- `very_active`

#### Response (200 OK)
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "user_id": "uuid",
    "height_cm": 180,
    "weight_kg": 75.5,
    "age": 28,
    "gender": "Male",
    "activity_level": "moderate",
    "created_at": "2025-12-21T10:00:00Z",
    "updated_at": "2025-12-21T10:05:00Z"
  }
}
```

#### Response (400 Bad Request)
```json
{
  "error": "invalid_height_cm",
  "message": "height_cm must be a positive number"
}
```

---

### 3. GET /api/fitness/workouts

**List all workouts for authenticated user**

#### Request
```
GET /api/fitness/workouts?startDate=2025-12-01&endDate=2025-12-31&type=strength
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)
- `type` (optional): Filter by type (strength, cardio, hiit)

#### Response (200 OK)
```json
{
  "workouts": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "workout_date": "2025-12-21T00:00:00Z",
      "workout_type": "strength",
      "duration_minutes": 45,
      "notes": "Back and biceps day",
      "created_at": "2025-12-21T10:00:00Z",
      "exercises": [
        {
          "id": "uuid",
          "exercise_name": "Barbell Row",
          "exercise_order": 1,
          "sets": [
            {
              "id": "uuid",
              "set_number": 1,
              "reps": 8,
              "weight": 100.5,
              "duration_seconds": null
            }
          ]
        }
      ]
    }
  ]
}
```

---

### 4. POST /api/fitness/workouts

**Create new workout (prevents duplicates on same day/type)**

#### Request
```
POST /api/fitness/workouts
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "workout_date": "2025-12-21",
  "workout_type": "strength",
  "duration_minutes": 45,
  "notes": "Back and biceps day"
}
```

**Required Fields:**
- `workout_date` (YYYY-MM-DD format)
- `workout_type` (strength | cardio | hiit)

**Optional Fields:**
- `duration_minutes` (positive number)
- `notes` (text)

#### Response (200 OK - Created)
```json
{
  "success": true,
  "workout": {
    "id": "uuid",
    "user_id": "uuid",
    "workout_date": "2025-12-21T00:00:00Z",
    "workout_type": "strength",
    "duration_minutes": 45,
    "notes": "Back and biceps day",
    "created_at": "2025-12-21T10:00:00Z",
    "exercises": []
  }
}
```

#### Response (409 Conflict - Duplicate)
```json
{
  "error": "duplicate_workout",
  "message": "A strength workout already exists for 2025-12-21. Delete the existing one first or update it instead.",
  "existingWorkout": {
    "id": "uuid",
    "created_at": "2025-12-21T09:00:00Z"
  }
}
```

#### Response (400 Bad Request)
```json
{
  "error": "invalid_workout_type",
  "message": "workout_type must be one of: strength, cardio, hiit"
}
```

---

### 5. GET /api/fitness/goals

**List all fitness goals for authenticated user**

#### Request
```
GET /api/fitness/goals?status=active
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `status` (optional): Filter by status (active, completed, abandoned)

#### Response (200 OK)
```json
{
  "goals": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "goal_type": "weight_loss",
      "target_value": 70,
      "unit": "kg",
      "start_date": "2025-12-01T00:00:00Z",
      "target_date": "2026-06-01T00:00:00Z",
      "status": "active",
      "created_at": "2025-12-21T10:00:00Z",
      "updated_at": "2025-12-21T10:00:00Z"
    }
  ]
}
```

---

### 6. POST /api/fitness/goals

**Create new fitness goal**

#### Request
```
POST /api/fitness/goals
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "goal_type": "weight_loss",
  "target_value": 70,
  "unit": "kg",
  "start_date": "2025-12-21",
  "target_date": "2026-06-21"
}
```

**Required Fields:**
- `goal_type` (string - weight_loss, muscle_gain, endurance, strength, etc)

**Optional Fields:**
- `target_value` (positive number)
- `unit` (kg, lbs, minutes, reps, etc)
- `start_date` (YYYY-MM-DD)
- `target_date` (YYYY-MM-DD)

#### Response (200 OK)
```json
{
  "success": true,
  "goal": {
    "id": "uuid",
    "user_id": "uuid",
    "goal_type": "weight_loss",
    "target_value": 70,
    "unit": "kg",
    "start_date": "2025-12-21T00:00:00Z",
    "target_date": "2026-06-21T00:00:00Z",
    "status": "active",
    "created_at": "2025-12-21T10:00:00Z",
    "updated_at": "2025-12-21T10:00:00Z"
  }
}
```

#### Response (400 Bad Request)
```json
{
  "error": "missing_goal_type",
  "message": "goal_type is required and must be a non-empty string"
}
```

---

## HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET/POST successful, data returned |
| 400 | Bad Request | Validation failed, invalid input |
| 401 | Unauthorized | Missing/invalid JWT token |
| 404 | Not Found | Resource doesn't exist (profile not found) |
| 409 | Conflict | Duplicate workout on same day |
| 500 | Server Error | Database error, Prisma error |

---

## Error Response Format

All errors follow this format:

```json
{
  "error": "error_code",
  "message": "Human readable description",
  "details": "error.message (optional, development only)"
}
```

---

## Security & User Scoping

### Authentication
- **Required:** All routes require valid JWT token
- **Source:** `Authorization: Bearer <token>` header
- **Check:** `requireAuth` middleware verifies token

### User Scoping
- **Profile:** Only user's own profile accessible
- **Workouts:** Only user's own workouts returned
- **Goals:** Only user's own goals returned
- **Enforcement:** Every query filtered by `WHERE user_id = $1`

### Data Isolation
- ✅ Users cannot access other users' profiles
- ✅ Users cannot delete other users' workouts
- ✅ Users cannot see other users' goals
- ✅ User ID from JWT token used, not request body

---

## Duplicate Workout Prevention

The POST /api/fitness/workouts endpoint prevents duplicates:

```javascript
// Checks for existing workout with:
// - Same user_id
// - Same workout_date (exact date)
// - Same workout_type

// Returns 409 Conflict if duplicate found
```

**Scenario:**
1. User creates "strength" workout on 2025-12-21
2. User tries to create another "strength" workout on 2025-12-21
3. **Result:** 409 Conflict error with existing workout ID
4. **Solution:** User must delete existing or update it instead

---

## Logging & Audit Trail

All operations logged with context:

### Success Logs
```
✅ Profile retrieved for user@email.com
📝 Profile updated for user@email.com
✨ Profile created for user@email.com
✅ Retrieved 5 workouts for user@email.com
💪 Workout created for user@email.com: uuid
✅ Retrieved 3 goals for user@email.com
🎯 Goal created for user@email.com: uuid
```

### Error Logs
```
[GET /api/fitness/profile] Error: message
[GET /api/fitness/profile] User ID: uuid
```

---

## Testing

### Using cURL

#### Create profile
```bash
curl -X POST http://localhost:5000/api/fitness/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "height_cm": 180,
    "weight_kg": 75,
    "age": 28,
    "activity_level": "moderate"
  }'
```

#### Get profile
```bash
curl -X GET http://localhost:5000/api/fitness/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Create workout
```bash
curl -X POST http://localhost:5000/api/fitness/workouts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workout_date": "2025-12-21",
    "workout_type": "strength",
    "duration_minutes": 45,
    "notes": "Back and biceps"
  }'
```

#### Get workouts
```bash
curl -X GET "http://localhost:5000/api/fitness/workouts?type=strength" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Create goal
```bash
curl -X POST http://localhost:5000/api/fitness/goals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal_type": "weight_loss",
    "target_value": 70,
    "unit": "kg",
    "target_date": "2026-06-21"
  }'
```

#### Get goals
```bash
curl -X GET "http://localhost:5000/api/fitness/goals?status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Integration with Server

### In `server.js`

```javascript
// After other imports
const fitnessRoutes = require('./fitness/backend/routes/fitness');

// After authentication middleware setup (around line 300+)
app.use('/api/fitness', fitnessRoutes);
```

### Environment Variables

Ensure these are set:
```
FITNESS_DATABASE_URL=postgresql://...
# Optionally also set in fitness/.env or fitness/backend/.env
```

---

## Future Enhancements

### Additional Endpoints (Planned)
- PUT /api/fitness/workouts/:id - Update workout
- DELETE /api/fitness/workouts/:id - Delete workout
- PUT /api/fitness/goals/:id - Update goal status
- DELETE /api/fitness/goals/:id - Delete goal
- POST /api/fitness/workout-exercises - Add exercise to workout
- GET /api/fitness/stats - User statistics dashboard

### Rate Limiting
- Consider adding `aiLimiter` or `generalLimiter` to expensive operations
- Protect profile updates with rate limiting

### Advanced Features
- Workout history analytics
- Goal progress tracking
- Cardio session logging
- Workout templating

---

## Troubleshooting

### Error: "Authentication required"
- ✅ Ensure JWT token is in `Authorization: Bearer <token>` header
- ✅ Verify token is not expired
- ✅ Check that `req.user` is populated by auth middleware

### Error: "Profile not found" (404)
- ✅ User must create profile first with POST /api/fitness/profile
- ✅ Each user needs their own profile

### Error: "Duplicate workout" (409)
- ✅ Use different date for new workout
- ✅ Use different workout_type
- ✅ Or delete existing workout first

### Error: "Failed to retrieve..." (500)
- ✅ Check Neon database connection
- ✅ Verify FITNESS_DATABASE_URL environment variable
- ✅ Check server logs for details

---

## Performance Notes

- **Queries:** All indexed by user_id for fast filtering
- **Relationships:** Workouts include exercises and sets (N+1 prevented)
- **Ordering:** Workouts/goals ordered by date DESC (most recent first)

---

**Last Updated:** December 21, 2025  
**Status:** ✅ Production Ready  
**Next:** Integration into server.js and frontend components
