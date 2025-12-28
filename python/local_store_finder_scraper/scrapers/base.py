"""
Base Scraper Class

Provides common functionality for all store scrapers.
Supports both requests-based and Playwright-based scraping.
"""

import re
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional, List, Dict, Any
from urllib.parse import urlencode, quote_plus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Safe User-Agent to avoid being blocked
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

# Default timeouts
DEFAULT_TIMEOUT = 15  # seconds
PLAYWRIGHT_TIMEOUT = 20000  # milliseconds


class ScraperResult:
    """Represents a single product result from scraping."""

    def __init__(
        self,
        store_id: str,
        store_name: str,
        item_name: str = "",
        price: str = "not available",
        unit: str = "each",
        product_url: str = "",
        notes: str = "",
        collected_at: str = None
    ):
        self.store_id = store_id
        self.store_name = store_name
        self.item_name = item_name
        self.price = price
        self.unit = unit
        self.product_url = product_url
        self.notes = notes
        self.collected_at = collected_at or datetime.now().strftime("%b %d, %Y %H:%M")

    def to_dict(self) -> Dict[str, str]:
        return {
            "store_id": self.store_id,
            "store_name": self.store_name,
            "item_name": self.item_name,
            "price": self.price,
            "unit": self.unit,
            "product_url": self.product_url,
            "notes": self.notes,
            "collected_at": self.collected_at
        }


class BaseScraper(ABC):
    """
    Base class for all store scrapers.

    Subclasses should override:
    - parse_results_requests() for requests-based scraping
    - parse_results_playwright() for Playwright-based scraping
    """

    def __init__(self, source: str = 'requests'):
        """
        Initialize scraper.

        Args:
            source: 'requests' for HTTP-based or 'playwright' for browser-based
        """
        self.source = source.lower()
        self.session = None
        self.browser = None
        self.page = None

    def build_search_url(self, base_url: str, search_template: str, query: str) -> str:
        """Build the search URL from template."""
        if search_template and '{query}' in search_template:
            return search_template.replace('{query}', quote_plus(query))
        # Fallback: append query to base URL
        return f"{base_url}/search?q={quote_plus(query)}"

    def parse_price(self, price_str: str) -> str:
        """
        Extract and normalize price from string.
        Returns 'not available' if parsing fails.
        """
        if not price_str:
            return "not available"

        # Remove whitespace and common prefixes
        price_str = price_str.strip()

        # Try to extract price pattern like $99.99 or 99.99
        match = re.search(r'\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', price_str)
        if match:
            price_val = match.group(1).replace(',', '')
            return f"${price_val}"

        return "not available"

    def scrape(
        self,
        store_id: str,
        store_name: str,
        base_url: str,
        search_url_template: str,
        query: str,
        max_results: int = 1
    ) -> List[ScraperResult]:
        """
        Main scraping method. Routes to appropriate implementation.

        Args:
            store_id: Unique store identifier
            store_name: Display name of store
            base_url: Store's base URL
            search_url_template: URL template with {query} placeholder
            query: Search query string
            max_results: Maximum number of results to return (default 1)

        Returns:
            List of ScraperResult objects
        """
        search_url = self.build_search_url(base_url, search_url_template, query)
        logger.info(f"Scraping {store_name}: {search_url}")

        try:
            if self.source == 'playwright':
                return self.scrape_playwright(
                    store_id, store_name, search_url, query, max_results
                )
            else:
                return self.scrape_requests(
                    store_id, store_name, search_url, query, max_results
                )
        except Exception as e:
            logger.error(f"Scraping error for {store_name}: {str(e)}")
            return [ScraperResult(
                store_id=store_id,
                store_name=store_name,
                item_name=query,
                price="not available",
                notes=f"Scraping failed: {str(e)[:100]}",
                product_url=search_url
            )]

    def scrape_requests(
        self,
        store_id: str,
        store_name: str,
        search_url: str,
        query: str,
        max_results: int
    ) -> List[ScraperResult]:
        """Scrape using requests + BeautifulSoup."""
        import requests
        from bs4 import BeautifulSoup

        headers = {
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }

        try:
            response = requests.get(
                search_url,
                headers=headers,
                timeout=DEFAULT_TIMEOUT,
                allow_redirects=True
            )
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')
            results = self.parse_results_requests(
                soup, store_id, store_name, search_url, query
            )

            return results[:max_results] if results else [ScraperResult(
                store_id=store_id,
                store_name=store_name,
                item_name=query,
                price="not available",
                notes="No products found",
                product_url=search_url
            )]

        except requests.Timeout:
            return [ScraperResult(
                store_id=store_id,
                store_name=store_name,
                item_name=query,
                price="not available",
                notes="Request timed out",
                product_url=search_url
            )]
        except requests.RequestException as e:
            return [ScraperResult(
                store_id=store_id,
                store_name=store_name,
                item_name=query,
                price="not available",
                notes=f"Request failed: {str(e)[:80]}",
                product_url=search_url
            )]

    def scrape_playwright(
        self,
        store_id: str,
        store_name: str,
        search_url: str,
        query: str,
        max_results: int
    ) -> List[ScraperResult]:
        """Scrape using Playwright for JS-rendered pages."""
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            return [ScraperResult(
                store_id=store_id,
                store_name=store_name,
                item_name=query,
                price="not available",
                notes="Playwright not installed",
                product_url=search_url
            )]

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(user_agent=USER_AGENT)
                page = context.new_page()

                page.goto(search_url, timeout=PLAYWRIGHT_TIMEOUT)
                page.wait_for_load_state('networkidle', timeout=PLAYWRIGHT_TIMEOUT)

                html = page.content()
                browser.close()

                from bs4 import BeautifulSoup
                soup = BeautifulSoup(html, 'html.parser')

                results = self.parse_results_playwright(
                    soup, page, store_id, store_name, search_url, query
                )

                return results[:max_results] if results else [ScraperResult(
                    store_id=store_id,
                    store_name=store_name,
                    item_name=query,
                    price="not available",
                    notes="No products found",
                    product_url=search_url
                )]

        except Exception as e:
            return [ScraperResult(
                store_id=store_id,
                store_name=store_name,
                item_name=query,
                price="not available",
                notes=f"Browser scraping failed: {str(e)[:80]}",
                product_url=search_url
            )]

    def parse_results_requests(
        self,
        soup,
        store_id: str,
        store_name: str,
        search_url: str,
        query: str
    ) -> List[ScraperResult]:
        """
        Parse search results from BeautifulSoup object (requests mode).
        Override in subclasses for store-specific parsing.

        This base implementation tries common patterns.
        """
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
            '[data-component="ProductCard"]',
        ]

        products = []
        for selector in product_selectors:
            products = soup.select(selector)
            if products:
                break

        # Try to find any product-like container
        if not products:
            products = soup.select('[class*="product"]')[:5]

        for product in products[:3]:  # Limit to first 3 for efficiency
            result = self._extract_product_info(product, store_id, store_name, search_url)
            if result and result.item_name:
                results.append(result)

        return results

    def parse_results_playwright(
        self,
        soup,
        page,
        store_id: str,
        store_name: str,
        search_url: str,
        query: str
    ) -> List[ScraperResult]:
        """
        Parse search results from Playwright-rendered page.
        Override in subclasses for store-specific parsing.

        Default implementation delegates to parse_results_requests.
        """
        return self.parse_results_requests(soup, store_id, store_name, search_url, query)

    def _extract_product_info(
        self,
        element,
        store_id: str,
        store_name: str,
        search_url: str
    ) -> Optional[ScraperResult]:
        """Extract product info from a product element."""
        try:
            # Try to find title
            title = None
            title_selectors = [
                'h2', 'h3', 'h4',
                '.product-title', '.product-name',
                '[class*="title"]', '[class*="name"]',
                'a[href*="product"]', 'a[href*="/p/"]'
            ]
            for sel in title_selectors:
                elem = element.select_one(sel)
                if elem and elem.get_text(strip=True):
                    title = elem.get_text(strip=True)[:150]
                    break

            if not title:
                return None

            # Try to find price
            price = "not available"
            price_selectors = [
                '[class*="price"]', '[data-price]',
                '.price', 'span[class*="Price"]',
                '[class*="cost"]', '[class*="amount"]'
            ]
            for sel in price_selectors:
                elem = element.select_one(sel)
                if elem:
                    price_text = elem.get_text(strip=True)
                    parsed = self.parse_price(price_text)
                    if parsed != "not available":
                        price = parsed
                        break

            # Try to find product URL
            product_url = search_url
            link = element.select_one('a[href]')
            if link:
                href = link.get('href', '')
                if href.startswith('/'):
                    from urllib.parse import urlparse
                    parsed = urlparse(search_url)
                    product_url = f"{parsed.scheme}://{parsed.netloc}{href}"
                elif href.startswith('http'):
                    product_url = href

            return ScraperResult(
                store_id=store_id,
                store_name=store_name,
                item_name=title,
                price=price,
                unit="each",
                product_url=product_url,
                notes=""
            )

        except Exception as e:
            logger.debug(f"Failed to extract product info: {e}")
            return None
