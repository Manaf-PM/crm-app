'use client'

import { AuthGuard } from '../auth-guard'
import ImportContent from './import-content'

export default function ImportPage() {
  return (
    <AuthGuard>
      <ImportContent />
    </AuthGuard>
  )
}
