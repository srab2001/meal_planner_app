-- Add AI workout fields to fitness_workouts table for storing AI-generated workouts
-- This allows the AI Coach feature to save workout plans with full metadata

-- Add new columns to fitness_workouts table
ALTER TABLE fitness_workouts 
ADD COLUMN IF NOT EXISTS workout_data JSONB COMMENT 'Full 6-section AI-generated workout structure (warm_up, strength, cardio, agility, recovery, closeout, summary)',
ADD COLUMN IF NOT EXISTS intensity VARCHAR(20) COMMENT 'Workout intensity level: low, medium, or high',
ADD COLUMN IF NOT EXISTS calories_burned INTEGER COMMENT 'Estimated calories burned during workout',
ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER COMMENT 'Difficulty rating from 1-10',
ADD COLUMN IF NOT EXISTS interview_responses JSONB COMMENT 'User answers to interview questions stored as JSON';

-- Make workout_type nullable since AI workouts use "ai-generated"
ALTER TABLE fitness_workouts 
ALTER COLUMN workout_type SET NOT NULL;

-- Add index for intensity queries
CREATE INDEX IF NOT EXISTS idx_fitness_workouts_intensity 
ON fitness_workouts(intensity);

-- Add check constraint for difficulty rating (1-10)
ALTER TABLE fitness_workouts 
ADD CONSTRAINT check_difficulty_rating 
CHECK (difficulty_rating IS NULL OR (difficulty_rating >= 1 AND difficulty_rating <= 10));

-- Add check constraint for intensity values
ALTER TABLE fitness_workouts 
ADD CONSTRAINT check_intensity_values 
CHECK (intensity IS NULL OR intensity IN ('low', 'medium', 'high'));
