# Workout Tracking - UI Fields Reference

## Screen 1: Saved Workouts

**Route:** `/fitness/workouts`
**Component:** `SavedWorkouts.js`

### Controls

| Element | Type | Behavior |
|---------|------|----------|
| Search input | Text | Filters templates by name (debounced) |
| Filter: All | Button | Shows all templates |
| Filter: Not Started | Button | Shows templates with no sessions |
| Filter: In Progress | Button | Shows templates with active session |
| Filter: Done | Button | Shows templates with completed sessions |

### Template Card Fields

| Field | Source | Format |
|-------|--------|--------|
| Name | `workout_templates.name` | Text |
| Status badge | Derived | "Not Started" / "In Progress" / "Completed" |
| Last done | `MAX(workout_sessions.finished_at)` | "Today" / "2 days ago" / "Jan 15" |
| Exercise count | `COUNT(workout_template_exercises)` | "5 exercises" |

### Actions

| Button | Condition | API Call | Result |
|--------|-----------|----------|--------|
| Start | status = not_started OR done | POST /session/start | Navigate to session detail |
| Continue | status = in_progress | None | Navigate to in_progress session |
| Review | status = done | None | Navigate to latest finished session |

### Validation

- Search: No validation, empty shows all
- Filter buttons: Only one active at a time

---

## Screen 2: Workout Calendar

**Route:** `/fitness/calendar`
**Component:** `WorkoutCalendar.js`

### Header

| Element | Behavior |
|---------|----------|
| Left arrow | Previous month |
| Month/Year title | Display only |
| Right arrow | Next month |

### Calendar Grid

| Element | Display |
|---------|---------|
| Day headers | S M T W T F S |
| Day cell | Day number |
| Workout indicator | Purple dot if has finished sessions |
| Count badge | Number if >1 sessions that day |

### Day Cell States

| State | Style |
|-------|-------|
| Other month | 30% opacity |
| Today | Purple border + light purple bg |
| Has workout | Solid purple bg + dot |
| No workout | Default white bg |

### Actions

| Action | Condition | Result |
|--------|-----------|--------|
| Click day | Has workouts | Navigate to day detail |
| Click day | No workouts | No action |

---

## Screen 3: Day Detail

**Route:** `/fitness/calendar/:date`
**Component:** `DayDetail.js`

### Header

| Element | Source | Format |
|---------|--------|--------|
| Back button | - | "< Back" |
| Date | URL param | "Monday, January 20, 2025" |

### Session Card Fields

| Field | Source | Format |
|-------|--------|--------|
| Template name | `workout_templates.name` | Text |
| Completion % | `workout_sessions.completion_percent` | "100%" |
| Start time | `workout_sessions.started_at` | "08:00 AM" |
| Finish time | `workout_sessions.finished_at` | "08:45 AM" |

### Day Note Section

| Element | Type | Behavior |
|---------|------|----------|
| Note textarea | Multiline text | Editable |
| Save button | Button | PATCH /session/:id/note |

### Actions

| Button | Result |
|--------|--------|
| Back | Navigate to calendar |
| Review workout | Navigate to session detail |
| Save note | Update day_note on first session |

---

## Screen 4: Workout Detail (Checkoff)

**Route:** `/fitness/session/:id`
**Component:** `WorkoutDetail.js`

### Header Card

| Field | Source | Format |
|-------|--------|--------|
| Template name | `workout_templates.name` | Text |
| Started | `workout_sessions.started_at` | "08:00 AM" or "-" |
| Finished | `workout_sessions.finished_at` | "08:45 AM" or "-" |
| Status badge | `workout_sessions.status` | "In Progress" / "Completed" |
| Completion % | `workout_sessions.completion_percent` | "60% Complete" |

### Exercise Row Fields

| Field | Source | Display |
|-------|--------|---------|
| Checkbox | `is_completed` | Checked/unchecked |
| Name | `name_snapshot` | Text |
| Prescription | `prescription_snapshot` | "3 x 10 reps / 90s rest" or "4 x 20 seconds / 10s rest" |
| Completed time | `completed_at` | "08:15 AM" or empty |
| Notes button | `notes` | "+ Note" or "Notes" |

### Exercise Row States

| State | Style |
|-------|-------|
| Not completed | White background |
| Completed | Light green background |

### Notes Expansion

| Element | Behavior |
|---------|----------|
| Click "+ Note" | Shows text input below row |
| Save button | PATCH /exercise/:id with notes |
| Notes display | Shows if notes exist |

### Actions

| Button | Condition | API Call | Result |
|--------|-----------|----------|--------|
| Finish Workout | status = in_progress | PATCH /finish | Session marked finished |
| Reset | status = in_progress | PATCH /reset | All exercises unchecked |
| Back to Calendar | status = finished | None | Navigate to calendar |

### Validation

- Checkbox: Disabled when session finished
- Notes: Disabled when session finished
- Finish: Enabled only when in_progress
- Reset: Shows confirmation dialog

---

## Prescription Display Format

```javascript
if (prescription_type === 'time') {
  // "4 x 20 seconds / 10s rest"
  `${sets} x ${seconds} seconds${rest_seconds ? ` / ${rest_seconds}s rest` : ''}`
} else {
  // "3 x 10 reps / 90s rest"
  `${sets} x ${reps} reps${rest_seconds ? ` / ${rest_seconds}s rest` : ''}`
}
```

---

## Time Display Format

```javascript
new Date(timestamp).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit'
})
// Output: "08:45 AM"
```

---

## Date Display Format

**Relative (List view):**
```javascript
if (diffDays === 0) return 'Today';
if (diffDays === 1) return 'Yesterday';
if (diffDays < 7) return `${diffDays} days ago`;
return date.toLocaleDateString(); // "1/20/2025"
```

**Full (Day Detail):**
```javascript
date.toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})
// Output: "Monday, January 20, 2025"
```

---

## Troubleshooting

### "No workouts found" in list view
- Check filter is set to "All"
- Verify user has templates in database
- Check auth token is valid

### Calendar not showing workout dots
- Only `status = finished` sessions appear
- Check `finished_at` is set
- Verify correct month is displayed

### Cannot check exercises
- Session may already be finished
- Checkboxes disabled for finished sessions
- Look for "Completed" badge in header

### Completion percent not updating
- Check network requests for errors
- API recalculates on each toggle
- Refresh page to sync state

### Day note not saving
- Must click "Save note" button
- Note saves to first session of that day
- Check for 401 errors (token expired)
