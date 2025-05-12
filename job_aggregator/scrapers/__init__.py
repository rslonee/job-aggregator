# job_aggregator/scrapers/__init__.py

from .ashby import AshbyScraper
# from .workday import WorkdayScraper
# from .greenhouse import GreenhouseScraper

SCRAPER_MAP = {
    "ashby": AshbyScraper,
    # "workday": WorkdayScraper,
    # "greenhouse": GreenhouseScraper,
}

def get_scraper(scraper_type: str, base_url: str):
    """
    Factory: returns an instance of the correct scraper.
    """
    key = scraper_type.lower()
    cls = SCRAPER_MAP.get(key)
    if not cls:
        raise KeyError(f"Unknown scraper_type '{scraper_type}' for site")
    return cls(base_url)
