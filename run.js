// run.js

// 1. Bring in whatever you need to fetch & insert
const { fetchAllSites, fetchJobsForSite, insertJobIntoSupabase } = require('./your-helpers');
// (adjust these imports to match your project)

async function main() {
  // 2. Fetch your list of sites from Supabase (or config)
  const sites = await fetchAllSites();                    

  // 3. For each site, fetch and map to a flat array of jobs
  const jobsBySite = await Promise.all(
    sites.map(site => fetchJobsForSite(site))
  );
  const allJobs = jobsBySite.flat();

  console.log(`✅ Mapped a total of ${allJobs.length} jobs`);

  // 4. (Bypass filter so we can test inserts)
  for (const job of allJobs) {
    console.log(`🔍 [✔] ${job.title}`);
    const { data, error } = await insertJobIntoSupabase(job);
    if (error) {
      console.error('❌ Supabase insert error for', job.id, job.title, error);
    } else {
      console.log('✔ Inserted', job.id);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
