import nodemailer from 'nodemailer'
import { eq } from 'drizzle-orm'
import { env } from '../env.js'
import { db } from '../db/client.js'
import { emailLogs } from '../db/schema.js'
import type { NotificationReason } from '@crm/shared/types/notification.js'

const transporter = nodemailer.createTransport({
  host: env.BREVO_SMTP_HOST,
  port: env.BREVO_SMTP_PORT,
  auth: {
    user: env.BREVO_SMTP_USER,
    pass: env.BREVO_SMTP_KEY,
  },
})

interface SendEmailOptions {
  clientId: string
  to: string
  subject: string
  html: string
  reason: NotificationReason
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { clientId, to, subject, html, reason } = options

  // Créer le log en base avant l'envoi
  const [log] = await db
    .insert(emailLogs)
    .values({ clientId, reason, subject, status: 'pending' })
    .returning()

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    })

    // Marquer comme envoyé
    await db
      .update(emailLogs)
      .set({ status: 'sent', sentAt: new Date() })
      .where(eq(emailLogs.id, log!.id))

  } catch (err) {
    // Marquer comme échoué
    await db
      .update(emailLogs)
      .set({
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      .where(eq(emailLogs.id, log!.id))

    throw err
  }
}
