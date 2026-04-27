import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { AuthProvider } from './auth-provider'
import { Sidebar } from './sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CRM App',
  description: 'Gestion de clients',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <Providers>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 px-8 py-8 overflow-auto">
                {children}
              </main>
            </div>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  )
}
