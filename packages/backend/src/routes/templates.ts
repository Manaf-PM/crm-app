import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { zValidator } from '@hono/zod-validator'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client.js'
import { notificationTemplates } from '../db/schema.js'

export const templatesRouter = new Hono<AppEnv>()

const TemplateCreateSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100),
  type: z.enum(['email', 'sms']),
  reason: z.enum(['anniversaire', 'periodique', 'manuel']),
  subject: z.string().max(255).optional(),
  body: z.string().min(1, 'Le corps du message est requis'),
})

const TemplateUpdateSchema = TemplateCreateSchema.partial()

const IdSchema = z.object({ id: z.string().uuid() })

// GET /templates
templatesRouter.get('/', async (c) => {
  const user = c.get('user')
  const rows = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.userId, user.uid))
    .orderBy(notificationTemplates.nom)
  return c.json(rows)
})

// GET /templates/:id
templatesRouter.get('/:id', zValidator('param', IdSchema), async (c) => {
  const user = c.get('user')
  const { id } = c.req.valid('param')
  const [template] = await db
    .select()
    .from(notificationTemplates)
    .where(and(
      eq(notificationTemplates.id, id),
      eq(notificationTemplates.userId, user.uid)
    ))
    .limit(1)
  if (!template) return c.json({ error: 'Template introuvable' }, 404)
  return c.json(template)
})

// POST /templates
templatesRouter.post('/', zValidator('json', TemplateCreateSchema), async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')
  if (data.type === 'email' && !data.subject) {
    return c.json({ error: 'Le sujet est requis pour un template email' }, 400)
  }
  const [created] = await db
    .insert(notificationTemplates)
    .values({ ...data, userId: user.uid })
    .returning()
  return c.json(created, 201)
})

// PATCH /templates/:id
templatesRouter.patch(
  '/:id',
  zValidator('param', IdSchema),
  zValidator('json', TemplateUpdateSchema),
  async (c) => {
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')
    const [updated] = await db
      .update(notificationTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(notificationTemplates.id, id),
        eq(notificationTemplates.userId, user.uid)
      ))
      .returning()
    if (!updated) return c.json({ error: 'Template introuvable' }, 404)
    return c.json(updated)
  }
)

// DELETE /templates/:id
templatesRouter.delete('/:id', zValidator('param', IdSchema), async (c) => {
  const user = c.get('user')
  const { id } = c.req.valid('param')
  const [deleted] = await db
    .delete(notificationTemplates)
    .where(and(
      eq(notificationTemplates.id, id),
      eq(notificationTemplates.userId, user.uid)
    ))
    .returning()
  if (!deleted) return c.json({ error: 'Template introuvable' }, 404)
  return c.json({ success: true })
})