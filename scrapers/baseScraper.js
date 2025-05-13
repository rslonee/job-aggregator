// scrapers/baseScraper.js
class BaseScraper {
  constructor(site, filters = []) {
    this.site = site;
    this.filters = filters.map(f => f.toLowerCase());
  }

  // Must return an array of jobs:
  // [{ jobId, title, location, url, datePosted }]
  async fetchJobs() {
    throw new Error('fetchJobs() not implemented');
  }

  filterByTitle(jobs) {
    return jobs.filter(job =>
      this.filters.some(f => job.title.toLowerCase().includes(f))
    );
  }
}

module.exports = BaseScraper;
