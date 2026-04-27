'use client'

import { AuthGuard } from '../auth-guard'
import TemplatesContent from './templates-content'

export default function TemplatesPage() {
  return (
    <AuthGuard>
      <TemplatesContent />
    </AuthGuard>
  )
}
