// scrapers/workdayScraper.js
const axios = require('axios');
const BaseScraper = require('./baseScraper');

class WorkdayScraper extends BaseScraper {
  async fetchJobs() {
    console.log(`🔎 Fetching Workday jobs from ${this.site.url}`);
    const res = await axios.get(this.site.url);
    const data = res.data;
    // TODO: adjust these paths based on your tenant’s JSON shape
    const rawJobs = data.jobPostings || [];
    const mapped = rawJobs.map(j => ({
      jobId: j.id || j.jobPostingId,
      title: j.title,
      location: j.location
        ? `${j.location.city}, ${j.location.country}`
        : '',
      url: this.site.base_url + (j.externalPath || ''),
      datePosted: j.postedDate
    }));
    console.log(`✅ Found ${mapped.length} total jobs`);
    return this.filterByTitle(mapped);
  }
}

module.exports = WorkdayScraper;
