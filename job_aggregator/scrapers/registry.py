# job_aggregator/scrapers/registry.py

from .workday import WorkdayScraper
from .greenhouse import GreenhouseScraper
from .ashby import AshbyScraper

def get_scraper(scraper_type: str, site: dict):
    """
    Factory to return the appropriate scraper instance based on scraper_type.
    """
    if scraper_type == "workday":
        return WorkdayScraper(site)
    elif scraper_type == "greenhouse":
        return GreenhouseScraper(site)
    elif scraper_type == "ashby":
        return AshbyScraper(site)
    else:
        raise ValueError(f"Unknown scraper_type '{scraper_type}' for site '{site.get('name', site.get('url'))}'")
