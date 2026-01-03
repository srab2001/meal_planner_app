# Fitness Interview Configuration

Admin-configurable interview for the AI-driven fitness coach.

Tables
- `fitness_interview_questions` - definitions of questions (key, label, input_type, help_text, is_required, sort_order, is_enabled)
- `fitness_interview_options` - dropdown options for questions that require them

Default questions (seeded):
1. main_goal (single_select)
2. primary_objectives (multi_select)
3. fitness_level (single_select)
4. days_per_week (number)
5. location (single_select)
6. session_length (single_select)
7. injuries (text, optional)
8. training_style (single_select)

Admin can add/edit questions and options via the Admin UI at `/admin/fitness-interview`.

API used by the interview UI
- GET `/api/fitness-interview/questions` — returns enabled questions and options
- POST `/api/fitness-interview/submit` — submit responses (response_json keyed by question.key)
- POST `/api/fitness-interview/generate-plan` — generate a workout plan for a submitted response

Admin APIs for configuration
- GET `/api/admin/fitness-interview/questions` — list all questions (admin only)
- POST `/api/admin/fitness-interview/questions` — create question (admin only). Accepts both new schema (key,label,input_type,...) and legacy admin payload (question_text,question_type,options).
- PATCH `/api/admin/fitness-interview/questions/:id` — update question (admin only). Supports replacing options when options array provided.
- PUT `/api/admin/fitness-interview/questions/reorder` — bulk reorder (admin only)
- GET `/api/admin/fitness-interview/questions/:id/options` — list options
- POST `/api/admin/fitness-interview/questions/:id/options` — create option
- PATCH `/api/admin/fitness-interview/options/:id` — update option
