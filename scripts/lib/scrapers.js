// scripts/lib/scrapers.js

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * Scrape jobs from a Workday career page via POST with jobPostings.
 * @param {string} endpointUrl - full POST endpoint, e.g., .../jobs
 * @returns {Promise<Array<{job_id:string,title:string,company:string,location:string,url:string,date_posted:string}>>}
 */
export async function scrapeWorkday(endpointUrl) {
  const resp = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ limit: 100, offset: 0, searchText: '' })
  });
  const json = await resp.json();
  const postings = json.jobPostings || [];
  return postings.map(p => ({
    job_id:      (Array.isArray(p.bulletFields) && p.bulletFields[0]) ? p.bulletFields[0] : p.externalPath,
    title:       p.title,
    company:     '',  // you can set this to site.name if desired
    location:    p.locationsText,
    url:         p.externalPath,  // adjust base URL if needed
    date_posted: p.postedOn
  }));
}

/**
 * Scrape jobs from a generic HTML listing page using cheerio.
 * @param {string} url
 * @returns {Promise<Array<{job_id,title,company,location,url,date_posted}>>}
 */
export async function scrapeHTML(url) {
  const resp = await fetch(url);
  const html = await resp.text();
  const $ = cheerio.load(html);
  const jobs = [];

  // Customize these selectors for your target site
  $('.job-listing').each((_, el) => {
    const $el = $(el);
    const title = $el.find('.job-title').text().trim();
    const link = $el.find('a').attr('href') || '';
    const jobUrl = link.startsWith('http') ? link : new URL(link, url).href;
    const jobId = $el.attr('data-id') || jobUrl;
    const company = $el.find('.company-name').text().trim();
    const location = $el.find('.location').text().trim();
    const dateText = $el.find('.date-posted').text().trim();

    jobs.push({
      job_id:      jobId,
      title,
      company,
      location,
      url:         jobUrl,
      date_posted: dateText
    });
  });

  return jobs;
}
