// Base Scraper Class with POST Request for Workday

class BaseScraper {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async fetchPage(url, method = 'GET', body = null) {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            };
            if (body) options.body = JSON.stringify(body);

            const response = await fetch(url, options);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Error fetching page: ${url} - Status: ${response.status} - Response: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`❌ Error fetching page: ${url}`, error);
            return null;
        }
    }
}

// Workday Scraper with POST Requests
class WorkdayScraper extends BaseScraper {
    async scrapeJobs() {
        const jobs = [];
        let offset = 0;
        const pageSize = 100;

        try {
            while (true) {
                const payload = { limit: pageSize, offset };
                const page = await this.fetchPage(this.baseUrl, 'POST', payload);

                if (!page || !page.jobs) break;
                jobs.push(...page.jobs);
                console.log(`✅ Retrieved ${page.jobs.length} jobs (offset ${offset})`);

                if (page.jobs.length < pageSize) break;
                offset += pageSize;
            }

            console.log(`✅ Retrieved ${jobs.length} jobs from Workday using POST.`);
        } catch (error) {
            console.error(`❌ Error scraping Workday:`, error);
        }

        return jobs;
    }
}

export { BaseScraper, WorkdayScraper };
