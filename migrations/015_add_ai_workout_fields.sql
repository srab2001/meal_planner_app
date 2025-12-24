-- Add AI workout fields to fitness_workouts table for storing AI-generated workouts
-- This allows the AI Coach feature to save workout plans with full metadata

-- Add new columns to fitness_workouts table
ALTER TABLE fitness_workouts 
ADD COLUMN IF NOT EXISTS workout_data JSONB,
ADD COLUMN IF NOT EXISTS intensity VARCHAR(20),
ADD COLUMN IF NOT EXISTS calories_burned INTEGER,
ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER,
ADD COLUMN IF NOT EXISTS interview_responses JSONB;

-- Add index for intensity queries
CREATE INDEX IF NOT EXISTS idx_fitness_workouts_intensity 
ON fitness_workouts(intensity);

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
