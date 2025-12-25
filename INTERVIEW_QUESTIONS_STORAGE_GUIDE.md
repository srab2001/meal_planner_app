# Interview Questions Storage Verification & Seeding Guide

## Current Status

✅ **Table Structure**: Verified in migrations/006_create_admin_questions_and_structured_workouts.sql

✅ **Prisma Schema**: Defined in prisma/schema.prisma (lines 454-465)

✅ **API Endpoint**: GET /api/fitness/admin/interview-questions?active=true

✅ **Auto-Seeding**: Enabled in fitness/backend/routes/fitness.js (lines 975-1027)

## How Interview Questions are Stored

### Database Schema

**Table**: `admin_interview_questions` (in main Render PostgreSQL)

**Columns**:
```
id              SERIAL PRIMARY KEY
question_text   TEXT NOT NULL
question_type   VARCHAR(50)  - 'text', 'multiple_choice', 'yes_no', 'range'
options         JSONB        - Array or object with options/settings
option_range    INT          - For range type questions
order_position  INT NOT NULL - Display order (1, 2, 3, ...)
is_active       BOOLEAN      - Default true
created_at      TIMESTAMP    - Auto-set to NOW()
updated_at      TIMESTAMP    - Auto-set to NOW()
```

### Default Seed Questions

The system includes 5 default questions that are auto-inserted if the table is empty:

```json
[
  {
    "id": 1,
    "question_text": "What type of workout are you interested in?",
    "question_type": "text",
    "options": null,
    "order_position": 1,
    "is_active": true
  },
  {
    "id": 2,
    "question_text": "How many days per week can you exercise?",
    "question_type": "multiple_choice",
    "options": ["1-2 days", "3-4 days", "5-6 days", "7 days"],
    "order_position": 2,
    "is_active": true
  },
  {
    "id": 3,
    "question_text": "What is your current fitness level?",
    "question_type": "multiple_choice",
    "options": ["Beginner", "Intermediate", "Advanced", "Elite"],
    "order_position": 3,
    "is_active": true
  },
  {
    "id": 4,
    "question_text": "Do you have access to gym equipment?",
    "question_type": "yes_no",
    "options": null,
    "order_position": 4,
    "is_active": true
  },
  {
    "id": 5,
    "question_text": "How much time can you dedicate per workout (in minutes)?",
    "question_type": "range",
    "options": { "min": 15, "max": 120 },
    "order_position": 5,
    "is_active": true
  }
]
```

## How to Verify the Table & Seed Data

### Option 1: Via Render Dashboard (Recommended)

1. Go to Render Dashboard
2. Select your PostgreSQL database
3. Click "Query" or use the database console
4. Run: `SELECT COUNT(*) FROM admin_interview_questions;`
5. If count is 0, run seed-interview-questions.js in Render's shell

### Option 2: Via API (After Authentication)

```bash
curl -X GET 'https://meal-planner-app-mve2.onrender.com/api/fitness/admin/interview-questions?active=true' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json'
```

Expected response:
```json
{
  "questions": [
    {
      "id": 1,
      "question_text": "What type of workout are you interested in?",
      "question_type": "text",
      "options": null,
      "order_position": 1,
      "is_active": true,
      "created_at": "2025-12-24T...",
      "updated_at": "2025-12-24T..."
    },
    ...
  ]
}
```

### Option 3: Automatic Seeding

The endpoint has **built-in auto-seeding**:
- When the route is first called
- If the table is empty
- It automatically inserts the 5 default questions
- Backend logs show: "✅ Seeded 5 default interview questions"

## How Data Flows to Frontend

```
┌─────────────────────────────────────────────────────────────┐
│ AIWorkoutInterview.js (frontend)                            │
│ - Calls: GET /api/fitness/admin/interview-questions?active=true
│ - Includes: Authorization: Bearer {JWT_TOKEN}              │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ /api/fitness → requireAuth middleware (server.js:531)      │
│ - Verifies JWT token is valid and extracts req.user        │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ router.get('/admin/interview-questions') (fitness.js:955)  │
│ - Middleware: requireAuth (verifies req.user exists)       │
│ - Query: WHERE is_active = true ORDER BY order_position    │
│ - Auto-seed if empty                                        │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ Render PostgreSQL Database                                  │
│ Table: admin_interview_questions                            │
│ - 5 default questions (or custom questions from admin)      │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ Response to frontend:                                        │
│ { questions: [...] }                                        │
│ - Parsed by: data.questions || []                           │
│ - Sorted by: order_position                                 │
│ - Displayed in: AI Coach interview component                │
└─────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Problem: "GET /api/fitness/admin/interview-questions 404 (Not Found)"

**Solution**: The table or data doesn't exist yet.

1. Check migrations have been applied:
   ```sql
   SELECT * FROM _prisma_migrations;
   ```

2. If migration 006 is missing, the table wasn't created. Render should auto-apply migrations on deploy.

3. If table exists but is empty, the API will auto-seed on first call.

### Problem: "TypeError: h.map is not a function" in Frontend

**Solution**: The response structure was wrong - this was already fixed in commit 18e79ff.

The API returns `{ questions: [...] }` and frontend now correctly extracts `data.questions`.

### Problem: Authentication Fails (401 Unauthorized)

**Solution**: Make sure:
1. User is logged in and has valid JWT token
2. Token is included in Authorization header: `Bearer <token>`
3. Token hasn't expired (30 day expiry)
4. Role is 'admin' (only admins can manage questions, but any authenticated user can fetch them)

## Files Involved

**Backend**:
- `fitness/backend/routes/fitness.js` (lines 947-1050) - Endpoints
- `migrations/006_create_admin_questions_and_structured_workouts.sql` - Table creation
- `seed-interview-questions.js` - Manual seeding script

**Frontend**:
- `client/src/modules/fitness/components/AIWorkoutInterview.js` (lines 44-56) - Fetch call
- `client/src/shared/utils/api.js` - `fetchWithAuth()` helper

**Database Schema**:
- `prisma/schema.prisma` (lines 454-465) - Prisma model

## Recent Fixes

### Commit 18e79ff: Fixed User Management Empty Page
- Changed: `setUsers(usersData)` → `setUsers(usersData.users)`
- Changed: `setInvites(invitesData)` → `setInvites(invitesData.invites)`
- Reason: API returns wrapped response `{users: [...]}` not direct array

This same pattern applies to interview questions:
- API returns: `{ questions: [...] }`
- Frontend extracts: `data.questions || []`

## Next Steps

1. ✅ Verify migrations have been applied to Render (auto-deployed)
2. ✅ Call API endpoint - it will auto-seed if empty
3. ✅ Refresh AI Coach page to fetch and display questions
4. 🔄 Test with different question types (text, multiple_choice, yes_no, range)

---

**Created**: 2025-12-24  
**Status**: Ready for deployment and testing  
**AI Coach Feature**: Ready to use  
