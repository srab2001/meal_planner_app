-- Create admin interview questions table
-- This stores the configurable questions that admins define for the AI Coach interview

CREATE TABLE IF NOT EXISTS admin_interview_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT,
  question_type VARCHAR(50) DEFAULT 'text',
  options JSONB,
  option_range INT,
  order_position INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure ALL columns exist for admin_interview_questions
ALTER TABLE admin_interview_questions ADD COLUMN IF NOT EXISTS question_text TEXT;
ALTER TABLE admin_interview_questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) DEFAULT 'text';
ALTER TABLE admin_interview_questions ADD COLUMN IF NOT EXISTS options JSONB;
ALTER TABLE admin_interview_questions ADD COLUMN IF NOT EXISTS option_range INT;
ALTER TABLE admin_interview_questions ADD COLUMN IF NOT EXISTS order_position INT;
ALTER TABLE admin_interview_questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE admin_interview_questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE admin_interview_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create structured workouts table
-- This stores generated workout plans with all sections and user progress

CREATE TABLE IF NOT EXISTS structured_workouts (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  workout_date DATE,
  workout_name VARCHAR(255),
  day_label VARCHAR(50),
  total_duration_minutes INT,
  primary_goal_summary TEXT,
  session_completed BOOLEAN DEFAULT false,
  effort_score INT,
  session_notes TEXT,
  warm_up_section JSONB,
  strength_section JSONB,
  cardio_pool_section JSONB,
  agility_core_section JSONB,
  recovery_section JSONB,
  interview_responses JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure ALL columns exist for structured_workouts
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS workout_date DATE;
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS workout_name VARCHAR(255);
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS day_label VARCHAR(50);
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS total_duration_minutes INT;
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS primary_goal_summary TEXT;
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS session_completed BOOLEAN DEFAULT false;
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS effort_score INT;
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS session_notes TEXT;
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS warm_up_section JSONB;
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS strength_section JSONB;
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS cardio_pool_section JSONB;
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS agility_core_section JSONB;
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS recovery_section JSONB;
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS interview_responses JSONB;
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE structured_workouts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add constraints for structured_workouts
DO $$
BEGIN
    BEGIN
        ALTER TABLE structured_workouts ADD CONSTRAINT fk_structured_workouts_user_id
        FOREIGN KEY (user_id) REFERENCES users(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Create detailed exercise tracking table
CREATE TABLE IF NOT EXISTS workout_exercises_detailed (
  id SERIAL PRIMARY KEY,
  structured_workout_id INT,
  section_type VARCHAR(50),
  exercise_order INT,
  exercise_name VARCHAR(255),
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  duration_seconds INT,
  how_to_text TEXT,
  sets INT,
  reps INT,
  equipment VARCHAR(255),
  target_muscles TEXT,
  actual_sets INT,
  actual_reps INT,
  pain_scale INT,
  time_minutes INT,
  distance_km DECIMAL(10, 2),
  heart_rate_intent VARCHAR(50),
  is_stretch BOOLEAN DEFAULT false,
  steam_sauna BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure ALL columns exist for workout_exercises_detailed
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS structured_workout_id INT;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS section_type VARCHAR(50);
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS exercise_order INT;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS exercise_name VARCHAR(255);
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS duration_seconds INT;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS how_to_text TEXT;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS sets INT;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS reps INT;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS equipment VARCHAR(255);
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS target_muscles TEXT;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS actual_sets INT;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS actual_reps INT;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS pain_scale INT;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS time_minutes INT;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2);
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS heart_rate_intent VARCHAR(50);
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS is_stretch BOOLEAN DEFAULT false;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS steam_sauna BOOLEAN DEFAULT false;
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE workout_exercises_detailed ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add constraints for workout_exercises_detailed
DO $$
BEGIN
    BEGIN
        ALTER TABLE workout_exercises_detailed ADD CONSTRAINT fk_workout_exercises_structured_workout
        FOREIGN KEY (structured_workout_id) REFERENCES structured_workouts(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add role column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Create indexes (table structures are now guaranteed complete)
CREATE INDEX IF NOT EXISTS idx_admin_questions_active ON admin_interview_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_questions_position ON admin_interview_questions(order_position);
CREATE INDEX IF NOT EXISTS idx_structured_workouts_user ON structured_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_structured_workouts_date ON structured_workouts(workout_date);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises_detailed(structured_workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_section ON workout_exercises_detailed(section_type);

-- Log successful migration
SELECT 'Admin Interview Questions and Structured Workouts tables created successfully' as status;
