// job-aggregator/scrapers/ashby.js
const BaseScraper = require('./base');

class AshbyScraper extends BaseScraper {
  constructor(site) {
    super(site);
  }

  async fetchJobs() {
    // example: Ashby exposes a GraphQL endpoint at /graphql
    const query = `{
      jobs {
        id
        title
        url
        location { name }
        postedAt
      }
    }`;
    const res = await this.http.post(`${this.site.url}/graphql`, { query });
    return res.data.jobs.map(job => ({
      id: job.id,
      title: job.title,
      url: job.url,
      location: job.location.name,
      posted_at: job.postedAt,
    }));
  }
}

module.exports = AshbyScraper;
