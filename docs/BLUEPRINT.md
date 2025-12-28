# ASR Health Portal - Architecture Blueprint

**Project:** ASR Health Portal Next (Parallel Build)
**Version:** 1.0
**Last Updated:** December 28, 2025

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    Vercel: asr-health-portal-next               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Switchboard│ │ Household │ │  Medical │ │  Pantry  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Compliance│ │   Meal   │ │ Fitness  │ │  Admin   │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│       CORE DB           │   │       MEAL DB           │
│   Neon: core_db_next    │   │  Render: meal_db_next   │
│                         │   │                         │
│ • Users & Identity      │   │ • Flyer data            │
│ • Roles & RBAC          │   │ • Scraped items         │
│ • Households            │   │ • Meal generations      │
│ • Medical profiles      │   │ • Shopping lists        │
│ • Restrictions          │   │ • Price comparisons     │
│ • Pantry                │   │ • Meal logs             │
│ • Compliance            │   │                         │
└─────────────────────────┘   └─────────────────────────┘
```

---

## Database Responsibilities

### CORE DB (Neon: core_db_next)
**System of Record** - All identity, authorization, and domain data

| Table | Purpose |
|-------|---------|
| `users` | User identity, OAuth, profile |
| `roles` | Role definitions (admin, household_admin, member, viewer) |
| `user_roles` | User-to-role assignments (per household) |
| `households` | Household groups |
| `household_memberships` | User-to-household relationships |
| `invites` | Pending household invitations |
| `medical_profiles` | User health profiles |
| `allergies` | Allergy records |
| `medical_conditions` | Health conditions |
| `restriction_rules` | Guardrail rules for medical conditions |
| `user_constraints` | User-specific dietary/medical constraints |
| `plans` | Meal/fitness plans |
| `plan_items` | Individual plan entries |
| `checkins` | Daily check-ins |
| `pantries` | Household pantry containers |
| `pantry_items` | Items in pantry |
| `pantry_item_events` | Add/remove/expire events |

### MEAL DB (Render: meal_db_next)
**Meal-Heavy Operations** - High-volume meal data

| Table | Purpose |
|-------|---------|
| `flyers` | Store flyer metadata |
| `flyer_items` | Scraped flyer items |
| `stores` | Store locations |
| `meal_generations` | AI meal plan generations |
| `shopping_lists` | Generated shopping lists |
| `price_comparisons` | Price comparison results |
| `meal_logs` | Generation logs and analytics |

---

## App List

| App | Status | Database | Description |
|-----|--------|----------|-------------|
| **Switchboard** | Redesign | CORE | Portal home, app launcher, auth |
| **Household** | New | CORE | Manage household members, invites |
| **Medical** | New | CORE | Health profiles, restrictions, guardrails |
| **Pantry** | New | CORE | Track pantry items, expiration |
| **Compliance** | New | CORE | Dietary compliance tracking |
| **Meal Planner** | Migrate | CORE + MEAL | AI meal planning, shopping lists |
| **Fitness Coach** | Migrate | CORE + Fitness DB | Workout planning, goals |
| **Admin** | Existing | CORE | User management, system admin |

---

## Environment Variables

### CORE DB (Neon)
```env
CORE_DATABASE_URL=postgresql://...@core_db_next.neon.tech/neondb
```

### MEAL DB (Render)
```env
MEAL_DATABASE_URL=postgresql://...@render.com/meal_db_next
```

### OAuth (New App)
```env
GOOGLE_CLIENT_ID=<new-oauth-app-client-id>
GOOGLE_CLIENT_SECRET=<new-oauth-app-client-secret>
GOOGLE_CALLBACK_URL=https://asr-health-portal-next.vercel.app/auth/callback
```

### Feature Flags
```env
NEXT_PUBLIC_ENV=development|preview|production
ENABLE_HOUSEHOLD_FEATURES=true
ENABLE_MEDICAL_GUARDRAILS=true
```

---

## RBAC Model

### Roles
| Role | Scope | Permissions |
|------|-------|-------------|
| `admin` | Global | All operations, all households |
| `household_admin` | Household | Manage members, invites, view all data |
| `member` | Household | Full CRUD on own data, pantry, compliance |
| `viewer` | Household | Read-only access |

### Role Hierarchy
```
owner > household_admin > admin > member > viewer
```
Higher roles include all permissions of lower roles.

### Permission Helpers (src/lib/permissions.js)

| Function | Description |
|----------|-------------|
| `canViewApp(userId, householdId, appId)` | Check if user can see app tile |
| `canEditHousehold(userId, householdId)` | Check if user can manage members/invites |
| `canDeleteHousehold(userId, householdId)` | Check if user can delete household |
| `canInviteMembers(userId, householdId)` | Check if user can send invites |
| `canChangeRoles(userId, householdId, targetUserId)` | Check if user can modify roles |
| `canEditPantry(userId, householdId)` | Check if user can add/consume pantry items |
| `canViewPantry(userId, householdId)` | Check if user can view pantry |
| `canEditMedical(userId, householdId, targetUserId)` | Check if user can edit medical profile |
| `canViewMedical(userId, householdId, targetUserId)` | Check if user can view medical profile |
| `canCheckin(userId, householdId)` | Check if user can record compliance checkins |
| `getVisibleApps(userId, householdId)` | Get list of apps user can access |

### App Visibility Matrix

| App | viewer | member | admin | household_admin | owner |
|-----|--------|--------|-------|-----------------|-------|
| meal-planner | Y | Y | Y | Y | Y |
| fitness | Y | Y | Y | Y | Y |
| coaching | Y | Y | Y | Y | Y |
| pantry | Y | Y | Y | Y | Y |
| compliance | Y | Y | Y | Y | Y |
| household | Y | Y | Y | Y | Y |
| medical | Y | Y | Y | Y | Y |
| admin | - | - | - | - | - |

Note: Admin app is only visible to global admins (checked via isGlobalAdmin).

### Middleware Pattern
```javascript
const { requirePermission, canEditPantry } = require('../src/lib/permissions');

// Use in route
router.post('/items',
  requirePermission(canEditPantry, req => [req.user.id, req.householdId]),
  async (req, res) => { ... }
);
```

### Permission Check Flow
```
1. Request arrives
2. requireAuth middleware - verify JWT, attach req.user
3. requirePermission middleware - call permission function
   a. Check if global admin (bypass all)
   b. Get user's household role from CORE DB
   c. Compare against required role/permission
4. If denied: 403 Forbidden + audit log entry
5. If allowed: proceed to handler
```

---

## Cutover Approach

### Phase 1: Parallel Build (No Production Impact)
1. Create new cloud resources (Vercel, Neon, Render, OAuth)
2. Build new apps in parallel repo
3. Test with synthetic data only
4. No production database connections

### Phase 2: Data Migration Prep
1. Create migration scripts
2. Test with production data copy
3. Validate data integrity
4. Document rollback procedures

### Phase 3: Cutover
1. Enable maintenance mode on production
2. Run final data migration
3. Update DNS/routing
4. Validate functionality
5. Monitor for issues

### Phase 4: Rollback (if needed)
1. Revert DNS/routing
2. Disable maintenance mode
3. Production restored
4. Investigate issues

---

## Prisma Configuration

### Multi-Schema Setup
```
prisma/
├── core/
│   └── schema.prisma    # CORE DB schema
├── meal/
│   └── schema.prisma    # MEAL DB schema
└── fitness/
    └── schema.prisma    # FITNESS DB schema (existing)
```

### Client Wrappers
```typescript
// src/lib/coreDb.ts
import { PrismaClient } from '@prisma/client/core';
export const coreDb = new PrismaClient();

// src/lib/mealDb.ts
import { PrismaClient } from '@prisma/client/meal';
export const mealDb = new PrismaClient();
```

---

## Audit Logging

### audit_log Table (CORE DB)
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  user_id UUID,
  household_id UUID,
  action VARCHAR(50),        -- create, update, delete, login, etc.
  resource_type VARCHAR(50), -- user, household, pantry_item, etc.
  resource_id UUID,
  details JSONB,             -- old/new values, context
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Logged Actions
| Action | Resource Type | When |
|--------|---------------|------|
| login | session | User logs in |
| logout | session | User logs out |
| create | * | New record created |
| update | * | Record modified |
| delete | * | Record deleted |
| permission_denied | * | Access denied |
| role_change | user_role | Role modified |
| invite_sent | invite | Invite created |
| invite_accepted | invite | Invite accepted |

### Audit Helper (src/lib/auditLog.js)
```javascript
const { logCreate, logUpdate, logDelete, logPermissionDenied } = require('./auditLog');

// In route handler
await logCreate(userId, householdId, 'pantry_item', item.id, { name: item.name }, req);
```

---

## Key Constraints

1. **No cross-DB joins** - Query one DB, pass IDs to second
2. **Household context always required** - Every API includes household_id
3. **RBAC on every route** - Check permissions before data access
4. **Audit logging** - Track all data modifications in CORE DB
5. **Environment isolation** - Never mix dev/preview/production

---

## Authentication Flow

### Login Provisioning

```
1. User clicks "Sign in with Google"
2. Redirect to /auth/google → Google OAuth
3. OAuth callback with token
4. Backend: provisionUserOnLogin()
   a. Upsert user in CORE DB by email
   b. If first login:
      - Create household
      - Create membership (role: owner)
      - Assign default roles
   c. Return user + household
5. Set auth_token cookie
6. Set active_household_id cookie
7. Redirect to switchboard
```

### Household Resolution

```
Every authenticated request:
1. Middleware: requireAuth
   - Extract token from Authorization header or cookie
   - Verify JWT
   - Attach req.user

2. Middleware: requireHouseholdContext
   - Get household_id from X-Household-ID header or cookie
   - Lookup membership in CORE DB
   - Verify user is member of household
   - Attach req.household, req.householdRole

3. Middleware: requireRole (optional)
   - Check req.householdRole against allowed roles
   - Global admin bypasses all checks
```

### Token Storage

| Token | Storage | Purpose |
|-------|---------|---------|
| auth_token | httpOnly cookie | JWT authentication |
| active_household_id | httpOnly cookie | Current household context |
| user | localStorage | UI display (non-sensitive) |

---

## Switchboard Behavior

### Features
- Household selector dropdown
- App tiles with status badges
- Environment banner (preview warning)
- CORE DB status counts

### Status Counts (from CORE DB)
- Pantry items expiring soon
- Compliance items missed
- Active medical constraints

### App Tiles
| App | Badge Source |
|-----|--------------|
| Pantry | pantry_items WHERE expiration_date < NOW() + 7 days |
| Compliance | checkins missed in last 7 days |
| Medical | user_constraints WHERE is_active = true |

---

## App Documentation

| App | Doc Path |
|-----|----------|
| Household | /docs/apps/household.md |
| Medical | /docs/apps/medical.md |
| Pantry | /docs/apps/pantry.md |
| Compliance | /docs/apps/compliance.md |

---

## Guardrails Integration

### Contract

Meal and Fitness generation MUST fetch guardrails before AI generation:

```
GET /api/core/medical/guardrails?user_id=xxx
```

Response includes:
- `constraints[]` - Dietary/medical constraints
- `allergies[]` - Allergen list with severity
- `conditions[]` - Active medical conditions
- `restriction_rules[]` - Max values for nutrients

### Flow

1. Frontend requests meal/workout generation
2. Backend calls guardrails API
3. AI prompt includes constraints
4. Results saved to MEAL/FITNESS DB with user_id/household_id
5. Plan items created in CORE DB for compliance

See: `/docs/integration/meal-fitness-core.md`

---

**Version:** 1.3
**Maintained By:** Development Team
