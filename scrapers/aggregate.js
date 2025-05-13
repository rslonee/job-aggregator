// aggregators/aggregate.js
const supabase = require('../supabaseClient');
const GreenhouseScraper = require('./greenhouseScraper');
const WorkdayScraper = require('./workdayScraper');

async function main() {
  console.log('🚀 Starting job aggregation');

  // fetch all sites from Supabase
  const { data: sites, error: sitesErr } = await supabase
    .from('sites')
    .select('*');
  if (sitesErr) throw sitesErr;

  // parse TITLE_FILTERS environment variable
  const filters = (process.env.TITLE_FILTERS || '')
    .split(',')
    .map(f => f.trim())
    .filter(Boolean);
  console.log('ℹ️ Using TITLE_FILTERS:', filters);

  // iterate through each site record
  for (const site of sites) {
    // DEBUG: inspect the full site object
    console.log('» site record:', site);

    try {
      let scraper;
      switch (site.scraper_type.toLowerCase()) {
        case 'greenhouse':
          scraper = new GreenhouseScraper(site, filters);
          break;
        case 'workday':
          scraper = new WorkdayScraper(site, filters);
          break;
        default:
          console.warn(`⚠️ No scraper for type "${site.scraper_type}", skipping.`);
          continue;
      }

      // fetch & filter jobs
      const jobs = await scraper.fetchJobs();
      console.log(`🔖 ${jobs.length} jobs passed filter for "${site.name}"`);

      // insert each job into Supabase
      for (const job of jobs) {
        const insertData = {
          site_id:    site.id,
          job_id:     job.jobId,
          title:      job.title,
          company:    site.name,
          location:   job.location,
          url:        job.url,
          date_posted: job.datePosted
        };

        const { data, error } = await supabase
          .from('jobs')
          .insert([insertData], {
            onConflict: 'site_id,job_id',
            ignoreDuplicates: true
          });

        if (error) {
          console.error(`❌ Insert error for ${job.jobId}:`, error.message);
        } else if (data && data.length > 0) {
          console.log(`🆕 Inserted ${job.jobId} – ${job.title}`);
        } else {
          console.log(`⏭️ ${job.jobId} already exists, skipped.`);
        }
      }
    } catch (err) {
      console.error(`🔥 Error processing site "${site.name}":`, err.message);
    }
  }

  console.log('🏁 Job aggregation complete');
}

module.exports = { main };
