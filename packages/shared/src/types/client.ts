export interface Client {
  id: string
  // Identité
  prenom: string
  nom: string
  email: string
  telephone?: string
  dateNaissance?: string  // format ISO : "1990-04-20"
  // Consentements RGPD
  consentementEmail: boolean
  consentementSms: boolean
  // Metadata
  createdAt: string
  updatedAt: string
}

export type ClientCreate = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
export type ClientUpdate = Partial<ClientCreate>