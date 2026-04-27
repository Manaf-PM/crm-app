import type { DecodedIdToken } from 'firebase-admin/auth'

export type AppEnv = { Variables: { user: DecodedIdToken } }
