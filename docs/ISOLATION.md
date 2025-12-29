# Database Isolation Rules

## Overview

ASR Health Portal uses a **dual-database architecture** to separate concerns and maintain data integrity:

| Database | Provider | Purpose | Connection |
|----------|----------|---------|------------|
| **CORE DB** | Neon PostgreSQL (`core_db_next`) | System of record: users, roles, households, medical, pantry | `CORE_DATABASE_URL` |
| **Render DB** | Render PostgreSQL | Meal planning data: recipes, meal plans, grocery lists | `DATABASE_URL` |

## Critical Rules

### 1. NO Cross-Database Joins

**NEVER** write queries that join tables across databases. This is technically impossible and architecturally wrong.

```javascript
// WRONG - Cross-DB join attempt
const result = await pool.query(`
  SELECT u.*, m.*
  FROM users u
  JOIN meal_plans m ON m.user_id = u.id
`);

// CORRECT - Pass IDs as parameters
const coreDb = getCoreDb();
const user = await coreDb.users.findUnique({ where: { id: userId } });
const mealPlans = await pool.query(
  'SELECT * FROM meal_plans WHERE user_id = $1',
  [userId]
);
```

### 2. Database Ownership by Domain

| Domain | Database | Tables |
|--------|----------|--------|
| **Users & Auth** | CORE | `users`, `user_roles`, `roles` |
| **Households** | CORE | `households`, `household_memberships`, `invites` |
| **Medical** | CORE | `medical_profiles`, `allergies`, `medical_conditions`, `restriction_rules`, `user_constraints` |
| **Pantry** | CORE | `pantries`, `pantry_items`, `pantry_item_events` |
| **Plans** | CORE | `plans`, `plan_items`, `checkins` |
| **Audit** | CORE | `audit_log` |
| **Recipes** | Render | `recipes`, `recipe_ingredients`, `recipe_steps` |
| **Meal Plans** | Render | `meal_plans`, `meal_plan_items`, `meal_plan_days` |
| **Grocery** | Render | `grocery_lists`, `grocery_items` |
| **Fitness** | Render | `workouts`, `workout_exercises`, `workout_share_tokens`, `fitness_goals` |

### 3. RBAC via CORE DB Only

All role-based access control (RBAC) checks must query CORE DB:

```javascript
// Correct RBAC check
const { getCoreDb } = require('../src/lib/coreDb');

const verifyHouseholdAccess = async (req, res, next) => {
  const db = getCoreDb();
  const membership = await db.household_memberships.findFirst({
    where: {
      user_id: req.user.id,
      household_id: householdId,
      is_active: true
    }
  });

  if (!membership) {
    return res.status(403).json({ error: 'Access denied' });
  }

  req.householdRole = membership.role; // owner, admin, member, viewer
  next();
};
```

### 4. Prisma Schema Locations

| Schema | Path | Database |
|--------|------|----------|
| CORE | `prisma/core/schema.prisma` | Neon (`CORE_DATABASE_URL`) |
| Render | `prisma/schema.prisma` | Render (`DATABASE_URL`) |

### 5. Client Usage

```javascript
// CORE DB - Use getCoreDb() singleton
const { getCoreDb } = require('../src/lib/coreDb');
const coreDb = getCoreDb();
const user = await coreDb.users.findUnique({ where: { id } });

// Render DB - Use pool or Prisma client
const { pool } = require('../db');
const result = await pool.query('SELECT * FROM recipes WHERE id = $1', [id]);

// OR with Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); // Uses DATABASE_URL by default
```

## Common Mistakes to Avoid

### Mistake 1: Wrong Database for Pantry
```javascript
// WRONG - Pantry is in CORE DB, not Render
const { pool } = require('../db');
const items = await pool.query('SELECT * FROM pantry_items');

// CORRECT
const { getCoreDb } = require('../src/lib/coreDb');
const db = getCoreDb();
const items = await db.pantry_items.findMany();
```

### Mistake 2: Looking up users in Render DB
```javascript
// WRONG - Users are in CORE DB
const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

// CORRECT
const db = getCoreDb();
const user = await db.users.findUnique({ where: { id } });
```

### Mistake 3: Creating migrations in wrong location
```bash
# Pantry migration in Render DB (WRONG)
migrations/020_create_pantry_tables.sql

# Pantry migration in CORE DB (CORRECT)
# Use Prisma migration for CORE DB:
npx prisma migrate dev --schema=prisma/core/schema.prisma
```

## Environment Variables

```env
# Neon PostgreSQL - CORE DB (System of Record)
CORE_DATABASE_URL="postgresql://user:pass@host/core_db_next"

# Render PostgreSQL - Meal Planning Data
DATABASE_URL="postgresql://user:pass@host/meal_planner"
```

## Schema Sync Commands

```bash
# CORE DB (Neon)
npx prisma generate --schema=prisma/core/schema.prisma
npx prisma db push --schema=prisma/core/schema.prisma

# Render DB
npx prisma generate
npx prisma db push
```

## Related Documentation

- `docs/LESSONS_LEARNED.md` - Architecture decisions and fixes
- `docs/BLUEPRINT.md` - Overall system architecture
- `prisma/core/schema.prisma` - CORE DB schema
- `prisma/schema.prisma` - Render DB schema
