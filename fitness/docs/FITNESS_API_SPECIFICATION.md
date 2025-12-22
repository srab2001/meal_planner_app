# FITNESS APP - REST API SPECIFICATION

**Prepared By:** Backend Architect  
**Date:** December 21, 2025  
**Status:** ✅ FINAL API SPECIFICATION  
**Format:** RESTful Endpoints with Request/Response Examples

---

## 📋 API OVERVIEW

### Base URL
```
Development:  http://localhost:3001/api
Staging:      https://staging-api.app.com/api
Production:   https://api.app.com/api
```

### Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer <jwt_token>
```

### Response Format
All responses are JSON. Success responses include status code and data.

---

## 🗂️ ENDPOINT CATEGORIES

| Category | Endpoints | Status |
|----------|-----------|--------|
| Workouts | 5 endpoints | ✅ Complete |
| Workout Exercises | 3 endpoints | ✅ Complete |
| Workout Sets | 3 endpoints | ✅ Complete |
| Exercise Definitions | 2 endpoints | ✅ Complete |
| Cardio Sessions | 5 endpoints | ✅ Complete |
| Progress Analytics | 3 endpoints | ✅ Complete |

**Total Endpoints:** 21

---

## 🏋️ WORKOUTS ENDPOINTS

### 1. CREATE WORKOUT
Log a new strength training session.

**Endpoint:**
```
POST /workouts
```

**Authentication:** Required (JWT)

**Request Headers:**
```json
{
  "Authorization": "Bearer eyJhbGc...",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "workout_date": "2025-12-21T14:30:00Z",
  "workout_name": "Back & Biceps Monday",
  "description": "Upper body pull day",
  "duration_minutes": 45,
  "notes": "Great session, feeling strong",
  "status": "completed",
  "exercises": [
    {
      "exercise_definition_id": "uuid-exercise-1",
      "exercise_order": 1,
      "rest_period_seconds": 90,
      "notes": "Felt strong today",
      "sets": [
        {
          "set_number": 1,
          "reps": 8,
          "weight_kg": 102,
          "weight_lbs": 225,
          "rpe": 7,
          "notes": ""
        },
        {
          "set_number": 2,
          "reps": 7,
          "weight_kg": 102,
          "weight_lbs": 225,
          "rpe": 8,
          "notes": "Harder than set 1"
        }
      ]
    }
  ]
}
```

**Request Body Fields:**
| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| `workout_date` | ISO 8601 | Yes | ≤ now() | Cannot be future date |
| `workout_name` | string | Yes | max 255 chars | e.g., "Leg Day" |
| `description` | string | No | max 500 chars | Optional details |
| `duration_minutes` | integer | No | > 0 | Total workout time |
| `notes` | string | No | max 1000 chars | User observations |
| `status` | string | No | draft/completed | Default: completed |
| `exercises` | array | Yes | min 1 item | Array of exercises |

**Exercise Object Fields:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `exercise_definition_id` | UUID | Yes | Must exist |
| `exercise_order` | integer | Yes | 1-based sequence |
| `rest_period_seconds` | integer | No | > 0 |
| `notes` | string | No | max 500 chars |
| `sets` | array | Yes | min 1 set |

**Set Object Fields:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `set_number` | integer | Yes | 1-based |
| `reps` | integer | Yes | > 0 |
| `weight_kg` | decimal | No | > 0 |
| `weight_lbs` | decimal | No | > 0 |
| `rpe` | integer | No | 1-10 scale |
| `notes` | string | No | max 200 chars |

**Response: Success (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "workout_date": "2025-12-21T14:30:00Z",
    "workout_name": "Back & Biceps Monday",
    "description": "Upper body pull day",
    "duration_minutes": 45,
    "total_volume_kg": 408,
    "total_volume_lbs": 900,
    "total_reps": 15,
    "notes": "Great session, feeling strong",
    "status": "completed",
    "exercises_count": 1,
    "sets_count": 2,
    "created_at": "2025-12-21T14:35:00Z",
    "updated_at": "2025-12-21T14:35:00Z",
    "exercises": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "exercise_definition_id": "uuid-exercise-1",
        "exercise_order": 1,
        "rest_period_seconds": 90,
        "notes": "Felt strong today",
        "sets": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440003",
            "set_number": 1,
            "reps": 8,
            "weight_kg": 102,
            "weight_lbs": 225,
            "rpe": 7,
            "notes": ""
          },
          {
            "id": "550e8400-e29b-41d4-a716-446655440004",
            "set_number": 2,
            "reps": 7,
            "weight_kg": 102,
            "weight_lbs": 225,
            "rpe": 8,
            "notes": "Harder than set 1"
          }
        ]
      }
    ]
  },
  "message": "Workout logged successfully"
}
```

**Response: Validation Error (400 Bad Request)**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "workout_date",
      "message": "Cannot log workout for future date"
    },
    {
      "field": "exercises",
      "message": "At least one exercise required"
    }
  ]
}
```

**Response: Unauthorized (401)**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Valid JWT token required"
}
```

**Response: Server Error (500)**
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Failed to save workout"
}
```

---

### 2. GET WORKOUT (by ID)
Retrieve a single workout with all exercises and sets.

**Endpoint:**
```
GET /workouts/:id
```

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Required | Example |
|-----------|------|----------|---------|
| `id` | UUID | Yes | 550e8400-e29b-41d4-a716-446655440000 |

**Request Example:**
```
GET /workouts/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGc...
```

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "workout_date": "2025-12-21T14:30:00Z",
    "workout_name": "Back & Biceps Monday",
    "description": "Upper body pull day",
    "duration_minutes": 45,
    "total_volume_kg": 408,
    "total_volume_lbs": 900,
    "total_reps": 15,
    "notes": "Great session, feeling strong",
    "status": "completed",
    "exercises_count": 1,
    "sets_count": 2,
    "created_at": "2025-12-21T14:35:00Z",
    "updated_at": "2025-12-21T14:35:00Z",
    "can_edit": true,
    "time_until_edit_window_expires": "23:45:30",
    "exercises": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "workout_id": "550e8400-e29b-41d4-a716-446655440000",
        "exercise_definition_id": "uuid-exercise-1",
        "exercise_name": "Barbell Squat",
        "exercise_order": 1,
        "rest_period_seconds": 90,
        "notes": "Felt strong today",
        "sets": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440003",
            "set_number": 1,
            "reps": 8,
            "weight_kg": 102,
            "weight_lbs": 225,
            "rpe": 7,
            "notes": ""
          }
        ]
      }
    ]
  }
}
```

**Response: Not Found (404)**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Workout not found"
}
```

**Response: Forbidden (403)**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You do not have permission to view this workout"
}
```

---

### 3. UPDATE WORKOUT
Modify workout details (within 24-hour window).

**Endpoint:**
```
PUT /workouts/:id
```

**Authentication:** Required

**Request Body:**
```json
{
  "workout_name": "Back & Biceps Monday (Updated)",
  "description": "Upper body pull day - adjusted",
  "duration_minutes": 50,
  "notes": "Updated - actually did rows instead of chest",
  "status": "completed"
}
```

**Request Body Fields (all optional):**
| Field | Type | Constraints |
|-------|------|-------------|
| `workout_name` | string | max 255 chars |
| `description` | string | max 500 chars |
| `duration_minutes` | integer | > 0 |
| `notes` | string | max 1000 chars |
| `status` | string | draft/completed/archived |

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "workout_name": "Back & Biceps Monday (Updated)",
    "duration_minutes": 50,
    "notes": "Updated - actually did rows instead of chest",
    "updated_at": "2025-12-21T15:40:00Z",
    "can_edit": true,
    "time_until_edit_window_expires": "22:50:15"
  },
  "message": "Workout updated successfully"
}
```

**Response: Edit Window Expired (403)**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "24-hour edit window has expired (expired Dec 22, 2:35 PM)"
}
```

**Response: Validation Error (400)**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "duration_minutes",
      "message": "Must be greater than 0"
    }
  ]
}
```

---

### 4. DELETE WORKOUT
Remove a workout and all associated exercises and sets.

**Endpoint:**
```
DELETE /workouts/:id
```

**Authentication:** Required

**Request Example:**
```
DELETE /workouts/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGc...
```

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deleted_at": "2025-12-21T15:45:00Z"
  },
  "message": "Workout deleted successfully"
}
```

**Response: Edit Window Expired (403)**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Can only delete within 24 hours of creation"
}
```

**Response: Not Found (404)**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Workout not found"
}
```

---

### 5. LIST WORKOUTS
Get user's workouts with filtering and pagination.

**Endpoint:**
```
GET /workouts
```

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Default | Options | Notes |
|-----------|------|---------|---------|-------|
| `page` | integer | 1 | 1-N | Pagination page |
| `limit` | integer | 20 | 1-100 | Items per page |
| `sort` | string | -workout_date | -workout_date, workout_date, -duration_minutes, -total_volume_kg | Sort order (- = desc) |
| `type` | string | all | strength, cardio, all | Filter by type |
| `status` | string | completed | draft, completed, archived, all | Filter by status |
| `date_from` | date | 30 days ago | YYYY-MM-DD | Start date |
| `date_to` | date | today | YYYY-MM-DD | End date |
| `search` | string | null | text | Search by name |

**Request Example:**
```
GET /workouts?page=1&limit=20&sort=-workout_date&type=strength&date_from=2025-12-01&date_to=2025-12-31
Authorization: Bearer eyJhbGc...
```

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "workout_date": "2025-12-21T14:30:00Z",
      "workout_name": "Back & Biceps Monday",
      "duration_minutes": 45,
      "total_volume_lbs": 900,
      "total_reps": 15,
      "exercises_count": 1,
      "sets_count": 2,
      "status": "completed"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "workout_date": "2025-12-19T16:00:00Z",
      "workout_name": "Leg Day Friday",
      "duration_minutes": 60,
      "total_volume_lbs": 2150,
      "total_reps": 35,
      "exercises_count": 4,
      "sets_count": 12,
      "status": "completed"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

**Response: Empty Result (200 OK)**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "total_pages": 0,
    "has_next": false,
    "has_prev": false
  },
  "message": "No workouts found for the selected criteria"
}
```

---

## 🏋️ WORKOUT EXERCISES ENDPOINTS

### 6. ADD EXERCISE TO WORKOUT
Add an exercise to an existing workout.

**Endpoint:**
```
POST /workouts/:id/exercises
```

**Authentication:** Required

**Request Body:**
```json
{
  "exercise_definition_id": "uuid-exercise-2",
  "exercise_order": 2,
  "rest_period_seconds": 90,
  "notes": "New exercise added",
  "sets": [
    {
      "set_number": 1,
      "reps": 10,
      "weight_kg": 32,
      "weight_lbs": 70,
      "rpe": 6,
      "notes": ""
    }
  ]
}
```

**Response: Success (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "workout_id": "550e8400-e29b-41d4-a716-446655440000",
    "exercise_definition_id": "uuid-exercise-2",
    "exercise_name": "Incline Dumbbell Press",
    "exercise_order": 2,
    "rest_period_seconds": 90,
    "notes": "New exercise added",
    "sets": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440021",
        "set_number": 1,
        "reps": 10,
        "weight_kg": 32,
        "weight_lbs": 70,
        "rpe": 6,
        "notes": ""
      }
    ]
  },
  "message": "Exercise added successfully"
}
```

**Response: Edit Window Expired (403)**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "24-hour edit window has expired"
}
```

---

### 7. UPDATE WORKOUT EXERCISE
Modify exercise details within a workout.

**Endpoint:**
```
PUT /workouts/:workoutId/exercises/:exerciseId
```

**Authentication:** Required

**Request Body:**
```json
{
  "exercise_order": 3,
  "rest_period_seconds": 120,
  "notes": "Increased rest time"
}
```

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "exercise_order": 3,
    "rest_period_seconds": 120,
    "notes": "Increased rest time",
    "updated_at": "2025-12-21T15:50:00Z"
  },
  "message": "Exercise updated successfully"
}
```

---

### 8. DELETE WORKOUT EXERCISE
Remove an exercise from a workout.

**Endpoint:**
```
DELETE /workouts/:workoutId/exercises/:exerciseId
```

**Authentication:** Required

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "deleted_at": "2025-12-21T15:55:00Z"
  },
  "message": "Exercise deleted successfully"
}
```

---

## 💪 WORKOUT SETS ENDPOINTS

### 9. ADD SET TO EXERCISE
Add a set to an exercise.

**Endpoint:**
```
POST /workouts/:workoutId/exercises/:exerciseId/sets
```

**Authentication:** Required

**Request Body:**
```json
{
  "set_number": 4,
  "reps": 5,
  "weight_kg": 116,
  "weight_lbs": 255,
  "rpe": 9,
  "notes": "Failed on rep 6"
}
```

**Response: Success (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "workout_exercise_id": "550e8400-e29b-41d4-a716-446655440020",
    "set_number": 4,
    "reps": 5,
    "weight_kg": 116,
    "weight_lbs": 255,
    "rpe": 9,
    "notes": "Failed on rep 6"
  },
  "message": "Set added successfully"
}
```

---

### 10. UPDATE SET
Modify a set's details.

**Endpoint:**
```
PUT /workouts/:workoutId/exercises/:exerciseId/sets/:setId
```

**Authentication:** Required

**Request Body:**
```json
{
  "reps": 6,
  "weight_kg": 120,
  "weight_lbs": 265,
  "rpe": 8,
  "notes": "Actually got all reps"
}
```

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "set_number": 4,
    "reps": 6,
    "weight_kg": 120,
    "weight_lbs": 265,
    "rpe": 8,
    "notes": "Actually got all reps",
    "updated_at": "2025-12-21T16:00:00Z"
  },
  "message": "Set updated successfully"
}
```

---

### 11. DELETE SET
Remove a set from an exercise.

**Endpoint:**
```
DELETE /workouts/:workoutId/exercises/:exerciseId/sets/:setId
```

**Authentication:** Required

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "deleted_at": "2025-12-21T16:05:00Z"
  },
  "message": "Set deleted successfully"
}
```

---

## 🏃 EXERCISE DEFINITIONS ENDPOINTS

### 12. GET EXERCISE (by ID)
Retrieve exercise definition details.

**Endpoint:**
```
GET /exercise-definitions/:id
```

**Authentication:** Required

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid-exercise-1",
    "name": "Barbell Squat",
    "category": "legs",
    "equipment": "barbell",
    "primary_muscle_group": "quads",
    "secondary_muscle_groups": "hamstrings, glutes, core",
    "description": "Place barbell on upper back...",
    "form_tips": "Keep chest up, knees tracking over toes...",
    "difficulty_level": "intermediate",
    "is_compound": true,
    "active": true
  }
}
```

---

### 13. LIST EXERCISE DEFINITIONS
Get all available exercises with filtering.

**Endpoint:**
```
GET /exercise-definitions
```

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `category` | string | all | Filter by muscle group |
| `equipment` | string | all | Filter by equipment |
| `difficulty` | string | all | beginner, intermediate, advanced |
| `search` | string | null | Search by name |
| `limit` | integer | 50 | Max results |
| `page` | integer | 1 | Pagination |

**Request Example:**
```
GET /exercise-definitions?category=legs&difficulty=intermediate&limit=20
Authorization: Bearer eyJhbGc...
```

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-exercise-1",
      "name": "Barbell Squat",
      "category": "legs",
      "equipment": "barbell",
      "primary_muscle_group": "quads",
      "difficulty_level": "intermediate",
      "is_compound": true
    },
    {
      "id": "uuid-exercise-2",
      "name": "Leg Press",
      "category": "legs",
      "equipment": "machine",
      "primary_muscle_group": "quads",
      "difficulty_level": "beginner",
      "is_compound": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3,
    "has_next": true
  }
}
```

---

## 🚴 CARDIO SESSIONS ENDPOINTS

### 14. CREATE CARDIO SESSION
Log a cardio activity.

**Endpoint:**
```
POST /cardio-sessions
```

**Authentication:** Required

**Request Body:**
```json
{
  "session_date": "2025-12-21T16:30:00Z",
  "session_name": "5K Run",
  "cardio_type": "running",
  "duration_minutes": 28,
  "distance_km": 5.0,
  "distance_miles": 3.1,
  "average_pace_min_per_km": 5.6,
  "average_pace_min_per_mile": 9.0,
  "average_heart_rate": 165,
  "max_heart_rate": 180,
  "calories_burned": 350,
  "intensity": "high",
  "notes": "Great run, felt strong",
  "source": "manual"
}
```

**Request Body Fields:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `session_date` | ISO 8601 | Yes | ≤ now() |
| `session_name` | string | Yes | max 255 chars |
| `cardio_type` | string | Yes | running, cycling, rowing, swimming, etc. |
| `duration_minutes` | integer | Yes | > 0 |
| `distance_km` | decimal | No | > 0 |
| `distance_miles` | decimal | No | > 0 |
| `average_pace_min_per_km` | decimal | No | > 0 |
| `average_pace_min_per_mile` | decimal | No | > 0 |
| `average_heart_rate` | integer | No | > 0 |
| `max_heart_rate` | integer | No | > 0 |
| `calories_burned` | decimal | No | > 0 |
| `intensity` | string | No | low, moderate, high, very_high |
| `notes` | string | No | max 500 chars |
| `source` | string | No | manual, strava, garmin, apple_health, fitbit |

**Response: Success (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "session_date": "2025-12-21T16:30:00Z",
    "session_name": "5K Run",
    "cardio_type": "running",
    "duration_minutes": 28,
    "distance_km": 5.0,
    "distance_miles": 3.1,
    "average_pace_min_per_km": 5.6,
    "average_pace_min_per_mile": 9.0,
    "average_heart_rate": 165,
    "max_heart_rate": 180,
    "calories_burned": 350,
    "intensity": "high",
    "notes": "Great run, felt strong",
    "source": "manual",
    "status": "completed",
    "created_at": "2025-12-21T16:35:00Z",
    "updated_at": "2025-12-21T16:35:00Z"
  },
  "message": "Cardio session logged successfully"
}
```

---

### 15. GET CARDIO SESSION
Retrieve a single cardio session.

**Endpoint:**
```
GET /cardio-sessions/:id
```

**Authentication:** Required

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "session_name": "5K Run",
    "cardio_type": "running",
    "duration_minutes": 28,
    "distance_miles": 3.1,
    "average_pace_min_per_mile": 9.0,
    "calories_burned": 350,
    "intensity": "high",
    "can_edit": true,
    "time_until_edit_window_expires": "23:45:30"
  }
}
```

---

### 16. UPDATE CARDIO SESSION
Modify a cardio session (within 24 hours).

**Endpoint:**
```
PUT /cardio-sessions/:id
```

**Authentication:** Required

**Request Body:**
```json
{
  "distance_miles": 3.2,
  "average_pace_min_per_mile": 8.75,
  "notes": "Actually went a bit further"
}
```

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "distance_miles": 3.2,
    "average_pace_min_per_mile": 8.75,
    "notes": "Actually went a bit further",
    "updated_at": "2025-12-21T16:40:00Z"
  },
  "message": "Cardio session updated successfully"
}
```

---

### 17. DELETE CARDIO SESSION
Remove a cardio session.

**Endpoint:**
```
DELETE /cardio-sessions/:id
```

**Authentication:** Required

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "deleted_at": "2025-12-21T16:45:00Z"
  },
  "message": "Cardio session deleted successfully"
}
```

---

### 18. LIST CARDIO SESSIONS
Get user's cardio sessions with filtering.

**Endpoint:**
```
GET /cardio-sessions
```

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `page` | integer | 1 | Pagination |
| `limit` | integer | 20 | Items per page |
| `sort` | string | -session_date | Sort order |
| `type` | string | all | Filter by cardio type |
| `date_from` | date | 30 days ago | Start date |
| `date_to` | date | today | End date |
| `intensity` | string | all | Filter by intensity |

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440040",
      "session_date": "2025-12-21T16:30:00Z",
      "session_name": "5K Run",
      "cardio_type": "running",
      "duration_minutes": 28,
      "distance_miles": 3.1,
      "intensity": "high"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "total_pages": 1,
    "has_next": false
  }
}
```

---

## 📊 PROGRESS ANALYTICS ENDPOINTS

### 19. GET PROGRESS - EXERCISE
Get strength progression for a specific exercise.

**Endpoint:**
```
GET /progress/exercises/:exerciseDefinitionId
```

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `period` | string | 12_weeks | 4_weeks, 12_weeks, 26_weeks, all_time |
| `metric` | string | max_weight | max_weight, avg_weight, total_volume |

**Request Example:**
```
GET /progress/exercises/uuid-exercise-1?period=12_weeks&metric=max_weight
Authorization: Bearer eyJhbGc...
```

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "exercise_id": "uuid-exercise-1",
    "exercise_name": "Barbell Squat",
    "period": "12_weeks",
    "metric": "max_weight",
    "unit": "lbs",
    "data_points": [
      {
        "week": 1,
        "date": "2025-09-21",
        "value": 185
      },
      {
        "week": 2,
        "date": "2025-09-28",
        "value": 190
      },
      {
        "week": 12,
        "date": "2025-12-21",
        "value": 245
      }
    ],
    "summary": {
      "starting_value": 185,
      "ending_value": 245,
      "total_improvement": 60,
      "improvement_percentage": 32.4,
      "average_improvement_per_week": 5.0,
      "times_performed": 24,
      "average_reps": 6.5
    }
  }
}
```

---

### 20. GET PROGRESS - CARDIO
Get cardio progression metrics.

**Endpoint:**
```
GET /progress/cardio
```

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `period` | string | 12_weeks | 4_weeks, 12_weeks, 26_weeks, all_time |
| `type` | string | running | running, cycling, rowing, swimming, all |
| `metric` | string | distance | distance, pace, duration, calories |

**Request Example:**
```
GET /progress/cardio?period=12_weeks&type=running&metric=pace
Authorization: Bearer eyJhbGc...
```

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "period": "12_weeks",
    "cardio_type": "running",
    "metric": "pace",
    "unit": "min/mile",
    "data_points": [
      {
        "week": 1,
        "date": "2025-09-21",
        "value": 8.5
      },
      {
        "week": 12,
        "date": "2025-12-21",
        "value": 7.45
      }
    ],
    "summary": {
      "starting_value": 8.5,
      "ending_value": 7.45,
      "improvement": 1.05,
      "improvement_percentage": 12.4,
      "total_sessions": 24,
      "total_distance_miles": 75.5,
      "average_duration_minutes": 31.5
    }
  }
}
```

---

### 21. GET WEEKLY SUMMARY
Get aggregated statistics for a specific week.

**Endpoint:**
```
GET /progress/weekly-summary
```

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `week` | date | current week | YYYY-MM-DD (Monday of week) |

**Request Example:**
```
GET /progress/weekly-summary?week=2025-12-15
Authorization: Bearer eyJhbGc...
```

**Response: Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "week_start": "2025-12-15",
    "week_end": "2025-12-21",
    "workouts_completed": 4,
    "workouts_planned": 5,
    "total_duration_minutes": 225,
    "total_volume_lbs": 12450,
    "total_reps": 156,
    "average_intensity": 6.5,
    "exercises_performed": 18,
    "unique_exercises": 12,
    "cardio_sessions": 2,
    "cardio_total_miles": 12.5,
    "cardio_total_minutes": 75,
    "workouts": [
      {
        "date": "2025-12-15",
        "day": "Monday",
        "name": "Back & Biceps",
        "duration": 45,
        "total_volume": 950
      }
    ],
    "comparison_to_previous_week": {
      "workouts_change": 1,
      "duration_change_minutes": -25,
      "volume_change_lbs": 350,
      "intensity_change": 0.3
    }
  }
}
```

---

## 📈 API USAGE EXAMPLES

### Complete Workout Logging Flow
```javascript
// 1. Create workout with exercises and sets
POST /workouts
{
  "workout_date": "2025-12-21T14:30:00Z",
  "workout_name": "Back & Biceps",
  "exercises": [...]
}
// Returns: { success: true, data: { id: "workout-123", ... } }

// 2. View the logged workout
GET /workouts/workout-123
// Returns: { success: true, data: { ... full details ... } }

// 3. Add another exercise within 24 hours
POST /workouts/workout-123/exercises
{ "exercise_definition_id": "...", ... }
// Returns: { success: true, data: { ... } }

// 4. Update a set
PUT /workouts/workout-123/exercises/exercise-456/sets/set-789
{ "reps": 8, "weight_lbs": 230 }
// Returns: { success: true, data: { ... } }

// 5. Delete the exercise
DELETE /workouts/workout-123/exercises/exercise-456
// Returns: { success: true, data: { ... } }
```

---

## 🔒 AUTHENTICATION & SECURITY

### JWT Token
- Required on all endpoints except `/health`
- Token included in `Authorization: Bearer <token>` header
- Token expiration: 24 hours
- Refresh token mechanism required for long sessions

### Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per user

### Data Validation
- All inputs validated on server side
- Numeric fields validated for type and range
- String fields validated for length and format
- Dates validated for logical correctness

### Permission Checks
- Users can only access their own workouts
- Edit window enforced (24 hours)
- Delete window enforced (24 hours for workouts)

---

## ✅ ENDPOINT COMPLETENESS CHECKLIST

### Workouts
- [x] Create (POST /workouts)
- [x] Read (GET /workouts/:id)
- [x] Update (PUT /workouts/:id)
- [x] Delete (DELETE /workouts/:id)
- [x] List (GET /workouts)

### Workout Exercises
- [x] Add (POST /workouts/:id/exercises)
- [x] Update (PUT /workouts/:id/exercises/:exerciseId)
- [x] Delete (DELETE /workouts/:id/exercises/:exerciseId)

### Workout Sets
- [x] Add (POST /workouts/:id/exercises/:exerciseId/sets)
- [x] Update (PUT /workouts/:id/exercises/:exerciseId/sets/:setId)
- [x] Delete (DELETE /workouts/:id/exercises/:exerciseId/sets/:setId)

### Exercise Definitions
- [x] Get (GET /exercise-definitions/:id)
- [x] List (GET /exercise-definitions)

### Cardio Sessions
- [x] Create (POST /cardio-sessions)
- [x] Read (GET /cardio-sessions/:id)
- [x] Update (PUT /cardio-sessions/:id)
- [x] Delete (DELETE /cardio-sessions/:id)
- [x] List (GET /cardio-sessions)

### Analytics
- [x] Exercise Progress (GET /progress/exercises/:id)
- [x] Cardio Progress (GET /progress/cardio)
- [x] Weekly Summary (GET /progress/weekly-summary)

**Total Endpoints:** 21 ✅
**Status:** COMPLETE AND READY FOR IMPLEMENTATION

---

## 🚀 IMPLEMENTATION NOTES

### Database Queries Required
- Index on `workouts.user_id` (for filtering user's workouts)
- Index on `workouts.workout_date` (for sorting by date)
- Index on `workout_sets.weight_kg`, `workout_sets.weight_lbs` (for progress queries)
- Index on `cardio_sessions.user_id`, `cardio_sessions.session_date`

### Error Handling
- All errors return appropriate HTTP status codes
- Error messages are user-friendly
- Validation errors include field-level details

### Response Consistency
- All successful responses use `success: true`
- All error responses use `success: false`
- All responses include `data` or `error` field
- Paginated responses include `pagination` object

### Testing Strategy
- Unit tests for all validation logic
- Integration tests for CRUD operations
- Tests for permission enforcement
- Tests for 24-hour window enforcement

---

**API specification is COMPLETE and PRODUCTION-READY.**

Status: ✅ Ready for backend implementation
Next: Create API documentation and Postman collection
