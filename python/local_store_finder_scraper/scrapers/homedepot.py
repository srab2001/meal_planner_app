"""
Home Depot Scraper (requests-based)

Scrapes product information from homedepot.com search results.
Uses requests + BeautifulSoup for standard HTTP scraping.
"""

import logging
from typing import List
from .base import BaseScraper, ScraperResult

logger = logging.getLogger(__name__)


class HomeDepotScraper(BaseScraper):
    """
    Scraper for Home Depot website.

    Home Depot's search results can often be scraped with requests,
    though some dynamic content may require Playwright.
    """

    def __init__(self, source: str = 'requests'):
        super().__init__(source=source)

    def build_search_url(self, base_url: str, search_template: str, query: str) -> str:
        """Build Home Depot search URL."""
        from urllib.parse import quote_plus

        if search_template and '{query}' in search_template:
            return search_template.replace('{query}', quote_plus(query))
        # Home Depot specific search URL format
        return f"https://www.homedepot.com/s/{quote_plus(query)}"

    def parse_results_requests(
        self,
        soup,
        store_id: str,
        store_name: str,
        search_url: str,
        query: str
    ) -> List[ScraperResult]:
        """Parse Home Depot search results."""
        results = []

        # Home Depot product card selectors
        product_selectors = [
            '[data-testid="product-pod"]',
            '.product-pod',
            '.browse-search__pod',
            '[class*="product-pod"]',
            '.plp-pod',
        ]

        products = []
        for selector in product_selectors:
            products = soup.select(selector)
            if products:
                logger.info(f"Found {len(products)} products with selector: {selector}")
                break

        if not products:
            # Fallback: look for any product-like containers
            products = soup.select('[class*="product"]')[:5]
            logger.info(f"Fallback: found {len(products)} product-like elements")

        for product in products[:3]:
            try:
                # Extract title
                title = None
                title_selectors = [
                    '[data-testid="product-header"]',
                    '.product-header',
                    '[class*="pod-title"]',
                    'h3', 'h2',
                    'a[href*="/p/"]',
                ]
                for sel in title_selectors:
                    elem = product.select_one(sel)
                    if elem and elem.get_text(strip=True):
                        title = elem.get_text(strip=True)[:150]
                        break

                if not title:
                    continue

                # Extract price
                price = "not available"
                price_selectors = [
                    '[data-testid="product-pod-price"]',
                    '.price-format__main-price',
                    '[class*="price"]',
                    'span[class*="Price"]',
                ]
                for sel in price_selectors:
                    elem = product.select_one(sel)
                    if elem:
                        price_text = elem.get_text(strip=True)
                        parsed = self.parse_price(price_text)
                        if parsed != "not available":
                            price = parsed
                            break

                # Extract product URL
                product_url = search_url
                link = product.select_one('a[href*="/p/"]')
                if link:
                    href = link.get('href', '')
                    if href.startswith('/'):
                        product_url = f"https://www.homedepot.com{href}"
                    elif href.startswith('http'):
                        product_url = href

                # Extract model number if available
                model = ""
                model_elem = product.select_one('[class*="model"]')
                if model_elem:
                    model = model_elem.get_text(strip=True)

                results.append(ScraperResult(
                    store_id=store_id,
                    store_name=store_name,
                    item_name=title,
                    price=price,
                    unit="each",
                    product_url=product_url,
                    notes=f"Model: {model}" if model else ""
                ))

            except Exception as e:
                logger.debug(f"Error parsing Home Depot product: {e}")
                continue

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
        Parse Home Depot results with Playwright.
        Useful if JavaScript rendering is needed.
        """
        # For Home Depot, the Playwright approach can wait for specific elements
        try:
            # Wait for product pods to load
            page.wait_for_selector('[data-testid="product-pod"]', timeout=10000)
        except Exception:
            pass  # Continue with whatever we have

        # Use the requests parser on the rendered HTML
        return self.parse_results_requests(soup, store_id, store_name, search_url, query)
