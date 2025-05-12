# job_aggregator/scrapers/registry.py
```
from job_aggregator.scrapers.workday import WorkdayScraper
from job_aggregator.scrapers.greenhouse import GreenhouseScraper
from job_aggregator.scrapers.ashby import AshbyScraper

SCRAPERS = {
    "workday": WorkdayScraper,
    "greenhouse": GreenhouseScraper,
    "ashby": AshbyScraper,
}

def get_scraper(scraper_type: str, site: dict):
    """
    Factory to return the appropriate scraper instance based on scraper_type.
    """
    # Normalize key
    key = str(scraper_type).strip().lower()
    cls = SCRAPERS.get(key)
    if not cls:
        raise ValueError(f'Unknown scraper_type "{scraper_type}"')
    return cls(site)
```
