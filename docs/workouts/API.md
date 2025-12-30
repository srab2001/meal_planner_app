# Workout Tracking - API Reference

## Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer <jwt_token>
```

## Response Format

**Success:**
```json
{
  "ok": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "ok": false,
  "error_code": "error_type",
  "message": "Human readable message"
}
```

---

## Templates

### GET /api/workouts/templates

List user's workout templates with derived status.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| search | string | Filter by name (case-insensitive) |
| filter | string | `all`, `not_started`, `in_progress`, `done` |

**Response:**
```json
{
  "ok": true,
  "templates": [
    {
      "id": "uuid",
      "name": "Full Body Strength",
      "notes": "Mon/Wed/Fri routine",
      "exercise_count": 5,
      "status": "done",
      "last_completed_at": "2025-01-20T08:45:00Z",
      "in_progress_session_id": null,
      "latest_finished_session_id": "session-uuid",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### POST /api/workouts/templates

Create a new workout template.

**Request:**
```json
{
  "name": "HIIT Cardio",
  "notes": "20 seconds on, 10 seconds rest",
  "exercises": [
    {
      "name": "Burpees",
      "prescription_type": "time",
      "sets": 4,
      "seconds": 20,
      "rest_seconds": 10
    },
    {
      "name": "Mountain Climbers",
      "prescription_type": "time",
      "sets": 4,
      "seconds": 20,
      "rest_seconds": 10
    }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "template": {
    "id": "new-uuid",
    "name": "HIIT Cardio",
    "notes": "20 seconds on, 10 seconds rest",
    "exercises": [...]
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| `missing_name` | Template name is required |

---

### GET /api/workouts/templates/:id

Get template details.

**Response:**
```json
{
  "ok": true,
  "template": {
    "id": "uuid",
    "name": "Full Body Strength",
    "notes": "...",
    "exercises": [
      {
        "id": "ex-uuid",
        "sort_order": 1,
        "name": "Barbell Squat",
        "prescription_type": "reps",
        "sets": 3,
        "reps": 10,
        "rest_seconds": 90
      }
    ]
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| `not_found` | Template not found |

---

### PUT /api/workouts/templates/:id

Update a template.

**Request:**
```json
{
  "name": "Updated Name",
  "notes": "Updated notes",
  "exercises": [...]
}
```

**Response:** Same as GET

---

### DELETE /api/workouts/templates/:id

Delete a template and all associated sessions.

**Response:**
```json
{
  "ok": true,
  "message": "Template deleted"
}
```

---

## Sessions

### POST /api/workouts/session/start

Start a new workout session from a template.

**Request:**
```json
{
  "workout_template_id": "template-uuid"
}
```

**Response:**
```json
{
  "ok": true,
  "session": {
    "id": "session-uuid",
    "status": "in_progress",
    "started_at": "2025-01-20T08:00:00Z",
    "finished_at": null,
    "completion_percent": 0,
    "template": { "name": "Full Body Strength" },
    "exercises": [
      {
        "id": "session-ex-uuid",
        "name_snapshot": "Barbell Squat",
        "sort_order_snapshot": 1,
        "prescription_snapshot": {...},
        "is_completed": false,
        "completed_at": null,
        "notes": null
      }
    ]
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| `missing_template` | workout_template_id is required |
| `template_not_found` | Template not found |
| `session_in_progress` | A session is already in progress for this template |

---

### GET /api/workouts/session/:id

Get session details.

**Response:** Same structure as start response

---

### PATCH /api/workouts/session/:id/exercise/:exerciseId

Toggle exercise completion.

**Request:**
```json
{
  "is_completed": true,
  "notes": "Felt easy, increase weight next time"
}
```

**Response:** Full session object with updated completion_percent

**Behavior:**
- `is_completed: true` → sets `completed_at` to current timestamp
- `is_completed: false` → sets `completed_at` to null
- `completion_percent` recalculated automatically

---

### PATCH /api/workouts/session/:id/finish

Mark session as finished.

**Request:**
```json
{
  "day_note": "Great workout, hit all targets"
}
```

**Response:**
```json
{
  "ok": true,
  "session": {
    "status": "finished",
    "finished_at": "2025-01-20T08:45:00Z",
    ...
  }
}
```

---

### PATCH /api/workouts/session/:id/reset

Reset session to initial state.

**Response:** Session object with:
- `status: "in_progress"`
- `finished_at: null`
- `completion_percent: 0`
- All exercises: `is_completed: false`, `completed_at: null`

---

### PATCH /api/workouts/session/:id/note

Update session day note.

**Request:**
```json
{
  "day_note": "Felt tired but pushed through"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Note updated"
}
```

---

## Calendar

### GET /api/workouts/calendar

Get calendar data for a month.

**Query Parameters:**
| Param | Type | Required | Format |
|-------|------|----------|--------|
| month | string | YES | YYYY-MM |

**Example:** `/api/workouts/calendar?month=2025-01`

**Response:**
```json
{
  "ok": true,
  "month": "2025-01",
  "days": [
    {
      "date": "2025-01-15",
      "count": 2,
      "sessions": [
        {
          "id": "session-uuid",
          "template_name": "Full Body Strength",
          "completion_percent": 100,
          "finished_at": "2025-01-15T08:45:00Z"
        },
        {
          "id": "session-uuid-2",
          "template_name": "HIIT Cardio",
          "completion_percent": 80,
          "finished_at": "2025-01-15T17:30:00Z"
        }
      ]
    }
  ]
}
```

**Errors:**
| Code | Message |
|------|---------|
| `invalid_month` | month must be in YYYY-MM format |

---

### GET /api/workouts/calendar/day

Get sessions for a specific day.

**Query Parameters:**
| Param | Type | Required | Format |
|-------|------|----------|--------|
| date | string | YES | YYYY-MM-DD |

**Example:** `/api/workouts/calendar/day?date=2025-01-15`

**Response:**
```json
{
  "ok": true,
  "date": "2025-01-15",
  "sessions": [
    {
      "id": "session-uuid",
      "template_name": "Full Body Strength",
      "completion_percent": 100,
      "started_at": "2025-01-15T08:00:00Z",
      "finished_at": "2025-01-15T08:45:00Z",
      "day_note": "Great session",
      "exercises": [...]
    }
  ]
}
```

**Errors:**
| Code | Message |
|------|---------|
| `invalid_date` | date must be in YYYY-MM-DD format |

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `missing_token` | 401 | No auth token provided |
| `invalid_token` | 401 | Token expired or invalid |
| `missing_name` | 400 | Required field missing |
| `missing_template` | 400 | Template ID required |
| `not_found` | 404 | Resource doesn't exist |
| `template_not_found` | 404 | Template doesn't exist |
| `session_not_found` | 404 | Session doesn't exist |
| `session_in_progress` | 409 | Cannot start new session |
| `invalid_month` | 400 | Invalid month format |
| `invalid_date` | 400 | Invalid date format |
| `server_error` | 500 | Internal error |
