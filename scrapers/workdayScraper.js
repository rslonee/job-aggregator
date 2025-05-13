// scrapers/workdayScraper.js
const axios = require('axios');
const BaseScraper = require('./baseScraper');

class WorkdayScraper extends BaseScraper {
  constructor(site, filters) {
    // site.url, site.base_url, site.name, etc. all come from Supabase
    super({ site, filters });
  }

  async fetchJobs() {
    console.log(`🔎 Fetching Workday jobs from ${this.site.url}`);

    const allMapped = [];
    let offset = 0;
    let total = Infinity;

    do {
      // build the paged URL dynamically – you could also store a "page_size" column
      const pageUrl = `${this.site.url}?offset=${offset}`;
      console.log(`ℹ️  Requesting offset ${offset}`);
      const res = await axios.post(
        pageUrl,
        {},
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!res.data || !Array.isArray(res.data.jobPostings)) {
        console.warn('⚠️ Unexpected response shape at offset', offset, res.data);
        break;
      }

      // capture the Workday-reported total on the first page
      if (total === Infinity && typeof res.data.total === 'number') {
        total = res.data.total;
        console.log(`ℹ️  Total jobs available: ${total}`);
      }

      const postings = res.data.jobPostings;
      console.log(`ℹ️  Retrieved ${postings.length} jobs at offset ${offset}`);

      // normalize each posting
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

    // (optional) debug print: show which titles match your TITLE_FILTERS
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
