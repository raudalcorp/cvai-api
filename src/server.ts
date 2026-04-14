import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import { internalAuth } from './middleware/auth.js'
import cvRoutes from './routes/cv.js'
import { getAIProvider } from "./services/ai/provider.js";

const app  = express()
const PORT = process.env.PORT ?? 3001

// ── Security middleware ───────────────────────────────────────
app.use(helmet())
app.use(cors({
  // Only allow requests from the Next.js BFF — not browsers directly
  origin: process.env.NEXTJS_ORIGIN ?? 'http://localhost:3000',
}))
app.use(express.json())

// ── Health check (public — Railway uses this to verify the service is alive) ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cvai-api', timestamp: new Date().toISOString() })
})

// ── Protected routes (require x-internal-key header) ─────────
app.use('/cv', internalAuth, cvRoutes)

// ── Global error handler ──────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Unhandled error:', err.message)
  res.status(500).json({ error: 'Error interno del servidor.' })
})

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] cvai-api running on port ${PORT}`)

  // Validate AI provider on startup so we fail fast if misconfigured
  try {
    const provider = getAIProvider()
    console.log(`[server] AI provider: ${provider.name}`)
  } catch (err) {
    console.error('[server] WARNING:', (err as Error).message)
    console.error('[server] Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or AZURE_OPENAI_ENDPOINT+KEY')
  }
})
