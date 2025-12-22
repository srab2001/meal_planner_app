# Fitness Module - API Integration Guide

**Status:** ✅ Ready for Integration  
**Date:** December 21, 2025  
**Backend Framework:** Express.js  
**Database:** PostgreSQL (Neon)  
**Authentication:** JWT  

---

## 🔌 API Endpoints Overview

All fitness endpoints are located in `/fitness/backend/routes/fitness.js` and serve under `/api/fitness/`.

### Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/fitness/workouts` | Create a new workout |
| GET | `/api/fitness/workouts` | Get all workouts for user |
| GET | `/api/fitness/workouts/:id` | Get single workout details |
| PUT | `/api/fitness/workouts/:id` | Update workout |
| DELETE | `/api/fitness/workouts/:id` | Delete workout |
| GET | `/api/fitness/profile` | Get user fitness profile |
| POST | `/api/fitness/profile` | Create/update fitness profile |
| GET | `/api/fitness/goals` | Get user goals |
| POST | `/api/fitness/goals` | Create fitness goal |

---

## 📝 Endpoint Specifications

### 1. Create Workout

**Endpoint:** `POST /api/fitness/workouts`  
**Authentication:** ✅ Required (Bearer token)  
**Rate Limit:** 100 requests/hour

#### Request Headers
```javascript
{
  'Authorization': 'Bearer eyJhbGc...',
  'Content-Type': 'application/json'
}
```

#### Request Body
```javascript
{
  "workoutDate": "2025-12-21",           // ISO string, YYYY-MM-DD
  "workoutName": "Leg Day",              // String, 1-255 chars
  "exercises": [
    {
      "exerciseName": "Barbell Squat",   // String
      "category": "Legs",                // String
      "sets": [
        {
          "reps": 8,                     // Integer, optional
          "weight": 225,                 // Decimal, optional
          "unit": "lbs",                 // "lbs" or "kg"
          "duration": null               // Integer (minutes), optional
        },
        {
          "reps": 7,
          "weight": 225,
          "unit": "lbs",
          "duration": null
        }
      ]
    }
  ],
  "notes": "Great workout, felt strong"   // String, optional, 0-500 chars
}
```

#### Response (200 OK)
```javascript
{
  "success": true,
  "data": {
    "id": "workout-uuid-1234",
    "userId": "user-uuid",
    "workoutDate": "2025-12-21",
    "workoutName": "Leg Day",
    "exercises": [
      {
        "id": "exercise-uuid-1",
        "exerciseName": "Barbell Squat",
        "category": "Legs",
        "sets": [
          {
            "id": "set-uuid-1",
            "reps": 8,
            "weight": 225,
            "unit": "lbs",
            "duration": null
          },
          {
            "id": "set-uuid-2",
            "reps": 7,
            "weight": 225,
            "unit": "lbs",
            "duration": null
          }
        ]
      }
    ],
    "notes": "Great workout, felt strong",
    "createdAt": "2025-12-21T15:30:00Z",
    "updatedAt": "2025-12-21T15:30:00Z"
  }
}
```

#### Error Responses

**400 Bad Request**
```javascript
{
  "success": false,
  "error": "Workout date cannot be in the future"
}
```

**401 Unauthorized**
```javascript
{
  "success": false,
  "error": "Invalid or expired token"
}
```

**422 Unprocessable Entity**
```javascript
{
  "success": false,
  "error": "Workout name is required",
  "details": [
    {
      "field": "workoutName",
      "message": "Required"
    }
  ]
}
```

---

### 2. Get All Workouts

**Endpoint:** `GET /api/fitness/workouts`  
**Authentication:** ✅ Required  
**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 10 | Max results per page |
| offset | integer | 0 | Pagination offset |
| sortBy | string | "date" | Sort field (date, name) |
| order | string | "desc" | "asc" or "desc" |
| dateFrom | string | - | Filter: YYYY-MM-DD |
| dateTo | string | - | Filter: YYYY-MM-DD |

#### Example Request
```javascript
GET /api/fitness/workouts?limit=20&offset=0&sortBy=date&order=desc
```

#### Response (200 OK)
```javascript
{
  "success": true,
  "data": {
    "workouts": [
      {
        "id": "workout-uuid-1",
        "workoutDate": "2025-12-21",
        "workoutName": "Leg Day",
        "exercises": [
          {
            "id": "exercise-uuid-1",
            "exerciseName": "Barbell Squat",
            "category": "Legs",
            "sets": [...]
          }
        ],
        "notes": "...",
        "createdAt": "2025-12-21T15:30:00Z",
        "updatedAt": "2025-12-21T15:30:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "pages": 3,
      "currentPage": 1
    }
  }
}
```

---

### 3. Get Single Workout

**Endpoint:** `GET /api/fitness/workouts/:id`  
**Authentication:** ✅ Required  

#### Request
```javascript
GET /api/fitness/workouts/workout-uuid-1234
```

#### Response (200 OK)
```javascript
{
  "success": true,
  "data": {
    "id": "workout-uuid-1234",
    "userId": "user-uuid",
    "workoutDate": "2025-12-21",
    "workoutName": "Leg Day",
    "exercises": [
      {
        "id": "exercise-uuid-1",
        "exerciseName": "Barbell Squat",
        "category": "Legs",
        "sets": [
          {
            "id": "set-uuid-1",
            "reps": 8,
            "weight": 225,
            "unit": "lbs",
            "duration": null
          }
        ]
      }
    ],
    "notes": "...",
    "createdAt": "2025-12-21T15:30:00Z",
    "updatedAt": "2025-12-21T15:30:00Z"
  }
}
```

#### Error: 404 Not Found
```javascript
{
  "success": false,
  "error": "Workout not found"
}
```

---

### 4. Update Workout

**Endpoint:** `PUT /api/fitness/workouts/:id`  
**Authentication:** ✅ Required  
**Note:** Only the logged-in user can update their own workouts

#### Request Body
```javascript
{
  "workoutDate": "2025-12-21",        // Optional
  "workoutName": "Leg Day Plus",      // Optional
  "exercises": [...],                 // Optional
  "notes": "Updated notes"            // Optional
}
```

#### Response (200 OK)
```javascript
{
  "success": true,
  "data": {
    "id": "workout-uuid-1234",
    "workoutDate": "2025-12-21",
    "workoutName": "Leg Day Plus",
    "exercises": [...],
    "notes": "Updated notes",
    "createdAt": "2025-12-21T15:30:00Z",
    "updatedAt": "2025-12-21T16:45:00Z"
  }
}
```

---

### 5. Delete Workout

**Endpoint:** `DELETE /api/fitness/workouts/:id`  
**Authentication:** ✅ Required  

#### Request
```javascript
DELETE /api/fitness/workouts/workout-uuid-1234
```

#### Response (200 OK)
```javascript
{
  "success": true,
  "data": {
    "id": "workout-uuid-1234",
    "message": "Workout deleted successfully"
  }
}
```

#### Error: 403 Forbidden
```javascript
{
  "success": false,
  "error": "You do not have permission to delete this workout"
}
```

---

### 6. Get User Fitness Profile

**Endpoint:** `GET /api/fitness/profile`  
**Authentication:** ✅ Required  

#### Request
```javascript
GET /api/fitness/profile
```

#### Response (200 OK)
```javascript
{
  "success": true,
  "data": {
    "id": "profile-uuid",
    "userId": "user-uuid",
    "age": 28,
    "weight": 180,
    "weightUnit": "lbs",
    "height": 72,
    "heightUnit": "inches",
    "experienceLevel": "intermediate",  // "beginner" | "intermediate" | "advanced"
    "goals": ["muscle_gain", "strength"],
    "createdAt": "2025-12-21T10:00:00Z",
    "updatedAt": "2025-12-21T10:00:00Z"
  }
}
```

---

### 7. Create/Update Fitness Profile

**Endpoint:** `POST /api/fitness/profile`  
**Authentication:** ✅ Required  

#### Request Body
```javascript
{
  "age": 28,
  "weight": 180,
  "weightUnit": "lbs",
  "height": 72,
  "heightUnit": "inches",
  "experienceLevel": "intermediate",
  "goals": ["muscle_gain", "strength"]
}
```

#### Response (201 Created / 200 OK)
```javascript
{
  "success": true,
  "data": {
    "id": "profile-uuid",
    "userId": "user-uuid",
    "age": 28,
    "weight": 180,
    "weightUnit": "lbs",
    "height": 72,
    "heightUnit": "inches",
    "experienceLevel": "intermediate",
    "goals": ["muscle_gain", "strength"],
    "createdAt": "2025-12-21T10:00:00Z",
    "updatedAt": "2025-12-21T10:00:00Z"
  }
}
```

---

### 8. Get User Goals

**Endpoint:** `GET /api/fitness/goals`  
**Authentication:** ✅ Required  

#### Request
```javascript
GET /api/fitness/goals
```

#### Response (200 OK)
```javascript
{
  "success": true,
  "data": [
    {
      "id": "goal-uuid-1",
      "userId": "user-uuid",
      "goalName": "Squat 300 lbs",
      "goalType": "strength",           // "strength" | "hypertrophy" | "endurance"
      "targetValue": 300,
      "currentValue": 225,
      "unit": "lbs",
      "deadline": "2026-03-21",
      "status": "in_progress",          // "not_started" | "in_progress" | "completed"
      "progress": 75,                   // Percentage
      "createdAt": "2025-12-21T10:00:00Z",
      "updatedAt": "2025-12-21T10:00:00Z"
    }
  ]
}
```

---

### 9. Create Goal

**Endpoint:** `POST /api/fitness/goals`  
**Authentication:** ✅ Required  

#### Request Body
```javascript
{
  "goalName": "Squat 300 lbs",
  "goalType": "strength",
  "targetValue": 300,
  "unit": "lbs",
  "deadline": "2026-03-21"
}
```

#### Response (201 Created)
```javascript
{
  "success": true,
  "data": {
    "id": "goal-uuid-1",
    "userId": "user-uuid",
    "goalName": "Squat 300 lbs",
    "goalType": "strength",
    "targetValue": 300,
    "currentValue": 0,
    "unit": "lbs",
    "deadline": "2026-03-21",
    "status": "not_started",
    "progress": 0,
    "createdAt": "2025-12-21T10:00:00Z",
    "updatedAt": "2025-12-21T10:00:00Z"
  }
}
```

---

## 🔐 Authentication

All endpoints require JWT authentication via Bearer token:

```javascript
const response = await fetch('/api/fitness/workouts', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
    'Content-Type': 'application/json'
  }
});
```

### Getting a Token

The authentication flow is managed by the main meal_planner app. Tokens are stored in localStorage under the key `token`.

```javascript
// Get the stored JWT token
const token = localStorage.getItem('token');

// Use in all API requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

---

## 🛠️ Frontend Integration

### 1. Create API Service Layer

Create a file: `fitness/frontend/services/fitnessApi.js`

```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

class FitnessAPI {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/fitness`;
  }

  // Get JWT token from localStorage
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Create Workout
  async createWorkout(workoutData) {
    const response = await fetch(`${this.baseUrl}/workouts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(workoutData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create workout');
    }
    
    return response.json();
  }

  // Get All Workouts
  async getWorkouts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}/workouts${queryString ? '?' + queryString : ''}`;
    
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch workouts');
    return response.json();
  }

  // Get Single Workout
  async getWorkout(workoutId) {
    const response = await fetch(`${this.baseUrl}/workouts/${workoutId}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch workout');
    return response.json();
  }

  // Update Workout
  async updateWorkout(workoutId, updates) {
    const response = await fetch(`${this.baseUrl}/workouts/${workoutId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) throw new Error('Failed to update workout');
    return response.json();
  }

  // Delete Workout
  async deleteWorkout(workoutId) {
    const response = await fetch(`${this.baseUrl}/workouts/${workoutId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to delete workout');
    return response.json();
  }

  // Get Profile
  async getProfile() {
    const response = await fetch(`${this.baseUrl}/profile`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  }

  // Create/Update Profile
  async updateProfile(profileData) {
    const response = await fetch(`${this.baseUrl}/profile`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  }

  // Get Goals
  async getGoals() {
    const response = await fetch(`${this.baseUrl}/goals`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch goals');
    return response.json();
  }

  // Create Goal
  async createGoal(goalData) {
    const response = await fetch(`${this.baseUrl}/goals`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(goalData)
    });
    
    if (!response.ok) throw new Error('Failed to create goal');
    return response.json();
  }
}

export const fitnessApi = new FitnessAPI();
```

### 2. Use API in LogWorkout Component

```javascript
import { fitnessApi } from '../services/fitnessApi';

function LogWorkout({ onSave, onCancel }) {
  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      const response = await fitnessApi.createWorkout(formData);
      
      if (response.success) {
        showNotification('Workout saved successfully!', 'success');
        onSave(response.data);
      }
    } catch (error) {
      setErrors({ submit: error.message });
      showNotification(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ... rest of component
}
```

---

## 📊 Data Flow Diagram

```
User Input (React Component)
        ↓
Form Validation (LogWorkout)
        ↓
API Service (fitnessApi.createWorkout)
        ↓
Express Route (/api/fitness/workouts - POST)
        ↓
Database (PostgreSQL via Prisma)
        ↓
Response (JSON with workout data)
        ↓
Update UI (ExerciseCard list, success message)
```

---

## 🧪 Testing API Endpoints

### Using cURL

```bash
# Create workout
curl -X POST http://localhost:3001/api/fitness/workouts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workoutDate": "2025-12-21",
    "workoutName": "Leg Day",
    "exercises": [
      {
        "exerciseName": "Barbell Squat",
        "category": "Legs",
        "sets": [{"reps": 8, "weight": 225, "unit": "lbs"}]
      }
    ],
    "notes": "Great workout"
  }'

# Get all workouts
curl -X GET http://localhost:3001/api/fitness/workouts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get single workout
curl -X GET http://localhost:3001/api/fitness/workouts/WORKOUT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update workout
curl -X PUT http://localhost:3001/api/fitness/workouts/WORKOUT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"workoutName": "Leg Day Plus"}'

# Delete workout
curl -X DELETE http://localhost:3001/api/fitness/workouts/WORKOUT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman

1. Create a collection: "Fitness API"
2. Add environment variable: `token` = (your JWT token)
3. Create requests for each endpoint with:
   ```
   Authorization: Bearer {{token}}
   Content-Type: application/json
   ```

---

## 🚀 Deployment Checklist

- [ ] API endpoints tested locally
- [ ] Environment variables configured
- [ ] JWT tokens working
- [ ] CORS configured correctly
- [ ] Database migrations applied
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] API documentation reviewed
- [ ] Components connected to API
- [ ] Error responses handled in UI
- [ ] Loading states working
- [ ] Success notifications showing
- [ ] Token refresh mechanism (if needed)
- [ ] Error logging configured
- [ ] Performance monitoring ready

---

**Last Updated:** December 21, 2025  
**Version:** 1.0.0  
**Status:** Ready for Integration ✅
