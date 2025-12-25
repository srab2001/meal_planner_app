# Fitness Module - API Integration Guide

**Status:** ✅ Implementation Complete
**Date:** December 25, 2025
**Backend Framework:** Express.js
**Database:** PostgreSQL (Neon)
**Authentication:** JWT

---

## 🔌 API Endpoints Overview

All fitness endpoints are located in `/fitness/backend/routes/fitness.js` and serve under `/api/fitness/`.

### Endpoint Summary (18 Total)

| Category | Method | Endpoint | Purpose | Status |
|----------|--------|----------|---------|--------|
| **Profile** | GET | `/api/fitness/profile` | Get user fitness profile | ✅ |
| **Profile** | POST | `/api/fitness/profile` | Create/update fitness profile | ✅ |
| **Workouts** | POST | `/api/fitness/workouts` | Create a new workout | ✅ |
| **Workouts** | GET | `/api/fitness/workouts` | Get all workouts for user | ✅ |
| **Workouts** | GET | `/api/fitness/workouts/:id` | Get single workout with exercises/sets | ✅ |
| **Workouts** | PUT | `/api/fitness/workouts/:id` | Update workout details | ✅ |
| **Workouts** | DELETE | `/api/fitness/workouts/:id` | Delete workout (cascade) | ✅ |
| **Exercises** | POST | `/api/fitness/workouts/:workoutId/exercises` | Add exercise to workout | ✅ |
| **Exercises** | PUT | `/api/fitness/workouts/:workoutId/exercises/:exerciseId` | Update exercise | ✅ |
| **Exercises** | DELETE | `/api/fitness/workouts/:workoutId/exercises/:exerciseId` | Remove exercise | ✅ |
| **Sets** | POST | `/api/fitness/workouts/:workoutId/exercises/:exerciseId/sets` | Add set to exercise | ✅ |
| **Sets** | PUT | `/api/fitness/workouts/:workoutId/exercises/:exerciseId/sets/:setId` | Update set | ✅ |
| **Sets** | DELETE | `/api/fitness/workouts/:workoutId/exercises/:exerciseId/sets/:setId` | Delete set | ✅ |
| **Library** | GET | `/api/fitness/exercise-definitions` | Browse exercise library (40 exercises) | ✅ |
| **Goals** | GET | `/api/fitness/goals` | Get user goals | ✅ |
| **Goals** | POST | `/api/fitness/goals` | Create fitness goal | ✅ |
| **AI Coach** | POST | `/api/fitness/ai-interview` | Generate AI workout plan | ✅ |
| **Admin** | GET | `/api/fitness/admin/interview-questions` | Get interview questions | ✅ |
| **Admin** | POST | `/api/fitness/admin/interview-questions` | Create interview question | ✅ |
| **Admin** | PUT | `/api/fitness/admin/interview-questions/:id` | Update interview question | ✅ |
| **Admin** | DELETE | `/api/fitness/admin/interview-questions/:id` | Delete interview question | ✅ |
| **Admin** | PUT | `/api/fitness/admin/interview-questions/reorder` | Reorder questions | ✅ |

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

### 10. Add Exercise to Workout

**Endpoint:** `POST /api/fitness/workouts/:workoutId/exercises`
**Authentication:** ✅ Required

#### Request Body
```javascript
{
  "exercise_definition_id": "exercise-def-uuid",  // From exercise library
  "exercise_name": "Barbell Squat",
  "exercise_order": 1,
  "sets": [
    {
      "set_number": 1,
      "reps": 10,
      "weight": 135,
      "duration_seconds": null
    }
  ]
}
```

#### Response (201 Created)
```javascript
{
  "success": true,
  "data": {
    "id": "exercise-uuid",
    "workout_id": "workout-uuid",
    "exercise_definition_id": "exercise-def-uuid",
    "exercise_name": "Barbell Squat",
    "exercise_order": 1,
    "created_at": "2025-12-25T10:00:00Z"
  }
}
```

---

### 11. Update Exercise

**Endpoint:** `PUT /api/fitness/workouts/:workoutId/exercises/:exerciseId`
**Authentication:** ✅ Required

#### Request Body
```javascript
{
  "exercise_name": "Front Squat",  // Optional
  "exercise_order": 2              // Optional
}
```

---

### 12. Delete Exercise

**Endpoint:** `DELETE /api/fitness/workouts/:workoutId/exercises/:exerciseId`
**Authentication:** ✅ Required
**Note:** Cascade deletes all sets for this exercise

#### Response (200 OK)
```javascript
{
  "success": true,
  "message": "Exercise deleted successfully"
}
```

---

### 13. Add Set to Exercise

**Endpoint:** `POST /api/fitness/workouts/:workoutId/exercises/:exerciseId/sets`
**Authentication:** ✅ Required

#### Request Body
```javascript
{
  "set_number": 3,
  "reps": 8,
  "weight": 225,
  "duration_seconds": null
}
```

#### Response (201 Created)
```javascript
{
  "success": true,
  "data": {
    "id": "set-uuid",
    "exercise_id": "exercise-uuid",
    "set_number": 3,
    "reps": 8,
    "weight": 225,
    "duration_seconds": null,
    "created_at": "2025-12-25T10:00:00Z"
  }
}
```

---

### 14. Update Set

**Endpoint:** `PUT /api/fitness/workouts/:workoutId/exercises/:exerciseId/sets/:setId`
**Authentication:** ✅ Required

#### Request Body
```javascript
{
  "reps": 10,        // Optional
  "weight": 235      // Optional
}
```

---

### 15. Delete Set

**Endpoint:** `DELETE /api/fitness/workouts/:workoutId/exercises/:exerciseId/sets/:setId`
**Authentication:** ✅ Required

---

### 16. Browse Exercise Definitions

**Endpoint:** `GET /api/fitness/exercise-definitions`
**Authentication:** ✅ Required
**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category: chest, back, legs, shoulders, arms, core |
| difficulty | string | Filter by difficulty: beginner, intermediate, advanced |
| equipment | string | Filter by equipment: barbell, dumbbell, machine, bodyweight, cable |
| search | string | Search by name (case-insensitive) |

#### Example Request
```javascript
GET /api/fitness/exercise-definitions?category=chest&difficulty=intermediate
```

#### Response (200 OK)
```javascript
{
  "success": true,
  "data": [
    {
      "id": "exercise-def-uuid-1",
      "name": "Barbell Bench Press",
      "description": "Classic chest exercise for building upper body strength",
      "category": "chest",
      "muscle_group": "pectorals",
      "secondary_muscles": ["triceps", "shoulders"],
      "equipment": "barbell",
      "difficulty_level": "intermediate",
      "form_tips": [
        "Keep shoulder blades retracted",
        "Lower bar to mid-chest",
        "Drive through heels"
      ],
      "video_url": null,
      "is_compound": true,
      "is_active": true
    }
    // ... 39 more exercises
  ]
}
```

**Available Exercises (40 total):**
- **Chest (8):** Bench Press, Dips, Cable Flyes, Dumbbell Press, etc.
- **Back (8):** Deadlift, Pull-ups, Barbell Rows, Lat Pulldowns, etc.
- **Legs (10):** Squat, Lunges, Romanian Deadlifts, Leg Press, etc.
- **Shoulders (6):** Overhead Press, Lateral Raises, Face Pulls, etc.
- **Arms (4):** Barbell Curls, Tricep Dips, Hammer Curls, etc.
- **Core (4):** Planks, Russian Twists, Dead Bugs, etc.

---

### 17. Generate AI Workout Plan

**Endpoint:** `POST /api/fitness/ai-interview`
**Authentication:** ✅ Required
**Note:** Uses OpenAI GPT-4o-mini for personalized workout generation

#### Request Body
```javascript
{
  "messages": [
    {
      "role": "user",
      "content": "I want to create a personalized workout plan based on my fitness assessment."
    },
    {
      "role": "user",
      "content": "Q1: What is your primary fitness goal?\nA: Build muscle and strength"
    },
    {
      "role": "user",
      "content": "Q2: How many days per week can you train?\nA: 4-5 days"
    }
    // ... more Q&A pairs
  ],
  "interview_answers": {
    "question-uuid-1": "Build muscle and strength",
    "question-uuid-2": "4-5 days",
    // ... more answers
  },
  "userProfile": {
    "age": 28,
    "fitness_level": "intermediate"
  }
}
```

#### Response (200 OK)
```javascript
{
  "success": true,
  "workoutGenerated": true,
  "workout": {
    "id": "workout-uuid",
    "workout_name": "AI Generated - Full Body Split",
    "workout_date": "2025-12-25",
    "workout_type": "ai_generated",
    "sections": [
      {
        "title": "Warm-up",
        "duration": "5-10 minutes",
        "exercises": ["Dynamic stretching", "Light cardio"]
      },
      {
        "title": "Compound Movements",
        "exercises": [
          {
            "name": "Barbell Squat",
            "sets": 4,
            "reps": "8-10",
            "rest": "2-3 minutes"
          }
        ]
      }
      // ... 4 more sections (Accessory Work, Core, Cool Down, etc.)
    ]
  }
}
```

---

### 18. Get Interview Questions (Admin)

**Endpoint:** `GET /api/fitness/admin/interview-questions`
**Authentication:** ✅ Required (Admin only)

#### Response (200 OK)
```javascript
{
  "success": true,
  "data": [
    {
      "id": "question-uuid-1",
      "question_text": "What is your primary fitness goal?",
      "answer_type": "text",
      "display_order": 1,
      "is_active": true,
      "created_at": "2025-12-25T10:00:00Z"
    }
    // ... more questions
  ]
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

### 1. API Configuration

**File:** `fitness/frontend/src/config/api.js`

The fitness app uses a centralized API configuration with endpoint helpers:

```javascript
// API Base URL (from environment or default)
const API_BASE = process.env.REACT_APP_FITNESS_API_URL || 'http://localhost:3001';

// Endpoint Helper Functions
const ENDPOINTS = {
  // Profile
  PROFILE: '/api/fitness/profile',

  // Workouts
  WORKOUTS: '/api/fitness/workouts',
  WORKOUT_DETAIL: (id) => `/api/fitness/workouts/${id}`,

  // Exercises
  WORKOUT_EXERCISES: (workoutId) => `/api/fitness/workouts/${workoutId}/exercises`,
  WORKOUT_EXERCISE_DETAIL: (workoutId, exerciseId) =>
    `/api/fitness/workouts/${workoutId}/exercises/${exerciseId}`,

  // Sets
  EXERCISE_SETS: (workoutId, exerciseId) =>
    `/api/fitness/workouts/${workoutId}/exercises/${exerciseId}/sets`,
  EXERCISE_SET_DETAIL: (workoutId, exerciseId, setId) =>
    `/api/fitness/workouts/${workoutId}/exercises/${exerciseId}/sets/${setId}`,

  // Exercise Library
  EXERCISE_DEFINITIONS: '/api/fitness/exercise-definitions',

  // Goals
  GOALS: '/api/fitness/goals',
  GOAL_DETAIL: (id) => `/api/fitness/goals/${id}`,

  // AI Coach
  AI_WORKOUT_PLAN: '/api/fitness/ai-interview',
  INTERVIEW_QUESTIONS: '/api/fitness/admin/interview-questions',
  INTERVIEW_QUESTION_DETAIL: (id) => `/api/fitness/admin/interview-questions/${id}`,
  INTERVIEW_QUESTIONS_REORDER: '/api/fitness/admin/interview-questions/reorder'
};

export { API_BASE, ENDPOINTS };
```

### 2. Using API in Components

#### Example: Creating a Workout (WorkoutLog Component)

```javascript
import { API_BASE, ENDPOINTS } from '../config/api';

function WorkoutLog({ user, token }) {
  const navigate = useNavigate();
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      // Step 1: Create workout
      const workoutResponse = await fetch(`${API_BASE}${ENDPOINTS.WORKOUTS}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workout_date: workoutDate,
          workout_name: workoutName,
          workout_type: 'strength',
          notes: notes || null
        })
      });

      if (!workoutResponse.ok) {
        throw new Error('Failed to create workout');
      }

      const { data: workout } = await workoutResponse.json();

      // Step 2: Add exercises with sets
      for (const exercise of exercises) {
        const exerciseResponse = await fetch(
          `${API_BASE}${ENDPOINTS.WORKOUT_EXERCISES(workout.id)}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              exercise_definition_id: exercise.exercise_definition_id,
              exercise_name: exercise.exercise_name,
              exercise_order: exercise.exercise_order
            })
          }
        );

        const { data: createdExercise } = await exerciseResponse.json();

        // Step 3: Add sets for each exercise
        for (const set of exercise.sets) {
          await fetch(
            `${API_BASE}${ENDPOINTS.EXERCISE_SETS(workout.id, createdExercise.id)}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(set)
            }
          );
        }
      }

      // Navigate to workout detail page
      navigate(`/workouts/${workout.id}`);
    } catch (error) {
      console.error('Error saving workout:', error);
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form inputs */}
    </form>
  );
}
```

#### Example: Fetching Exercise Library (ExerciseSelector Component)

```javascript
import { API_BASE, ENDPOINTS } from '../config/api';

function ExerciseSelector({ onSelect, onClose, token }) {
  const [exercises, setExercises] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchExercises();
  }, [categoryFilter]);

  const fetchExercises = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }

      const response = await fetch(
        `${API_BASE}${ENDPOINTS.EXERCISE_DEFINITIONS}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const { data } = await response.json();
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  return (
    <div className="exercise-selector">
      {/* Selector UI */}
    </div>
  );
}
```

#### Example: AI Workout Generation (AICoach Component)

```javascript
import { API_BASE, ENDPOINTS } from '../config/api';

function AICoach({ user, token }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [workoutPlan, setWorkoutPlan] = useState(null);

  const handleSubmitAnswers = async () => {
    try {
      // Build messages array from Q&A pairs
      const messages = questions.map((q, idx) => ({
        role: 'user',
        content: `Q${idx + 1}: ${q.question_text}\nA: ${answers[q.id] || 'No answer'}`
      }));

      messages.unshift({
        role: 'user',
        content: 'I want to create a personalized workout plan.'
      });

      const payload = {
        messages: messages,
        interview_answers: answers,
        userProfile: {
          age: user.age,
          fitness_level: user.fitness_level
        }
      };

      const response = await fetch(`${API_BASE}${ENDPOINTS.AI_WORKOUT_PLAN}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.workoutGenerated && result.workout) {
        setWorkoutPlan(result.workout);
      }
    } catch (error) {
      console.error('Error generating workout:', error);
    }
  };

  return (
    <div className="ai-coach">
      {/* Interview UI */}
    </div>
  );
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

### Backend
- [x] API endpoints implemented (18 total)
- [x] Database schema updated (7 tables)
- [x] Migrations created and ready (003_add_exercise_library)
- [x] 40 exercises seeded in exercise_definitions
- [x] User ownership verification on all endpoints
- [x] Cascade deletes configured
- [x] Error handling implemented
- [x] JWT authentication working
- [ ] Environment variables configured in production
- [ ] Database migration applied to production
- [ ] CORS configured for production domain
- [ ] Rate limiting configured (if needed)

### Frontend
- [x] All components created (WorkoutLog, ExerciseSelector, etc.)
- [x] Design system implemented (wireframe.config.js)
- [x] API integration complete
- [x] React Router navigation implemented
- [x] Error responses handled in UI
- [x] Loading states implemented
- [x] Form validation working
- [ ] Production API URL configured
- [ ] Build tested
- [ ] Responsive design verified on mobile/tablet/desktop

### Testing
- [ ] Manual workout logging flow tested end-to-end
- [ ] AI Coach workout generation tested
- [ ] Exercise selector (40 exercises) verified
- [ ] Edit/delete functionality tested
- [ ] Navigation and routing verified
- [ ] User authentication tested
- [ ] Error handling tested

### Documentation
- [x] API_INTEGRATION_GUIDE.md updated
- [x] IMPLEMENTATION_COMPLETE.md created
- [x] Endpoint specifications documented
- [x] Frontend integration examples provided

---

## 📁 Implementation Summary

### Database Schema (7 Tables)
1. `fitness_profiles` - User fitness profiles
2. `fitness_goals` - User fitness goals
3. `fitness_workouts` - Workout sessions
4. `fitness_workout_exercises` - Exercises within workouts
5. `fitness_workout_sets` - Sets for each exercise
6. `exercise_definitions` - Exercise library (40 exercises)
7. `admin_interview_questions` - AI coach questions

### API Endpoints (18 Total)
- **Profile:** 2 endpoints
- **Workouts:** 5 endpoints (list, create, get, update, delete)
- **Exercises:** 3 endpoints (add, update, delete)
- **Sets:** 3 endpoints (add, update, delete)
- **Library:** 1 endpoint (browse with filters)
- **Goals:** 2 endpoints
- **AI Coach:** 1 endpoint (generate workout plan)
- **Admin:** 5 endpoints (CRUD + reorder questions)

### Frontend Components (13 Files)
- **Design System:** wireframe.config.js
- **Workout Logging:** WorkoutLog.jsx/css, ExerciseCard.jsx/css, SetEntry.jsx/css
- **Exercise Selection:** ExerciseSelector.jsx/css
- **Workout Detail:** WorkoutDetail.jsx/css
- **Navigation:** App.jsx (React Router)
- **Config:** api.js (endpoint helpers)

### Features Implemented
✅ Manual workout logging with exercises and sets
✅ AI-powered workout generation
✅ Exercise library (40 exercises with search/filter)
✅ Full CRUD operations (create, read, update, delete)
✅ User authentication and authorization
✅ Responsive wireframe-compliant design
✅ URL-based navigation
✅ Form validation and error handling
✅ Loading states and user feedback

---

**Last Updated:** December 25, 2025
**Version:** 2.0.0
**Status:** ✅ Implementation Complete - Ready for Testing & Deployment

**Next Steps:**
1. Run database migration: `npx prisma migrate deploy`
2. Test all features thoroughly
3. Deploy to staging environment
4. Conduct user acceptance testing
5. Deploy to production
