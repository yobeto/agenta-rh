'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Timeout de seguridad: si isLoading tarda más de 5 segundos, redirigir a login
  useEffect(() => {
    if (isLoading) {
      const timeoutId = setTimeout(() => {
        console.warn('ProtectedRoute: Timeout de carga, redirigiendo a login')
        router.push('/login')
      }, 5000) // 5 segundos máximo

      return () => clearTimeout(timeoutId)
    }
  }, [isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Cargando...</p>
          <p className="text-sm text-slate-400 mt-2">Si esto tarda más de 5 segundos, serás redirigido al login</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Se redirigirá a /login
  }

  return <>{children}</>
}

