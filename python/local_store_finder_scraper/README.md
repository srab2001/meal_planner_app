# Local Store Finder Scraper

A Python-based web scraping module for finding product prices across retail stores.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Node.js Backend                               │
│  services/localStoreFinderScraper.js                            │
│  - Spawns Python process                                         │
│  - Passes JSON via stdin                                         │
│  - Reads JSON from stdout                                        │
│  - Enforces timeout                                              │
│  - Optional AI normalization                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ stdin: JSON input
                            │ stdout: JSON output
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Python Scraper                                │
│  python/local_store_finder_scraper/run_scrape.py                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ scrapers/                                                │    │
│  │   base.py        - Base scraper class                   │    │
│  │   homedepot.py   - Home Depot (requests-based)          │    │
│  │   bestbuy.py     - Best Buy (Playwright-based)          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

### Python Dependencies

```bash
cd python/local_store_finder_scraper
pip install -r requirements.txt
```

For JavaScript-rendered pages (Best Buy, etc.):

```bash
pip install playwright
playwright install chromium
```

### Environment Variables

Add to your `.env`:

```env
# Python scraper configuration
LOCAL_STORE_SCRAPER_PYTHON=/usr/bin/python3
LOCAL_STORE_SCRAPER_ENTRY=python/local_store_finder_scraper/run_scrape.py
LOCAL_STORE_SCRAPER_TIMEOUT=30000

# AI normalization (optional)
USE_AI_NORMALIZER=true
OPENAI_API_KEY=sk-...
```

## Usage

### Running Locally (Python)

```bash
# From project root
cd python/local_store_finder_scraper

# Run with JSON input
echo '{"stores":[{"id":"1","name":"Home Depot","base_url":"https://homedepot.com","search_url_template":"https://homedepot.com/s/{query}","source":"requests"}],"query":"power drill"}' | python run_scrape.py
```

### Input JSON Format

```json
{
  "stores": [
    {
      "id": "uuid",
      "name": "Store Name",
      "base_url": "https://store.com",
      "search_url_template": "https://store.com/search?q={query}",
      "source": "requests"  // or "playwright"
    }
  ],
  "query": "search term"
}
```

### Output JSON Format

```json
{
  "results": [
    {
      "store_id": "uuid",
      "store_name": "Store Name",
      "item_name": "Product Name",
      "price": "$99.99",
      "unit": "each",
      "product_url": "https://store.com/product/123",
      "notes": "additional info",
      "collected_at": "Dec 27, 2025 14:30"
    }
  ],
  "errors": [],
  "meta": {
    "query": "search term",
    "stores_processed": 1,
    "total_results": 1
  }
}
```

## Adding New Store Scrapers

1. Create a new file in `scrapers/`:

```python
# scrapers/newstore.py
from .base import BaseScraper, ScraperResult

class NewStoreScraper(BaseScraper):
    def __init__(self, source='requests'):
        super().__init__(source=source)

    def parse_results_requests(self, soup, store_id, store_name, search_url, query):
        results = []
        # Add store-specific parsing logic
        products = soup.select('.product-card')  # Adjust selector
        for product in products[:3]:
            # Extract title, price, URL
            results.append(ScraperResult(...))
        return results
```

2. Register in `scrapers/__init__.py`:

```python
from .newstore import NewStoreScraper

SCRAPER_REGISTRY = {
    # ...existing scrapers...
    'new store': NewStoreScraper,
    'newstore': NewStoreScraper,
}
```

## Scraper Types

### requests-based (Default)
- Uses `requests` + `BeautifulSoup`
- Fast, lightweight
- Works for server-rendered pages
- Example: Home Depot

### Playwright-based
- Uses headless Chromium browser
- Handles JavaScript-rendered content
- Slower but more capable
- Example: Best Buy

## Running Tests

```bash
# Node.js tests (mocked child_process)
node tests/localStoreFinderScraper.test.js

# Python scraper direct test
cd python/local_store_finder_scraper
echo '{"stores":[{"id":"test","name":"Test","base_url":"https://example.com","source":"requests"}],"query":"test"}' | python run_scrape.py
```

## API Integration

The scraper is called from the `/api/local-store-finder/find` endpoint:

```javascript
// POST /api/local-store-finder/find
{
  "storeIds": ["uuid1", "uuid2"],
  "itemQuery": "power drill"
}
```

The endpoint:
1. Fetches store details from database
2. Calls `runScraper()` from the Node.js bridge
3. Returns normalized results to the frontend

## AI Normalization

When `USE_AI_NORMALIZER=true`, results are post-processed with ChatGPT to:
- Clean up item names
- Normalize price formats
- Pick the best match per store
- Remove scraping artifacts

The AI prompt ensures:
- No prices are invented
- Missing prices show as "not available"
- JSON-only output (no prose)

## Error Handling

The scraper is designed to be resilient:

1. **Individual store failures don't block others**
   - Each store is scraped independently
   - Failed stores return with `price: "not available"`

2. **Timeouts are enforced**
   - Default: 30 seconds total
   - Per-store: 20 seconds
   - Timed out stores return gracefully

3. **Graceful degradation**
   - Missing Python: Returns fallback data
   - Network errors: Returns with error notes
   - Parse errors: Sanitized error messages

## File Structure

```
python/local_store_finder_scraper/
├── __init__.py           # Package init
├── run_scrape.py         # Entry point (stdin/stdout)
├── requirements.txt      # Python dependencies
├── README.md            # This file
└── scrapers/
    ├── __init__.py      # Scraper registry
    ├── base.py          # Base scraper class
    ├── homedepot.py     # Home Depot (requests)
    └── bestbuy.py       # Best Buy (Playwright)

services/
├── localStoreFinderScraper.js  # Node.js bridge
└── aiNormalizer.js             # ChatGPT normalization

tests/
└── localStoreFinderScraper.test.js  # Unit tests
```
