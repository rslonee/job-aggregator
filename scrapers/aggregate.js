// job-aggregator/scrapers/aggregate.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// ← UPDATE THIS to the relative path where your Workday scraper lives.
//     If you create /scrapers/workday.js (see below), you can leave it as './workday'
const { fetchWorkdayJobsForSite } = require('./workday');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('🚀 Starting job aggregation');

  // 1) pull your list of sites
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*');
  if (sitesError) throw sitesError;

  // 2) normalize your title filters
  const filters = process.env.TITLE_FILTERS
    ? process.env.TITLE_FILTERS.split(',').map(f => f.trim())
    : [];
  console.log('ℹ️ Normalized TITLE_FILTERS:', filters);

  // 3) scrape each site
  let allJobs = [];
  for (const site of sites) {
    let jobs = [];
    if (site.scraper_type === 'workday') {
      jobs = await fetchWorkdayJobsForSite(site, filters);
    }
    const mapped = jobs.map(job => ({
      site_id: site.id,
      job_id: job.id,
      title: job.title,
      location: job.location,
      // …any other fields you need here
    }));
    allJobs.push(...mapped);
  }
  console.log(`✅ Mapped a total of ${allJobs.length} jobs`);

  // 4) upsert into Supabase on (site_id, job_id)
  const { data, error } = await supabase
    .from('jobs')
    .upsert(allJobs, {
      onConflict: ['site_id', 'job_id'],
      ignoreDuplicates: true
    });

  if (error) throw error;
  console.log(`✅ Upserted ${data.length} jobs`);
}

module.exports = { main };
