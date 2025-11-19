import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import { DebugInfo } from '@/components/DebugInfo'

export const metadata: Metadata = {
  title: 'agente-rh',
  description: 'Asistente ético para la preselección de candidatos de nivel medio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-800 min-h-screen">
        <AuthProvider>
          {children}
          <DebugInfo />
        </AuthProvider>
      </body>
    </html>
  )
}
