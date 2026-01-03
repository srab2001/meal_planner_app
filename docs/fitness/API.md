# Fitness Interview & Plan API

Endpoints

- GET /api/admin/questions/active
  - Returns enabled questions and options (for building the interview UI)

- POST /api/fitness-interview/submit
  - Protected (JWT)
  - Body: { session_id: string, answers: [{ question_id?, question_key?, question_text?, user_answer }] }
  - Stores a `fitness_interview_responses` record and returns { success: true, response_id }

- POST /api/fitness-interview/generate-plan
  - Protected (JWT)
  - Body: { response_id }
  - Server loads the response, calls ChatGPT, validates JSON, stores `workout_plans` and returns { success: true, plan_id }
  - Errors: { error_code: 'invalid_plan_json' } if AI returns invalid JSON

- GET /api/fitness/plan/latest
  - Protected (JWT)
  - Returns the latest plan for the authenticated user

Security & Logging

- OpenAI calls occur server-side only.
- Raw injury text is never logged. Server logs only: requestId, responseId, status, duration (ms).
