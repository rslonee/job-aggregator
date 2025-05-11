// scripts/scrape.js

import { getAllSites, upsertJobsForSite } from './lib/db.js'
import { scrapeWorkday, scrapeGreenhouse, scrapeHTML } from './lib/scrapers.js'

async function main() {
  try {
    // Load and normalize global title filters
    const raw = process.env.TITLE_FILTERS || ''
    const filters = raw
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
    console.log(`🔎 Applying title filters: ${filters.join(', ') || '(none)'}`)

    const sites = await getAllSites()

    for (const site of sites) {
      let jobs = []

      // Branch by scraper_type, now including 'greenhouse'
      switch (site.scraper_type) {
        case 'workday':
          jobs = await scrapeWorkday(site.url, site.name, site.base_url)
          break
        case 'greenhouse':
          jobs = await scrapeGreenhouse(site.url, site.name)
          break
        case 'html':
          jobs = await scrapeHTML(site.url, site.name, site.base_url)
          break
        default:
          console.warn(`⚠️  Unknown scraper_type "${site.scraper_type}" for site "${site.name}"`)
      }

      // Apply your title filters
      if (filters.length) {
        jobs = jobs.filter(job => {
          const title = (job.title || '').toLowerCase()
          return filters.some(f => title.includes(f))
        })
      }

      console.log(`🔍 Debug "${site.name}" after filter returned ${jobs.length} jobs`)

      if (jobs.length) {
        await upsertJobsForSite(site.id, jobs)
        console.log(`✅ Upserted ${jobs.length} jobs for "${site.name}"`)
      } else {
        console.log(`– No jobs passed the filter for "${site.name}"`)
      }
    }

    process.exit(0)
  } catch (err) {
    console.error('🔴 Error during scraping:', err)
    process.exit(1)
  }
}

main()
