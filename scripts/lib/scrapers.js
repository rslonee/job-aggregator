// scripts/lib/scrapers.js

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

/**
 * Scrape jobs from a Workday career page via POST, with full pagination support.
 * @param {string} endpointUrl - full POST endpoint, e.g., .../jobs
 * @param {string} companyName - human-friendly company name (from sites.name)
 */
export async function scrapeWorkday(endpointUrl, companyName) {
  console.log(`🔄 scrapeWorkday: POST to ${endpointUrl}`)
  const baseOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }

  async function postFetch(body, url) {
    let response = await fetch(url, { ...baseOptions, body })
    console.log(`🔄 POST ${url} status: ${response.status}`)
    if (response.status === 400) {
      const retryUrl = url.endsWith('/') ? url : `${url}/`
      console.warn(`⚠️ Received 400, retrying with trailing slash: ${retryUrl}`)
      response = await fetch(retryUrl, { ...baseOptions, body })
      console.log(`🔄 Retry status: ${response.status}`)
    }
    const text = await response.text()
    try {
      return JSON.parse(text)
    } catch (err) {
      console.error(`❌ Failed to parse JSON. Response start: ${text.slice(0,200)}`)
      throw err
    }
  }

  const initial = await postFetch(JSON.stringify({}), endpointUrl)
  if (initial.errorCode) {
    console.error('❌ Workday error response:', initial)
    return []
  }

  const total = typeof initial.total === 'number' ? initial.total : null
  let postings = Array.isArray(initial.jobPostings) ? initial.jobPostings : []
  console.log(`🔄 Found ${postings.length}${total ? ` of ${total}` : ''} jobPostings entries`)

  if (total && postings.length < total) {
    const pageSize = postings.length
    console.log(`🔄 Paginating: pageSize=${pageSize}, total=${total}`)
    let all = postings
    for (let offset = pageSize; offset < total; offset += pageSize) {
      console.log(`🔄 Fetch page offset ${offset}`)
      const pageBody = JSON.stringify({ limit: pageSize, offset, searchText: '' })
      const pageJson = await postFetch(pageBody, endpointUrl)
      const pagePosts = Array.isArray(pageJson.jobPostings) ? pageJson.jobPostings : []
      console.log(`🔄 Page returned ${pagePosts.length} entries`)
      all = all.concat(pagePosts)
    }
    postings = all
    console.log(`🔄 Total postings after pagination: ${postings.length}`)
  }

  return postings.map(p => {
    let datePosted = null
    const rel = p.postedOn || ''
    const m = rel.match(/Posted\s+(\d+)\s+Days?\s+Ago/i)
    if (m) {
      const days = parseInt(m[1], 10)
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
 * @param {string} companyName - human-friendly company name (from sites.name)
 */
export async function scrapeHTML(url, companyName) {
  console.log(`🔄 scrapeHTML: GET ${url}`)
  const resp = await fetch(url)
  console.log(`🔄 scrapeHTML status: ${resp.status}`)
  const html = await resp.text()
  const $ = cheerio.load(html)
  const jobs = []

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
