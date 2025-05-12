// Enhanced Database Interaction Module

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

async function upsertJobsForSite(siteId, jobs) {
    if (!jobs.length) return;

    const batchSize = 100;
    for (let i = 0; i < jobs.length; i += batchSize) {
        const batch = jobs.slice(i, i + batchSize);
        const { error } = await supabase
            .from('jobs')
            .upsert(batch.map(job => ({ site_id: siteId, ...job })), { onConflict: ['site_id', 'job_id'] });

        if (error) {
            console.error(`[${new Date().toISOString()}] ❌ Failed to upsert batch of jobs for site ${siteId}:`, error);
        } else {
            console.log(`[${new Date().toISOString()}] ✅ Upserted batch of ${batch.length} jobs for site ${siteId}`);
        }
    }
}

async function getAllSites() {
    const { data: sites, error } = await supabase
        .from('sites')
        .select('id, name, url, scraper_type');

    if (error) throw error;
    console.log(`[${new Date().toISOString()}] ✅ Retrieved ${sites.length} sites for scraping.`);
    return sites;
}

export { upsertJobsForSite, getAllSites };
