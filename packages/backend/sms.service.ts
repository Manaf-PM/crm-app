import twilio from 'twilio'
import { env } from '../env.js'
import { db } from '../db/client.js'
import { smsLogs } from '../db/schema.js'
import type { NotificationReason } from '@crm/shared'

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)

interface SendSmsOptions {
  clientId: string
  to: string
  message: string
  reason: NotificationReason
}

export async function sendSms(options: SendSmsOptions): Promise<void> {
  const { clientId, to, message, reason } = options

  const [log] = await db
    .insert(smsLogs)
    .values({ clientId, reason, message, status: 'pending' })
    .returning()

  try {
    await client.messages.create({
      from: env.TWILIO_FROM_NUMBER,
      to,
      body: message,
    })

    await db
      .update(smsLogs)
      .set({ status: 'sent', sentAt: new Date() })
      .where(({ id }) => id === log!.id)

  } catch (err) {
    await db
      .update(smsLogs)
      .set({
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      .where(({ id }) => id === log!.id)

    throw err
  }
}
