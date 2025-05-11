// scripts/lib/scrapers.js

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

/**
 * Scrape jobs from a Workday career page via POST, with debug, retry, and pagination logic.
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

  // Helper to POST and parse JSON, with retry logic
  async function postFetch(options, url) {
    let response = await fetch(url, options)
    console.log(`🔄 POST ${url} status: ${response.status}`)
    if (response.status === 400) {
      const retryUrl = url.endsWith('/') ? url : `${url}/`
      console.warn(`⚠️ Received 400, retrying with trailing slash: ${retryUrl}`)
      response = await fetch(retryUrl, options)
      console.log(`🔄 Retry status: ${response.status}`)
    }
    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch (err) {
      console.error(`❌ Failed to parse JSON. Response starts: ${text.slice(0, 200)}`)
      throw err
    }
    return data
  }

  // First fetch
  const json = await postFetch(requestOptions, endpointUrl)
  if (json.errorCode) {
    console.error('❌ Workday error response:', json)
    return []
  }
  console.log(`🔄 JSON keys: ${Object.keys(json).join(', ')}`)

  const total = typeof json.total === 'number' ? json.total : null
  let postings = Array.isArray(json.jobPostings) ? json.jobPostings : []
  console.log(`🔄 Found ${postings.length} of ${total ?? postings.length} jobPostings entries`)

  // If more pages exist, fetch all in one go (using total as limit)
  if (total && postings.length < total) {
    console.log(`🔄 Fetching all jobs with limit ${total}`)
    const fullOptions = { ...requestOptions, body: JSON.stringify({ limit: total, offset: 0, searchText: '' }) }
    const fullJson = await postFetch(fullOptions, endpointUrl)
    postings = Array.isArray(fullJson.jobPostings) ? fullJson.jobPostings : postings
    console.log(`🔄 After full fetch, entries: ${postings.length}`)
  }

  // Derive company from hostname (text between https:// and first dot)
  let companyName = ''
  try {
    companyName = new URL(endpointUrl).hostname.split('.')[0]
  } catch (_) {}

  return postings.map(p => {
    // Convert "Posted X Days Ago" to YYYY-MM-DD
    let datePosted = null
    const rel = p.postedOn || ''
    const match = rel.match(/Posted\s+(\d+)\s+Days?\s+Ago/i)
    if (match) {
      const days = parseInt(match[1], 10)
      const d = new Date()
      d.setDate(d.getDate() - days)
      datePosted = d.toISOString().split('T')[0]
    }

    return {
      job_id:      Array.isArray(p.bulletFields) && p.bulletFields[0] ? p.bulletFields[0] : p.externalPath,
      title:       p.title,
      company:     companyName,
      location:    p.locationsText,
      url:         p.externalPath,
      date_posted: datePosted,
    }
  })
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

  // Derive company from URL hostname
  let companyName = ''
  try {
    companyName = new URL(url).hostname.split('.')[0]
  } catch (_) {}

  $('.job-listing').each((_, el) => {
    const $el = $(el)
    const title = $el.find('.job-title').text().trim()
    const link = $el.find('a').attr('href') || ''
    const jobUrl = link.startsWith('http') ? link : new URL(link, url).href
    const jobId = $el.attr('data-id') || jobUrl
    const location = $el.find('.location').text().trim()
    const dateText = $el.find('.date-posted').text().trim()

    jobs.push({
      job_id:      jobId,
      title,
      company:     companyName,
      location,
      url:         jobUrl,
      date_posted: dateText,
    })
  })

  console.log(`🔄 scrapeHTML: Found ${jobs.length} entries`)
  return jobs
}
