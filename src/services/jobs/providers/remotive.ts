// src/services/jobs/providers/remotive.ts
// Remotive API — fully free, no API key required.
// Only returns remote jobs — used as last fallback.
// Docs: https://remotive.com/api/remote-jobs

import type { JobProvider, JobSearchParams, JobSearchResult, JobListing } from '../types'

export class RemotiveProvider implements JobProvider {
  name = 'Remotive'

  async search(params: JobSearchParams): Promise<JobSearchResult> {
    const url = new URL('https://remotive.com/api/remote-jobs')
    url.searchParams.set('search', params.query)
    url.searchParams.set('limit',  String(params.perPage ?? 10))

    const res  = await fetch(url.toString())
    if (!res.ok) throw new Error(`Remotive error: ${res.status}`)
    const data = await res.json() as RemotiveResponse

    const jobs: JobListing[] = (data.jobs ?? []).map((r) => ({
      id:          `remotive-${r.id}`,
      title:       r.title,
      company:     r.company_name,
      location:    r.candidate_required_location || 'Worldwide',
      description: r.description ?? '',
      url:         r.url,
      salary:      r.salary || undefined,
      postedAt:    r.publication_date,
      remote:      true,
      source:      'remotive',
    }))

    return { jobs, total: data['job-count'] ?? 0, source: 'Remotive', page: 1 }
  }
}

interface RemotiveResponse {
  'job-count': number
  jobs: Array<{
    id: number
    url: string
    title: string
    company_name: string
    candidate_required_location: string
    description: string
    salary: string
    publication_date: string
  }>
}
