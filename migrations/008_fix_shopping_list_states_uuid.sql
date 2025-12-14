-- Migration 008: Fix shopping_list_states table UUID types
-- This migration corrects the user_id column type from INTEGER to UUID
-- Created: December 14, 2025

-- Drop the existing table if it has wrong types
DROP TABLE IF EXISTS shopping_list_states CASCADE;

-- Recreate with correct UUID types
CREATE TABLE IF NOT EXISTS shopping_list_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  checked_items JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, meal_plan_date)
);

CREATE INDEX IF NOT EXISTS idx_shopping_list_states_user_id ON shopping_list_states(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_states_date ON shopping_list_states(meal_plan_date);
CREATE INDEX IF NOT EXISTS idx_shopping_list_states_user_date ON shopping_list_states(user_id, meal_plan_date);
