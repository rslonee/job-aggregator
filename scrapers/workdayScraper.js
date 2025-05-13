const axios = require('axios');
const BaseScraper = require('./baseScraper');

class WorkdayScraper extends BaseScraper {
  async fetchJobs() {
    console.log(`🔎 Fetching Workday jobs from ${this.site.url}`);
    const res = await axios.post(
      this.site.url,
      {}, // empty body
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!res.data || !Array.isArray(res.data.jobPostings)) {
      console.warn('⚠️ Unexpected Workday response shape:', res.data);
      return [];
    }

    const mapped = res.data.jobPostings.map(j => {
      // derive datePosted
      let datePosted = null;
      const posted = (j.postedOn || '').toLowerCase();
      if (posted.includes('today')) {
        datePosted = new Date().toISOString().split('T')[0];
      } else if (posted.includes('yesterday')) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        datePosted = d.toISOString().split('T')[0];
      }

      return {
        jobId: Array.isArray(j.bulletFields) && j.bulletFields[0]
          ? String(j.bulletFields[0])
          : null,
        title: j.title,
        location: j.locationsText || '',
        url: this.site.base_url + (j.externalPath || ''),
        datePosted
      };
    });

    // Debug: show which titles match your filters
    mapped.forEach(job => {
      const matches = this.filters.some(f =>
        job.title.toLowerCase().includes(f)
      );
      console.log(`🔍 [${matches ? '✔' : '✖'}] ${job.title}`);
    });

    console.log(`✅ Found ${mapped.length} total jobs`);
    return this.filterByTitle(mapped);
  }
}

module.exports = WorkdayScraper;
