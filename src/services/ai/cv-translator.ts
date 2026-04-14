// src/services/ai/cv-translator.ts
// Translates a full CvFormData from one language to another.
// Uses the same provider adapter as cv-structurer — works with
// Azure OpenAI, OpenAI direct, or Anthropic.

import { getAIProvider } from './provider'
import type { CvFormData } from '../../types/cv-types'

type SupportedLang = 'es' | 'en'

const LANG_NAMES: Record<SupportedLang, string> = {
  es: 'Spanish',
  en: 'English',
}

// Fields that must NOT be translated (proper nouns, URLs, etc.)
const SYSTEM_PROMPT = (targetLang: string) => `
You are a professional CV translator. Translate the provided JSON CV data to ${targetLang}.

Rules:
- Return ONLY a valid JSON object — no markdown, no explanation, no backticks.
- Translate text fields: fullName (do NOT translate names), jobTitle, summary, 
  experience[].position, experience[].tasks, education[].degree, 
  certifications[].title, languages[].name.
- Do NOT translate: company names, institution names, city names, country names,
  URLs (linkedin, portfolio), emails, phone numbers, skill names, 
  date fields (keep as-is), IDs (keep as-is).
- Language level values must use these exact strings in the target language:
  For English: "beginner" | "intermediate" | "professional" | "native"
  For Spanish: "principiante" | "intermedio" | "profesional" | "nativo"
- Preserve the exact JSON structure — same keys, same array lengths.
`.trim()

export async function translateCv(
  cvData: CvFormData,
  from: SupportedLang,
  to: SupportedLang
): Promise<CvFormData> {
  if (from === to) return cvData

  const ai = getAIProvider()

  const userMessage =
    `Translate this CV JSON from ${LANG_NAMES[from]} to ${LANG_NAMES[to]}:\n\n` +
    JSON.stringify(cvData, null, 2)

  const raw = await ai.chat(
    [
      { role: 'system', content: SYSTEM_PROMPT(LANG_NAMES[to]) },
      { role: 'user',   content: userMessage },
    ],
    3000 // CV data can be large — allow enough tokens
  )

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  let translated: CvFormData
  try {
    translated = JSON.parse(cleaned)
  } catch {
    console.error('[translateCv] AI returned invalid JSON:', cleaned.slice(0, 300))
    throw new Error('El modelo de IA devolvió una respuesta no válida. Intenta de nuevo.')
  }

  return translated
}
