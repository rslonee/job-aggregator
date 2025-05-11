import { createClient } from '@supabase/supabase-js'
import { getAllSites, upsertJobsForSite } from './lib/db.js'
import { scrapeWorkday, scrapeHTML } from './lib/scrapers.js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function main() {
  const { data: sites } = await supabase.from('sites').select('*')
  for (let site of sites) {
    let jobs = []
    if (site.scraper_type === 'workday') {
      jobs = await scrapeWorkday(site.url)
    } else if (site.scraper_type === 'html') {
      jobs = await scrapeHTML(site.url)
    }
    // each job: { job_id, title, company, location, url, date_posted }
    for (let job of jobs) {
      await supabase
        .from('jobs')
        .upsert({ site_id: site.id, ...job }, { onConflict: ['site_id','job_id'] })
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
