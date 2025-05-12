// Base Scraper Class

class BaseScraper {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async fetchPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`❌ Error fetching page: ${url}`, error);
            return null;
        }
    }

    async scrapeJobs() {
        throw new Error('scrapeJobs method not implemented');
    }
}

// Workday Scraper
class WorkdayScraper extends BaseScraper {
    async scrapeJobs() {
        const jobs = [];
        try {
            const firstPage = await this.fetchPage(`${this.baseUrl}/api/jobs?limit=100`);
            if (!firstPage) return jobs;

            jobs.push(...firstPage.jobs);

            const total = firstPage.total || jobs.length;
            for (let offset = 100; offset < total; offset += 100) {
                const page = await this.fetchPage(`${this.baseUrl}/api/jobs?limit=100&offset=${offset}`);
                if (page && page.jobs) jobs.push(...page.jobs);
            }
            console.log(`✅ Retrieved ${jobs.length} jobs from Workday.`);
        } catch (error) {
            console.error(`❌ Error scraping Workday:`, error);
        }
        return jobs;
    }
}

// Greenhouse Scraper
class GreenhouseScraper extends BaseScraper {
    async scrapeJobs() {
        const jobs = [];
        const page = await this.fetchPage(this.baseUrl);
        if (!page || !page.jobs) return jobs;

        jobs.push(...page.jobs.map(job => ({
            job_id: job.id,
            title: job.title,
            location: job.location,
            url: job.absolute_url,
            date_posted: job.updated_at
        })));

        console.log(`✅ Retrieved ${jobs.length} jobs from Greenhouse.`);
        return jobs;
    }
}

// HTML Scraper
class HTMLScraper extends BaseScraper {
    async scrapeJobs() {
        const jobs = [];
        const page = await this.fetchPage(this.baseUrl);
        if (!page) return jobs;

        const $ = cheerio.load(page);
        $('.job-listing').each((_, el) => {
            jobs.push({
                job_id: $(el).attr('data-id'),
                title: $(el).find('.job-title').text().trim(),
                location: $(el).find('.location').text().trim(),
                url: $(el).find('a').attr('href')
            });
        });

        console.log(`✅ Retrieved ${jobs.length} jobs from HTML.`);
        return jobs;
    }
}

export { BaseScraper, WorkdayScraper, GreenhouseScraper, HTMLScraper };
