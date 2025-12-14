-- Shopping List States Table
-- Stores the state of shopping list checkboxes for each meal plan date
-- Version: 1.0
-- Created: December 13, 2025

-- Drop existing table if it has wrong types (e.g., INTEGER user_id instead of UUID)
-- This handles the case where an old version of the table exists
DROP TABLE IF EXISTS shopping_list_states CASCADE;

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
