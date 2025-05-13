// scrapers/workdayScraper.js
const axios = require('axios');
const BaseScraper = require('./baseScraper');

class WorkdayScraper extends BaseScraper {
  constructor(site, filters) {
    // pass site and filters separately so BaseScraper picks them up correctly
    super(site, filters);

    // allow either `site.url` or `site.endpoint` (or rename to match your Supabase column)
    this.endpoint = site.url || site.endpoint;
    if (!this.endpoint) {
      throw new Error(`No Workday endpoint defined for site "${site.name}"`);
    }

    // allow either `site.base_url` or `site.website_url`
    this.baseUrl = site.base_url || site.website_url || '';
  }

  async fetchJobs() {
    console.log(`🔎 Fetching Workday jobs from ${this.endpoint}`);

    const allMapped = [];
    let offset = 0;
    let total = Infinity;

    do {
      const pageUrl = `${this.endpoint}?offset=${offset}`;
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

      // capture total from the first page
      if (total === Infinity && typeof res.data.total === 'number') {
        total = res.data.total;
        console.log(`ℹ️  Total jobs available: ${total}`);
      }

      const postings = res.data.jobPostings;
      console.log(`ℹ️  Retrieved ${postings.length} jobs at offset ${offset}`);

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
          url: this.baseUrl + (j.externalPath || ''),
          datePosted
        });
      }

      offset += postings.length;
    } while (offset < total);

    console.log(`✅ Mapped a total of ${allMapped.length} jobs`);

    // debug: mark which titles pass your TITLE_FILTERS
    allMapped.forEach(job => {
      const matches = this.filters.some(f =>
        job.title.toLowerCase().includes(f)
      );
      console.log(`🔍 [${matches ? '✔' : '✖'}] ${job.title}`);
    });

    const filtered = this.filterByTitle(allMapped);
    console.log(`🔖 ${filtered.length} jobs passed filter for "${this.site.name}"`);

    return filtered;
  }
}

module.exports = WorkdayScraper;
