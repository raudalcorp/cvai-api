// src/services/jobs/providers/adzuna.ts
// Adzuna API — 250 requests/day free.
// Docs: https://developer.adzuna.com/docs/search
// Env vars: ADZUNA_APP_ID, ADZUNA_APP_KEY

import type { JobProvider, JobSearchParams, JobSearchResult, JobListing } from '../types'

// Maps common country names/codes to Adzuna's country codes
const COUNTRY_MAP: Record<string, string> = {
  hn: 'mx',   // Honduras → use Mexico (closest with Adzuna coverage)
  mx: 'mx',
  us: 'us',
  gb: 'gb',
  ca: 'ca',
  au: 'au',
  de: 'de',
  default: 'us',
}

export class AdzunaProvider implements JobProvider {
  name = 'Adzuna'

  async search(params: JobSearchParams): Promise<JobSearchResult> {
    const appId  = process.env.ADZUNA_APP_ID
    const appKey = process.env.ADZUNA_APP_KEY

    if (!appId || !appKey) throw new Error('Adzuna credentials not configured.')

    const country  = COUNTRY_MAP[params.country?.toLowerCase() ?? 'default'] ?? COUNTRY_MAP.default
    const page     = params.page    ?? 1
    const perPage  = params.perPage ?? 10

    const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`)
    url.searchParams.set('app_id',         appId)
    url.searchParams.set('app_key',        appKey)
    url.searchParams.set('results_per_page', String(perPage))
    url.searchParams.set('what',           params.query)
    url.searchParams.set('content-type',   'application/json')
    if (params.location) url.searchParams.set('where', params.location)

    const res  = await fetch(url.toString())
    if (!res.ok) throw new Error(`Adzuna error: ${res.status}`)
    const data = await res.json() as AdzunaResponse

    const jobs: JobListing[] = (data.results ?? []).map((r) => ({
      id:          `adzuna-${r.id}`,
      title:       r.title,
      company:     r.company?.display_name ?? 'Empresa desconocida',
      location:    r.location?.display_name ?? '',
      description: r.description ?? '',
      url:         r.redirect_url,
      salary:      r.salary_min
        ? `$${Math.round(r.salary_min).toLocaleString()} – $${Math.round(r.salary_max).toLocaleString()}`
        : undefined,
      postedAt:    r.created,
      remote:      /remote|remoto/i.test(r.title + r.description),
      source:      'adzuna',
    }))

    return { jobs, total: data.count ?? 0, source: 'Adzuna', page }
  }
}

// ── Adzuna API types ──────────────────────────────
interface AdzunaResponse {
  count: number
  results: Array<{
    id: string
    title: string
    description: string
    created: string
    redirect_url: string
    salary_min: number
    salary_max: number
    company: { display_name: string }
    location: { display_name: string }
  }>
}
