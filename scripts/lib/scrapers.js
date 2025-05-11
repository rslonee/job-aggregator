// scripts/lib/scrapers.js

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

/**
 * Scrape jobs from a Workday career page via POST, with debug and retry logic.
 * @param {string} endpointUrl - full POST endpoint, e.g., .../jobs
 */
export async function scrapeWorkday(endpointUrl) {
  console.log(`🔄 scrapeWorkday: POST to ${endpointUrl}`)
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({}),
  }
  // First attempt
  let resp = await fetch(endpointUrl, requestOptions)
  console.log(`🔄 Response status: ${resp.status}`)

  // Retry with trailing slash if initial 400
  if (resp.status === 400) {
    const retryUrl = endpointUrl.endsWith('/') ? endpointUrl : `${endpointUrl}/`
    console.warn(`⚠️ Received 400, retrying with trailing slash: ${retryUrl}`)
    resp = await fetch(retryUrl, requestOptions)
    console.log(`🔄 Retry response status: ${resp.status}`)
  }

  const text = await resp.text()
  let json
  try {
    json = JSON.parse(text)
  } catch (err) {
    console.error(`❌ scrapeWorkday: Failed to parse JSON. Response starts: ${text.slice(0, 200)}`)
    throw err
  }

  // Log error payload if present
  if (json.errorCode) {
    console.error('❌ Workday error response:', json)
    return []
  }

  console.log(`🔄 JSON keys: ${Object.keys(json).join(', ')}`)
  const postings = Array.isArray(json.jobPostings) ? json.jobPostings : []
  console.log(`🔄 Found ${postings.length} jobPostings entries`)

  return postings.map(p => ({
    job_id:      Array.isArray(p.bulletFields) && p.bulletFields[0] ? p.bulletFields[0] : p.externalPath,
    title:       p.title,
    company:     '',  // or set to site.name as desired
    location:    p.locationsText,
    url:         p.externalPath,
    date_posted: p.postedOn,
  }))
}

/**
 * (Optional) Scrape jobs from a generic HTML listing page using Cheerio.
 * @param {string} url
 */
export async function scrapeHTML(url) {
  console.log(`🔄 scrapeHTML: GET ${url}`)
  const resp = await fetch(url)
  console.log(`🔄 scrapeHTML Response status: ${resp.status}`)
  const html = await resp.text()
  const $ = cheerio.load(html)
  const jobs = []

  // Customize selectors for your target site
  $('.job-listing').each((_, el) => {
    const $el = $(el)
    const title = $el.find('.job-title').text().trim()
    const link = $el.find('a').attr('href') || ''
    const jobUrl = link.startsWith('http') ? link : new URL(link, url).href
    const jobId = $el.attr('data-id') || jobUrl
    const company = $el.find('.company-name').text().trim()
    const location = $el.find('.location').text().trim()
    const dateText = $el.find('.date-posted').text().trim()

    jobs.push({
      job_id:      jobId,
      title,
      company,
      location,
      url:         jobUrl,
      date_posted: dateText,
    })
  })

  console.log(`🔄 scrapeHTML: Found ${jobs.length} entries`)
  return jobs
}
