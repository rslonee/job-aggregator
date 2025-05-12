// Base Scraper Class for Workday (POST Only)

class BaseScraper {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async fetchPage(url, method = 'POST') {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const response = await fetch(url, options);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Error fetching page: ${url} - Status: ${response.status} - Response: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                console.warn(`⚠️ Non-JSON response received, attempting to parse HTML for jobs.`);
                return text; // Return text for further parsing
            }
        } catch (error) {
            console.error(`❌ Error fetching page: ${url}`, error);
            return null;
        }
    }
}

// Workday Scraper with POST Only
class WorkdayScraper extends BaseScraper {
    async scrapeJobs() {
        const jobs = [];
        try {
            const page = await this.fetchPage(`${this.baseUrl}`, 'POST');

            if (!page) return jobs;

            // Check if JSON and contains jobs
            if (page.jobPostings) {
                jobs.push(...page.jobPostings.map(job => ({
                    title: job.title,
                    url: this.baseUrl + job.externalPath,
                    location: job.locationsText,
                    date_posted: job.postedOn
                })));
            }

            console.log(`✅ Retrieved ${jobs.length} jobs from Workday using POST.`);
        } catch (error) {
            console.error(`❌ Error scraping Workday:`, error);
        }

        return jobs;
    }
}

// Greenhouse Scraper (GET)
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

// HTML Scraper (GET)
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
