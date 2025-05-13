// scrapers/aggregate.js

// Load env vars if running locally
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { fetchWorkdayJobsForSite } = require('./workday'); // your existing scraper
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('🚀 Starting job aggregation');

  // 1) Fetch your list of sites
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*');
  if (sitesError) throw sitesError;

  // 2) Normalize TITLE_FILTERS from env
  const filters = process.env.TITLE_FILTERS
    ? process.env.TITLE_FILTERS.split(',').map(f => f.trim())
    : [];
  console.log('ℹ️ Normalized TITLE_FILTERS:', filters);

  // 3) Scrape each site
  let allJobs = [];
  for (const site of sites) {
    let jobs = [];
    if (site.scraper_type === 'workday') {
      jobs = await fetchWorkdayJobsForSite(site, filters);
    }
    // Map to your DB schema
    const mapped = jobs.map(job => ({
      site_id: site.id,
      job_id: job.id,
      title: job.title,
      location: job.location,
      // …any other fields you need
    }));
    allJobs.push(...mapped);
  }

  console.log(`✅ Mapped a total of ${allJobs.length} jobs`);

  // 4) Upsert into Supabase, dropping any duplicates on (site_id, job_id)
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
