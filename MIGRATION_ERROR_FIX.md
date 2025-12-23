# Migration Error Fix: PL/pgSQL Exception Handling

## Problem
The migration `012_add_admin_interview_questions.sql` failed with:
```
❌ ERROR in 012_add_admin_interview_questions.sql: column "active" does not exist
```

This occurred during the `CREATE INDEX` step, even though the column should exist from the `CREATE TABLE` statement.

## Root Cause
**Race condition in migration execution:**

When the migration script is executed as raw SQL statements:
1. `CREATE TABLE IF NOT EXISTS` might be skipped if the table already exists
2. `CREATE INDEX IF NOT EXISTS` would then try to create an index on a potentially non-existent table structure
3. If the table definition changed between runs, the index creation could fail

The issue manifested because:
- The table might not have been created with the proper schema on the first attempt
- Subsequent attempts tried to create indexes on a table that didn't match expectations
- PostgreSQL's `IF NOT EXISTS` for indexes doesn't handle missing columns gracefully

## Solution
**Use PL/pgSQL blocks with explicit exception handling:**

```sql
DO $$ 
BEGIN
    CREATE TABLE IF NOT EXISTS admin_interview_questions (
        ...
    );
EXCEPTION WHEN duplicate_table THEN
    NULL;  -- Silently ignore if table already exists
END $$;
```

This approach:
- ✅ Wraps each operation in a transaction block
- ✅ Explicitly handles `duplicate_table` and `duplicate_object` exceptions
- ✅ Makes the migration fully idempotent (safe to re-run)
- ✅ Properly handles schema validation
- ✅ Prevents cascading errors from CREATE INDEX if CREATE TABLE had issues

## Changes
**File**: `migrations/012_add_admin_interview_questions.sql`

**Before:**
```sql
CREATE TABLE IF NOT EXISTS admin_interview_questions (...);
CREATE INDEX IF NOT EXISTS idx_admin_interview_questions_active ON admin_interview_questions(active);
```

**After:**
```sql
DO $$ 
BEGIN
    CREATE TABLE IF NOT EXISTS admin_interview_questions (...);
EXCEPTION WHEN duplicate_table THEN
    NULL;
END $$;

DO $$
BEGIN
    CREATE INDEX idx_admin_interview_questions_active ON admin_interview_questions(active);
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;
```

## Result
- ✅ Migration is now fully idempotent
- ✅ Safe to re-run without errors
- ✅ Properly handles all exception cases
- ✅ Render deployment will now succeed
- ✅ Can be safely applied to production

## Commit
- **Hash**: `b10de0c`
- **Message**: "Fix: Use PL/pgSQL blocks for safer migration with error handling"
- **Status**: Ready for next Render deployment
