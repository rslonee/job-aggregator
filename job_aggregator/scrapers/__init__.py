# job_aggregator/scrapers/__init__.py

from .workday import WorkdayScraper
from .greenhouse import GreenhouseScraper
from .ashby import AshbyScraper

# Map normalized scraper keys to their classes
def _build_scrapers():
    return {
        "workday":    WorkdayScraper,
        "greenhouse": GreenhouseScraper,
        "ashby":      AshbyScraper,
    }

SCRAPERS = _build_scrapers()

def get_scraper(scraper_type: str, site: dict):
    """
    Factory to return an instance of the appropriate scraper based on the site config.
    Normalizes the scraper_type key (strip/lower) before lookup.
    """
    key = str(scraper_type).strip().lower()
    cls = SCRAPERS.get(key)
    if not cls:
        raise ValueError(f'Unknown scraper_type "{scraper_type}"')
    return cls(site)
