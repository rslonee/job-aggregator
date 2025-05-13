// job‐aggregator/scrapers/workdayScraper.js

const axios       = require('axios');
const BaseScraper = require('./baseScraper');

class WorkdayScraper extends BaseScraper {
  constructor(site, filters) {
    super(site, filters);
    this.endpoint = site.url || site.endpoint;
    if (!this.endpoint) {
      throw new Error(`No Workday endpoint defined for "${site.name}"`);
    }
    this.baseUrl = site.base_url || site.website_url || '';
  }

  async fetchJobs() {
    console.log(`🔎 Fetching Workday jobs from ${this.endpoint}`);
    const allMapped = [];
    let offset = 0, total = Infinity;

    do {
      const pageUrl = `${this.endpoint}?offset=${offset}`;
      console.log(`ℹ️  Requesting offset ${offset}`);
      const res = await axios.post(pageUrl, {}, {
        headers: { 'Content-Type': 'application/json' }
      });

      // DEBUG: show you what keys this site actually returned on first call
      if (offset === 0) {
        console.log(
          `[${this.site.name}] response top‐level keys:`,
          Object.keys(res.data)
        );
      }

      // try the two most common shapes:
      let postings = res.data.jobPostings;
      if (!Array.isArray(postings) && res.data.body) {
        postings = Array.isArray(res.data.body.jobPostings)
          ? res.data.body.jobPostings
          : null;
      }
      if (!Array.isArray(postings)) {
        console.warn(`⚠️ [${this.site.name}] no jobPostings array found, aborting`);
        break;
      }

      if (total === Infinity && typeof res.data.total === 'number') {
        total = res.data.total;
        console.log(`ℹ️  Total jobs available: ${total}`);
      }
      console.log(`ℹ️  Retrieved ${postings.length} jobs at offset ${offset}`);

      for (const j of postings) {
        let datePosted = null;
        const posted = (j.postedOn || '').toLowerCase();
        if (posted.includes('today')) {
          datePosted = new Date().toISOString().split('T')[0];
        } else if (posted.includes('yesterday')) {
          const d = new Date(); d.setDate(d.getDate() - 1);
          datePosted = d.toISOString().split('T')[0];
        }

        allMapped.push({
          jobId:       Array.isArray(j.bulletFields) && j.bulletFields[0]
                          ? String(j.bulletFields[0])
                          : null,
          title:       j.title      || j.jobTitle   || '',
          location:    j.locationsText || j.location || '',
          url:         this.baseUrl + (j.externalPath || j.path || ''),
          datePosted
        });
      }

      offset += postings.length;
    } while (offset < total);

    console.log(`✅ Mapped a total of ${allMapped.length} jobs`);

    allMapped.forEach(job => {
      const ok = this.filters.some(f =>
        job.title.toLowerCase().includes(f)
      );
      console.log(`🔍 [${ok?'✔':'✖'}] ${job.title}`);
    });

    const filtered = this.filterByTitle(allMapped);
    console.log(`🔖 ${filtered.length} jobs passed filter for "${this.site.name}"`);
    return filtered;
  }
}

module.exports = WorkdayScraper;
