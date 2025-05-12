# job_aggregator/scrapers/__init__.py

from .ashby import AshbyScraper
# import your other scrapers here...
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
    cls = SCRAPER_MAP.get(scraper_type)
    if not cls:
        raise KeyError(f"No scraper registered for '{scraper_type}'")
    return cls(base_url)
