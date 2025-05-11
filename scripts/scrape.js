// ----------------------------------------------------------------------
// scripts/scrape.js
// ----------------------------------------------------------------------

import { getAllSites, upsertJobsForSite } from './lib/db.js'
import { scrapeWorkday, scrapeHTML } from './lib/scrapers.js'

async function main() {
  try {
    const sites = await getAllSites()

    for (const site of sites) {
      let jobs = []
      if (site.scraper_type === 'workday') {
        jobs = await scrapeWorkday(site.url, site.name)
      } else if (site.scraper_type === 'html') {
        jobs = await scrapeHTML(site.url, site.name)
      }

      console.log(`✅ Upserted ${jobs.length} jobs for "${site.name}"`)
      await upsertJobsForSite(site.id, jobs)
    }

    process.exit(0)
  } catch (error) {
    console.error('🔴 Error during scraping:', error)
    process.exit(1)
  }
}

main()
