import 'dotenv/config'

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Variable d'environnement manquante : ${key}`)
  return value
}

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  PORT: Number(process.env['PORT'] ?? 3001),

  // Email
  BREVO_SMTP_HOST: process.env['BREVO_SMTP_HOST'] ?? 'smtp-relay.brevo.com',
  BREVO_SMTP_PORT: Number(process.env['BREVO_SMTP_PORT'] ?? 587),
  BREVO_SMTP_USER: requireEnv('BREVO_SMTP_USER'),
  BREVO_SMTP_KEY: requireEnv('BREVO_SMTP_KEY'),
  EMAIL_FROM: requireEnv('EMAIL_FROM'),

  // SMS
  TWILIO_ACCOUNT_SID: process.env['TWILIO_ACCOUNT_SID'] ?? '',
  TWILIO_AUTH_TOKEN: process.env['TWILIO_AUTH_TOKEN'] ?? '',
  TWILIO_FROM_NUMBER: process.env['TWILIO_FROM_NUMBER'] ?? '',

  // Auth
  FRONTEND_URL: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
}
