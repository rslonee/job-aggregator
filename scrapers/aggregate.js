// job-aggregator/scrapers/aggregate.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const WorkdayScraper = require('./workdayScraper');

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

  // 2) normalize your title‐filters
  const filters = process.env.TITLE_FILTERS
    ? process.env.TITLE_FILTERS.split(',').map(f => f.trim().toLowerCase())
    : [];
  console.log('ℹ️ Normalized TITLE_FILTERS:', filters);

  // 3) scrape each Workday site
  let allJobs = [];
  for (const site of sites) {
    if (site.scraper_type !== 'workday') continue;
    const scraper = new WorkdayScraper(site, filters);
    const jobs = await scraper.fetchJobs();          // returns filtered array
    const mapped = jobs.map(j => ({                  // map to your DB schema
      site_id:    site.id,
      job_id:     j.jobId,
      title:      j.title,
      location:   j.location,
      url:        j.url,
      date_posted:j.datePosted
      // …add any other columns here
    }));
    allJobs.push(...mapped);
  }

  console.log(`✅ Mapped a total of ${allJobs.length} jobs`);

  // if nothing new, bail out early
  if (allJobs.length === 0) {
    console.log('ℹ️ No jobs to upsert');
    return;
  }

  // 4) upsert into Supabase on (site_id, job_id), ignore dups
  const { data, error } = await supabase
    .from('jobs')
    .upsert(allJobs, {
      onConflict: ['site_id', 'job_id'],
      ignoreDuplicates: true
    });

  if (error) throw error;

  // guard against null data
  const upsertCount = Array.isArray(data) ? data.length : 0;
  console.log(`✅ Upserted ${upsertCount} jobs`);
}

module.exports = { main };
