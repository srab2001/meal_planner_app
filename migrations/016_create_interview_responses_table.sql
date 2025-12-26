-- Create dedicated table for tracking interview responses (optional but recommended)
-- This provides better analytics and allows reusing responses across sessions

-- Determine the correct type for question_id based on admin_interview_questions.id type
DO $$
DECLARE
    admin_questions_id_type TEXT;
BEGIN
    -- Get the actual data type of admin_interview_questions.id
    SELECT data_type INTO admin_questions_id_type
    FROM information_schema.columns
    WHERE table_name = 'admin_interview_questions'
    AND column_name = 'id';

    -- Create table with appropriate question_id type
    IF admin_questions_id_type = 'uuid' THEN
        -- Legacy schema uses UUID for admin_interview_questions.id
        CREATE TABLE IF NOT EXISTS fitness_interview_responses (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          session_id VARCHAR(255) NOT NULL,
          question_id UUID REFERENCES admin_interview_questions(id) ON DELETE SET NULL,
          question_text TEXT NOT NULL,
          user_answer TEXT NOT NULL,
          answer_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ELSE
        -- New schema uses INTEGER (SERIAL) for admin_interview_questions.id
        CREATE TABLE IF NOT EXISTS fitness_interview_responses (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          session_id VARCHAR(255) NOT NULL,
          question_id INTEGER REFERENCES admin_interview_questions(id) ON DELETE SET NULL,
          question_text TEXT NOT NULL,
          user_answer TEXT NOT NULL,
          answer_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    BEGIN
        ALTER TABLE fitness_interview_responses
        ADD CONSTRAINT unique_session_question UNIQUE(session_id, question_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_fitness_interview_responses_user_id 
ON fitness_interview_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_fitness_interview_responses_session_id 
ON fitness_interview_responses(session_id);

CREATE INDEX IF NOT EXISTS idx_fitness_interview_responses_created_at 
ON fitness_interview_responses(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE fitness_interview_responses IS 'Track user responses to fitness interview questions for analysis and improvement';
COMMENT ON COLUMN fitness_interview_responses.session_id IS 'Unique identifier for each interview session';
COMMENT ON COLUMN fitness_interview_responses.answer_type IS 'Type of answer: text, multiple_choice, yes_no, or range';
