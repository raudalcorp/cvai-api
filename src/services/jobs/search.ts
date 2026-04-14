// src/services/jobs/search.ts
// Orchestrates job search across providers with fallback chain.
// Order: Adzuna → JSearch → Remotive
// If a provider fails or returns 0 results, the next one is tried.

import { AdzunaProvider }   from './providers/adzuna'
import { JSearchProvider }  from './providers/jsearch'
import { RemotiveProvider } from './providers/remotive'
import type { JobSearchParams, JobSearchResult, JobProvider } from './types'

// Build the provider chain based on which keys are configured
function buildProviderChain(): JobProvider[] {
  const chain: JobProvider[] = []

  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
    chain.push(new AdzunaProvider())
  }
  if (process.env.JSEARCH_RAPIDAPI_KEY) {
    chain.push(new JSearchProvider())
  }
  // Remotive is always available — no key required
  chain.push(new RemotiveProvider())

  return chain
}

export async function searchJobs(params: JobSearchParams): Promise<JobSearchResult> {
  const providers = buildProviderChain()
  const errors: string[] = []

  for (const provider of providers) {
    try {
      console.log(`[jobs/search] Trying ${provider.name}...`)
      const result = await provider.search(params)

      if (result.jobs.length > 0) {
        console.log(`[jobs/search] ${provider.name} returned ${result.jobs.length} results`)
        return result
      }

      console.log(`[jobs/search] ${provider.name} returned 0 results, trying next...`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[jobs/search] ${provider.name} failed: ${msg}`)
      errors.push(`${provider.name}: ${msg}`)
    }
  }

  // All providers failed or returned nothing
  console.error('[jobs/search] All providers failed:', errors)
  return { jobs: [], total: 0, source: 'none', page: params.page ?? 1 }
}
