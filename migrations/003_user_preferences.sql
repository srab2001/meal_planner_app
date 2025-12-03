-- Meal Planner App - User Preferences and Profile Management
-- Version: 1.1
-- Created: December 3, 2025

-- ============================================================================
-- USER PROFILE ENHANCEMENTS
-- ============================================================================

-- Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/New_York';
ALTER TABLE users ADD COLUMN IF NOT EXISTS meal_plans_generated INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create index for timezone (useful for scheduled notifications)
CREATE INDEX IF NOT EXISTS idx_users_timezone ON users(timezone);

-- ============================================================================
-- USER PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Meal Planning Defaults
  default_cuisines JSONB DEFAULT '[]',
  default_people INTEGER DEFAULT 2,
  default_meals JSONB DEFAULT '["breakfast", "lunch", "dinner"]',
  default_days JSONB DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]',
  default_dietary JSONB DEFAULT '[]',

  -- Email Notification Preferences
  email_notifications JSONB DEFAULT '{
    "weeklyReminder": true,
    "mealPlanReady": true,
    "favoriteRecipeDigest": false,
    "accountActivity": true,
    "promotions": false
  }',

  -- Display Preferences
  theme VARCHAR(20) DEFAULT 'light',
  units VARCHAR(20) DEFAULT 'imperial',
  language VARCHAR(10) DEFAULT 'en',

  -- Privacy Settings
  share_favorites BOOLEAN DEFAULT FALSE,
  public_profile BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_theme CHECK (theme IN ('light', 'dark', 'auto')),
  CONSTRAINT check_units CHECK (units IN ('imperial', 'metric')),
  CONSTRAINT check_default_people CHECK (default_people > 0 AND default_people <= 20)
);

-- Create indexes for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_prefs_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prefs_cuisines ON user_preferences USING GIN(default_cuisines);
CREATE INDEX IF NOT EXISTS idx_user_prefs_dietary ON user_preferences USING GIN(default_dietary);

-- Auto-update updated_at on user_preferences
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RECIPE CUSTOMIZATIONS
-- ============================================================================

-- Enhance favorites table with customization options
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS servings_adjustment INTEGER DEFAULT 1;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS ingredient_swaps JSONB DEFAULT '[]';
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS user_notes TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS custom_instructions JSONB;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS cooking_time_actual INTEGER;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS last_cooked_at TIMESTAMP;

-- Add indexes for new favorite fields
CREATE INDEX IF NOT EXISTS idx_favorites_last_cooked ON favorites(last_cooked_at DESC) WHERE last_cooked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_favorites_difficulty ON favorites(difficulty_rating) WHERE difficulty_rating IS NOT NULL;

-- ============================================================================
-- USER ACTIVITY TRACKING
-- ============================================================================

-- Create table for tracking user actions (for profile stats)
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_activity_type CHECK (activity_type IN (
    'login',
    'logout',
    'meal_plan_generated',
    'favorite_added',
    'favorite_removed',
    'recipe_customized',
    'profile_updated',
    'preferences_updated'
  ))
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_type ON user_activity(user_id, activity_type, created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create preferences when user is created
CREATE TRIGGER trigger_create_user_preferences
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_user_preferences();

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type VARCHAR(50),
  p_activity_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO user_activity (user_id, activity_type, activity_data)
  VALUES (p_user_id, p_activity_type, p_activity_data)
  RETURNING id INTO v_activity_id;
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- BACKFILL EXISTING USERS
-- ============================================================================

-- Create preferences for existing users who don't have them yet
INSERT INTO user_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify new columns added to users table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('phone_number', 'timezone', 'meal_plans_generated', 'bio')
ORDER BY column_name;

-- Verify user_preferences table created
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Verify favorites enhancements
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'favorites'
AND column_name IN ('servings_adjustment', 'ingredient_swaps', 'user_notes', 'custom_instructions', 'cooking_time_actual', 'difficulty_rating', 'last_cooked_at')
ORDER BY column_name;

-- Count preferences created
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM user_preferences) as users_with_preferences;

COMMIT;
