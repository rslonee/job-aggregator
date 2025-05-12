# job_aggregator/scrapers/ashby.py

import requests
from bs4 import BeautifulSoup

class AshbyScraper:
    """Scrapes AshbyHQ-powered pages (e.g. jobs.ashbyhq.com/company)."""

    def __init__(self, site):
        # expecting site to be a dict with keys 'url' (and optionally name/id)
        self.base_url = site["url"].rstrip("/")
        self.headers = {"User-Agent": "job-aggregator/1.0"}

    def list_job_posts(self):
        """Return a list of job dicts with keys title, url, company, location, date_posted."""
        results = []
        page = 1
        while True:
            resp = requests.get(f"{self.base_url}?page={page}", headers=self.headers)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            cards = soup.select("a.JobListingCard__link")
            if not cards:
                break

            # Company name is on the page header
            company = (
                soup.select_one(".CompanyHeader__name").get_text(strip=True)
                if soup.select_one(".CompanyHeader__name")
                else ""
            )

            for a in cards:
                title_el = a.select_one(".JobListingCard__title")
                loc_el   = a.select_one(".JobListingCard__location")
                date_el  = a.select_one(".JobListingCard__posted")

                title = title_el.get_text(strip=True) if title_el else ""
                location = loc_el.get_text(strip=True) if loc_el else ""
                date_posted = date_el.get_text(strip=True) if date_el else ""
                href = a["href"]
                url = href if href.startswith("http") else self.base_url + href

                results.append({
                    "job_id":       url.split("/")[-1],  # fallback if you need a unique id
                    "title":        title,
                    "company":      company,
                    "location":     location,
                    "url":          url,
                    "date_posted":  date_posted,
                })
            page += 1

        return results
