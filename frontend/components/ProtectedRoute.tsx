'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('🛡️ ProtectedRoute - Estado:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      hasToken: !!token
    })
    
    if (!isLoading && !isAuthenticated) {
      console.log('🛡️ ProtectedRoute - Redirigiendo a /login (no autenticado)')
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router, user, token])

  if (isLoading) {
    console.log('🛡️ ProtectedRoute - Mostrando loader (cargando)')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('🛡️ ProtectedRoute - No autenticado, retornando null')
    return null
  }

  console.log('🛡️ ProtectedRoute - Usuario autenticado, mostrando contenido')
  return <>{children}</>
}

