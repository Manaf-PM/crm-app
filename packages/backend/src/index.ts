import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { rateLimiter } from 'hono-rate-limiter'
import type { AppEnv } from './types.js'
import { env } from './env.js'
import { clientsRouter } from './routes/clients.js'
import { firebaseAuth } from './middleware/auth.js'
import { templatesRouter } from './routes/templates.js'
import { campaignsRouter } from './routes/campaigns.js'
import { jobsRouter } from './routes/jobs.js'

const app = new Hono<AppEnv>()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: env.FRONTEND_URL,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

// Route publique
app.get('/health', (c) => c.json({ status: 'ok' }))

// Routes protégées — auth en premier, puis rate limiting par userId
app.use('/api/*', firebaseAuth)

// 100 requêtes / 15 min par utilisateur (général)
app.use(
  '/api/*',
  rateLimiter<AppEnv>({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    keyGenerator: (c) => c.get('user').uid,
    message: { error: 'Trop de requêtes, réessaie dans quelques minutes.' },
  })
)

// 10 envois / heure par utilisateur (anti-spam campagnes)
app.use(
  '/api/campaigns/send',
  rateLimiter<AppEnv>({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    keyGenerator: (c) => c.get('user').uid,
    message: { error: 'Limite d\'envoi atteinte, réessaie dans une heure.' },
  })
)

app.route('/api/clients', clientsRouter)
app.route('/api/templates', templatesRouter)
app.route('/api/campaigns', campaignsRouter)
app.route('/api/jobs', jobsRouter)

console.log(`✓ Serveur démarré sur http://localhost:${env.PORT}`)
serve({ fetch: app.fetch, port: env.PORT })
