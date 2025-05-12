# scrapers/ashby.py
import requests
from bs4 import BeautifulSoup

def scrape_ashby_jobs(company_base_url: str):
    """
    Scrapes job listings from an Ashby-hosted careers page.

    Args:
      company_base_url: the base careers URL, e.g. "https://YOUR_COMPANY.ashbyhq.com"

    Returns:
      A list of job dicts: {"title", "location", "url", "date_posted", "company"}
    """
    jobs = []
    # Ashby exposes a JSON endpoint at /api/v1/jobs
    endpoint = company_base_url.rstrip('/') + '/api/v1/jobs'
    resp = requests.get(endpoint, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    company_name = data.get('meta', {}).get('company_name') or company_base_url

    for job in data.get('data', []):
        jobs.append({
            'id': job.get('id'),
            'title': job.get('attributes', {}).get('title'),
            'company': company_name,
            'location': job.get('attributes', {}).get('location'),
            'url': company_base_url.rstrip('/') + job.get('attributes', {}).get('path'),
            'date_posted': job.get('attributes', {}).get('published_at'),
        })
    return jobs

# Register this scraper in the aggregator
from aggregator.registry import register_scraper
register_scraper('ashby', scrape_ashby_jobs)
