// scripts/lib/db.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/** Fetch all configured sites */
export async function getAllSites() {
  const { data, error } = await supabase.from('sites').select('*')
  if (error) throw error
  return data
}

/**
 * Upsert a batch of jobs for a given site
 * @param {number} siteId
 * @param {Array<Object>} jobs
 */
export async function upsertJobsForSite(siteId, jobs) {
  for (let job of jobs) {
    await supabase
      .from('jobs')
      .upsert(
        { site_id: siteId, ...job },
        { onConflict: ['site_id', 'job_id'] }
      )
  }
}
