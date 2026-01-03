-- Migration: Create fitness interview tables and workout plans

-- Create questions table
CREATE TABLE IF NOT EXISTS fitness_interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(255) NOT NULL,
  help_text TEXT,
  input_type VARCHAR(50) NOT NULL,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fiq_sort_order ON fitness_interview_questions(sort_order);

-- Create options table
CREATE TABLE IF NOT EXISTS fitness_interview_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES fitness_interview_questions(id) ON DELETE CASCADE,
  value VARCHAR(255) NOT NULL,
  label VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fio_question_order ON fitness_interview_options(question_id, sort_order);

-- Create responses table
CREATE TABLE IF NOT EXISTS fitness_interview_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  response_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index only if submitted_at column exists (some older setups may have different schema)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fitness_interview_responses' AND column_name='submitted_at') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_fir_user_submitted') THEN
      EXECUTE 'CREATE INDEX idx_fir_user_submitted ON fitness_interview_responses(user_id, submitted_at DESC)';
    END IF;
  END IF;
END$$;

-- Create workout plans table
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Match existing fitness_interview_responses.id type (may be SERIAL/INTEGER in older setups)
  created_from_response_id INTEGER REFERENCES fitness_interview_responses(id) ON DELETE SET NULL,
  plan_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wp_user_created ON workout_plans(user_id, created_at DESC);

COMMENT ON TABLE fitness_interview_questions IS 'Admin-configurable fitness interview questions';
COMMENT ON TABLE fitness_interview_options IS 'Options for interview questions';
COMMENT ON TABLE fitness_interview_responses IS 'User-submitted responses to fitness interview';
COMMENT ON TABLE workout_plans IS 'AI-generated workout plans derived from interview responses';
