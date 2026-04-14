// src/services/jobs/providers/jsearch.ts
// JSearch (RapidAPI) — 200 requests/month free.
// Aggregates Indeed, LinkedIn, Glassdoor and others.
// Env vars: JSEARCH_RAPIDAPI_KEY

import type { JobProvider, JobSearchParams, JobSearchResult, JobListing } from '../types.js'

export class JSearchProvider implements JobProvider {
  name = 'JSearch'

  async search(params: JobSearchParams): Promise<JobSearchResult> {
    const apiKey = process.env.JSEARCH_RAPIDAPI_KEY
    if (!apiKey) throw new Error('JSearch API key not configured.')

    const query = [params.query, params.location].filter(Boolean).join(' in ')
    const page  = params.page   ?? 1

    const url = new URL('https://jsearch.p.rapidapi.com/search')
    url.searchParams.set('query',    query)
    url.searchParams.set('page',     String(page))
    url.searchParams.set('num_pages','1')
    if (/remote|remoto/i.test(params.query)) {
      url.searchParams.set('remote_jobs_only', 'true')
    }

    const res = await fetch(url.toString(), {
      headers: {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key':  apiKey,
      },
    })

    if (!res.ok) throw new Error(`JSearch error: ${res.status}`)
    const data = await res.json() as JSearchResponse

    const jobs: JobListing[] = (data.data ?? []).map((r) => ({
      id:          `jsearch-${r.job_id}`,
      title:       r.job_title,
      company:     r.employer_name,
      location:    [r.job_city, r.job_country].filter(Boolean).join(', '),
      description: r.job_description ?? '',
      url:         r.job_apply_link ?? r.job_google_link ?? '',
      salary:      r.job_min_salary
        ? `$${r.job_min_salary.toLocaleString()} – $${r.job_max_salary?.toLocaleString()}`
        : undefined,
      postedAt:    r.job_posted_at_datetime_utc,
      remote:      r.job_is_remote,
      source:      'jsearch',
    }))

    return { jobs, total: data.data?.length ?? 0, source: 'JSearch', page }
  }
}

interface JSearchResponse {
  data: Array<{
    job_id: string
    job_title: string
    employer_name: string
    job_city: string
    job_country: string
    job_description: string
    job_apply_link: string
    job_google_link: string
    job_min_salary: number
    job_max_salary: number
    job_posted_at_datetime_utc: string
    job_is_remote: boolean
  }>
}
