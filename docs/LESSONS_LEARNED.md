# Lessons Learned - ASR Health Portal Next

**Project:** ASR Health Portal - Parallel Build
**Last Updated:** December 28, 2025

---

## Architecture Rules

### 1. CORE DB is System of Record
- **Location:** Neon `core_db_next`
- **Contains:** users, roles, households, medical profiles, restrictions, pantry, compliance
- All identity and authorization data lives here
- Single source of truth for user context

### 2. Render DB is Meal-Heavy Only
- **Location:** Render `meal_db_next`
- **Contains:** flyers, scraped items, meal generations, logs, meal outputs
- No user identity data
- References CORE DB user_id as foreign key (not joined)

### 3. No Cross-DB Joins
- Never join tables across CORE DB and Render DB
- Pass user_id/household_id as parameters
- Fetch from one DB, then use IDs to query the other
- Example:
  ```javascript
  // CORRECT
  const user = await coreDb.users.findUnique({ where: { id } });
  const meals = await mealDb.meals.findMany({ where: { user_id: user.id } });

  // WRONG - never do this
  // SELECT * FROM core.users JOIN meal.meals ON ...
  ```

### 4. One Identity in CORE DB
- Single `users` table in CORE DB
- OAuth tokens stored in CORE DB
- No duplicate user records in Render DB
- Meal DB references `user_id` without storing user details

### 5. Household Context Required
- Every data operation includes household_id
- Users can belong to multiple households
- Active household stored in session/localStorage
- API routes validate household membership

### 6. RBAC Required
- Roles: admin, household_admin, member, viewer
- Permissions checked on every protected route
- Role assignments are per-household
- Admin role is global (cross-household)

### 7. Isolation Rules
- **No production connections** in development/preview
- Separate OAuth apps for each environment
- Environment-specific database URLs
- Never reference production URLs in code

---

## Build Errors & Fixes

| Error | Root Cause | Fix | Prevention |
|-------|------------|-----|------------|
| (To be populated during development) | | | |

---

## Runtime Errors & Fixes

| Error | Root Cause | Fix | Prevention |
|-------|------------|-----|------------|
| (To be populated during development) | | | |

---

## SSO & Auth Lessons (from production)

### OAuth Query Params Lost During URL Cleanup
- **Error:** returnTo param stripped after OAuth
- **Fix:** Use `pathname + search` when cleaning URL hash
- **Prevention:** Always preserve query params in history.replaceState

### User Data Not in localStorage Before Redirect
- **Error:** SSO redirect failed silently
- **Fix:** Save user to localStorage BEFORE checking returnTo
- **Prevention:** Set state before reading it

### Deployment-Specific URLs Break
- **Error:** Hardcoded Vercel deployment URLs become stale
- **Fix:** Use stable project URLs or environment variables
- **Prevention:** Never hardcode deployment-specific URLs

---

## Database Lessons

### Empty Array Type in PostgreSQL
- **Error:** `cannot determine type of empty array`
- **Fix:** Cast explicitly: `ARRAY[]::TEXT[]`
- **Prevention:** Always cast empty arrays in migrations

### Null Validation Failures
- **Error:** `target_value must be a positive number` for null values
- **Fix:** Check `!== null` in addition to `!== undefined`
- **Prevention:** Validate optional fields allow null explicitly

---

## Deployment Lessons

### Vercel Root Directory Misconfiguration
- **Error:** `Missing script: "build"`
- **Fix:** Set Root Directory in Vercel project settings
- **Prevention:** Configure `vercel.json` with correct root

### Git Divergent Branches
- **Error:** `Need to specify how to reconcile divergent branches`
- **Fix:** Use `--rebase` or `--no-rebase` flag
- **Prevention:** Pull frequently, use feature branches

---

**Version:** 1.0
**Maintained By:** Development Team
