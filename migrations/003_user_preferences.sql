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
  user_id UUID,
  default_cuisines JSONB DEFAULT '[]',
  default_people INTEGER DEFAULT 2,
  default_meals JSONB DEFAULT '["breakfast", "lunch", "dinner"]',
  default_days JSONB DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]',
  default_dietary JSONB DEFAULT '[]',
  email_notifications JSONB DEFAULT '{
    "weeklyReminder": true,
    "mealPlanReady": true,
    "favoriteRecipeDigest": false,
    "accountActivity": true,
    "promotions": false
  }',
  theme VARCHAR(20) DEFAULT 'light',
  units VARCHAR(20) DEFAULT 'imperial',
  language VARCHAR(10) DEFAULT 'en',
  share_favorites BOOLEAN DEFAULT FALSE,
  public_profile BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure ALL columns exist (handles partial table creation from failed deployments)
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS default_cuisines JSONB DEFAULT '[]';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS default_people INTEGER DEFAULT 2;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS default_meals JSONB DEFAULT '["breakfast", "lunch", "dinner"]';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS default_days JSONB DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS default_dietary JSONB DEFAULT '[]';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS email_notifications JSONB DEFAULT '{
    "weeklyReminder": true,
    "mealPlanReady": true,
    "favoriteRecipeDigest": false,
    "accountActivity": true,
    "promotions": false
  }';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'light';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS units VARCHAR(20) DEFAULT 'imperial';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS share_favorites BOOLEAN DEFAULT FALSE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS public_profile BOOLEAN DEFAULT FALSE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add constraints safely
DO $$
BEGIN
    BEGIN
        ALTER TABLE user_preferences ADD CONSTRAINT unique_user_preferences_user_id UNIQUE (user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER TABLE user_preferences ADD CONSTRAINT fk_user_preferences_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER TABLE user_preferences ADD CONSTRAINT check_theme CHECK (theme IN ('light', 'dark', 'auto'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER TABLE user_preferences ADD CONSTRAINT check_units CHECK (units IN ('imperial', 'metric'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER TABLE user_preferences ADD CONSTRAINT check_default_people CHECK (default_people > 0 AND default_people <= 20);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Create indexes (table structure is now guaranteed complete)
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
