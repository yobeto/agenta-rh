'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [mounted, setMounted] = useState(false)
  const [info, setInfo] = useState<any>({})

  useEffect(() => {
    setMounted(true)
    setInfo({
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'NO CONFIGURADA',
      nodeEnv: process.env.NODE_ENV || 'NO DEFINIDO',
      timestamp: new Date().toISOString(),
      localStorage: typeof window !== 'undefined' ? 'disponible' : 'no disponible',
      cookies: typeof document !== 'undefined' ? document.cookie : 'no disponible',
    })
  }, [])

  if (!mounted) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Cargando información de debug...</h1>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍 Página de Debug</h1>
      
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Información del Entorno</h2>
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(info, null, 2)}
        </pre>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h2>Pruebas de Funcionalidad</h2>
        <button 
          onClick={() => alert('JavaScript funciona!')}
          style={{ 
            padding: '0.75rem 1.5rem', 
            background: '#003b71', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '0.5rem'
          }}
        >
          Probar JavaScript
        </button>
        <button 
          onClick={() => {
            try {
              localStorage.setItem('test', 'ok')
              alert('localStorage funciona!')
            } catch (e) {
              alert('localStorage error: ' + e)
            }
          }}
          style={{ 
            padding: '0.75rem 1.5rem', 
            background: '#00a859', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Probar localStorage
        </button>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px' }}>
        <h2>Navegación</h2>
        <a 
          href="/" 
          style={{ 
            display: 'inline-block', 
            padding: '0.75rem 1.5rem', 
            background: '#003b71', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '4px',
            marginRight: '0.5rem'
          }}
        >
          Ir a página principal
        </a>
        <a 
          href="/login" 
          style={{ 
            display: 'inline-block', 
            padding: '0.75rem 1.5rem', 
            background: '#00a859', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '4px'
          }}
        >
          Ir a login
        </a>
      </div>
    </div>
  )
}

