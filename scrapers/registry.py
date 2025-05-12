# scrapers/registry.py

from .workday import WorkdayScraper
from .greenhouse import GreenhouseScraper
from .ashby import AshbyScraper

# Map your `sites.scraper_type` → scraper class
SCRAPERS = {
    'workday':    WorkdayScraper,
    'greenhouse': GreenhouseScraper,
    'ashby':      AshbyScraper,
}
