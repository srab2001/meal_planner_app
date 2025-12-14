-- Meal Planner App - Cuisine and Dietary Options Management
-- Version: 1.3
-- Created: December 3, 2025

-- ============================================================================
-- CUISINE OPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cuisine_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cuisine_active ON cuisine_options(active);
CREATE INDEX IF NOT EXISTS idx_cuisine_display_order ON cuisine_options(display_order);

CREATE TRIGGER update_cuisine_options_updated_at BEFORE UPDATE ON cuisine_options
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
('Middle Eastern', 14)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- DIETARY OPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS dietary_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dietary_active ON dietary_options(active);
CREATE INDEX IF NOT EXISTS idx_dietary_display_order ON dietary_options(display_order);

CREATE TRIGGER update_dietary_options_updated_at BEFORE UPDATE ON dietary_options
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
('paleo', 'Paleo', 10)
ON CONFLICT (key) DO NOTHING;
