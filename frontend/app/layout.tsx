import './globals.css'
import type { Metadata } from 'next'

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
        <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  )
}
