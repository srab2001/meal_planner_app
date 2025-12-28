# Compliance App Documentation

**Module:** /apps/compliance
**Database:** CORE DB (Neon)
**Status:** Active

---

## Features

| Feature | Description |
|---------|-------------|
| Week View | 7-day calendar with plan items |
| Check-in | Mark items done/skipped/partial |
| Missed View | List of overdue items |
| Summary | Completion rate, counts |

---

## API Routes

### GET /api/core/compliance/week
Get week view with plan items.

Query: `start` (ISO date), `household_id`

Response:
```json
{
  "days": [
    {
      "date": "2025-01-01",
      "items": [
        {
          "id": "uuid",
          "item_type": "meal",
          "title": "Breakfast",
          "scheduled_at": "2025-01-01T08:00:00Z",
          "status": "pending"
        }
      ]
    }
  ]
}
```

### GET /api/core/compliance/missed
Get overdue items.

Query: `household_id`

### GET /api/core/compliance/summary
Get summary counts.

Query: `household_id`, `days` (default 7)

Response:
```json
{
  "total": 21,
  "completed": 15,
  "skipped": 3,
  "missed": 3,
  "completion_rate": 71
}
```

### POST /api/core/compliance/checkin
Record check-in for plan item.

Body:
```json
{
  "plan_item_id": "uuid",
  "status": "completed",
  "notes": "Had smaller portion"
}
```

---

## Status Values

| Status | Description |
|--------|-------------|
| pending | Not yet due or unchecked |
| completed | Done as planned |
| skipped | Intentionally skipped |
| partial | Partially completed |
| missed | Past due, not checked |

---

## Item Types

| Type | Source | Icon |
|------|--------|------|
| meal | Meal generation | 🍽️ |
| workout | Fitness generation | 💪 |
| task | Manual entry | 📋 |

---

## Compliance Calculation

```javascript
// Items are marked "missed" if:
// - scheduled_at < now
// - status === 'pending'
// - no checkin exists

// Completion rate:
// (completed / (completed + skipped + missed)) * 100
```

---

**Version:** 1.0
