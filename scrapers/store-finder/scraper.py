#!/usr/bin/env python3
"""
Store Finder Scraper

Searches store websites for product information and prices.
Called from Node.js via child_process.spawn.

Usage:
    python scraper.py --store-name "Home Depot" --search-url "https://..." --query "drill"

Output:
    JSON object with search results:
    {
        "success": true,
        "store": "Home Depot",
        "results": [
            {
                "item": "Product Name",
                "price": "$99.99",
                "unit": "each",
                "product_url": "https://...",
                "notes": "In stock"
            }
        ],
        "error": null
    }
"""

import argparse
import json
import sys
import re
from datetime import datetime
from urllib.parse import quote_plus

# Try to import scraping libraries (optional - falls back to mock data)
try:
    import requests
    from bs4 import BeautifulSoup
    SCRAPING_AVAILABLE = True
except ImportError:
    SCRAPING_AVAILABLE = False


def parse_price(price_str):
    """Extract numeric price from string like '$99.99' or '99.99'"""
    if not price_str:
        return None
    match = re.search(r'[\$]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)', price_str.replace(',', ''))
    if match:
        return f"${match.group(1)}"
    return price_str


def scrape_generic(store_name, search_url, query, timeout=10):
    """
    Generic scraper that attempts to extract product info from search results page.
    Works with common e-commerce patterns.
    """
    if not SCRAPING_AVAILABLE:
        return {
            "success": False,
            "store": store_name,
            "results": [],
            "error": "Scraping libraries not installed (requests, beautifulsoup4)"
        }

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }

    try:
        response = requests.get(search_url, headers=headers, timeout=timeout)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        results = []

        # Common product container selectors
        product_selectors = [
            '[data-testid="product-card"]',
            '.product-card',
            '.product-item',
            '.search-result-product',
            '[class*="ProductCard"]',
            '[class*="product-pod"]',
            '.plp-pod',
            '.browse-search__pod',
        ]

        products = []
        for selector in product_selectors:
            products = soup.select(selector)
            if products:
                break

        # Try to extract info from first product found
        if products:
            product = products[0]

            # Extract title
            title = None
            title_selectors = ['h2', 'h3', '.product-title', '[class*="title"]', '[class*="name"]', 'a[href*="product"]']
            for sel in title_selectors:
                elem = product.select_one(sel)
                if elem and elem.get_text(strip=True):
                    title = elem.get_text(strip=True)[:100]  # Limit length
                    break

            # Extract price
            price = None
            price_selectors = ['[class*="price"]', '[data-price]', '.price', 'span[class*="Price"]']
            for sel in price_selectors:
                elem = product.select_one(sel)
                if elem:
                    price_text = elem.get_text(strip=True)
                    price = parse_price(price_text)
                    if price:
                        break

            # Extract product URL
            product_url = None
            link = product.select_one('a[href]')
            if link:
                href = link.get('href', '')
                if href.startswith('/'):
                    # Relative URL - construct full URL
                    from urllib.parse import urlparse
                    parsed = urlparse(search_url)
                    product_url = f"{parsed.scheme}://{parsed.netloc}{href}"
                elif href.startswith('http'):
                    product_url = href

            if title:
                results.append({
                    "item": title,
                    "price": price or "Price not available",
                    "unit": "each",
                    "product_url": product_url,
                    "notes": "Found via web search"
                })

        return {
            "success": True,
            "store": store_name,
            "results": results[:1],  # Return only first/best result
            "error": None
        }

    except requests.Timeout:
        return {
            "success": False,
            "store": store_name,
            "results": [],
            "error": "Request timed out"
        }
    except requests.RequestException as e:
        return {
            "success": False,
            "store": store_name,
            "results": [],
            "error": str(e)
        }
    except Exception as e:
        return {
            "success": False,
            "store": store_name,
            "results": [],
            "error": f"Scraping error: {str(e)}"
        }


def mock_scrape(store_name, query):
    """
    Mock scraper for testing and when real scraping is not available.
    Returns realistic-looking data based on store and query.
    """
    # Generate mock price based on query complexity
    import hashlib
    hash_val = int(hashlib.md5(f"{store_name}{query}".encode()).hexdigest()[:8], 16)
    base_price = 20 + (hash_val % 500)
    cents = hash_val % 100

    return {
        "success": True,
        "store": store_name,
        "results": [{
            "item": f"{query.title()} - {store_name} Edition",
            "price": f"${base_price}.{cents:02d}",
            "unit": "each",
            "product_url": f"https://www.example.com/product/{hash_val}",
            "notes": "Mock data - actual scraping not available"
        }],
        "error": None
    }


def main():
    parser = argparse.ArgumentParser(description='Store Finder Scraper')
    parser.add_argument('--store-name', required=True, help='Name of the store')
    parser.add_argument('--search-url', required=True, help='Full search URL with query embedded')
    parser.add_argument('--query', required=True, help='Search query for reference')
    parser.add_argument('--timeout', type=int, default=10, help='Request timeout in seconds')
    parser.add_argument('--mock', action='store_true', help='Use mock data instead of real scraping')

    args = parser.parse_args()

    try:
        if args.mock or not SCRAPING_AVAILABLE:
            result = mock_scrape(args.store_name, args.query)
            if not args.mock and not SCRAPING_AVAILABLE:
                result["notes"] = "Using mock data - install requests and beautifulsoup4 for real scraping"
        else:
            result = scrape_generic(
                args.store_name,
                args.search_url,
                args.query,
                args.timeout
            )

        # Add timestamp
        result["collected_at"] = datetime.now().strftime("%b %d, %Y")

        print(json.dumps(result))
        sys.exit(0 if result["success"] else 1)

    except Exception as e:
        error_result = {
            "success": False,
            "store": args.store_name,
            "results": [],
            "error": str(e),
            "collected_at": datetime.now().strftime("%b %d, %Y")
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()
