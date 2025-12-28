-- Local Store Finder - Stores Directory
-- Version: 1.0
-- Created: December 27, 2025

-- ============================================================================
-- STORE TYPES ENUM AND STORES TABLE
-- ============================================================================

-- Create store_type enum
DO $$ BEGIN
  CREATE TYPE store_type AS ENUM ('home', 'appliances', 'clothing', 'restaurants');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Stores directory table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  store_type store_type NOT NULL,
  base_url VARCHAR(500) NOT NULL,
  search_url_template VARCHAR(500),
  logo_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stores_type ON stores(store_type);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);

-- Add unique constraint on name + store_type to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_name_type ON stores(name, store_type);

-- ============================================================================
-- SEED INITIAL STORE DATA
-- ============================================================================

-- Home Improvement Stores
INSERT INTO stores (name, store_type, base_url, search_url_template, notes) VALUES
  ('Home Depot', 'home', 'https://www.homedepot.com', 'https://www.homedepot.com/s/{query}', 'Major home improvement retailer'),
  ('Lowes', 'home', 'https://www.lowes.com', 'https://www.lowes.com/search?searchTerm={query}', 'Home improvement and appliances'),
  ('Menards', 'home', 'https://www.menards.com', 'https://www.menards.com/main/search.html?search={query}', 'Midwest home improvement chain')
ON CONFLICT (name, store_type) DO NOTHING;

-- Appliance Stores
INSERT INTO stores (name, store_type, base_url, search_url_template, notes) VALUES
  ('Best Buy', 'appliances', 'https://www.bestbuy.com', 'https://www.bestbuy.com/site/searchpage.jsp?st={query}', 'Electronics and appliances'),
  ('Home Depot Appliances', 'appliances', 'https://www.homedepot.com/b/Appliances', 'https://www.homedepot.com/s/{query}?NCNI-5', 'Home Depot appliance section'),
  ('Lowes Appliances', 'appliances', 'https://www.lowes.com/l/Appliances', 'https://www.lowes.com/search?searchTerm={query}&refinement=4294857975', 'Lowes appliance section')
ON CONFLICT (name, store_type) DO NOTHING;

-- Clothing Stores
INSERT INTO stores (name, store_type, base_url, search_url_template, notes) VALUES
  ('Target', 'clothing', 'https://www.target.com', 'https://www.target.com/s?searchTerm={query}', 'General merchandise including clothing'),
  ('Walmart', 'clothing', 'https://www.walmart.com', 'https://www.walmart.com/search?q={query}', 'General merchandise including clothing'),
  ('Kohls', 'clothing', 'https://www.kohls.com', 'https://www.kohls.com/search.jsp?search={query}', 'Department store with clothing focus')
ON CONFLICT (name, store_type) DO NOTHING;

-- Restaurants (for menu/pricing lookups)
INSERT INTO stores (name, store_type, base_url, search_url_template, notes) VALUES
  ('Grubhub', 'restaurants', 'https://www.grubhub.com', 'https://www.grubhub.com/search?queryText={query}', 'Restaurant delivery aggregator'),
  ('DoorDash', 'restaurants', 'https://www.doordash.com', 'https://www.doordash.com/search/store/{query}', 'Restaurant delivery aggregator'),
  ('Yelp', 'restaurants', 'https://www.yelp.com', 'https://www.yelp.com/search?find_desc={query}', 'Restaurant reviews and info')
ON CONFLICT (name, store_type) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE stores IS 'Directory of stores for Local Store Finder module';
COMMENT ON COLUMN stores.search_url_template IS 'URL template with {query} placeholder for product searches';
COMMENT ON COLUMN stores.is_active IS 'Whether store is currently available for searches';
