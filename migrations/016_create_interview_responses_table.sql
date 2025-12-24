-- Create dedicated table for tracking interview responses (optional but recommended)
-- This provides better analytics and allows reusing responses across sessions

CREATE TABLE IF NOT EXISTS fitness_interview_responses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  question_id INTEGER REFERENCES admin_interview_questions(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  answer_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_session_question UNIQUE(session_id, question_id)
);

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
