'use client'

import { AuthGuard } from '../auth-guard'
import ClientsContent from './clients-content'

export default function ClientsPage() {
  return (
    <AuthGuard>
      <ClientsContent />
    </AuthGuard>
  )
}
