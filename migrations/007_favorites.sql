-- Migration 007: Add favorites table
-- This table stores user's favorite meals for quick access

-- Drop existing table if it has wrong types
DROP TABLE IF EXISTS favorites CASCADE;

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  meal_data JSONB NOT NULL,
  meal_name VARCHAR(255) NOT NULL,
  servings_adjustment INTEGER,
  user_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, meal_name, meal_type)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_meal_type ON favorites(meal_type);
CREATE INDEX IF NOT EXISTS idx_favorites_meal_name ON favorites(meal_name);

-- Add comment
COMMENT ON TABLE favorites IS 'Stores user favorite meals for quick access and reuse';
COMMENT ON COLUMN favorites.meal_data IS 'Complete meal data as JSON (ingredients, instructions, etc.)';
COMMENT ON COLUMN favorites.servings_adjustment IS 'User adjustment to default servings count';
COMMENT ON COLUMN favorites.user_notes IS 'User personal notes about the meal';
