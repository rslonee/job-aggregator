# job_aggregator/scrapers/__init__.py

"""
Initialize scraper registry and factory.
"""
from .ashby import AshbyScraper
# from .workday import WorkdayScraper
# from .greenhouse import GreenhouseScraper

# Map normalized scraper_type to scraper class
SCRAPER_MAP = {
    "ashby": AshbyScraper,
    # "workday": WorkdayScraper,
    # "greenhouse": GreenhouseScraper,
}

def get_scraper(scraper_type: str, base_url: str):
    """
    Factory: returns an instance of the correct scraper based on scraper_type.
    Raises KeyError if no matching scraper exists.
    """
    # Normalize key
    key = scraper_type.strip().lower()
    if key not in SCRAPER_MAP:
        available = ", ".join(sorted(SCRAPER_MAP.keys()))
        raise KeyError(
            f"Unknown scraper_type '{scraper_type}' for site. "
            f"Available types: {available}"
        )
    cls = SCRAPER_MAP[key]
    return cls(base_url)
