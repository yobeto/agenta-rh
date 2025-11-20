'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [showContent, setShowContent] = useState(false)

  // Marcar como montado inmediatamente
  useEffect(() => {
    setMounted(true)
    // Forzar mostrar contenido después de 1 segundo máximo
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Redirigir a login si no está autenticado (después de verificar)
  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      const timer = setTimeout(() => {
        window.location.href = '/login'
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [mounted, isLoading, isAuthenticated])

  // Si está cargando y aún no ha pasado el timeout, mostrar loader
  if (isLoading && !showContent) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f8fafc' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #2563eb',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `
          }} />
          <p style={{ color: '#475569', marginBottom: '0.5rem' }}>Cargando...</p>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, mostrar mensaje de redirección
  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f8fafc' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#475569', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
            Redirigiendo al login...
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Si no eres redirigido automáticamente,
          </p>
          <a 
            href="/login" 
            style={{ 
              color: '#2563eb', 
              textDecoration: 'underline',
              fontSize: '0.875rem'
            }}
          >
            haz clic aquí
          </a>
        </div>
      </div>
    )
  }

  // Mostrar contenido si está autenticado
  return <>{children}</>
}

