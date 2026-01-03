-- Migration: 023_seed_admin_interview_questions.sql
-- Purpose: Idempotently seed the canonical AI Coach interview questions

BEGIN;

-- Q1: Free-text workout type
INSERT INTO admin_interview_questions (question_text, question_type, options, option_range, order_position, is_active, display_style)
SELECT 'What type of workout are you interested in?', 'text', '[]'::jsonb, NULL, 1, TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM admin_interview_questions WHERE question_text = 'What type of workout are you interested in?');

-- Q2: Days per week (multiple choice, numeric) - use dropdown
INSERT INTO admin_interview_questions (question_text, question_type, options, option_range, order_position, is_active, display_style)
SELECT 'How many days per week can you exercise?', 'multiple_choice', '["1","2","3","4","5","6","7"]'::jsonb, NULL, 2, TRUE, 'dropdown'
WHERE NOT EXISTS (SELECT 1 FROM admin_interview_questions WHERE question_text = 'How many days per week can you exercise?');

-- Q3: Current fitness level
INSERT INTO admin_interview_questions (question_text, question_type, options, option_range, order_position, is_active, display_style)
SELECT 'What is your current fitness level?', 'multiple_choice', '["Beginner","Intermediate","Advanced"]'::jsonb, NULL, 3, TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM admin_interview_questions WHERE question_text = 'What is your current fitness level?');

-- Q4: Gym equipment access (yes/no)
INSERT INTO admin_interview_questions (question_text, question_type, options, option_range, order_position, is_active, display_style)
SELECT 'Do you have access to gym equipment?', 'yes_no', '[]'::jsonb, NULL, 4, TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM admin_interview_questions WHERE question_text = 'Do you have access to gym equipment?');

-- Q5: Time per workout (range)
-- For range questions we store min/max in the options JSON to be compatible with existing schema where option_range is INT
INSERT INTO admin_interview_questions (question_text, question_type, options, option_range, order_position, is_active, display_style)
SELECT 'How much time can you dedicate per workout (minutes)?', 'range', '{"min":10,"max":120}'::jsonb, NULL, 5, TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM admin_interview_questions WHERE question_text = 'How much time can you dedicate per workout (minutes)?');

COMMIT;
