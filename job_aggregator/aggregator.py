// Aggregation Script for Scraping Jobs

import { WorkdayScraper, GreenhouseScraper, HTMLScraper } from './baseScraper.js';
import { upsertJobsForSite, getAllSites } from '../../scripts/lib/db.js';

// Global Error Handler for Unhandled Rejections
process.on('unhandledRejection', (reason) => {
    console.error(`[${new Date().toISOString()}] ❌ Unhandled Rejection:`, reason);
    process.exit(1);
});

async function runScraping() {
    try {
        const sites = await getAllSites();
        for (const site of sites) {
            let scraper;
            switch (site.scraper_type) {
                case 'workday':
                    scraper = new WorkdayScraper(site.url);
                    break;
                case 'greenhouse':
                    scraper = new GreenhouseScraper(site.url);
                    break;
                case 'html':
                    scraper = new HTMLScraper(site.url);
                    break;
                default:
                    console.warn(`[${new Date().toISOString()}] ⚠️ Unknown scraper type: ${site.scraper_type}`);
                    continue;
            }

            try {
                const jobs = await scraper.scrapeJobs();
                if (jobs.length) {
                    await upsertJobsForSite(site.id, jobs);
                    console.log(`[${new Date().toISOString()}] ✅ Successfully upserted ${jobs.length} jobs for site: ${site.name}`);
                } else {
                    console.log(`[${new Date().toISOString()}] ⚠️ No jobs found for site: ${site.name}`);
                }
            } catch (error) {
                console.error(`[${new Date().toISOString()}] ❌ Failed to scrape site: ${site.name}`, error);
            }
        }
        console.log(`[${new Date().toISOString()}] 🚀 All scraping tasks completed.`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ Critical Error in Aggregation Script:`, error);
        process.exit(1);
    }
}

runScraping();
