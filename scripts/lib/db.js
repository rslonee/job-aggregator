// Enhanced Database Interaction Module

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Enhanced Upsert Function with Error Handling
async function upsertJobsForSite(siteId, jobs) {
    if (!jobs.length) return;

    const batchSize = 100;
    for (let i = 0; i < jobs.length; i += batchSize) {
        const batch = jobs.slice(i, i + batchSize);
        try {
            const { error } = await supabase
                .from('jobs')
                .upsert(batch.map(job => ({ site_id: siteId, ...job })), { onConflict: ['site_id', 'job_id'] });

            if (error) {
                console.error(`[${new Date().toISOString()}] ❌ Failed to upsert batch of jobs for site ${siteId}:`, error);
            } else {
                console.log(`[${new Date().toISOString()}] ✅ Upserted batch of ${batch.length} jobs for site ${siteId}`);
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] ❌ Critical error during upsert for site ${siteId}:`, error);
        }
    }
}

// Enhanced Function to Fetch Sites with Error Handling
async function getAllSites() {
    try {
        const { data: sites, error } = await supabase
            .from('sites')
            .select('id, name, url, scraper_type');

        if (error) {
            console.error(`[${new Date().toISOString()}] ❌ Error fetching sites:`, error);
            throw new Error('Failed to fetch sites');
        }

        if (!sites || !sites.length) {
            console.warn(`[${new Date().toISOString()}] ⚠️ No sites found for scraping.`);
            return [];
        }

        console.log(`[${new Date().toISOString()}] ✅ Retrieved ${sites.length} sites for scraping.`);
        return sites;
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ Critical error in getAllSites():`, error);
        throw error;
    }
}

export { upsertJobsForSite, getAllSites };
