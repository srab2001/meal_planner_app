-- Meal Planner App - Meal of the Day Feature
-- Version: 1.4
-- Created: December 4, 2025

-- ============================================================================
-- MEAL OF THE DAY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS meal_of_the_day (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  meal_type VARCHAR(50), -- breakfast, lunch, dinner, snack
  cuisine VARCHAR(100),
  prep_time VARCHAR(50),
  cook_time VARCHAR(50),
  servings INTEGER DEFAULT 2,
  ingredients JSONB NOT NULL, -- Array of ingredient strings
  instructions JSONB NOT NULL, -- Array of instruction strings
  image_url TEXT, -- URL to meal image
  nutrition_info JSONB, -- Optional nutrition data
  tags JSONB DEFAULT '[]', -- Tags like ["quick", "healthy", "budget-friendly"]
  featured_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_by VARCHAR(100), -- admin username/email
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  UNIQUE(featured_date, active) -- Only one active meal per date
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_meal_of_day_featured_date ON meal_of_the_day(featured_date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_of_day_active ON meal_of_the_day(active);
CREATE INDEX IF NOT EXISTS idx_meal_of_day_meal_type ON meal_of_the_day(meal_type);

-- Add trigger for updated_at
CREATE TRIGGER update_meal_of_the_day_updated_at BEFORE UPDATE ON meal_of_the_day
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MEAL OF THE DAY SHARES TABLE (Track social media shares)
-- ============================================================================

CREATE TABLE IF NOT EXISTS meal_of_day_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id UUID REFERENCES meal_of_the_day(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- facebook, twitter, pinterest, whatsapp, email, etc.
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meal_shares_meal_id ON meal_of_day_shares(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_shares_platform ON meal_of_day_shares(platform);

-- Insert a sample meal of the day
INSERT INTO meal_of_the_day (
  title,
  description,
  meal_type,
  cuisine,
  prep_time,
  cook_time,
  servings,
  ingredients,
  instructions,
  image_url,
  tags,
  featured_date,
  active,
  created_by,
  published_at
) VALUES (
  'Classic Margherita Pizza',
  'A timeless Italian favorite with fresh mozzarella, tomatoes, and basil on a crispy homemade crust.',
  'dinner',
  'Italian',
  '20 mins',
  '15 mins',
  4,
  '["2 cups all-purpose flour", "1 tsp active dry yeast", "1 cup warm water", "2 tbsp olive oil", "1 tsp salt", "1 cup tomato sauce", "8 oz fresh mozzarella cheese, sliced", "Fresh basil leaves", "Salt and pepper to taste"]',
  '["Mix flour, yeast, warm water, olive oil, and salt to form dough", "Knead for 5-7 minutes until smooth", "Let rise for 1 hour until doubled", "Preheat oven to 475°F (245°C)", "Roll out dough on floured surface", "Spread tomato sauce evenly", "Add mozzarella slices", "Bake for 12-15 minutes until crust is golden", "Top with fresh basil leaves", "Slice and serve hot"]',
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
  '["italian", "vegetarian", "classic", "family-friendly"]',
  CURRENT_DATE,
  TRUE,
  'admin',
  CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- Verify tables created
SELECT COUNT(*) as meal_of_day_count FROM meal_of_the_day;

COMMIT;
