# Workout Tracking - Overview

## Purpose

Track saved workout templates and completion history. Users can:
- Create and save workout templates
- Start a session from any template
- Check off exercises as they complete them
- View workout history on a calendar
- Review past sessions

## User Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Saved Workouts │────▶│  Workout Detail │────▶│     Calendar    │
│     (List)      │     │   (Checkoff)    │     │    (History)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       ▼
        │                       │               ┌─────────────────┐
        │                       │               │   Day Detail    │
        │                       │               └─────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                              Review
```

### Step-by-Step Flow

1. **List View** (`/fitness/workouts`)
   - User sees all saved workout templates
   - Each shows: name, status badge, last completed date
   - Actions: Start, Continue, Review

2. **Start Workout**
   - Creates a new `workout_session` with status `in_progress`
   - Copies all exercises from template to `workout_session_exercises`
   - Timestamps `started_at`

3. **Checkoff** (`/fitness/session/:id`)
   - User checks/unchecks exercises
   - Each check sets `is_completed=true` and `completed_at=now()`
   - Uncheck clears both fields
   - `completion_percent` updates automatically

4. **Finish Workout**
   - Sets `status=finished` and `finished_at=now()`
   - Session appears on calendar

5. **Calendar** (`/fitness/calendar`)
   - Monthly grid view
   - Days with finished sessions show a purple dot
   - Click day to see details

6. **Day Detail** (`/fitness/calendar/:date`)
   - Lists all sessions completed that day
   - Shows completion %, start/finish times
   - Day note field (optional)
   - Review button opens session detail

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/fitness/workouts` | SavedWorkouts | Template list with search/filter |
| `/fitness/calendar` | WorkoutCalendar | Monthly history view |
| `/fitness/calendar/:date` | DayDetail | Sessions for one day |
| `/fitness/session/:id` | WorkoutDetail | Exercise checkoff |

## API Endpoints

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/workouts/templates` | List user's templates |
| POST | `/api/workouts/templates` | Create template |
| GET | `/api/workouts/templates/:id` | Get template |
| PUT | `/api/workouts/templates/:id` | Update template |
| DELETE | `/api/workouts/templates/:id` | Delete template |
| POST | `/api/workouts/session/start` | Start new session |
| GET | `/api/workouts/session/:id` | Get session |
| PATCH | `/api/workouts/session/:id/exercise/:exerciseId` | Toggle exercise |
| PATCH | `/api/workouts/session/:id/finish` | Finish session |
| PATCH | `/api/workouts/session/:id/reset` | Reset session |
| GET | `/api/workouts/calendar?month=YYYY-MM` | Get month data |
| GET | `/api/workouts/calendar/day?date=YYYY-MM-DD` | Get day sessions |

## Status Values

| Status | Meaning |
|--------|---------|
| `not_started` | Template never used or no active session |
| `in_progress` | Session started but not finished |
| `finished` | Session completed |

## Files

```
routes/workout-tracking.js          # API routes
client/src/modules/fitness/
├── components/
│   ├── SavedWorkouts.js            # List view
│   ├── WorkoutCalendar.js          # Calendar view
│   ├── DayDetail.js                # Day sessions
│   ├── WorkoutDetail.js            # Checkoff view
│   └── WorkoutTracking.js          # Main container
├── styles/
│   └── WorkoutTracking.css         # Styles (ASR colors)
└── index.js                        # Exports
```
