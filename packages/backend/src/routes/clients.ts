import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { zValidator } from '@hono/zod-validator'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/client.js'
import { clients } from '../db/schema.js'
import {
  ClientCreateSchema,
  ClientUpdateSchema,
  ClientIdSchema,
} from '@crm/shared/schemas/client.schema.js'

export const clientsRouter = new Hono<AppEnv>()

// GET /clients — uniquement les clients de l'utilisateur connecté
clientsRouter.get('/', async (c) => {
  const user = c.get('user')
  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, user.uid))
    .orderBy(clients.nom)
  return c.json(rows)
})

// GET /clients/:id
clientsRouter.get('/:id', zValidator('param', ClientIdSchema), async (c) => {
  const user = c.get('user')
  const { id } = c.req.valid('param')
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, user.uid)))
    .limit(1)
  if (!client) return c.json({ error: 'Client introuvable' }, 404)
  return c.json(client)
})

// POST /clients — userId automatiquement rempli
clientsRouter.post('/', zValidator('json', ClientCreateSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')
  const [created] = await db
    .insert(clients)
    .values({ ...data, userId: user.uid })
    .returning()
  return c.json(created, 201)
})

// PATCH /clients/:id
clientsRouter.patch(
  '/:id',
  zValidator('param', ClientIdSchema),
  zValidator('json', ClientUpdateSchema),
  async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')
    const [updated] = await db
      .update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.userId, user.uid)))
      .returning()
    if (!updated) return c.json({ error: 'Client introuvable' }, 404)
    return c.json(updated)
  }
)

// DELETE /clients/:id
clientsRouter.delete('/:id', zValidator('param', ClientIdSchema), async (c) => {
  const user = c.get('user')
  const { id } = c.req.valid('param')
  const [deleted] = await db
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, user.uid)))
    .returning()
  if (!deleted) return c.json({ error: 'Client introuvable' }, 404)
  return c.json({ success: true })
})