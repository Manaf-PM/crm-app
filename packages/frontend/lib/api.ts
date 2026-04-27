import axios from 'axios'
import { auth } from './firebase'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Injecte automatiquement le token Firebase dans chaque requête
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Types ──────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  prenom: string
  nom: string
  email: string
  telephone?: string
  dateNaissance?: string
  consentementEmail: boolean
  consentementSms: boolean
  createdAt: string
  updatedAt: string
}

export type ClientCreate = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
export type ClientUpdate = Partial<ClientCreate>

// ── API clients ────────────────────────────────────────────────────────────

export const clientsApi = {
  list: () => api.get<Client[]>('/api/clients').then(r => r.data),
  get: (id: string) => api.get<Client>(`/api/clients/${id}`).then(r => r.data),
  create: (data: ClientCreate) => api.post<Client>('/api/clients', data).then(r => r.data),
  update: (id: string, data: ClientUpdate) => api.patch<Client>(`/api/clients/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/api/clients/${id}`).then(r => r.data),
}
