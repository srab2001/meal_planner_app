# Lessons Learned - ASR Health Portal Next

**Project:** ASR Health Portal - Parallel Build
**Last Updated:** December 29, 2025

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
| `Cannot find module '../prisma/generated/client'` | Prisma output changed from custom path to default | Change import to `@prisma/client` | Use standard imports |
| `functions in index predicate must be marked IMMUTABLE` | Using `CURRENT_TIMESTAMP` in partial index WHERE clause | Remove non-IMMUTABLE function from index predicate | Only use IMMUTABLE functions in indexes |
| `function uuid_generate_v4() does not exist` | Missing uuid-ossp extension after DB reset | Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"` | Include extension creation in initial migration |
| `function update_updated_at_column() does not exist` | Missing trigger function after DB reset | Ensure migration 001 runs completely or create function manually | Test migrations in fresh DB |

---

## Runtime Errors & Fixes

| Error | Root Cause | Fix | Prevention |
|-------|------------|-----|------------|
| `Access denied to this household` on pantry | Using Render DB `pool` instead of CORE DB for pantry | Use `getCoreDb()` from `src/lib/coreDb.js` | See `docs/ISOLATION.md` |
| Pantry items not found | Tables created in wrong database (Render vs CORE) | Delete Render migration, use Prisma for CORE | Follow database ownership rules |

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

## Token & Security Lessons

### Token Storage Strategy
- **Decision:** Store tokens as-is (not hashed) in database
- **Reasoning:** Share tokens are short-lived (24h) and random (256-bit)
- **Trade-off:** Faster lookup vs slightly less secure at rest
- **Alternative:** Store hash, require lookup by hash (slower but more secure)

### Rate Limiting Implementation
- **Pattern:** Use database counts within time window
- **Query:** `COUNT(*) WHERE created_at > NOW() - INTERVAL`
- **Consideration:** For high-volume, use Redis instead of DB queries

### Phone Number Validation
- **Format:** E.164 (`+[country][number]`)
- **Validation:** Regex: `/^\+[1-9]\d{1,14}$/`
- **Privacy:** Mask in API responses (show last 4 digits only)
- **Never log:** Full phone numbers in production logs

### Public Routes with Token Auth
- **Pattern:** Create specific public routes with token validation
- **Example:** `/api/fitness/sms/workout/check-off/:token`
- **Validation:** Token lookup → expiration check → ownership check
- **Important:** Don't expose user data beyond the specific resource

---

## SMS Integration Lessons

### Twilio Setup
- **Env Vars:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Fail Fast:** Validate env vars on module load, not on first use
- **Development:** Skip sending unless `ENABLE_SMS_DEV=true`
- **Logging:** Log message SID but never log phone numbers

### Rate Limiting for SMS
- **Limit:** 5 SMS per user per hour (reasonable default)
- **Storage:** Use same DB (sms_log table) for simplicity
- **Response:** Return remaining quota to client

---

## RBAC Lessons

### Permission Helper Pattern
- **Location:** `src/lib/permissions.js`
- **Pattern:** Async functions that return boolean
- **Caching:** None - always check DB for fresh data
- **Middleware:** `requirePermission(fn, getParams)` wrapper

### App Visibility
- **Approach:** Server returns visible app list based on RBAC
- **Fallback:** Frontend shows all apps if API fails
- **Admin app:** Only visible to global admins, checked separately

### Audit Logging
- **What to log:** All CRUD operations, permission denials, role changes
- **What NOT to log:** Read operations (too noisy), sensitive data values
- **Fail silently:** Audit log failures shouldn't break functionality

---

## Testing Lessons

### Jest Module Mocking
- **Issue:** Mocking modules that are imported at module load time
- **Solution:** Use `moduleNameMapper` in jest.config.js for consistent mocks
- **Pattern:** Create mock files in `__tests__/__mocks__/` directory
- **Example:** `'^../prisma/generated/client$': '<rootDir>/__tests__/__mocks__/prismaClient.js'`

### Unit vs Integration Tests
- **Unit tests:** Pure functions (validation, formatting, URL generation)
- **Integration tests:** Database interactions, API endpoints
- **Decision:** Focus unit tests on pure functions, use integration tests for DB

### Coverage for Generated Files
- **Issue:** Prisma generated client not available in test environment
- **Fix:** Add to .gitignore: `coverage/`
- **Prevention:** Exclude generated directories from coverage reports

---

## Event Logging Lessons

### Privacy-Safe Logging
- **Pattern:** Mask IDs (show last 4 chars only)
- **Never log:** Full tokens, phone numbers, sensitive data
- **Always log:** Event type, timestamp, masked references
- **Example:** `userId: '***abc1'` instead of full UUID

### Structured Event Format
- **Format:** JSON objects with consistent structure
- **Fields:** timestamp, event, userId (masked), workoutId (masked), metadata
- **Output:** `console.log('[EVENT]', JSON.stringify(logEntry))`

---

**Version:** 1.2
**Maintained By:** Development Team
