// scripts/lib/scrapers.js

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

/**
 * Scrape all jobs from a Workday career page via POST, paging through total count.
 * @param {string} endpointUrl – the /jobs POST endpoint
 * @param {string} companyName – from sites.name
 * @param {string} baseUrl – prefix to prepend to each partial job URL
 */
export async function scrapeWorkday(endpointUrl, companyName, baseUrl) {
  console.log(`🔄 scrapeWorkday: POST to ${endpointUrl}`)
  const commonOpts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({}),
  }

  let resp = await fetch(endpointUrl, commonOpts)
  console.log(`🔄 Response status: ${resp.status}`)

  if (resp.status === 400) {
    const retryUrl = endpointUrl.endsWith('/') ? endpointUrl : `${endpointUrl}/`
    console.warn(`⚠️ Received 400, retrying with trailing slash: ${retryUrl}`)
    resp = await fetch(retryUrl, commonOpts)
    console.log(`🔄 Retry response status: ${resp.status}`)
  }

  const json = await resp.json()
  if (json.errorCode) {
    console.error('❌ Workday error response:', json)
    return []
  }

  const total = json.total || 0
  const initial = Array.isArray(json.jobPostings) ? json.jobPostings : []
  console.log(`🔄 Found total=${total}, first batch length=${initial.length}`)

  let all = initial.slice()
  let offset = initial.length

  while (offset < total) {
    console.log(`🔄 Fetching offset ${offset}`)
    const pageResp = await fetch(endpointUrl, {
      ...commonOpts,
      body: JSON.stringify({ offset })
    })
    const pageJson = await pageResp.json()
    const batch = Array.isArray(pageJson.jobPostings) ? pageJson.jobPostings : []
    console.log(`🔄   got ${batch.length} more`)
    if (!batch.length) break
    all = all.concat(batch)
    offset += batch.length
  }
  console.log(`🔄 scrapeWorkday: totaling ${all.length} postings`)

  return all.map(p => ({
    job_id:      Array.isArray(p.bulletFields) && p.bulletFields[0] ? p.bulletFields[0] : p.externalPath,
    title:       p.title,
    company:     companyName,
    location:    p.locationsText,
    url:         `${baseUrl}${p.externalPath}`,
    date_posted: parsePostedDate(p.postedOn),
  }))
}


/**
 * Scrape all jobs from a Greenhouse board via its public JSON API.
 * @param {string} apiUrl – e.g. https://boards-api.greenhouse.io/v1/boards/marqeta/jobs
 * @param {string} companyName – from sites.name
 */
export async function scrapeGreenhouse(apiUrl, companyName) {
  console.log(`🔄 scrapeGreenhouse: GET ${apiUrl}`)
  const resp = await fetch(apiUrl)
  if (!resp.ok) {
    console.error(`❌ Greenhouse error ${resp.status}: ${await resp.text()}`)
    return []
  }
  const { jobs } = await resp.json()
  console.log(`🔄 scrapeGreenhouse: found ${Array.isArray(jobs) ? jobs.length : 0} jobs`)

  return (jobs || []).map(p => ({
    job_id:      String(p.id),
    title:       p.title,
    company:     companyName,
    location:    p.location || (p.metadata?.location || []).join(', '),
    url:         p.absolute_url,
    date_posted: p.updated_at ? p.updated_at.split('T')[0] : null,
  }))
}


/**
 * (Optional) Scrape jobs from a generic HTML listing page using Cheerio.
 * @param {string} pageUrl – the page to GET
 * @param {string} companyName – from sites.name
 * @param {string} baseUrl – prefix for relative links
 */
export async function scrapeHTML(pageUrl, companyName, baseUrl) {
  console.log(`🔄 scrapeHTML: GET ${pageUrl}`)
  const resp = await fetch(pageUrl)
  console.log(`🔄 scrapeHTML Response status: ${resp.status}`)
  const html = await resp.text()
  const $ = cheerio.load(html)
  const jobs = []

  // Customize selectors for your target markup:
  $('.job-listing').each((_, el) => {
    const $el      = $(el)
    const title    = $el.find('.job-title').text().trim()
    const link     = $el.find('a').attr('href') || ''
    const path     = link.startsWith('http') ? link : new URL(link, pageUrl).pathname
    const jobId    = $el.attr('data-id') || path
    const location = $el.find('.location').text().trim()
    const dateText = $el.find('.date-posted').text().trim()

    jobs.push({
      job_id:      jobId,
      title,
      company:     companyName,
      location,
      url:         `${baseUrl}${path}`,
      date_posted: parsePostedDate(dateText),
    })
  })

  console.log(`🔄 scrapeHTML: found ${jobs.length} entries`)
  return jobs
}


/**
 * Helper: Converts "Posted X Days Ago" (including "30+ Days Ago") into YYYY-MM-DD.
 * Falls back to today for unrecognized formats.
 */
function parsePostedDate(text) {
  const match = text.match(/(\d+)\+?\s+Day/)
  if (match) {
    const days = parseInt(match[1], 10)
    const d = new Date()
    d.setDate(d.getDate() - days)
    return d.toISOString().split('T')[0]
  }
  // Fallback to today
  return new Date().toISOString().split('T')[0]
}
