// example: scripts/lib/scrapers.js

export async function scrapeWorkday(careerPageUrl) {
  // note: no “?format=json” here — we POST to the /jobs path directly
  const resp = await fetch(
    `${careerPageUrl}/wday/cxs/keybank/External_Career_Site/jobs`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Workday sometimes wants these:
        'Accept':           'application/json',
        'Accept-Encoding':  'gzip, deflate, br',
      },
      body: JSON.stringify({
        limit:      100,
        offset:     0,
        searchText: ''
      })
    }
  )

  // now parse real JSON
  const json = await resp.json()
  // StackOverflow confirms this endpoint returns jobs via POST :contentReference[oaicite:0]{index=0}
  return json.jobs.map(j => ({
    job_id:      j.id,
    title:       j.title,
    company:     j.organization?.name || '',
    location:    (j.locations || []).map(l => l.name).join(', '),
    url:         `${careerPageUrl}${j.absoluteUrl}`,
    date_posted: j.postDate,
  }))
}
