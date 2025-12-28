# Local Store Finder Module

Product price comparison across multiple retail stores using a Python scraper with optional AI normalization.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  LocalStoreFinderApp.js - Wizard UI with 4 steps            │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express)                         │
│  /api/local-store-finder/stores        - Get store directory│
│  /api/local-store-finder/locate-stores - Get stores by type │
│  /api/local-store-finder/find          - Search products    │
└─────────────────────────────────┬───────────────────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              ▼                                       ▼
┌─────────────────────────┐            ┌─────────────────────────┐
│   PostgreSQL Database   │            │    Python Scraper       │
│   - stores              │            │    python/local_store_  │
│   - lsf_search_sessions │            │    finder_scraper/      │
│   - lsf_search_events   │            │                         │
│   - lsf_search_results  │            │    run_scrape.py        │
└─────────────────────────┘            └─────────────────────────┘
```

## Database Schema

### stores Table (Migration 018)
```sql
CREATE TYPE store_type AS ENUM ('home', 'appliances', 'clothing', 'restaurants');

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  store_type store_type NOT NULL,
  base_url VARCHAR(500) NOT NULL,
  search_url_template VARCHAR(500),
  source VARCHAR(50) DEFAULT 'requests',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Logging Tables (Migration 019)
```sql
-- Search sessions (locate-stores requests)
CREATE TABLE lsf_search_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  store_type VARCHAR(50) NOT NULL,
  location_text VARCHAR(500),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  intent_text TEXT,
  stores_returned INTEGER,
  created_at TIMESTAMP
);

-- Search events (find requests)
CREATE TABLE lsf_search_events (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES lsf_search_sessions(id),
  user_id UUID REFERENCES users(id),
  query VARCHAR(500) NOT NULL,
  store_ids UUID[],
  store_count INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMP
);

-- Per-store results
CREATE TABLE lsf_search_results (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES lsf_search_events(id),
  store_id UUID,
  store_name VARCHAR(255),
  success BOOLEAN,
  price VARCHAR(50),
  item_name VARCHAR(500),
  error_message VARCHAR(500),
  created_at TIMESTAMP
);
```

## API Endpoints

### GET /api/local-store-finder/stores
Get stores filtered by type.

**Query:** `?store_type=home`

**Response:**
```json
{
  "stores": [
    { "id": "uuid", "name": "Home Depot", "base_url": "...", "search_url_template": "..." }
  ]
}
```

### POST /api/local-store-finder/locate-stores
Get stores by type with session logging.

**Request:**
```json
{
  "storeType": "home",
  "locationText": "90210",
  "latitude": 34.0901,
  "longitude": -118.4065,
  "intent": "looking for lumber"
}
```

**Response:**
```json
{
  "stores": [...],
  "sessionId": "uuid"
}
```

### POST /api/local-store-finder/find
Search products across stores (max 3).

**Request:**
```json
{
  "storeIds": ["uuid1", "uuid2"],
  "query": "power drill",
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "results": [
    {
      "store_id": "uuid",
      "store_name": "Home Depot",
      "item_name": "DEWALT 20V MAX Drill",
      "price": "$129.00",
      "unit": "each",
      "product_url": "https://...",
      "notes": "",
      "collected_at": "Dec 27, 2025 14:30"
    }
  ],
  "duration_ms": 2345
}
```

## Python Scraper

### Location
`python/local_store_finder_scraper/`

### Structure
```
python/local_store_finder_scraper/
├── run_scrape.py           # Entry point (stdin JSON → stdout JSON)
├── requirements.txt        # Dependencies
└── scrapers/
    ├── __init__.py
    ├── base.py             # BaseScraper class
    ├── homedepot.py        # requests-based example
    └── bestbuy.py          # playwright-based example
```

### Usage
```bash
echo '{"stores":[...],"query":"drill"}' | python3 python/local_store_finder_scraper/run_scrape.py
```

### Output Format
```json
{
  "results": [
    {
      "store_id": "uuid",
      "store_name": "Home Depot",
      "item_name": "Product Name",
      "price": "$99.99",
      "unit": "each",
      "product_url": "https://...",
      "notes": "",
      "collected_at": "Dec 27, 2025"
    }
  ],
  "errors": []
}
```

## Node.js Bridge

`services/localStoreFinderScraper.js` spawns the Python process:
- Passes JSON via stdin
- Reads JSON from stdout
- Enforces 30s timeout (configurable via `LOCAL_STORE_SCRAPER_TIMEOUT`)
- Validates output schema
- Sanitizes errors for user display

## AI Normalization (Optional)

`services/aiNormalizer.js` - Uses ChatGPT to clean up scraper results.

**Enable:**
```bash
USE_AI_NORMALIZER=true
OPENAI_API_KEY=sk-...
```

**Rules:**
- Never invents prices
- Picks best match per store
- Cleans up item names
- Normalizes price format to $X.XX

## Seeding Stores

```bash
node scripts/seed-stores.js
```

Seeds 12 stores (3 per type):
- **home**: Home Depot, Lowe's, Ace Hardware
- **appliances**: Best Buy, Home Depot Appliances, Lowe's Appliances
- **clothing**: Nordstrom, Macy's, Gap
- **restaurants**: Yelp, OpenTable, Google Maps

## Testing

### Smoke Test
```bash
JWT_TOKEN=your_token node scripts/smoke-test-local-store-finder.js
```

### E2E Checklist
See `docs/LOCAL_STORE_FINDER_E2E_CHECKLIST.md`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOCAL_STORE_SCRAPER_PYTHON` | `python3` | Python executable path |
| `LOCAL_STORE_SCRAPER_ENTRY` | `python/local_store_finder_scraper/run_scrape.py` | Entry script |
| `LOCAL_STORE_SCRAPER_TIMEOUT` | `30000` | Timeout in ms |
| `USE_AI_NORMALIZER` | `false` | Enable AI normalization |
| `OPENAI_API_KEY` | - | Required for AI normalization |

## Error Handling

- Individual store failures don't block other results
- Failed stores show `price: "not available"` with error in notes
- Timeouts return graceful "Search timed out" message
- All errors logged to `lsf_search_results` table
