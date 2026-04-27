import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  date,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'

// ── Enums ──────────────────────────────────────────────────────────────────

export const notificationStatusEnum = pgEnum('notification_status', [
  'pending',
  'sent',
  'failed',
])

export const notificationReasonEnum = pgEnum('notification_reason', [
  'anniversaire',
  'periodique',
  'manuel',
])

export const notificationTypeEnum = pgEnum('notification_type', [
  'email',
  'sms',
])

// ── Tables ─────────────────────────────────────────────────────────────────

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 128 }).notNull(),
  prenom: varchar('prenom', { length: 100 }).notNull(),
  nom: varchar('nom', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  telephone: varchar('telephone', { length: 30 }),
  dateNaissance: date('date_naissance'),
  consentementEmail: boolean('consentement_email').notNull().default(false),
  consentementSms: boolean('consentement_sms').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const emailLogs = pgTable('email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  reason: notificationReasonEnum('reason').notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  status: notificationStatusEnum('status').notNull().default('pending'),
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const smsLogs = pgTable('sms_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  reason: notificationReasonEnum('reason').notNull(),
  message: text('message').notNull(),
  status: notificationStatusEnum('status').notNull().default('pending'),
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 128 }).notNull(),
  nom: varchar('nom', { length: 100 }).notNull(),
  type: notificationTypeEnum('type').notNull(),
  reason: notificationReasonEnum('reason').notNull(),
  subject: varchar('subject', { length: 255 }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
