// scripts/lib/scrapers.js

import fetch from 'node-fetch'
import cheerio from 'cheerio'

/**
 * Scrape jobs from a Workday career page.
 * @param {string} careerPageUrl
 * @returns {Promise<Array<{job_id:string, title:string, company:string, location:string, url:string, date_posted:string}>>}
 */
export async function scrapeWorkday(careerPageUrl) {
  const resp = await fetch(`${careerPageUrl}/jobs?format=json`)
  const json = await resp.json()
  return json.jobs.map(j => ({
    job_id: j.id,
    title: j.title,
    company: j.organization?.name || '',
    location: (j.locations || []).map(l => l.name).join(', '),
    url: `${careerPageUrl}${j.absoluteUrl}`,
    date_posted: j.postDate
  }))
}

/**
 * Scrape jobs from a generic HTML job-listing page.
 * @param {string} url
 * @returns {Promise<Array<{job_id:string, title:string, company:string, location:string, url:string, date_posted:string}>>}
 */
export async function scrapeHTML(url) {
  const resp = await fetch(url)
  const html = await resp.text()
  const $ = cheerio.load(html)
  const jobs = []

  // *** Customize these selectors to match your target site’s markup ***
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
      job_id: jobId,
      title,
      company,
      location,
      url: jobUrl,
      date_posted: dateText
    })
  })

  return jobs
}
