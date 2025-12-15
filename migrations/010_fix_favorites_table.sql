-- Migration 010: Fix favorites endpoint - ensure table exists and has correct schema
-- This migration will ensure the favorites table is correctly created

-- First, ensure uuid-ossp extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the favorites table if it exists (to recreate it fresh)
DROP TABLE IF EXISTS favorites CASCADE;

-- Create the favorites table with correct schema
CREATE TABLE favorites (
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

-- Create indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_meal_type ON favorites(meal_type);
CREATE INDEX idx_favorites_meal_name ON favorites(meal_name);

-- Add comments for documentation
COMMENT ON TABLE favorites IS 'Stores user favorite meals for quick access and reuse';
COMMENT ON COLUMN favorites.meal_data IS 'Complete meal data as JSON (ingredients, instructions, etc.)';
COMMENT ON COLUMN favorites.servings_adjustment IS 'User adjustment to default servings count';
COMMENT ON COLUMN favorites.user_notes IS 'User personal notes about the meal';
