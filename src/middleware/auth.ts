import type { Request, Response, NextFunction } from 'express'

/**
 * Validates that requests come from the Next.js BFF (not from browsers directly).
 * Both Railway and Next.js must share the same INTERNAL_API_KEY env var.
 */
export function internalAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-internal-key']

  if (!key || key !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  next()
}
