-- ============================================================================
-- CUISINE AND DIETARY OPTIONS SETUP
-- Run this file in TablePlus to set up cuisine and dietary options tables
-- ============================================================================

-- First, check if uuid extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- CUISINE OPTIONS TABLE
-- ============================================================================

-- Drop and recreate cuisine_options table
DROP TABLE IF EXISTS cuisine_options CASCADE;

CREATE TABLE cuisine_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cuisine_active ON cuisine_options(active);
CREATE INDEX idx_cuisine_display_order ON cuisine_options(display_order);

CREATE TRIGGER update_cuisine_options_updated_at
  BEFORE UPDATE ON cuisine_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default cuisine options
INSERT INTO cuisine_options (name, display_order) VALUES
('Italian', 1),
('Mexican', 2),
('Chinese', 3),
('Japanese', 4),
('Indian', 5),
('Thai', 6),
('Mediterranean', 7),
('American', 8),
('French', 9),
('Korean', 10),
('Vietnamese', 11),
('Greek', 12),
('Spanish', 13),
('Middle Eastern', 14),
('Caribbean', 15),
('Ethiopian', 16),
('Brazilian', 17),
('Turkish', 18);

-- ============================================================================
-- DIETARY OPTIONS TABLE
-- ============================================================================

-- Drop and recreate dietary_options table
DROP TABLE IF EXISTS dietary_options CASCADE;

CREATE TABLE dietary_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dietary_active ON dietary_options(active);
CREATE INDEX idx_dietary_display_order ON dietary_options(display_order);

CREATE TRIGGER update_dietary_options_updated_at
  BEFORE UPDATE ON dietary_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default dietary options
INSERT INTO dietary_options (key, label, display_order) VALUES
('diabetic', 'Diabetic-Friendly', 1),
('dairyFree', 'Dairy-Free', 2),
('glutenFree', 'Gluten-Free', 3),
('peanutFree', 'Peanut-Free', 4),
('vegetarian', 'Vegetarian', 5),
('kosher', 'Kosher', 6),
('vegan', 'Vegan', 7),
('lowCarb', 'Low-Carb', 8),
('keto', 'Keto', 9),
('paleo', 'Paleo', 10);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables were created and populated
SELECT 'Cuisines Created:' as info, COUNT(*) as count FROM cuisine_options;
SELECT 'Dietary Options Created:' as info, COUNT(*) as count FROM dietary_options;

-- Show sample data
SELECT 'Sample Cuisines:' as info;
SELECT name, display_order, active FROM cuisine_options ORDER BY display_order LIMIT 10;

SELECT 'Sample Dietary Options:' as info;
SELECT key, label, display_order, active FROM dietary_options ORDER BY display_order LIMIT 10;

-- Success message
SELECT '✅ Setup complete! You can now add cuisines from the admin panel.' as status;
