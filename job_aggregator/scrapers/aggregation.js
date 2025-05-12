// Aggregation Script for Scraping Jobs

import { WorkdayScraper, GreenhouseScraper, HTMLScraper } from './baseScraper.js';
import { upsertJobsForSite, getAllSites } from '../../scripts/lib/db.js';

async function runScraping() {
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
                console.warn(`Unknown scraper type: ${site.scraper_type}`);
                continue;
        }

        try {
            const jobs = await scraper.scrapeJobs();
            if (jobs.length) {
                await upsertJobsForSite(site.id, jobs);
                console.log(`✅ Successfully upserted ${jobs.length} jobs for site: ${site.name}`);
            } else {
                console.log(`⚠️ No jobs found for site: ${site.name}`);
            }
        } catch (error) {
            console.error(`❌ Failed to scrape site: ${site.name}`, error);
        }
    }
    console.log('🚀 All scraping tasks completed.');
}

runScraping();
