// src/routes/jobs.ts  — NEW ROUTE FILE
// Add to server.ts: app.use('/jobs', internalAuth, jobRoutes)

import { Router, Request, Response } from 'express'
import { searchJobs }      from '../services/jobs/search.js'
import { scoreJobAffinity } from '../services/jobs/affinity.js'
import type { CvFormData } from '../types/cv-types.js'

const router = Router()

// ── POST /jobs/search ─────────────────────────────────────────
// Body: {
//   query: string,          required — job title or keywords
//   location?: string,      optional
//   country?: string,       optional — ISO code
//   page?: number,
//   perPage?: number,
//   cvData?: CvFormData     optional — if provided, AI affinity scores are added
// }
router.post('/search', async (req: Request, res: Response) => {
  const {
    query, location, country, page, perPage, cvData,
  } = req.body as {
    query: string
    location?: string
    country?: string
    page?: number
    perPage?: number
    cvData?: CvFormData
  }

  const userId = req.headers['x-user-id'] as string | undefined

  if (!query?.trim()) {
    res.status(400).json({ error: 'El campo "query" es requerido.' })
    return
  }

  console.log(`[jobs/search] user=${userId} query="${query}" location="${location}"`)

  try {
    // 1. Search across providers (with fallback)
    const result = await searchJobs({ query, location, country, page, perPage })

    // 2. Score affinity if CV data was provided
    if (cvData && result.jobs.length > 0) {
      const scored = await scoreJobAffinity(result.jobs, cvData)
      res.json({ ...result, jobs: scored, hasAffinity: true })
    } else {
      res.json({ ...result, hasAffinity: false })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error en la búsqueda.'
    console.error('[jobs/search]', msg)
    res.status(500).json({ error: msg })
  }
})

export default router
