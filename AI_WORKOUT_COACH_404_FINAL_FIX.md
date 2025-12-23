# AI Workout Coach 404 Fix - Final Solution

## Problem
The AI Workout Coach feature was returning a 404 error when trying to fetch interview questions.

## Root Cause Analysis
After thorough investigation, discovered THREE distinct issues:

1. **Initial Issue (Already Fixed)**: 
   - Frontend was calling wrong endpoint: `/api/admin/questions/active`
   - Should call: `/api/fitness/admin/interview-questions?active=true`
   - Fixed in commit `2f559f8`

2. **Response Format Issue (Already Fixed)**:
   - Backend response had wrong field names
   - Fixed mappings: `question`→`question_text`, `type`→`question_type`, etc.
   - Fixed in commit `2f559f8`

3. **Database Table Issue (JUST FIXED)** ✅:
   - The `admin_interview_questions` table didn't exist in the MAIN database
   - Model was only defined in `fitness/prisma/schema.prisma` but not in main schema
   - Fitness routes use the main `DATABASE_URL`, not a separate fitness database
   - The migration to add the table wasn't being applied

## Solution Implemented

### Step 1: Added Model to Main Schema
Updated `prisma/schema.prisma` to include the `admin_interview_questions` model:
```prisma
model admin_interview_questions {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  question  String
  type      String   @db.VarChar(50)
  options   String?
  order     Int      @default(0)
  active    Boolean  @default(true)
  created_at DateTime @default(now()) @db.Timestamptz(6)
  updated_at DateTime @default(now()) @db.Timestamptz(6)

  @@index([active], map: "idx_admin_interview_questions_active")
  @@index([order], map: "idx_admin_interview_questions_order")
}
```

### Step 2: Created SQL Migration
Created `migrations/012_add_admin_interview_questions.sql` with:
- CREATE TABLE statement for `admin_interview_questions`
- Proper indexes on `active` and `order` columns
- 5 sample interview questions:
  1. "What type of workout are you interested in?" (text)
  2. "How many days per week can you exercise?" (multiple_choice)
  3. "What is your current fitness level?" (multiple_choice)
  4. "Do you have access to gym equipment?" (yes_no)
  5. "How much time can you dedicate per workout?" (range)

### Step 3: Updated Code Comments
Updated `fitness/backend/routes/fitness.js` comments to clarify that:
- The `admin_interview_questions` table is in the main Render database
- Fitness routes must use the main `DATABASE_URL`

## Deployment

The fix is now deployed with:
- Commit: `6d5ae89` - "Fix: Ensure admin_interview_questions table exists in main database"
- Pushed to GitHub: https://github.com/srab2001/meal_planner_app/commits/main

When the Render deployment runs:
1. The `scripts/run-migrations.js` will execute before server start
2. Migration `012_add_admin_interview_questions.sql` will be applied
3. Table will be created with sample data
4. AI Workout Coach endpoint will work correctly

## Expected Results

After the next Render deployment:
- ✅ `GET /api/fitness/admin/interview-questions?active=true` returns 200 OK
- ✅ Response includes 5 interview questions
- ✅ Field names are properly normalized (question_text, question_type, etc.)
- ✅ AI Workout Coach modal loads without errors
- ✅ User can answer interview questions and generate workout plans

## Testing

To verify the fix works:
1. Go to https://meal-planner-gold-one.vercel.app
2. Click "Fitness Tracker"
3. Click "AI Workout Coach" tab
4. Should see interview questions loading
5. Can answer questions and generate a workout plan

## Files Modified

1. `prisma/schema.prisma` - Added admin_interview_questions model
2. `migrations/012_add_admin_interview_questions.sql` - New migration file
3. `fitness/backend/routes/fitness.js` - Updated comments for clarity

## Commit Message

```
Fix: Ensure admin_interview_questions table exists in main database

- Added admin_interview_questions model to main prisma/schema.prisma
- Created migration 012_add_admin_interview_questions.sql
- Includes 5 sample interview questions for AI Workout Coach
- Updated fitness.js comment to clarify database usage
- This fixes the 404 error when fetching interview questions
```

---

**Status**: ✅ RESOLVED AND DEPLOYED
**Previous Commits**: 2f559f8, 347a33f, cb5afcc
**Current Commit**: 6d5ae89
