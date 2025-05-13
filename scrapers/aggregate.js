// job‐aggregator/scrapers/aggregate.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const WorkdayScraper     = require('./workdayScraper');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('🚀 Starting job aggregation');

  // 1) fetch all site configs
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*');
  if (sitesError) throw sitesError;
  console.log(`ℹ️ Found ${sites.length} sites in database`);

  // 2) normalize filters
  const filters = process.env.TITLE_FILTERS
    ? process.env.TITLE_FILTERS.split(',').map(f => f.trim().toLowerCase())
    : [];
  console.log('ℹ️ Normalized TITLE_FILTERS:', filters);

  // 3) scrape each Workday site
  let allJobs = [];
  for (const site of sites) {
    const type = (site.scraper_type || '').toLowerCase();
    if (type !== 'workday') {
      console.log(`ℹ️ Skipping "${site.name}" (scraper_type="${site.scraper_type}")`);
      continue;
    }

    console.log(`🔎 Scraping site "${site.name}" (id=${site.id})`);
    const scraper = new WorkdayScraper(site, filters);

    let filtered;
    try {
      filtered = await scraper.fetchJobs();
    } catch (err) {
      console.error(`❌ Error scraping "${site.name}":`, err);
      continue;
    }

    console.log(`ℹ️ "${site.name}" returned ${filtered.length} jobs after filter`);
    allJobs.push(
      ...filtered.map(j => ({
        site_id:     site.id,
        job_id:      j.jobId,
        title:       j.title,
        location:    j.location,
        url:         j.url,
        date_posted: j.datePosted
      }))
    );
  }

  console.log(`✅ Total jobs to upsert: ${allJobs.length}`);
  if (!allJobs.length) return console.log('ℹ️ Nothing to upsert');

  // 4) upsert into Supabase
  const { data, error } = await supabase
    .from('jobs')
    .upsert(allJobs, {
      onConflict:      ['site_id','job_id'],
      ignoreDuplicates:true
    });
  if (error) throw error;

  const upserted = Array.isArray(data) ? data.length : 0;
  console.log(`✅ Upserted ${upserted} jobs`);
}

module.exports = { main };
