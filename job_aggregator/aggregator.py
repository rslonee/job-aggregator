# job_aggregator/aggregator.py

import os
import json
from job_aggregator.database import upsert_job, load_sites_config
from job_aggregator.scrapers import get_scraper

def run_all_scrapes():
    """
    Loads site definitions from your DB/config and iterates over them,
    scraping each in turn and upserting the results.
    """
    sites = load_sites_config()  # should return a list of dicts with id, scraper_type, url

    for site in sites:
        print(f"⏳  Scraping site id={site['id']} ({site['scraper_type']}) @ {site['url']}")
        scraper = get_scraper(site["scraper_type"], site["url"])
        try:
            jobs = scraper.list_job_posts()
            print(f"✅  Retrieved {len(jobs)} jobs from {site['url']}")
        except Exception as e:
            print(f"❌  Error scraping {site['url']}: {e}")
            continue

        for job in jobs:
            upsert_job(
                job_id      = job["job_id"],
                title       = job["title"],
                location    = job["location"],
                date_posted = job["date_posted"],
                url         = job["url"],
                site_id     = site["id"],
            )

if __name__ == "__main__":
    run_all_scrapes()
