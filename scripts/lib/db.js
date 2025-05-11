// scripts/lib/db.js

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

/**
 * Fetch all configured sites from the "sites" table,
 * including the new base_url field.
 * @returns {Promise<Array<{id: number, name: string, url: string, scraper_type: string, base_url: string}>>}
 */
export async function getAllSites() {
  const { data: sites, error } = await supabase
    .from('sites')
    .select('id, name, url, scraper_type, base_url')

  if (error) throw error
  return sites
}

/**
 * Upsert a batch of jobs for a given site into the "jobs" table.
 * @param {number} siteId
 * @param {Array<Object>} jobs
 */
export async function upsertJobsForSite(siteId, jobs) {
  if (!jobs.length) return

  const records = jobs.map(job => ({
    site_id: siteId,
    ...job
  }))

  const { error } = await supabase
    .from('jobs')
    .upsert(records, { onConflict: ['site_id', 'job_id'] })

  if (error) throw error
}
