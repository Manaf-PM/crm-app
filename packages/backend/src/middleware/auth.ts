import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '../types.js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Initialisation Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = JSON.parse(
    readFileSync(resolve('./firebase-service-account.json'), 'utf-8')
  )
  initializeApp({ credential: cert(serviceAccount) })
}

export const firebaseAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Non authentifié' }, 401)
  }
  const token = authHeader.slice(7)
  try {
    const decoded = await getAuth().verifyIdToken(token)
    c.set('user', decoded)
    await next()
  } catch {
    return c.json({ error: 'Token invalide' }, 401)
  }
}
