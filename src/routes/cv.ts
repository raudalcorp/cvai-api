import { generateCvPdf } from "../services/pdf/generator.js";
import { Router } from "express";
import type { Request, Response } from "express";
// src/routes/cv.ts  — DROP-IN REPLACEMENT for the existing file
import multer from 'multer'
import { extractTextFromPdf }  from '../services/parser/pdf.js'
import { extractTextFromDocx } from '../services/parser/docx.js'
import { structureCvText }     from '../services/ai/cv-structurer.js'
import { translateCv }         from '../services/ai/cv-translator.js'
import type { CvFormData }     from '../types/cv-types.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Solo PDF y DOCX.'))
  },
})

// ── POST /cv/parse ────────────────────────────────────────────
router.post('/parse', upload.single('file'), async (req: Request, res: Response) => {
  const file   = req.file
  const type   = req.body.type as 'pdf' | 'docx' | undefined
  const userId = req.headers['x-user-id'] as string | undefined

  if (!file) { res.status(400).json({ error: 'No se recibió ningún archivo.' }); return }
  if (!type || !['pdf', 'docx'].includes(type)) {
    res.status(400).json({ error: '"type" debe ser "pdf" o "docx".' }); return
  }

  console.log(`[cv/parse] user=${userId} type=${type} size=${file.size}B`)

  try {
    const rawText = type === 'pdf'
      ? await extractTextFromPdf(file.buffer)
      : await extractTextFromDocx(file.buffer)

    if (!rawText || rawText.length < 50) {
      res.status(422).json({ error: 'No se pudo extraer texto del archivo.' }); return
    }

    res.json(await structureCvText(rawText))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno.'
    console.error('[cv/parse]', msg)
    res.status(500).json({ error: msg })
  }
})

// ── POST /cv/generate-pdf ─────────────────────────────────────
router.post('/generate-pdf', async (req: Request, res: Response) => {
  const { cvData, templateId } = req.body as { cvData: CvFormData; templateId: string }
  const userId = req.headers['x-user-id'] as string | undefined

  if (!cvData || !templateId) {
    res.status(400).json({ error: 'cvData y templateId son requeridos.' }); return
  }

  console.log(`[cv/generate-pdf] user=${userId} template=${templateId}`)

  try {
    const buf = await generateCvPdf(cvData, templateId)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Length', buf.length)
    res.end(buf)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error generando el PDF.'
    console.error('[cv/generate-pdf]', msg)
    res.status(500).json({ error: msg })
  }
})

// ── POST /cv/translate ────────────────────────────────────────
// Body: { cvData: CvFormData, from: 'es'|'en', to: 'es'|'en' }
// Returns: translated CvFormData JSON
router.post('/translate', async (req: Request, res: Response) => {
  const { cvData, from, to } = req.body as {
    cvData: CvFormData
    from: 'es' | 'en'
    to:   'es' | 'en'
  }
  const userId = req.headers['x-user-id'] as string | undefined

  if (!cvData)                       { res.status(400).json({ error: 'cvData es requerido.' }); return }
  if (!from || !to)                  { res.status(400).json({ error: '"from" y "to" son requeridos.' }); return }
  if (!['es','en'].includes(from) || !['es','en'].includes(to)) {
    res.status(400).json({ error: 'Idiomas válidos: "es" y "en".' }); return
  }
  if (from === to)                   { res.json(cvData); return }

  console.log(`[cv/translate] user=${userId} ${from}→${to}`)

  try {
    const translated = await translateCv(cvData, from, to)
    res.json(translated)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error en la traducción.'
    console.error('[cv/translate]', msg)
    res.status(500).json({ error: msg })
  }
})

// ── GET /cv/health ────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default router
