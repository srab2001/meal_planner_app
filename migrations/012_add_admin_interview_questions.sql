-- Add sample interview questions to the admin_interview_questions table
-- Table was created by migration 006_create_admin_questions_and_structured_workouts.sql
-- with these columns: id, question_text, question_type, options, option_range, order_position, is_active

-- Handle legacy 'question' column (rename to 'question_text' if it exists)
DO $$
BEGIN
    -- If old 'question' column exists, rename it to 'question_text'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_interview_questions'
        AND column_name = 'question'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_interview_questions'
        AND column_name = 'question_text'
    ) THEN
        ALTER TABLE admin_interview_questions RENAME COLUMN question TO question_text;
    END IF;
END $$;

-- Ensure ALL columns exist (handles partial table creation from failed deployments)
ALTER TABLE admin_interview_questions
ADD COLUMN IF NOT EXISTS question_text TEXT;

ALTER TABLE admin_interview_questions
ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) DEFAULT 'text';

ALTER TABLE admin_interview_questions
ADD COLUMN IF NOT EXISTS options JSONB;

ALTER TABLE admin_interview_questions
ADD COLUMN IF NOT EXISTS option_range INT;

ALTER TABLE admin_interview_questions
ADD COLUMN IF NOT EXISTS order_position INTEGER DEFAULT 0;

ALTER TABLE admin_interview_questions
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE admin_interview_questions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE admin_interview_questions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Now insert sample interview questions (table structure is guaranteed complete)
INSERT INTO admin_interview_questions (question_text, question_type, order_position, is_active) VALUES
    ('What type of workout are you interested in?', 'text', 1, true),
    ('How many days per week can you exercise?', 'multiple_choice', 2, true),
    ('What is your current fitness level?', 'multiple_choice', 3, true),
    ('Do you have access to gym equipment?', 'yes_no', 4, true),
    ('How much time can you dedicate per workout?', 'range', 5, true)
ON CONFLICT DO NOTHING;
