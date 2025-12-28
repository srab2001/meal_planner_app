"""
Store-specific scrapers

Each scraper inherits from BaseScraper and implements store-specific logic.
"""

from .base import BaseScraper
from .homedepot import HomeDepotScraper
from .bestbuy import BestBuyScraper

# Registry of available scrapers by store name (lowercase)
SCRAPER_REGISTRY = {
    'home depot': HomeDepotScraper,
    'homedepot': HomeDepotScraper,
    'best buy': BestBuyScraper,
    'bestbuy': BestBuyScraper,
}

def get_scraper_for_store(store_name: str, source: str = 'requests'):
    """
    Get the appropriate scraper class for a store.
    Falls back to BaseScraper if no specific scraper exists.
    """
    name_lower = store_name.lower().strip()
    scraper_class = SCRAPER_REGISTRY.get(name_lower, BaseScraper)
    return scraper_class(source=source)

__all__ = ['BaseScraper', 'HomeDepotScraper', 'BestBuyScraper', 'get_scraper_for_store', 'SCRAPER_REGISTRY']
