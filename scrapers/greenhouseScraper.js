// scrapers/greenhouseScraper.js
const axios = require('axios');
const BaseScraper = require('./baseScraper');

class GreenhouseScraper extends BaseScraper {
  async fetchJobs() {
    console.log(`🔎 Fetching Greenhouse jobs from ${this.site.url}`);
    const res = await axios.get(this.site.url);
    const rawJobs = res.data.jobs; // API returns { jobs: [...] }
    const mapped = rawJobs.map(j => ({
      jobId: String(j.id),
      title: j.title,
      location: j.location || '',
      url: j.absolute_url,
      datePosted: j.updated_at ? j.updated_at.split('T')[0] : null
    }));
    console.log(`✅ Found ${mapped.length} total jobs`);
    return this.filterByTitle(mapped);
  }
}

module.exports = GreenhouseScraper;
