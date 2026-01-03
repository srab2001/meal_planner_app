-- Create tables for fitness interview feature

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Questions table
CREATE TABLE IF NOT EXISTS fitness_interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  help_text text,
  input_type text NOT NULL CHECK (input_type IN ('single_select','multi_select','number','text')),
  is_required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Options table
CREATE TABLE IF NOT EXISTS fitness_interview_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES fitness_interview_questions(id) ON DELETE CASCADE,
  value text NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Responses table
CREATE TABLE IF NOT EXISTS fitness_interview_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  response_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Workout plans table
CREATE TABLE IF NOT EXISTS workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  created_from_response_id uuid REFERENCES fitness_interview_responses(id) ON DELETE SET NULL,
  plan_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fi_options_qid_sort ON fitness_interview_options(question_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_fi_responses_user_submitted ON fitness_interview_responses(user_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_created ON workout_plans(user_id, created_at);

-- Trigger to update updated_at timestamps (optional convenience)
CREATE OR REPLACE FUNCTION touch_updated_at_column() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_questions BEFORE UPDATE ON fitness_interview_questions FOR EACH ROW EXECUTE PROCEDURE touch_updated_at_column();
CREATE TRIGGER trg_touch_options BEFORE UPDATE ON fitness_interview_options FOR EACH ROW EXECUTE PROCEDURE touch_updated_at_column();
CREATE TRIGGER trg_touch_responses BEFORE UPDATE ON fitness_interview_responses FOR EACH ROW EXECUTE PROCEDURE touch_updated_at_column();
CREATE TRIGGER trg_touch_plans BEFORE UPDATE ON workout_plans FOR EACH ROW EXECUTE PROCEDURE touch_updated_at_column();
