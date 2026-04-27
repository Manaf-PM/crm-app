import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { clients } from '../db/schema.js'
import { ClientCreateSchema, ClientUpdateSchema, ClientIdSchema } from '../../../shared/src/schemas/client.schema.js'

export const clientsRouter = new Hono()

// GET /clients — liste tous les clients
clientsRouter.get('/', async (c) => {
  const rows = await db.select().from(clients).orderBy(clients.nom)
  return c.json(rows)
})

// GET /clients/:id — un client
clientsRouter.get(
  '/:id',
  zValidator('param', ClientIdSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id))
      .limit(1)
    if (!client) return c.json({ error: 'Client introuvable' }, 404)
    return c.json(client)
  }
)

// POST /clients — créer un client
clientsRouter.post(
  '/',
  zValidator('json', ClientCreateSchema),
  async (c) => {
    const data = c.req.valid('json')
    const [created] = await db.insert(clients).values(data).returning()
    return c.json(created, 201)
  }
)

// PATCH /clients/:id — modifier un client
clientsRouter.patch(
  '/:id',
  zValidator('param', ClientIdSchema),
  zValidator('json', ClientUpdateSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')
    const [updated] = await db
      .update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning()
    if (!updated) return c.json({ error: 'Client introuvable' }, 404)
    return c.json(updated)
  }
)

// DELETE /clients/:id — supprimer un client (RGPD)
clientsRouter.delete(
  '/:id',
  zValidator('param', ClientIdSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const [deleted] = await db
      .delete(clients)
      .where(eq(clients.id, id))
      .returning()
    if (!deleted) return c.json({ error: 'Client introuvable' }, 404)
    return c.json({ success: true })
  }
)
