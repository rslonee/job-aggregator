// run.js

// 1) Load env vars if you use a .env locally
//    require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
// ← adjust this path to wherever your scraper live
const { fetchJobsForSite } = require('./scrapers/aggregation');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 2) Fetch all sites
async function fetchAllSites() {
  const { data: sites, error } = await supabase
    .from('sites')
    .select('*');

  if (error) {
    console.error('❌ Error fetching sites:', error);
    process.exit(1);
  }
  return sites;
}

// 3) Map your scraper’s job shape into your DB schema
function mapJobToPayload(job, site) {
  return {
    workday_id:   job.id,
    title:        job.title,
    location:     job.location,
    description:  job.description,
    apply_url:    job.applyUrl,
    site_id:      site.id,
    // …any other fields you need…
  };
}

(async () => {
  // fetch sites
  const sites = await fetchAllSites();

  // fetch & flatten all jobs
  const jobsBySite = await Promise.all(
    sites.map(site => fetchJobsForSite(site))
  );
  const allJobs = jobsBySite.flat();

  console.log(`✅ Mapped a total of ${allJobs.length} jobs`);

  // 4) Insert every job (no filter)
  for (const job of allJobs) {
    const payload = mapJobToPayload(job, job.__site || job.site);
    const { error } = await supabase
      .from('jobs')
      .insert(payload);

    if (error) {
      console.error(
        `❌ Supabase insert error for ${job.id} (${job.title}):`,
        error
      );
    } else {
      console.log(`✔ Inserted ${job.id}`);
    }
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
