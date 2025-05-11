// scripts/lib/db.js

import { createClient } from '@supabase/supabase-js'

// ← use the same secret name you set in your workflow
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

/**
 * Fetch all configured sites from the "sites" table.
 * @returns {Promise<Array>}
 */
export async function getAllSites() {
  const { data, error } = await supabase.from('sites').select('*')
  if (error) throw error
  return data
}

/**
 * Upsert a batch of jobs for a given site into the "jobs" table.
 * @param {number} siteId
 * @param {Array<Object>} jobs
 */
export async function upsertJobsForSite(siteId, jobs) {
  const records = jobs.map(job => ({
    site_id: siteId,
    ...job
  }))

  const { error } = await supabase
    .from('jobs')
    .upsert(records, { onConflict: ['site_id', 'job_id'] })

  if (error) throw error
}
