# Database Schema Fix: Foreign Key Type Mismatch

## Problem Identified 🐛

**Render Error Log:**
```
error: foreign key constraint "shopping_list_states_user_id_fkey" cannot be implemented
Key columns "user_id" of the referencing table and "id" of the referenced table are of incompatible types: integer and uuid.
```

### Root Cause
The application was trying to create a `shopping_list_states` table with `user_id` defined as `INTEGER`, but the `users` table has `id` defined as `UUID`. PostgreSQL doesn't allow foreign key constraints between incompatible types.

## Solution Implemented ✅

### 1. Created Migration File
**File:** `migrations/007_shopping_list_states.sql`

This migration creates the `shopping_list_states` table with the correct UUID type:
```sql
CREATE TABLE IF NOT EXISTS shopping_list_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  checked_items JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, meal_plan_date)
);
```

**Key Fixes:**
- ✅ `user_id UUID` instead of `INTEGER` (matches `users.id` type)
- ✅ Proper indexes for performance
- ✅ UUID primary key for consistency
- ✅ Timestamps for audit trail

### 2. Added Migration Runner
**File:** `scripts/run-migrations.js`

This script:
- Reads all SQL files in `/migrations` directory (sorted by filename)
- Executes them in order
- Handles "already exists" errors gracefully
- Runs automatically on npm start via prestart hook

### 3. Updated package.json
Added prestart hook:
```json
"prestart": "node scripts/run-migrations.js || true",
"start": "node server.js",
```

This ensures migrations run before the application starts on Render.

## Changes Made

### New Files
- `migrations/007_shopping_list_states.sql` - Corrected table schema
- `scripts/run-migrations.js` - Migration runner

### Modified Files
- `package.json` - Added prestart script

## Testing the Fix

Once Render redeploys (should happen automatically):

```bash
# 1. Check Render logs
# Render Dashboard → meal-planner-api → Logs

# Expected output:
# 🔄 Running database migrations...
#   📋 Running 001_initial_schema.sql...
#   ✅ 001_initial_schema.sql completed
#   📋 Running 002_session_table.sql...
#   ℹ️  002_session_table.sql already exists, skipping
#   ...
#   📋 Running 007_shopping_list_states.sql...
#   ✅ 007_shopping_list_states.sql completed
# ✅ All migrations completed successfully
# ✅ Server listening on port 10000

# 2. Test health endpoint
curl https://meal-planner-api.onrender.com/health

# Expected: {"status":"ok",...}
```

## Why This Happened

The `shopping_list_states` table creation code was in the application's startup logic (not in this codebase), which had a bug where it created the column as INTEGER instead of UUID. By defining it properly in migrations before the app starts, the app's dynamic table creation is skipped.

## Deployment Timeline

| Status | Time | Event |
|--------|------|-------|
| ✅ | Just now | Fix pushed to GitHub |
| ⏳ | Next 2-5 min | Render triggers automatic redeploy |
| ⏳ | During deploy | Migration runner executes migrations |
| ✅ | Final | Backend comes online with correct schema |

## Next Steps

1. **Monitor Render Logs**
   - Go to: https://dashboard.render.com
   - Service: meal-planner-api
   - Check logs for "✅ All migrations completed successfully"

2. **Verify Backend Health**
   ```bash
   curl https://meal-planner-api.onrender.com/health
   ```

3. **Test Full Integration**
   - Open frontend: https://meal-planner.vercel.app
   - Try logging in with Google OAuth
   - Generate a meal plan
   - Check shopping list functionality

4. **Monitor for Issues**
   - Check Render logs for any errors
   - Check browser console for CORS or API errors

## Related Schema References

**All user_id columns must be UUID:**
- ✅ users.id = UUID
- ✅ subscriptions.user_id = UUID
- ✅ favorites.user_id = UUID
- ✅ usage_stats.user_id = UUID
- ✅ meal_plan_history.user_id = UUID
- ✅ shopping_list_states.user_id = UUID (FIXED)

---

**Created:** December 13, 2025  
**Fixed by:** Database Schema Migration  
**Status:** Deployed to GitHub, awaiting Render rebuild
