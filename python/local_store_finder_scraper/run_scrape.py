#!/usr/bin/env python3
"""
Local Store Finder Scraper - Entry Point

Accepts JSON input on stdin, scrapes stores, and outputs JSON on stdout.

Input JSON format:
{
    "stores": [
        {
            "id": "uuid",
            "name": "Store Name",
            "base_url": "https://store.com",
            "search_url_template": "https://store.com/search?q={query}",
            "source": "requests|playwright"
        }
    ],
    "query": "search term"
}

Output JSON format:
{
    "results": [
        {
            "store_id": "uuid",
            "store_name": "Store Name",
            "item_name": "Product Name",
            "price": "$99.99",
            "unit": "each",
            "product_url": "https://...",
            "notes": "additional info",
            "collected_at": "Dec 27, 2025 14:30"
        }
    ],
    "errors": [],
    "meta": {
        "query": "search term",
        "stores_processed": 2,
        "total_results": 2
    }
}

Usage:
    echo '{"stores":[...],"query":"drill"}' | python run_scrape.py
    cat input.json | python run_scrape.py
"""

import sys
import json
import logging
import signal
from datetime import datetime
from typing import Dict, List, Any
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

# Configure logging to stderr (stdout is reserved for JSON output)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

# Import scrapers
from scrapers import get_scraper_for_store

# Timeout for individual store scraping (seconds)
STORE_SCRAPE_TIMEOUT = 20

# Maximum stores to process
MAX_STORES = 5


def validate_input(data: Dict) -> tuple:
    """
    Validate input JSON structure.
    Returns (is_valid, error_message).
    """
    if not isinstance(data, dict):
        return False, "Input must be a JSON object"

    if 'stores' not in data:
        return False, "Missing 'stores' field"

    if not isinstance(data['stores'], list):
        return False, "'stores' must be an array"

    if len(data['stores']) == 0:
        return False, "'stores' array is empty"

    if len(data['stores']) > MAX_STORES:
        return False, f"Maximum {MAX_STORES} stores allowed"

    if 'query' not in data:
        return False, "Missing 'query' field"

    if not isinstance(data['query'], str) or not data['query'].strip():
        return False, "'query' must be a non-empty string"

    # Validate each store
    for i, store in enumerate(data['stores']):
        if not isinstance(store, dict):
            return False, f"Store at index {i} must be an object"
        if 'id' not in store:
            return False, f"Store at index {i} missing 'id'"
        if 'name' not in store:
            return False, f"Store at index {i} missing 'name'"
        if 'base_url' not in store:
            return False, f"Store at index {i} missing 'base_url'"

    return True, None


def scrape_store(store: Dict, query: str) -> List[Dict]:
    """
    Scrape a single store and return results.
    """
    store_id = store.get('id', '')
    store_name = store.get('name', 'Unknown Store')
    base_url = store.get('base_url', '')
    search_template = store.get('search_url_template', '')
    source = store.get('source', 'requests')

    logger.info(f"Scraping {store_name} ({source}) for '{query}'")

    try:
        scraper = get_scraper_for_store(store_name, source)
        results = scraper.scrape(
            store_id=store_id,
            store_name=store_name,
            base_url=base_url,
            search_url_template=search_template,
            query=query,
            max_results=1  # Only return best hit
        )
        return [r.to_dict() for r in results]

    except Exception as e:
        logger.error(f"Error scraping {store_name}: {e}")
        return [{
            "store_id": store_id,
            "store_name": store_name,
            "item_name": query,
            "price": "not available",
            "unit": "each",
            "product_url": base_url,
            "notes": f"Scraping error: {str(e)[:100]}",
            "collected_at": datetime.now().strftime("%b %d, %Y %H:%M")
        }]


def main():
    """Main entry point."""
    output = {
        "results": [],
        "errors": [],
        "meta": {
            "query": "",
            "stores_processed": 0,
            "total_results": 0
        }
    }

    try:
        # Read input from stdin
        input_data = sys.stdin.read()

        if not input_data.strip():
            output["errors"].append("No input provided")
            print(json.dumps(output))
            sys.exit(1)

        # Parse JSON
        try:
            data = json.loads(input_data)
        except json.JSONDecodeError as e:
            output["errors"].append(f"Invalid JSON: {str(e)}")
            print(json.dumps(output))
            sys.exit(1)

        # Validate input
        is_valid, error = validate_input(data)
        if not is_valid:
            output["errors"].append(error)
            print(json.dumps(output))
            sys.exit(1)

        query = data['query'].strip()
        stores = data['stores']

        output["meta"]["query"] = query

        logger.info(f"Processing {len(stores)} stores for query: '{query}'")

        # Scrape stores in parallel with timeout
        all_results = []
        errors = []

        with ThreadPoolExecutor(max_workers=min(len(stores), 3)) as executor:
            futures = {
                executor.submit(scrape_store, store, query): store
                for store in stores
            }

            for future in futures:
                store = futures[future]
                try:
                    results = future.result(timeout=STORE_SCRAPE_TIMEOUT)
                    all_results.extend(results)
                except FuturesTimeoutError:
                    logger.warning(f"Timeout scraping {store.get('name')}")
                    all_results.append({
                        "store_id": store.get('id', ''),
                        "store_name": store.get('name', 'Unknown'),
                        "item_name": query,
                        "price": "not available",
                        "unit": "each",
                        "product_url": store.get('base_url', ''),
                        "notes": "Scraping timed out",
                        "collected_at": datetime.now().strftime("%b %d, %Y %H:%M")
                    })
                except Exception as e:
                    logger.error(f"Error with {store.get('name')}: {e}")
                    errors.append(f"{store.get('name')}: {str(e)[:80]}")

        output["results"] = all_results
        output["errors"] = errors
        output["meta"]["stores_processed"] = len(stores)
        output["meta"]["total_results"] = len(all_results)

        # Output JSON to stdout
        print(json.dumps(output, indent=None))
        sys.exit(0)

    except KeyboardInterrupt:
        output["errors"].append("Interrupted by user")
        print(json.dumps(output))
        sys.exit(130)

    except Exception as e:
        logger.exception("Unexpected error")
        output["errors"].append(f"Unexpected error: {str(e)}")
        print(json.dumps(output))
        sys.exit(1)


if __name__ == "__main__":
    main()
