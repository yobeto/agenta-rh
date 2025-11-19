'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [forceShow, setForceShow] = useState(false)

  // Timeout de seguridad: después de 3 segundos, forzar mostrar contenido o redirigir
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.warn('ProtectedRoute: Timeout de seguridad activado')
      if (!isAuthenticated) {
        setShouldRedirect(true)
      } else {
        setForceShow(true)
      }
    }, 3000)

    return () => clearTimeout(timeoutId)
  }, [isAuthenticated])

  // Redirigir si no está autenticado
  useEffect(() => {
    if (shouldRedirect || (!isLoading && !isAuthenticated && !forceShow)) {
      console.log('ProtectedRoute: Redirigiendo a login')
      // Usar window.location para forzar la redirección
      const timer = setTimeout(() => {
        window.location.href = '/login'
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isLoading, shouldRedirect, forceShow])

  // Si está cargando y no ha pasado el timeout, mostrar loader
  if (isLoading && !forceShow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Cargando...</p>
          <p className="text-sm text-slate-400 mt-2">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado y no hay que forzar, mostrar mensaje
  if (!isAuthenticated && !forceShow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 text-lg">Redirigiendo al login...</p>
          <p className="text-slate-400 text-sm mt-2">
            Si no eres redirigido automáticamente,{' '}
            <a href="/login" className="text-blue-600 underline">
              haz clic aquí
            </a>
          </p>
        </div>
      </div>
    )
  }

  // Mostrar contenido si está autenticado o si forzamos la visualización
  return <>{children}</>
}

