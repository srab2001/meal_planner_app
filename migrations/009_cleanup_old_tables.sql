-- Migration 009: Cleanup old tables with wrong types
-- This migration removes OLD tables that have incorrect data types
-- Created: December 14, 2025
-- Purpose: Clean up database schema to allow fresh table recreation

-- Drop the old shopping_list_states table if it exists (it has INTEGER user_id instead of UUID)
-- This will cascade to any dependent tables
DROP TABLE IF EXISTS shopping_list_states CASCADE;

-- Drop the old favorites table if it exists (might have INTEGER user_id too)
DROP TABLE IF EXISTS favorites CASCADE;

-- Drop meal_plan_history if it has issues
DROP TABLE IF EXISTS meal_plan_history CASCADE;

-- All of these will be recreated by subsequent migrations with correct UUID types
