# aggregator.py

from job_aggregator.scrapers.ashby import AshbyScraper
# … import your other scrapers …

def get_scraper(scraper_type: str, base_url: str):
    """
    Factory: returns an instance of the correct scraper.
    """
    if scraper_type == "ashby":
        return AshbyScraper(base_url)
    # elif scraper_type == "workday":
    #     return WorkdayScraper(base_url)
    # … other scraper types …
    else:
        raise ValueError(f"Unknown scraper type: {scraper_type}")
