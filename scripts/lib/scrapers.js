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
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({}),
  }

  // initial request
  let resp = await fetch(endpointUrl, commonOpts)
  console.log(`🔄 Response status: ${resp.status}`)

  // retry with trailing slash if needed
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
  const batch = Array.isArray(json.jobPostings) ? json.jobPostings : []
  console.log(`🔄 Found total=${total}, first batch length=${batch.length}`)

  // page through the rest
  let all = batch.slice()
  let offset = batch.length
  while (offset < total) {
    console.log(`🔄 Fetching offset ${offset}`)
    const pagedResp = await fetch(endpointUrl, {
      ...commonOpts,
      body: JSON.stringify({ offset })
    })
    const pageJson = await pagedResp.json()
    const pageBatch = Array.isArray(pageJson.jobPostings) ? pageJson.jobPostings : []
    console.log(`🔄   got ${pageBatch.length} more`)
    if (!pageBatch.length) break
    all = all.concat(pageBatch)
    offset += pageBatch.length
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
 * Scrape jobs from a generic HTML listing page using Cheerio.
 * @param {string} url
 * @param {string} companyName
 * @param {string} baseUrl
 */
export async function scrapeHTML(url, companyName, baseUrl) {
  console.log(`🔄 scrapeHTML: GET ${url}`)
  const resp = await fetch(url)
  console.log(`🔄 scrapeHTML Response status: ${resp.status}`)
  const html = await resp.text()
  const $ = cheerio.load(html)
  const jobs = []

  $('.job-listing').each((_, el) => {
    const $el      = $(el)
    const title    = $el.find('.job-title').text().trim()
    const link     = $el.find('a').attr('href') || ''
    const path     = link.startsWith('http') ? link : new URL(link, url).pathname
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

  console.log(`🔄 scrapeHTML: Found ${jobs.length} entries`)
  return jobs
}

/** 
 * Convert "Posted X Days Ago" (including "30+ Days Ago") into a YYYY-MM-DD date.
 * Falls back to today if unparsable.
 */
function parsePostedDate(text) {
  const match = text.match(/(\d+)\+?\s+Day/)
  if (match) {
    const days = parseInt(match[1], 10)
    const d = new Date()
    d.setDate(d.getDate() - days)
    return d.toISOString().split('T')[0]
  }
  // fallback: use today
  return new Date().toISOString().split('T')[0]
}
