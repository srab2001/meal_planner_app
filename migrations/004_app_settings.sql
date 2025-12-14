-- Meal Planner App - App Settings Table
-- Version: 1.2
-- Created: December 3, 2025

-- Create app_settings table for storing global application settings
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default free meal plans limit
INSERT INTO app_settings (key, value, description)
VALUES ('free_meal_plans_limit', '10', 'Number of free meal plans per month per user')
ON CONFLICT (key) DO NOTHING;
