-- Local Store Finder - Search Logging Tables
-- Version: 1.0
-- Created: December 27, 2025

-- ============================================================================
-- SEARCH SESSIONS TABLE
-- Tracks each user search session (locate-stores request)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lsf_search_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  store_type VARCHAR(50) NOT NULL,
  location_text VARCHAR(500),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  intent_text TEXT,
  stores_returned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lsf_sessions_user ON lsf_search_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_lsf_sessions_created ON lsf_search_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lsf_sessions_store_type ON lsf_search_sessions(store_type);

-- ============================================================================
-- SEARCH EVENTS TABLE
-- Tracks each product search (find request) and per-store results
-- ============================================================================

CREATE TABLE IF NOT EXISTS lsf_search_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES lsf_search_sessions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  query VARCHAR(500) NOT NULL,
  store_ids UUID[] NOT NULL,
  store_count INTEGER DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lsf_events_user ON lsf_search_events(user_id);
CREATE INDEX IF NOT EXISTS idx_lsf_events_created ON lsf_search_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lsf_events_session ON lsf_search_events(session_id);

-- ============================================================================
-- SEARCH EVENT RESULTS TABLE
-- Per-store results for each search event
-- ============================================================================

CREATE TABLE IF NOT EXISTS lsf_search_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES lsf_search_events(id) ON DELETE CASCADE,
  store_id UUID,
  store_name VARCHAR(255),
  success BOOLEAN DEFAULT FALSE,
  price VARCHAR(50),
  item_name VARCHAR(500),
  error_message VARCHAR(500),
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lsf_results_event ON lsf_search_results(event_id);
CREATE INDEX IF NOT EXISTS idx_lsf_results_store ON lsf_search_results(store_id);
CREATE INDEX IF NOT EXISTS idx_lsf_results_success ON lsf_search_results(success);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE lsf_search_sessions IS 'Logs locate-stores requests for Local Store Finder';
COMMENT ON TABLE lsf_search_events IS 'Logs product search (find) requests';
COMMENT ON TABLE lsf_search_results IS 'Per-store results for each search event';
