-- Add sample interview questions to the admin_interview_questions table
-- Table was created by migration 006_create_admin_questions_and_structured_workouts.sql
-- with these columns: id, question_text, question_type, options, option_range, order_position, is_active

-- Ensure columns exist (for backwards compatibility)
ALTER TABLE admin_interview_questions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE admin_interview_questions 
ADD COLUMN IF NOT EXISTS order_position INTEGER DEFAULT 0;

-- Insert sample interview questions for the AI Workout Coach
INSERT INTO admin_interview_questions (question_text, question_type, order_position, is_active) VALUES
    ('What type of workout are you interested in?', 'text', 1, true),
    ('How many days per week can you exercise?', 'multiple_choice', 2, true),
    ('What is your current fitness level?', 'multiple_choice', 3, true),
    ('Do you have access to gym equipment?', 'yes_no', 4, true),
    ('How much time can you dedicate per workout?', 'range', 5, true)
ON CONFLICT DO NOTHING;
