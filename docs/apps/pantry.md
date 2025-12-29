# Pantry App

Food inventory management with expiration tracking and consumption/waste events.

## Database

**Location:** CORE DB (Neon)

**Tables:**
- `pantries` - One per household
- `pantry_items` - Food items with quantity, expiration
- `pantry_item_events` - Consumption, waste, adjustment events

## RBAC Rules

| Role | View | Add | Consume | Waste | Adjust |
|------|------|-----|---------|-------|--------|
| owner | Yes | Yes | Yes | Yes | Yes |
| admin | Yes | Yes | Yes | Yes | Yes |
| member | Yes | Yes | Yes | Yes | Yes |
| viewer | Yes | No | No | No | No |
| non-member | No | No | No | No | No |

## API Routes

Base path: `/api/pantry`

### GET /items

List pantry items with optional filters.

**Query params:**
- `household_id` (required): Household UUID
- `view`: `all` | `exp3` | `exp7` | `exp14`
- `search`: Search by item name or brand

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "itemName": "Milk",
      "brand": "Organic Valley",
      "quantity": 2,
      "unit": "count",
      "purchaseDate": "2025-12-20",
      "expirationDate": "2025-12-30",
      "notes": null,
      "updatedAt": "2025-12-29T10:00:00Z",
      "category": "dairy",
      "status": "available"
    }
  ],
  "count": 1
}
```

### POST /items

Add a new pantry item.

**Body:**
```json
{
  "itemName": "Milk",
  "brand": "Organic Valley",
  "quantity": 2,
  "unit": "count",
  "purchaseDate": "2025-12-20",
  "expirationDate": "2025-12-30",
  "notes": "2% fat"
}
```

**Validation:**
- `itemName` required
- `quantity` > 0
- `expirationDate` >= `purchaseDate` if both present
- `notes` max 500 chars

### POST /items/update

Update an existing item.

**Body:**
```json
{
  "pantryItemId": "uuid",
  "quantity": 1,
  "unit": "count",
  "notes": "One left"
}
```

**Validation:**
- `pantryItemId` required
- `quantity` >= 0

### POST /items/event

Record consumption, waste, or adjustment.

**Body:**
```json
{
  "pantryItemId": "uuid",
  "eventType": "consume",
  "amount": 1,
  "unit": "count",
  "relatedPlanItemId": "optional-uuid",
  "notes": "Used for breakfast"
}
```

**Event types:**
- `consume` - Item was used
- `waste` - Item was discarded
- `adjust` - Manual quantity adjustment

**Validation:**
- `pantryItemId` required
- `eventType` must be `consume`, `waste`, or `adjust`
- `amount` > 0

### GET /events

List recent pantry events.

**Query params:**
- `household_id` (required)
- `limit`: Number of events (default 50)

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "itemId": "uuid",
      "itemName": "Milk",
      "eventType": "consume",
      "quantityChange": -1,
      "unit": "count",
      "notes": null,
      "createdBy": "John Doe",
      "createdAt": "2025-12-29T10:00:00Z"
    }
  ]
}
```

## Categories

- produce
- dairy
- meat
- pantry
- frozen
- beverages
- other

## UI Components

**Page:** `client/src/apps/pantry/PantryApp.jsx`

**Modals:**
- `AddItemModal` - Add new item
- `ConsumeModal` - Record consumption
- `WasteModal` - Record waste with reason
- `AdjustModal` - Adjust quantity

**Features:**
- Table view with sortable columns
- Server-side filtering by expiration
- Search by name/brand
- Recent events panel
- Optimistic UI updates

## Event Logging

Events logged (privacy-safe):
- `pantry_item_added`
- `pantry_item_consumed`
- `pantry_item_wasted`
- `pantry_item_adjusted`

Logged fields:
- `timestamp`
- `userId` (masked)
- `householdId` (masked)
- `itemId` (masked)
- `quantity`/`amount`

## Known Limits

- No bulk operations (add/delete multiple items)
- No barcode scanning integration
- No recipe ingredient linking
- No shopping list integration
- Events not editable after creation

## Related Files

- `routes/pantry.js` - API routes
- `src/lib/permissions.js` - RBAC helpers
- `prisma/core/schema.prisma` - Database schema
- `docs/ISOLATION.md` - Database rules

---

**Version:** 2.0
