// scrapers/workdayScraper.js
const axios = require('axios');
const BaseScraper = require('./baseScraper');

class WorkdayScraper extends BaseScraper {
  constructor({ site, filters }) {
    super({ site, filters });
  }

  async fetchJobs() {
    console.log(`🔎 Fetching Workday jobs from ${this.site.url}`);

    const allMapped = [];
    let offset = 0;
    let total = Infinity;

    // keep fetching pages until we've retrieved 'total' jobs
    do {
      const pageUrl = `${this.site.url}?offset=${offset}`;
      console.log(`ℹ️  Requesting offset ${offset}`);
      const res = await axios.post(
        pageUrl,
        {}, // empty body
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!res.data || !Array.isArray(res.data.jobPostings)) {
        console.warn('⚠️ Unexpected response shape at offset', offset, res.data);
        break;
      }

      // record total on first page
      if (total === Infinity && typeof res.data.total === 'number') {
        total = res.data.total;
        console.log(`ℹ️  Total jobs available: ${total}`);
      }

      const postings = res.data.jobPostings;
      console.log(`ℹ️  Retrieved ${postings.length} jobs at offset ${offset}`);

      // map each posting to our shape
      for (const j of postings) {
        let datePosted = null;
        const posted = (j.postedOn || '').toLowerCase();
        if (posted.includes('today')) {
          datePosted = new Date().toISOString().split('T')[0];
        } else if (posted.includes('yesterday')) {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          datePosted = d.toISOString().split('T')[0];
        }

        allMapped.push({
          jobId: Array.isArray(j.bulletFields) && j.bulletFields[0]
            ? String(j.bulletFields[0])
            : null,
          title: j.title,
          location: j.locationsText || '',
          url: this.site.base_url + (j.externalPath || ''),
          datePosted
        });
      }

      offset += postings.length;
    } while (offset < total);

    console.log(`✅ Mapped a total of ${allMapped.length} jobs`);

    // debug: show which titles match your filters
    allMapped.forEach(job => {
      const matches = this.filters.some(f =>
        job.title.toLowerCase().includes(f)
      );
      console.log(`🔍 [${matches ? '✔' : '✖'}] ${job.title}`);
    });

    // apply your filters (or return all if none specified)
    const filtered = this.filterByTitle(allMapped);
    console.log(`🔖 ${filtered.length} jobs passed filter for "${this.site.name}"`);

    return filtered;
  }
}

module.exports = WorkdayScraper;
