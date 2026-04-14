// src/services/jobs/affinity.ts
// Uses the AI provider to score how well a job matches the user's CV.
// Returns a 0–100 score and a short justification per job.

import { getAIProvider } from '../ai/provider.js'
import type { JobListing } from './types.js'
import type { CvFormData } from '../../types/cv-types.js'

export interface JobWithAffinity extends JobListing {
  affinityScore: number   // 0–100
  affinityReason: string  // One sentence
}

const SYSTEM_PROMPT = `
You are a career matching expert. Given a user's CV summary and a list of job listings,
score each job's affinity with the profile from 0 to 100.

Respond ONLY with a valid JSON array — no markdown, no explanation.
Each item must have: { "id": string, "score": number, "reason": string }

Scoring criteria:
- 80–100: Strong match — title, skills, and experience level align closely
- 60–79:  Good match — most skills match, minor gaps
- 40–59:  Partial match — some relevant experience but notable gaps
- 0–39:   Low match — different field or seniority level

Keep "reason" to one sentence maximum.
`.trim()

export async function scoreJobAffinity(
  jobs: JobListing[],
  cvData: Pick<CvFormData, 'fullName' | 'jobTitle' | 'summary' | 'experience'>
): Promise<JobWithAffinity[]> {
  if (jobs.length === 0) return []

  const ai = getAIProvider()

  // Build a lean CV summary to keep tokens low
  const topSkills = [...new Set(cvData.experience.flatMap((e) => e.skills))].slice(0, 15)
  const cvSummary = [
    `Title: ${cvData.jobTitle}`,
    `Summary: ${cvData.summary?.slice(0, 300)}`,
    `Top skills: ${topSkills.join(', ')}`,
    `Experience roles: ${cvData.experience.map((e) => e.position).join(', ')}`,
  ].join('\n')

  // Lean job list for the prompt (avoid sending full descriptions)
  const jobsForPrompt = jobs.map((j) => ({
    id:       j.id,
    title:    j.title,
    company:  j.company,
    desc:     j.description.slice(0, 200),
  }))

  const userMessage =
    `CV Profile:\n${cvSummary}\n\nJobs to score:\n${JSON.stringify(jobsForPrompt, null, 2)}`

  try {
    const raw = await ai.chat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userMessage },
      ],
      1000
    )

    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const scores  = JSON.parse(cleaned) as Array<{ id: string; score: number; reason: string }>

    // Merge scores back into job listings
    const scoreMap = new Map(scores.map((s) => [s.id, s]))

    return jobs.map((job) => {
      const match = scoreMap.get(job.id)
      return {
        ...job,
        affinityScore:  match?.score  ?? 50,
        affinityReason: match?.reason ?? 'Sin evaluación disponible.',
      }
    }).sort((a, b) => b.affinityScore - a.affinityScore) // Highest first

  } catch (err) {
    console.warn('[affinity] AI scoring failed, returning unscored jobs:', err)
    // Graceful fallback: return jobs without scores
    return jobs.map((job) => ({
      ...job,
      affinityScore:  50,
      affinityReason: 'Puntuación no disponible.',
    }))
  }
}
