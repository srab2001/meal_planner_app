# Fitness Interview — Compact Summary

DB tables:
- fitness_interview_questions (id, key, label, help_text, input_type, is_required, sort_order, is_enabled, timestamps)
- fitness_interview_options (id, question_id, value, label, sort_order, is_enabled, timestamps)
- fitness_interview_responses (id, user_id, submitted_at, response_json, timestamps)
- workout_plans (id, user_id, created_from_response_id, plan_json, timestamps)

API routes:
- Public / user (auth required):
  - GET /api/fitness-interview/questions — fetch enabled questions + options
  - POST /api/fitness-interview/submit — submit response_json (server validates required fields)
  - POST /api/fitness-interview/generate-plan — generate plan from saved response_id (server-only calls to OpenAI)
  - GET /api/fitness/plan/latest — fetch latest plan for user
  - GET /api/fitness/plan/:id — fetch specific plan

- Admin (admin role required):
  - GET /api/admin/fitness-interview/questions
  - POST /api/admin/fitness-interview/questions
  - PATCH /api/admin/fitness-interview/questions/:id
  - PUT /api/admin/fitness-interview/questions/reorder
  - GET /api/admin/fitness-interview/questions/:id/options
  - POST /api/admin/fitness-interview/questions/:id/options
  - PATCH /api/admin/fitness-interview/options/:id

UI routes:
- User interview: /fitness/interview
- Fitness plan viewer: /fitness (auto-open when ?plan_id=...)
- Admin editor: Admin panel -> AI Coach (or new page client/src/modules/admin/pages/FitnessInterviewAdminPage.js)

Planning rules (high level):
- Use main_goal to set training focus and weekly split
- Fit sessions into days_per_week and session_length
- Respect fitness_level; avoid over-progression
- Respect location/equipment assumptions and injuries (lowImpactFlag)
- Include warm-up, mobility, main work, cooldown

Error codes (examples):
- validation_error — missing/invalid input
- invalid_plan_json — AI returned unparsable or schema-invalid JSON
- server_error — transient/internal server errors
# Fitness Interview — Compact Summary

DB tables:
- fitness_interview_questions
- fitness_interview_options
- fitness_interview_responses
- workout_plans

API routes:
- GET /api/admin/questions/active (public)
- POST /api/fitness-interview/submit (store responses)
- POST /api/fitness-interview/generate-plan (generate via ChatGPT)
- GET /api/fitness/plan/latest (latest plan for user)

UI routes:
- /admin/fitness-interview (manage questions & options)
- /fitness/interview (user interview flow)
- /fitness/plan (view generated plan)

Planning rules (server enforces in prompt):
- Use goal to set focus and weekly split
- Use targetDate if provided, else steady progression
- Respect fitness level and avoid over-progressing
- Fit plan to days_per_week & session_length
- Use only exercises supported by location/equipment
- Provide substitutes and low-impact options as needed
- Include warm-up and mobility tied to injuries/limits

Error codes:
- invalid_plan_json — AI returned invalid or non-conforming JSON
- not_authenticated — JWT missing/invalid
- forbidden — access denied for this resource
- not_found — requested resource not found
