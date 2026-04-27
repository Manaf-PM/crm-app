import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { zValidator } from '@hono/zod-validator'
import { eq, and, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client.js'
import { clients, notificationTemplates, emailLogs, smsLogs } from '../db/schema.js'
import { sendEmail } from '../services/email.service.js'
import { sendSms } from '../services/sms.service.js'

export const campaignsRouter = new Hono<AppEnv>()

const SendCampaignSchema = z.object({
  templateId: z.string().uuid(),
  clientIds: z.array(z.string().uuid()).min(1, 'Sélectionne au moins un destinataire'),
})

// POST /campaigns/send — envoie une campagne
campaignsRouter.post('/send', zValidator('json', SendCampaignSchema), async (c) => {
  const user = c.get('user')
  const { templateId, clientIds } = c.req.valid('json')

  // Récupérer le template (vérifie qu'il appartient à l'utilisateur)
  const [template] = await db
    .select()
    .from(notificationTemplates)
    .where(and(
      eq(notificationTemplates.id, templateId),
      eq(notificationTemplates.userId, user.uid)
    ))
    .limit(1)

  if (!template) {
    return c.json({ error: 'Template introuvable' }, 404)
  }

  // Récupérer les clients sélectionnés (vérifie qu'ils appartiennent à l'utilisateur)
  const selectedClients = await db
    .select()
    .from(clients)
    .where(and(
      inArray(clients.id, clientIds),
      eq(clients.userId, user.uid)
    ))

  if (selectedClients.length === 0) {
    return c.json({ error: 'Aucun client trouvé' }, 404)
  }

  // Résultats
  const results = { sent: 0, failed: 0, skipped: 0, errors: [] as string[] }

  for (const client of selectedClients) {
    // Remplace les variables dans le body et le subject
    const body = replaceVariables(template.body, client)
    const subject = template.subject ? replaceVariables(template.subject, client) : ''

    try {
      if (template.type === 'email') {
        if (!client.consentementEmail) {
          results.skipped++
          continue
        }
        await sendEmail({
          clientId: client.id,
          to: client.email,
          subject,
          html: body.replace(/\n/g, '<br>'),
          reason: template.reason,
        })
        results.sent++
      } else if (template.type === 'sms') {
        if (!client.consentementSms || !client.telephone) {
          results.skipped++
          continue
        }
        await sendSms({
          clientId: client.id,
          to: client.telephone,
          message: body,
          reason: template.reason,
        })
        results.sent++
      }
    } catch (err) {
      results.failed++
      results.errors.push(`${client.prenom} ${client.nom} : ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    }
  }

  return c.json({
    success: true,
    template: template.nom,
    total: selectedClients.length,
    ...results,
  })
})


// GET /campaigns/logs — historique des envois
campaignsRouter.get('/logs', async (c) => {
  const user = c.get('user')

  const emails = await db
    .select()
    .from(emailLogs)
    .innerJoin(clients, eq(emailLogs.clientId, clients.id))
    .where(eq(clients.userId, user.uid))
    .orderBy(emailLogs.createdAt)
    .limit(100)

  return c.json(emails)
})

// ── Utilitaire ─────────────────────────────────────────────────────────────

function replaceVariables(text: string, client: { prenom: string; nom: string; email: string }): string {
  return text
    .replace(/{{prenom}}/g, client.prenom)
    .replace(/{{nom}}/g, client.nom)
    .replace(/{{email}}/g, client.email)
}