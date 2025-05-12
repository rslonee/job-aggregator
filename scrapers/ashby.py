# scrapers/ashby.py

import requests
from bs4 import BeautifulSoup

class AshbyScraper:
    """Scrapes listing pages served by Ashby (jobs.ashbyhq.com)."""

    def __init__(self, site):
        self.base_url = site['url'].rstrip('/')
        self.headers = {'User-Agent': 'job-aggregator/1.0'}

    def fetch(self):
        # Ashby paginates via `?page=`; we'll grab all pages until empty.
        results = []
        page = 1
        while True:
            resp = requests.get(f"{self.base_url}?page={page}", headers=self.headers)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'html.parser')
            cards = soup.select('a.JobListingCard__link')
            if not cards:
                break
            for a in cards:
                title = a.select_one('.JobListingCard__title').get_text(strip=True)
                url   = a['href'] if a['href'].startswith('http') else self.base_url + a['href']
                company = soup.select_one('.CompanyHeader__name').get_text(strip=True)
                date_posted = a.select_one('.JobListingCard__posted').get_text(strip=True)  # format: “3 days ago”
                location = a.select_one('.JobListingCard__location').get_text(strip=True)
                results.append({
                    'title': title,
                    'company': company,
                    'location': location,
                    'url': url,
                    'date_posted': date_posted,
                })
            page += 1
        return results
