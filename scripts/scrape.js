// scripts/scrape.js

import { getAllSites, upsertJobsForSite } from './lib/db.js'
import { scrapeWorkday, scrapeHTML }      from './lib/scrapers.js'

async function main() {
  try {
    // Load global title‐filter keywords from env (case-insensitive)
    const raw = process.env.TITLE_FILTERS || ''
    const filters = raw
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)

    console.log(`🔎 Applying title filters: ${filters.join(', ') || '(none)'}`)

    const sites = await getAllSites()

    for (const site of sites) {
      let jobs = []

      if (site.scraper_type === 'workday') {
        jobs = await scrapeWorkday(site.url, site.name, site.base_url)
      } else if (site.scraper_type === 'html') {
        jobs = await scrapeHTML(site.url, site.name, site.base_url)
      }

      // Apply the title filter globally
      if (filters.length) {
        jobs = jobs.filter(job => {
          const title = (job.title || '').toLowerCase()
          return filters.some(f => title.includes(f))
        })
      }

      console.log(`🔍 Debug "${site.name}" after filter returned ${jobs.length} jobs`)
      if (jobs.length) {
        await upsertJobsForSite(site.id, jobs)
        console.log(`✅ Upserted ${jobs.length} jobs from "${site.name}"`)
      } else {
        console.log(`– No jobs passed the filter for "${site.name}"`)
      }
    }

    process.exit(0)
  } catch (error) {
    console.error('🔴 Error during scraping:', error)
    process.exit(1)
  }
}

main()
