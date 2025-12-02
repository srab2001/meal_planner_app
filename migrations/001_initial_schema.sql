-- Meal Planner App - Initial Database Schema
-- Version: 1.0
-- Created: December 2, 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  picture_url TEXT,
  default_cuisine TEXT[],
  default_people INTEGER DEFAULT 2,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_login ON users(last_login DESC);

-- 2. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan_type VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  trial_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_plan_type CHECK (plan_type IN ('free', 'premium')),
  CONSTRAINT check_status CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete'))
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end) WHERE status = 'active';

-- 3. Usage Stats Table
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_user_id ON usage_stats(user_id);
CREATE INDEX idx_usage_action_type ON usage_stats(action_type);
CREATE INDEX idx_usage_created_at ON usage_stats(created_at DESC);
CREATE INDEX idx_usage_user_month ON usage_stats(user_id, date_trunc('month', created_at));
CREATE INDEX idx_usage_metadata ON usage_stats USING GIN(metadata);

-- 4. Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  meal_type VARCHAR(50) NOT NULL,
  meal_data JSONB NOT NULL,
  meal_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_meal_type CHECK (meal_type IN ('breakfast', 'lunch', 'dinner'))
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_meal_type ON favorites(meal_type);
CREATE INDEX idx_favorites_user_meal_type ON favorites(user_id, meal_type);
CREATE INDEX idx_favorites_meal_data ON favorites USING GIN(meal_data);
CREATE UNIQUE INDEX idx_favorites_unique ON favorites(user_id, meal_name, meal_type);

-- 5. Meal Plan History Table
CREATE TABLE IF NOT EXISTS meal_plan_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL,
  meal_plan JSONB NOT NULL,
  stores JSONB NOT NULL,
  shopping_list JSONB,
  total_cost DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_user_id ON meal_plan_history(user_id);
CREATE INDEX idx_history_created_at ON meal_plan_history(created_at DESC);
CREATE INDEX idx_history_user_recent ON meal_plan_history(user_id, created_at DESC);
CREATE INDEX idx_history_preferences ON meal_plan_history USING GIN(preferences);
CREATE INDEX idx_history_meal_plan ON meal_plan_history USING GIN(meal_plan);

-- ============================================================================
-- ADVERTISING TABLES
-- ============================================================================

-- 6. Discount Codes Table
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  minimum_plan_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_discount_type CHECK (discount_type IN ('percentage', 'fixed_amount')),
  CONSTRAINT check_discount_value CHECK (discount_value > 0)
);

CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(active) WHERE active = TRUE;
CREATE INDEX idx_discount_codes_valid_until ON discount_codes(valid_until) WHERE valid_until > CURRENT_TIMESTAMP;

-- 7. Discount Usage Table
CREATE TABLE IF NOT EXISTS discount_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount_saved DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  ip_address INET,
  user_agent TEXT,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discount_usage_code ON discount_usage(discount_code_id);
CREATE INDEX idx_discount_usage_user ON discount_usage(user_id);
CREATE INDEX idx_discount_usage_used_at ON discount_usage(used_at DESC);
CREATE UNIQUE INDEX idx_discount_usage_unique ON discount_usage(discount_code_id, user_id);

-- 8. Ad Impressions Table
CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ad_type VARCHAR(50) NOT NULL,
  ad_placement VARCHAR(100),
  ad_id VARCHAR(255),
  ad_content JSONB,
  page_url TEXT,
  referrer TEXT,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ad_impressions_user_id ON ad_impressions(user_id);
CREATE INDEX idx_ad_impressions_ad_type ON ad_impressions(ad_type);
CREATE INDEX idx_ad_impressions_created_at ON ad_impressions(created_at DESC);
CREATE INDEX idx_ad_impressions_session ON ad_impressions(session_id);
CREATE INDEX idx_ad_impressions_date_type ON ad_impressions(date_trunc('day', created_at), ad_type);

-- 9. Ad Clicks Table
CREATE TABLE IF NOT EXISTS ad_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  impression_id UUID REFERENCES ad_impressions(id) ON DELETE SET NULL,
  ad_type VARCHAR(50) NOT NULL,
  ad_placement VARCHAR(100),
  ad_id VARCHAR(255),
  destination_url TEXT,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  converted BOOLEAN DEFAULT FALSE,
  conversion_value DECIMAL(10, 2),
  conversion_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ad_clicks_user_id ON ad_clicks(user_id);
CREATE INDEX idx_ad_clicks_impression_id ON ad_clicks(impression_id);
CREATE INDEX idx_ad_clicks_ad_type ON ad_clicks(ad_type);
CREATE INDEX idx_ad_clicks_created_at ON ad_clicks(created_at DESC);
CREATE INDEX idx_ad_clicks_converted ON ad_clicks(converted) WHERE converted = TRUE;
CREATE INDEX idx_ad_clicks_date_type ON ad_clicks(date_trunc('day', created_at), ad_type);

-- 10. Affiliate Conversions Table
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  click_id UUID REFERENCES ad_clicks(id) ON DELETE SET NULL,
  affiliate_network VARCHAR(100) NOT NULL,
  affiliate_id VARCHAR(255),
  conversion_type VARCHAR(50),
  order_value DECIMAL(10, 2),
  commission_value DECIMAL(10, 2),
  commission_rate DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'pending',
  conversion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_date TIMESTAMP,
  paid_date TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_affiliate_conversions_user_id ON affiliate_conversions(user_id);
CREATE INDEX idx_affiliate_conversions_network ON affiliate_conversions(affiliate_network);
CREATE INDEX idx_affiliate_conversions_status ON affiliate_conversions(status);
CREATE INDEX idx_affiliate_conversions_date ON affiliate_conversions(conversion_date DESC);
CREATE INDEX idx_affiliate_conversions_month_network ON affiliate_conversions(
  date_trunc('month', conversion_date),
  affiliate_network,
  status
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create some sample discount codes
INSERT INTO discount_codes (code, description, discount_type, discount_value, max_uses) VALUES
('WELCOME10', 'Welcome discount - 10% off first premium subscription', 'percentage', 10.00, NULL),
('FREEMONTH', 'Free month of premium', 'fixed_amount', 6.99, 100)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count indexes created
SELECT
  schemaname,
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

COMMIT;
