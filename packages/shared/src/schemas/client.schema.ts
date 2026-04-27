import { z } from 'zod'

export const ClientCreateSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est requis').max(100),
  nom: z.string().min(1, 'Le nom est requis').max(100),
  email: z.string().email('Email invalide'),
  telephone: z
    .string()
    .regex(/^\+?[0-9\s\-().]{7,20}$/, 'Numéro invalide')
    .optional(),
  dateNaissance: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : YYYY-MM-DD')
    .optional(),
  consentementEmail: z.boolean().default(false),
  consentementSms: z.boolean().default(false),
})

export const ClientUpdateSchema = ClientCreateSchema.partial()

export const ClientIdSchema = z.object({
  id: z.string().uuid('ID invalide'),
})

// Schema pour valider une ligne CSV importée
export const ClientCsvRowSchema = z.object({
  prenom: z.string().min(1),
  nom: z.string().min(1),
  email: z.string().email(),
  telephone: z.string().optional(),
  date_naissance: z.string().optional(),  // snake_case dans le CSV
  consentement_email: z
    .string()
    .transform(v => v.toLowerCase() === 'oui' || v === '1' || v === 'true')
    .optional()
    .default('false'),
  consentement_sms: z
    .string()
    .transform(v => v.toLowerCase() === 'oui' || v === '1' || v === 'true')
    .optional()
    .default('false'),
})

export type ClientCreateInput = z.infer<typeof ClientCreateSchema>
export type ClientUpdateInput = z.infer<typeof ClientUpdateSchema>
export type ClientCsvRow = z.infer<typeof ClientCsvRowSchema>