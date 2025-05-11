// scripts/scrape.js

import { getAllSites, upsertJobsForSite } from './lib/db.js'
import { scrapeWorkday, scrapeHTML }      from './lib/scrapers.js'

async function main() {
  try {
    const sites = await getAllSites()

    for (const site of sites) {
      let jobs = []

      if (site.scraper_type === 'workday') {
        // Pass site.base_url (exactly as stored) into your scraper
        jobs = await scrapeWorkday(site.url, site.name, site.base_url)
      } else if (site.scraper_type === 'html') {
        jobs = await scrapeHTML(site.url, site.name, site.base_url)
      }

      console.log(`🔍 Debug "${site.name}" scrape returned ${jobs.length} jobs`)
      if (jobs.length) {
        await upsertJobsForSite(site.id, jobs)
        console.log(`✅ Upserted ${jobs.length} jobs from "${site.name}"`)
      } else {
        console.log(`– No jobs found for "${site.name}"`)
      }
    }

    process.exit(0)
  } catch (error) {
    console.error('🔴 Error during scraping:', error)
    process.exit(1)
  }
}

main()
