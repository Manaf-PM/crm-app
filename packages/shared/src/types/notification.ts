export type NotificationType = 'email' | 'sms'
export type NotificationStatus = 'pending' | 'sent' | 'failed'
export type NotificationReason = 'anniversaire' | 'periodique' | 'manuel'

export interface EmailLog {
  id: string
  clientId: string
  reason: NotificationReason
  subject: string
  status: NotificationStatus
  errorMessage?: string
  sentAt?: string
  createdAt: string
}

export interface SmsLog {
  id: string
  clientId: string
  reason: NotificationReason
  message: string
  status: NotificationStatus
  errorMessage?: string
  sentAt?: string
  createdAt: string
}

export interface NotificationTemplate {
  id: string
  nom: string
  type: NotificationType
  reason: NotificationReason
  subject?: string   // email uniquement
  body: string       // HTML pour email, texte pour SMS
  createdAt: string
  updatedAt: string
}