# job_aggregator/aggregator.py
# … your existing imports …
from job_aggregator.scrapers import get_scraper

def run_all_scrapes(sites_config):
    """
    sites_config is a list of dicts, e.g.
      [{"scraper_type": "ashby", "url": "https://acme.ashbyhq.com", …}, …]
    """
    for site in sites_config:
        scraper = get_scraper(site["scraper_type"], site["url"])
        try:
            jobs = scraper.list_job_posts()
        except Exception as e:
            print(f"Error scraping {site['url']}: {e}")
            continue

        for job in jobs:
            # upsert into your database
            upsert_job(
                job_id      = job["job_id"],
                title       = job["title"],
                location    = job["location"],
                date_posted = job["date_posted"],
                url         = job["url"],
                site_id     = site["id"],
            )
