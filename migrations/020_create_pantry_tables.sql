-- ============================================================================
-- PANTRY TABLES
-- Food inventory tracking with expiration management and consumption/waste events
-- ============================================================================

-- Pantries table (one per household)
CREATE TABLE IF NOT EXISTS pantries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL,
  name VARCHAR(100) DEFAULT 'Main Pantry',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_household_pantry UNIQUE (household_id)
);

CREATE INDEX IF NOT EXISTS idx_pantries_household ON pantries(household_id);

-- Pantry Items table
CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pantry_id UUID NOT NULL REFERENCES pantries(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(100),
  category VARCHAR(50) DEFAULT 'pantry', -- produce, dairy, meat, pantry, frozen, beverages, other
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit VARCHAR(20) DEFAULT 'count', -- count, lbs, oz, kg, g, L, mL, cups
  purchase_date DATE,
  expiration_date DATE,
  status VARCHAR(20) DEFAULT 'active', -- active, low, expired, consumed, wasted
  notes TEXT,
  barcode VARCHAR(50),
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pantry_items_pantry ON pantry_items(pantry_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiration ON pantry_items(expiration_date);
CREATE INDEX IF NOT EXISTS idx_pantry_items_category ON pantry_items(category);
CREATE INDEX IF NOT EXISTS idx_pantry_items_status ON pantry_items(status);

-- Pantry Events table (consumption, waste, adjustments)
CREATE TABLE IF NOT EXISTS pantry_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pantry_id UUID NOT NULL REFERENCES pantries(id) ON DELETE CASCADE,
  item_id UUID REFERENCES pantry_items(id) ON DELETE SET NULL,
  item_name VARCHAR(200) NOT NULL, -- Store name for history even if item deleted
  event_type VARCHAR(20) NOT NULL, -- consumed, wasted, adjusted, added, removed
  quantity_change DECIMAL(10, 2) NOT NULL, -- negative for consumed/wasted, positive for added
  unit VARCHAR(20),
  reason TEXT, -- For waste: expired, spoiled, damaged, other
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pantry_events_pantry ON pantry_events(pantry_id);
CREATE INDEX IF NOT EXISTS idx_pantry_events_item ON pantry_events(item_id);
CREATE INDEX IF NOT EXISTS idx_pantry_events_type ON pantry_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pantry_events_created ON pantry_events(created_at DESC);

-- Trigger to update updated_at on pantry_items
CREATE TRIGGER IF NOT EXISTS update_pantry_items_updated_at
BEFORE UPDATE ON pantry_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on pantries
CREATE TRIGGER IF NOT EXISTS update_pantries_updated_at
BEFORE UPDATE ON pantries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
