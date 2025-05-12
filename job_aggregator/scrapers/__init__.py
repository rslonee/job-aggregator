# job_aggregator/scrapers/__init__.py

from .workday      import WorkdayScraper
from .greenhouse   import GreenhouseScraper
from .ashby        import AshbyScraper

SCRAPERS = {
    "workday":    WorkdayScraper,
    "greenhouse": GreenhouseScraper,
    "ashby":      AshbyScraper,
}

def get_scraper(scraper_type: str, site: dict):
    """
    Returns an instance of the scraper class for this site.
      - scraper_type: string key in SCRAPERS
      - site: full site dict from load_sites_config()
    """
    cls = SCRAPERS.get(scraper_type)
    if not cls:
        raise ValueError(f'Unknown scraper_type "{scraper_type}"')
    return cls(site)
