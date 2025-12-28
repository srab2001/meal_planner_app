# Pantry App Documentation

**Module:** /apps/pantry
**Database:** CORE DB (Neon)
**Status:** Active

---

## Features

| Feature | Description | RBAC |
|---------|-------------|------|
| List Items | View all pantry items | all |
| Add Item | Add item with expiration | owner, admin, member |
| Consume | Record usage event | owner, admin, member |
| Waste | Mark as wasted | owner, admin, member |
| Adjust | Modify quantity | owner, admin, member |
| Expiring Views | 3/7/14 day filters | all |
| Events | Recent activity log | all |

---

## API Routes

### GET /api/core/pantry/items
List items for household.

Query: `household_id`, `status`, `category`, `expiring_days`

### POST /api/core/pantry/items
Add new item.

Body:
```json
{
  "name": "Milk",
  "category": "dairy",
  "quantity": 1,
  "unit": "gallon",
  "expiration_date": "2025-01-15"
}
```

### POST /api/core/pantry/items/:id/events
Record event (consume, waste, adjust).

Body:
```json
{
  "event_type": "consumed",
  "quantity_change": -1,
  "notes": "Used for breakfast"
}
```

### GET /api/core/pantry/events
Recent events for household.

Query: `household_id`, `limit`

---

## Categories

- produce
- dairy
- meat
- pantry
- frozen
- beverages
- other

---

## Event Types

| Type | Description | Quantity |
|------|-------------|----------|
| added | Item added | positive |
| consumed | Used normally | negative |
| wasted | Thrown away | negative |
| adjusted | Manual correction | +/- |
| expired | Auto-marked expired | 0 |

---

## RBAC

| Action | owner | admin | member | viewer |
|--------|-------|-------|--------|--------|
| View items | ✓ | ✓ | ✓ | ✓ |
| Add item | ✓ | ✓ | ✓ | ✗ |
| Record event | ✓ | ✓ | ✓ | ✗ |
| Delete item | ✓ | ✓ | ✗ | ✗ |

---

**Version:** 1.0
