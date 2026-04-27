'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from './auth-provider'

const navigation = [
  {
    section: 'Clients',
    items: [
      { label: 'Clients', href: '/clients' },
      { label: 'Import CSV', href: '/import' },
    ],
  },
  {
    section: 'Communication',
    items: [
      { label: 'Templates', href: '/templates' },
      { label: 'Campagnes', href: '/campaigns' },
      { label: 'Périodiques', href: '/periodic' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  async function handleLogout() {
    await signOut(auth)
    router.push('/login')
  }

  if (!user) return null

  return (
    <aside className="w-52 min-h-screen bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-200">
        <span className="font-semibold text-gray-900 text-sm">CRM App</span>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {navigation.map(group => (
          <div key={group.section}>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-1">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
