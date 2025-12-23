-- Create admin interview questions table
-- This stores the configurable questions that admins define for the AI Coach interview

CREATE TABLE IF NOT EXISTS admin_interview_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'text', -- 'text', 'multiple_choice', 'yes_no', 'range'
  options JSONB, -- For multiple choice: ["option1", "option2", ...]
  option_range INT, -- For range type: max value (1-10, etc)
  order_position INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create structured workouts table
-- This stores generated workout plans with all sections and user progress

CREATE TABLE IF NOT EXISTS structured_workouts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  workout_date DATE,
  workout_name VARCHAR(255),
  day_label VARCHAR(50), -- "Monday", "Day 1", etc
  total_duration_minutes INT,
  primary_goal_summary TEXT,
  
  -- Session tracking
  session_completed BOOLEAN DEFAULT false,
  effort_score INT, -- 1-10 scale
  session_notes TEXT,
  
  -- Sections stored as JSONB for flexibility
  warm_up_section JSONB, -- Array of exercises
  strength_section JSONB, -- Array of exercises with sets/reps
  cardio_pool_section JSONB, -- Array of activities
  agility_core_section JSONB, -- Array of exercises
  recovery_section JSONB, -- Array of stretches
  
  -- Interview responses (for reference/regeneration)
  interview_responses JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create detailed exercise tracking table
-- This stores user progress on individual exercises

CREATE TABLE IF NOT EXISTS workout_exercises_detailed (
  id SERIAL PRIMARY KEY,
  structured_workout_id INT NOT NULL REFERENCES structured_workouts(id) ON DELETE CASCADE,
  section_type VARCHAR(50) NOT NULL, -- 'warm_up', 'strength', 'cardio', 'agility', 'recovery'
  exercise_order INT,
  
  -- Common fields
  exercise_name VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Warm-up/Recovery specific
  duration_seconds INT,
  how_to_text TEXT,
  
  -- Strength specific
  sets INT,
  reps INT,
  equipment VARCHAR(255),
  target_muscles TEXT,
  actual_sets INT,
  actual_reps INT,
  pain_scale INT, -- 0-10
  
  -- Cardio specific
  time_minutes INT,
  distance_km DECIMAL(10, 2),
  heart_rate_intent VARCHAR(50), -- 'low', 'moderate', 'high'
  
  -- Recovery specific
  is_stretch BOOLEAN DEFAULT false,
  steam_sauna BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add role column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'; -- 'user', 'admin'

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_questions_active ON admin_interview_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_questions_position ON admin_interview_questions(order_position);
CREATE INDEX IF NOT EXISTS idx_structured_workouts_user ON structured_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_structured_workouts_date ON structured_workouts(workout_date);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises_detailed(structured_workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_section ON workout_exercises_detailed(section_type);

-- Log successful migration
SELECT 'Admin Interview Questions and Structured Workouts tables created successfully' as status;
