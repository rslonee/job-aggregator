# job_aggregator/scrapers/ashby.py
import requests
from bs4 import BeautifulSoup
from datetime import datetime

class AshbyScraper:
    """
    Scrapes an Ashby-powered careers site.
    Example page: https://company.ashbyhq.com/jobs
    """
    BASE_JOBS_URL = "{base_url}/jobs"

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    def list_job_posts(self):
        """
        Returns a list of dicts: { job_id, title, location, date_posted, url }
        """
        resp = requests.get(self.BASE_JOBS_URL.format(base_url=self.base_url), timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        jobs = []
        for card in soup.select(".JobListCard"):  # Ashby’s job card container
            link = card.find("a", class_="JobListCard__jobLink")
            if not link:
                continue
            job_id = link["href"].split("/")[-1]
            title = link.get_text(strip=True)
            location_el = card.select_one(".JobListCard__location")
            location = location_el.get_text(strip=True) if location_el else ""
            date_el = card.select_one(".JobListCard__date")
            if date_el:
                # e.g. "May  5, 2025"
                date_posted = datetime.strptime(date_el.get_text(strip=True), "%b %d, %Y").date()
            else:
                date_posted = datetime.utcnow().date()
            url = f"{self.base_url}{link['href']}"
            jobs.append({
                "job_id": job_id,
                "title": title,
                "location": location,
                "date_posted": date_posted.isoformat(),
                "url": url,
            })

        return jobs
