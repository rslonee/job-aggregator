# job_aggregator/scrapers/registry.py
from job_aggregator.scrapers.workday import WorkdayScraper
from job_aggregator.scrapers.greenhouse import GreenhouseScraper
from job_aggregator.scrapers.ashby import AshbyScraper


def get_scraper(scraper_type: str, site: dict):
    """
    Factory to return the appropriate scraper instance based on scraper_type.
    """
    if scraper_type == "workday":
        return WorkdayScraper(site)
    elif scraper_type == "greenhouse":
        return GreenhouseScraper(site)
    elif scraper_type == "ashby":
        return AshbyScraper(site)
    else:

    def _fetch_page(self, offset: int):
        url = f"{self.base_url}/api/jobs"
        params = {
            'limit': self.page_size,
            'offset': offset,
        }
        resp = self.session.get(url, params=params, timeout=10)
        resp.raise_for_status()
        return resp.json().get('jobs', [])

    def fetch_jobs(self):
        # First request to determine total count
        initial = self._fetch_page(0)
        all_jobs = list(initial)
        if len(initial) < self.page_size:
            return all_jobs

        # Estimate total from headers or fallback to continue until empty
        # For simplicity, we page until a page returns empty
        offsets = []
        # Compute next offsets until empty pages
        next_offset = self.page_size
        while True:
            offsets.append(next_offset)
            next_offset += self.page_size
            if next_offset - self.page_size >= len(all_jobs):
                break

        # Fetch remaining pages concurrently
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {executor.submit(self._fetch_page, off): off for off in offsets}
            for fut in as_completed(futures):
                page = fut.result()
                if not page:
                    continue
                all_jobs.extend(page)

        return all_jobs
