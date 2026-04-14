// src/server.ts  — DROP-IN REPLACEMENT
// Only change from previous version: adds jobRoutes registration.

import 'dotenv/config'
import express from 'express'
import cors    from 'cors'
import helmet  from 'helmet'

import { internalAuth } from './middleware/auth'
import cvRoutes   from './routes/cv'
import jobRoutes  from './routes/jobs'
import { getAIProvider } from './services/ai/provider'

const app  = express()
const PORT = process.env.PORT ?? 3001

app.use(helmet())
app.use(cors({ origin: process.env.NEXTJS_ORIGIN ?? 'http://localhost:3000' }))
app.use(express.json({ limit: '2mb' })) // CV data can be sizeable

// Public health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cvai-api', timestamp: new Date().toISOString() })
})

// Protected routes
app.use('/cv',   internalAuth, cvRoutes)
app.use('/jobs', internalAuth, jobRoutes)

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Unhandled error:', err.message)
  res.status(500).json({ error: 'Error interno del servidor.' })
})

app.listen(PORT, () => {
  console.log(`[server] cvai-api running on port ${PORT}`)
  try {
    const provider = getAIProvider()
    console.log(`[server] AI provider: ${provider.name}`)
  } catch (err) {
    console.error('[server] WARNING — No AI provider configured:', (err as Error).message)
  }
})
