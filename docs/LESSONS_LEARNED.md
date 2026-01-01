# Lessons Learned - ASR Health Portal Next

**Project:** ASR Health Portal - Parallel Build
**Last Updated:** December 31, 2025

---

## Architecture Rules

### 1. Production Database is on RENDER (Not Neon!)
- **Location:** Render PostgreSQL (`oregon-postgres.render.com`)
- **Connection:** `DATABASE_URL` on Render backend
- **Contains:** users (with role column), meals, favorites, subscriptions, usage_stats
- **CRITICAL:** Admin roles must be updated HERE, not in Neon!

```bash
# Production database connection (Render)
Host: dpg-d4nj6demcj7s73dfvie0-a.oregon-postgres.render.com
Database: meal_planner_vo27
User: meal_planner_user
```

### 2. Neon DB is for Development/CORE Features
- **Location:** Neon `core_db_next`
- **Contains:** households, pantry, medical profiles, restrictions, compliance
- Used for CORE_DATABASE_URL features (pantry, households)
- **NOT** used for authentication in production!

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

### The SSO Redirect Loop Problem (December 2025)

**Symptom:** Users logging in from the Meal Planner were being redirected to the Fitness App instead of staying on the switchboard.

**Root Cause:** The backend `FRONTEND_BASE` environment variable was pointing to the wrong Vercel deployment URL (fitness app instead of meal planner).

#### Key Issues Identified

| Issue | Root Cause | Fix |
|-------|------------|-----|
| **Backend FRONTEND_BASE misconfigured** | Render env var pointed to fitness app instead of meal planner | Set FRONTEND_BASE to correct meal planner URL |
| returnTo in URL lost during OAuth | Query params embedded in hash fragment after OAuth callback, not in `window.location.search` | Store `returnTo` in localStorage BEFORE OAuth redirect |
| Stale localStorage value | `sso_return_to` persisting from previous SSO visits | Clear `sso_return_to` when no `returnTo` param in URL |
| Multiple login paths | Different components (AppSwitchboard, LoginPage, SwitchboardNext) each have OAuth links | Fix ALL login entry points, not just one |
| URL formats differ | Backend uses `#token=`, switchboard SSO uses `#auth=` | Handle both formats in fitness app's useAuth hook |

#### Backend Environment Variable Check

**CRITICAL**: The OAuth callback redirects to `${FRONTEND_BASE}#token=...`

If `FRONTEND_BASE` on Render is set incorrectly, ALL OAuth logins will redirect to the wrong app!

```bash
# On Render, verify FRONTEND_BASE is set to the MEAL PLANNER, not fitness:
FRONTEND_BASE=https://meal-planner-gold-one.vercel.app

# NOT the fitness app URL!
```

#### The Correct Login Flow

```
All Logins (including from fitness app):
1. User clicks login on switchboard
2. handleGoogleLogin() clears any stale sso_return_to
3. OAuth redirect to /auth/google?redirect=/switchboard
4. Backend callback → FRONTEND_BASE#token=JWT&redirect=/switchboard
   (FRONTEND_BASE must be set to meal planner URL on Render!)
5. App.js extracts token, stores in localStorage
6. Calls /auth/user to verify token
7. Calls handleLogin() → always goes to switchboard ✓
```

**Note:** Users from external fitness app also land on switchboard after login.
They can then navigate to any app from there.

#### Files That Need SSO Fixes (Checklist)

When implementing SSO with localStorage state:
- [ ] `AppSwitchboard.js` - handleGoogleLogin()
- [ ] `AppSwitchboard.js` - admin login path
- [ ] `LoginPage.js` - useEffect on mount
- [ ] `SwitchboardNext.jsx` - handleGoogleLogin()
- [ ] `App.js` - handleLogin() to read and clear state
- [ ] External app's useAuth hook - handle both #auth= and #token= formats

#### Prevention Checklist

1. **Store state BEFORE redirect** - OAuth destroys URL state
2. **Clear state when NOT needed** - Prevents stale value issues
3. **Clear state AFTER use** - Prevents redirect loops
4. **Check ALL login paths** - Apps often have multiple entry points
5. **Add debug logging** - Makes production issues diagnosable

#### Debug Logging Pattern

```javascript
// In handleGoogleLogin (BEFORE OAuth)
if (returnTo) {
  console.log('🔄 Storing returnTo before OAuth:', returnTo);
  localStorage.setItem('sso_return_to', returnTo);
} else {
  console.log('🔄 No returnTo, clearing stale sso_return_to');
  localStorage.removeItem('sso_return_to');
}

// In handleLogin (AFTER OAuth)
const returnTo = localStorage.getItem('sso_return_to');
console.log('🔐 handleLogin: sso_return_to =', returnTo);
if (returnTo === 'fitness') {
  console.log('🔐 Redirecting to fitness app');
  localStorage.removeItem('sso_return_to'); // Clear BEFORE redirect
  // ... redirect
} else {
  console.log('🔐 NOT redirecting, staying on switchboard');
}
```

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

### Multiple URL Hash Formats
- **Error:** Fitness app only handled `#token=` format, not `#auth=`
- **Fix:** useAuth hook handles both formats:
  - `#auth=token=xxx&user=xxx` - From switchboard SSO (preferred)
  - `#token=xxx` - From backend OAuth callback (fallback)
- **Prevention:** Document expected URL formats in useAuth hook

### Broken External App URLs (Vercel Deployments)
- **Error:** Clicking Fitness Coach opened `frontend-six-topaz-27.vercel.app` which returned 404 `DEPLOYMENT_NOT_FOUND`
- **Root Cause:** Vercel deployment was deleted/expired but URL was still hardcoded in `externalUrl`
- **Fix:** Removed `externalUrl` to use internal FitnessApp module instead
- **Prevention:**
  - Use stable project URLs, not deployment-specific URLs
  - Or use environment variables for external app URLs
  - Prefer internal modules when available

### Admin Role Not Working (December 2025)

**Symptom:** User with admin role in Neon database still saw "You do not have admin privileges" error.

**Root Cause:** The production backend connects to **Render's PostgreSQL**, not Neon. Admin roles were being updated in the wrong database.

#### The Two Databases
| Database | Host | Purpose |
|----------|------|---------|
| **Render PostgreSQL** | `oregon-postgres.render.com` | Production users, auth, meals |
| **Neon** | `*.neon.tech` | CORE features (pantry, households) |

#### How Admin Roles Work
1. User logs in with Google OAuth
2. Backend queries **Render DB**: `SELECT * FROM users WHERE google_id = ?`
3. Backend creates JWT with `role: user.role || 'user'`
4. Frontend checks `user.role === 'admin'` from JWT

#### Fix: Update Render Database
```sql
-- Connect to Render PostgreSQL (NOT Neon!)
-- Host: dpg-d4nj6demcj7s73dfvie0-a.oregon-postgres.render.com

-- Add role column if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Grant admin
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';

-- Verify
SELECT email, role FROM users WHERE email = 'your-email@example.com';
```

After updating, user must **log out and log back in** to get new JWT with admin role.

#### Prevention
- Document which database is used for what
- Add comments in environment variable configs
- When debugging auth issues, always check DATABASE_URL first

---

## Email Integration (Office 365)

### Setup Requirements
1. Configure SMTP environment variables on Render:
   ```
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_USER=your-email@yourdomain.com
   SMTP_PASS=your-password-or-app-password
   EMAIL_FROM=your-email@yourdomain.com  (optional, defaults to SMTP_USER)
   ```

2. If using MFA, create an app password at: https://mysignins.microsoft.com/security-info

### Features
- Invitation emails sent when admin creates invite
- Emails resent when admin clicks "Resend" on pending invite
- Frontend shows email status (sent, failed, or not configured)
- Graceful degradation: invites still work without email (copy link manually)

### Files
- `/services/emailService.js` - Office 365 SMTP configuration
- `/routes/admin.js` - Calls `sendInviteEmail()` on invite/resend

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

### Sync vs Async Permission Checks
- **Problem:** Repeatedly fetching role from DB is inefficient
- **Solution:** Provide both async and sync versions
  - `getUserHouseholdRole({ userId, householdId })` - returns `{ membershipRole }`
  - `canEditPantryRole(membershipRole)` - sync check after role is fetched
  - `canEditPantry(userId, householdId)` - async version that fetches role
- **Pattern:** Fetch role once in middleware, use sync helpers in route

### Pantry RBAC Rules
- **viewer:** Can only view pantry items
- **member/admin/owner:** Can view + edit (add, consume, waste, adjust)
- **non-member:** No access (403)
- **Enforcement:** Middleware checks role before route handlers

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

## Pantry Lessons

### Validation Patterns
- **Quantity validation:** Must check > 0 for add/event, >= 0 for update
- **Date validation:** Expiration date >= purchase date if both present
- **Notes validation:** Max 500 characters for text fields
- **Pattern:** Return `{ valid: boolean, error?: string, value?: T }`

### Expiring Items Filter
- **Server-side:** Use `expiration_date <= today + N days AND >= today`
- **Views:** `all`, `exp3`, `exp7`, `exp14`
- **Status filter:** Exclude `consumed` and `wasted` items
- **Timezone:** Server uses UTC boundaries for consistency

### Modal Form Patterns
- **Validation:** Block submit on invalid values
- **Error display:** Show API errors in form
- **Optimistic updates:** Update UI immediately, rollback on error
- **Loading state:** Disable submit button during API call

### Event Types Standardization
- **Canonical:** `add`, `consume`, `waste`, `adjust`
- **Legacy support:** Convert `consumed` → `consume`, `wasted` → `waste`
- **Logging prefixes:** `pantry_item_added`, `pantry_item_consumed`, etc.

---

## UI Lessons

### Search Debouncing
- **Pattern:** 300ms debounce on search input
- **Implementation:** useEffect with setTimeout and cleanup
- **Avoid:** Making API call on every keystroke

### Table vs Grid Layout
- **Decision:** Use table for data-heavy views (pantry items)
- **Reason:** Better for comparing values across columns
- **Cards:** Use for visual/browsing views (recipes)

---

**Version:** 1.4
**Maintained By:** Development Team
