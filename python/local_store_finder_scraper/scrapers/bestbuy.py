"""
Best Buy Scraper (Playwright-based)

Scrapes product information from bestbuy.com search results.
Uses Playwright for JavaScript-rendered content.

Best Buy heavily relies on JavaScript for rendering search results,
making Playwright the preferred method.
"""

import logging
from typing import List
from .base import BaseScraper, ScraperResult, PLAYWRIGHT_TIMEOUT

logger = logging.getLogger(__name__)


class BestBuyScraper(BaseScraper):
    """
    Scraper for Best Buy website.

    Best Buy's search results are heavily JavaScript-rendered,
    so this scraper defaults to Playwright mode.
    """

    def __init__(self, source: str = 'playwright'):
        # Default to playwright for Best Buy since it's JS-heavy
        super().__init__(source=source)

    def build_search_url(self, base_url: str, search_template: str, query: str) -> str:
        """Build Best Buy search URL."""
        from urllib.parse import quote_plus

        if search_template and '{query}' in search_template:
            return search_template.replace('{query}', quote_plus(query))
        # Best Buy specific search URL format
        return f"https://www.bestbuy.com/site/searchpage.jsp?st={quote_plus(query)}"

    def parse_results_requests(
        self,
        soup,
        store_id: str,
        store_name: str,
        search_url: str,
        query: str
    ) -> List[ScraperResult]:
        """
        Parse Best Buy search results using BeautifulSoup.

        Note: Best Buy may require JavaScript for full content.
        This method works with pre-rendered HTML from Playwright.
        """
        results = []

        # Best Buy product card selectors
        product_selectors = [
            '.sku-item',
            '[class*="sku-item"]',
            '.list-item',
            '[data-sku-id]',
            '.product-list-item',
        ]

        products = []
        for selector in product_selectors:
            products = soup.select(selector)
            if products:
                logger.info(f"Found {len(products)} products with selector: {selector}")
                break

        if not products:
            # Fallback
            products = soup.select('[class*="product"]')[:5]

        for product in products[:3]:
            try:
                # Extract title
                title = None
                title_selectors = [
                    '.sku-title a',
                    '.sku-header a',
                    'h4.sku-title',
                    '[class*="sku-title"]',
                    'h4 a',
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
                    '[data-testid="customer-price"] span',
                    '.priceView-hero-price span',
                    '.priceView-customer-price span',
                    '[class*="price"] span',
                    '.sr-only',  # Screen reader price
                ]
                for sel in price_selectors:
                    elems = product.select(sel)
                    for elem in elems:
                        price_text = elem.get_text(strip=True)
                        if '$' in price_text or price_text.replace(',', '').replace('.', '').isdigit():
                            parsed = self.parse_price(price_text)
                            if parsed != "not available":
                                price = parsed
                                break
                    if price != "not available":
                        break

                # Extract product URL
                product_url = search_url
                link = product.select_one('a.sku-title, a[href*="/site/"]')
                if link:
                    href = link.get('href', '')
                    if href.startswith('/'):
                        product_url = f"https://www.bestbuy.com{href}"
                    elif href.startswith('http'):
                        product_url = href

                # Extract SKU if available
                sku = product.get('data-sku-id', '')
                if not sku:
                    sku_elem = product.select_one('[class*="sku-value"]')
                    if sku_elem:
                        sku = sku_elem.get_text(strip=True)

                # Extract rating if available
                rating = ""
                rating_elem = product.select_one('[class*="rating"]')
                if rating_elem:
                    rating_text = rating_elem.get_text(strip=True)
                    if rating_text:
                        rating = f"Rating: {rating_text}"

                notes = []
                if sku:
                    notes.append(f"SKU: {sku}")
                if rating:
                    notes.append(rating)

                results.append(ScraperResult(
                    store_id=store_id,
                    store_name=store_name,
                    item_name=title,
                    price=price,
                    unit="each",
                    product_url=product_url,
                    notes="; ".join(notes) if notes else ""
                ))

            except Exception as e:
                logger.debug(f"Error parsing Best Buy product: {e}")
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
        Parse Best Buy results with Playwright.

        This method can use page interactions if needed.
        """
        try:
            # Wait for product list to load
            page.wait_for_selector('.sku-item, .list-item', timeout=10000)

            # Scroll to load lazy content
            page.evaluate('window.scrollTo(0, document.body.scrollHeight / 3)')
            page.wait_for_timeout(500)

        except Exception as e:
            logger.debug(f"Playwright wait error: {e}")

        # Parse the rendered HTML
        return self.parse_results_requests(soup, store_id, store_name, search_url, query)

    def scrape_playwright(
        self,
        store_id: str,
        store_name: str,
        search_url: str,
        query: str,
        max_results: int
    ) -> List[ScraperResult]:
        """Override to handle Best Buy's JavaScript-heavy pages."""
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            logger.warning("Playwright not installed, falling back to requests")
            return self.scrape_requests(store_id, store_name, search_url, query, max_results)

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    user_agent=self.__class__.__bases__[0].__module__.split('.')[0],
                    viewport={'width': 1920, 'height': 1080}
                )
                page = context.new_page()

                # Navigate with retry
                for attempt in range(2):
                    try:
                        page.goto(search_url, timeout=PLAYWRIGHT_TIMEOUT, wait_until='domcontentloaded')
                        break
                    except Exception as e:
                        if attempt == 1:
                            raise e
                        logger.debug(f"Retry navigation: {e}")

                # Wait for content
                try:
                    page.wait_for_selector('.sku-item, .list-item, [class*="product"]', timeout=10000)
                except Exception:
                    pass

                # Small delay for JS to settle
                page.wait_for_timeout(1000)

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
            logger.error(f"Best Buy Playwright scrape failed: {e}")
            return [ScraperResult(
                store_id=store_id,
                store_name=store_name,
                item_name=query,
                price="not available",
                notes=f"Scraping failed: {str(e)[:80]}",
                product_url=search_url
            )]
