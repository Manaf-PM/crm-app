import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { eq, and, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { clients, notificationTemplates } from '../db/schema.js'
import { sendEmail } from '../services/email.service.js'
import { sendSms } from '../services/sms.service.js'

export const jobsRouter = new Hono<AppEnv>()

// POST /jobs/birthday — déclenché par Cloud Scheduler chaque matin
// En dev : appel manuel depuis l'interface
jobsRouter.post('/birthday', async (c) => {
  const user = c.get('user')

  // Trouve le template anniversaire de l'utilisateur
  const [template] = await db
    .select()
    .from(notificationTemplates)
    .where(and(
      eq(notificationTemplates.userId, user.uid),
      eq(notificationTemplates.reason, 'anniversaire')
    ))
    .limit(1)

  if (!template) {
    return c.json({ error: 'Aucun template anniversaire trouvé. Crée un template avec l\'usage "Anniversaire".' }, 404)
  }

  // Trouve les clients dont c'est l'anniversaire aujourd'hui
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()

  const birthdayClients = await db
    .select()
    .from(clients)
    .where(and(
      eq(clients.userId, user.uid),
      sql`EXTRACT(MONTH FROM ${clients.dateNaissance}) = ${month}`,
      sql`EXTRACT(DAY FROM ${clients.dateNaissance}) = ${day}`
    ))

  if (birthdayClients.length === 0) {
    return c.json({ message: 'Aucun anniversaire aujourd\'hui.', sent: 0 })
  }

  const results = { sent: 0, failed: 0, skipped: 0, clients: [] as string[] }

  for (const client of birthdayClients) {
    const body = replaceVariables(template.body, client)
    const subject = template.subject ? replaceVariables(template.subject, client) : ''

    try {
      if (template.type === 'email') {
        if (!client.consentementEmail) { results.skipped++; continue }
        await sendEmail({
          clientId: client.id,
          to: client.email,
          subject,
          html: body.replace(/\n/g, '<br>'),
          reason: 'anniversaire',
        })
      } else {
        if (!client.consentementSms || !client.telephone) { results.skipped++; continue }
        await sendSms({
          clientId: client.id,
          to: client.telephone,
          message: body,
          reason: 'anniversaire',
        })
      }
      results.sent++
      results.clients.push(`${client.prenom} ${client.nom}`)
    } catch {
      results.failed++
    }
  }

  return c.json({
    message: `${results.sent} message(s) d'anniversaire envoyé(s)`,
    ...results,
  })
})

function replaceVariables(text: string, client: { prenom: string; nom: string; email: string }): string {
  return text
    .replace(/{{prenom}}/g, client.prenom)
    .replace(/{{nom}}/g, client.nom)
    .replace(/{{email}}/g, client.email)
}