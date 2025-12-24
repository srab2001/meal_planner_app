-- Add AI workout fields to fitness_workouts table for storing AI-generated workouts
-- This allows the AI Coach feature to save workout plans with full metadata

-- Create fitness_workouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS fitness_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL,
  workout_type VARCHAR(50),
  duration_minutes INTEGER,
  notes TEXT,
  
  -- AI-Generated Workout Fields
  workout_data JSONB,
  intensity VARCHAR(20),
  calories_burned INTEGER,
  difficulty_rating INTEGER,
  
  -- Interview Tracking
  interview_responses JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to fitness_workouts table (if table was pre-existing)
ALTER TABLE fitness_workouts 
ADD COLUMN IF NOT EXISTS workout_data JSONB,
ADD COLUMN IF NOT EXISTS intensity VARCHAR(20),
ADD COLUMN IF NOT EXISTS calories_burned INTEGER,
ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER,
ADD COLUMN IF NOT EXISTS interview_responses JSONB;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_fitness_workouts_user_id ON fitness_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_workouts_date ON fitness_workouts(workout_date);
CREATE INDEX IF NOT EXISTS idx_fitness_workouts_intensity ON fitness_workouts(intensity);

-- Add check constraint for difficulty rating (1-10)
DO $$ BEGIN
  BEGIN
    ALTER TABLE fitness_workouts 
    ADD CONSTRAINT check_difficulty_rating 
    CHECK (difficulty_rating IS NULL OR (difficulty_rating >= 1 AND difficulty_rating <= 10));
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- Add check constraint for intensity values
DO $$ BEGIN
  BEGIN
    ALTER TABLE fitness_workouts 
    ADD CONSTRAINT check_intensity_values 
    CHECK (intensity IS NULL OR intensity IN ('low', 'medium', 'high'));
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- Add comments to columns (separate statements)
COMMENT ON COLUMN fitness_workouts.workout_data IS 'Full 6-section AI-generated workout structure (warm_up, strength, cardio, agility, recovery, closeout, summary)';
COMMENT ON COLUMN fitness_workouts.intensity IS 'Workout intensity level: low, medium, or high';
COMMENT ON COLUMN fitness_workouts.calories_burned IS 'Estimated calories burned during workout';
COMMENT ON COLUMN fitness_workouts.difficulty_rating IS 'Difficulty rating from 1-10';
COMMENT ON COLUMN fitness_workouts.interview_responses IS 'User answers to interview questions stored as JSON';
