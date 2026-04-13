import { getAIProvider } from '../ai/provider.ts'
import type { ParsedCvResponse } from '../../types/cv-types.ts'
import { nanoid } from 'nanoid'

// ─────────────────────────────────────────────────────────────
// Takes raw text extracted from PDF/DOCX and uses AI to
// return a structured CvFormData-compatible JSON object.
// ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are a professional CV parser. Your only job is to extract structured data from raw CV text.

You MUST respond with a single valid JSON object — nothing else. No markdown, no explanation, no backticks.

The JSON must follow this exact schema:
{
  "fullName": "string",
  "jobTitle": "string",
  "summary": "string",
  "emailFromCv": "string (email found in CV or empty string)",
  "contact": {
    "phone": "string",
    "email": "string",
    "city": "string",
    "linkedin": "string (full URL or empty)",
    "portfolio": "string (URL or empty)"
  },
  "experience": [
    {
      "id": "generated",
      "position": "string",
      "company": "string",
      "period": {
        "startYear": "string (YYYY or empty)",
        "startMonth": "string (Month name in Spanish or empty)",
        "endYear": "string (YYYY or empty, empty if present)",
        "endMonth": "string (Month name in Spanish or empty, empty if present)"
      },
      "city": "string",
      "country": "string",
      "modality": "presencial | hibrido | remoto | (empty string if unknown)",
      "tasks": "string (bullet points separated by newlines)",
      "skills": ["string"]
    }
  ],
  "education": [
    {
      "id": "generated",
      "institution": "string",
      "degree": "string",
      "startYear": "string",
      "startMonth": "string",
      "endYear": "string",
      "endMonth": "string"
    }
  ],
  "certifications": [
    {
      "id": "generated",
      "title": "string",
      "issuedBy": "string",
      "obtainedYear": "string",
      "obtainedMonth": "string",
      "expiresYear": "string",
      "expiresMonth": "string"
    }
  ],
  "languages": [
    {
      "id": "generated",
      "name": "string",
      "level": "principiante | intermedio | profesional | nativo"
    }
  ]
}

Rules:
- Generate a unique short ID for each experience, education, certification, and language item.
- Month names must be in Spanish (Enero, Febrero, etc.)
- If a field is not found in the CV, use an empty string — never null.
- For arrays, return empty arrays [] if no data is found.
- The "tasks" field should preserve bullet structure if present.
- Do NOT invent data. Only extract what is explicitly present.
`.trim()

export async function structureCvText(rawText: string): Promise<ParsedCvResponse> {
  const ai = getAIProvider()

  const userMessage = `Extract structured CV data from the following raw text:\n\n---\n${rawText}\n---`

  const raw = await ai.chat(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userMessage },
    ],
    2500
  )

  // Strip any accidental markdown fences the model might add
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  let parsed: ParsedCvResponse
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('[structureCvText] AI returned invalid JSON:', cleaned.slice(0, 300))
    throw new Error('El modelo de IA devolvió una respuesta no válida. Intenta de nuevo.')
  }

  // Ensure all array items have IDs (fallback if model forgot)
  parsed.experience     = (parsed.experience     ?? []).map((e) => ({ ...e, id: e.id || nanoid() }))
  parsed.education      = (parsed.education      ?? []).map((e) => ({ ...e, id: e.id || nanoid() }))
  parsed.certifications = (parsed.certifications ?? []).map((c) => ({ ...c, id: c.id || nanoid() }))
  parsed.languages      = (parsed.languages      ?? []).map((l) => ({ ...l, id: l.id || nanoid() }))

  return parsed
}
