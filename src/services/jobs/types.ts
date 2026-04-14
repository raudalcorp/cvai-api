// src/services/jobs/types.ts
// Shared types for job search across all providers.

export interface JobListing {
  id: string
  title: string
  company: string
  location: string
  description: string
  url: string
  salary?: string
  postedAt?: string
  remote: boolean
  source: 'adzuna' | 'jsearch' | 'remotive'
}

export interface JobSearchParams {
  query: string        // e.g. "Software Engineer"
  location?: string    // e.g. "Honduras" or "Remote"
  country?: string     // ISO code: "hn", "us", "mx"
  page?: number
  perPage?: number
}

export interface JobSearchResult {
  jobs: JobListing[]
  total: number
  source: string
  page: number
}

export interface JobProvider {
  name: string
  search(params: JobSearchParams): Promise<JobSearchResult>
}
