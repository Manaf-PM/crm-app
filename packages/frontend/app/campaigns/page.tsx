'use client'

import { AuthGuard } from '../auth-guard'
import CampaignsContent from './campaigns-content'

export default function CampaignsPage() {
  return (
    <AuthGuard>
      <CampaignsContent />
    </AuthGuard>
  )
}
