-- Migration 011: Recreate meal_plan_history table with correct UUID types
-- This migration recreates the meal_plan_history table that was dropped in migration 009
-- Purpose: Ensure meal plan history functionality works with proper UUID types

CREATE TABLE IF NOT EXISTS meal_plan_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferences JSONB,
  meal_plan JSONB NOT NULL,
  stores JSONB,
  shopping_list JSONB,
  total_cost DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_history_user_id ON meal_plan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON meal_plan_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_user_recent ON meal_plan_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_preferences ON meal_plan_history USING GIN(preferences);
CREATE INDEX IF NOT EXISTS idx_history_meal_plan ON meal_plan_history USING GIN(meal_plan);
