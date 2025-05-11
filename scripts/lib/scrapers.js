import fetch from 'node-fetch'

export async function scrapeWorkday(careerPageUrl) {
  // Workday career JSON endpoint example:
  const resp = await fetch(`${careerPageUrl}/jobs?format=json`)
  const json = await resp.json()
  return json.jobs.map(j => ({
    job_id: j.id,
    title: j.title,
    company: j.organization.name,
    location: j.locations.map(l=>l.name).join(', '),
    url: `${careerPageUrl}${j.absoluteUrl}`,
    date_posted: j.postDate
  }))
}
