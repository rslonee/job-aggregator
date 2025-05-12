from .workday      import WorkdayScraper
from .greenhouse   import GreenhouseScraper
from .ashby        import AshbyScraper

SCRAPERS = {
    "workday":    WorkdayScraper,
    "greenhouse": GreenhouseScraper,
    "ashby":      AshbyScraper,
}

def get_scraper(scraper_type: str, site: dict):
    key = scraper_type.strip().lower()
    cls = SCRAPERS.get(key)
    if not cls:
        raise ValueError(f'Unknown scraper_type "{scraper_type}"')
    return cls(site)
