'use client'

import { useEffect, useState } from 'react'

export function DebugInfo() {
  const [apiUrl, setApiUrl] = useState<string>('')
  const [envVar, setEnvVar] = useState<string>('')

  useEffect(() => {
    // Esto se ejecuta en el cliente
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
    setEnvVar(process.env.NEXT_PUBLIC_API_URL || 'NO CONFIGURADA')
  }, [])

  // Solo mostrar en desarrollo o si hay un problema
  if (process.env.NODE_ENV === 'production' && apiUrl.includes('localhost')) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#fee2e2',
        border: '2px solid #dc2626',
        padding: '1rem',
        borderRadius: '8px',
        zIndex: 9999,
        maxWidth: '400px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#dc2626', fontSize: '14px', fontWeight: 'bold' }}>
          ⚠️ Error de Configuración
        </h3>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '12px', color: '#991b1b' }}>
          La URL del API está apuntando a localhost en producción.
        </p>
        <div style={{ fontSize: '11px', color: '#7f1d1d', fontFamily: 'monospace' }}>
          <div><strong>API_URL actual:</strong> {apiUrl}</div>
          <div><strong>NEXT_PUBLIC_API_URL:</strong> {envVar}</div>
        </div>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '11px', color: '#991b1b' }}>
          Verifica que la variable NEXT_PUBLIC_API_URL esté configurada en Render y haz un nuevo deploy.
        </p>
      </div>
    )
  }

  // En desarrollo, mostrar siempre
  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#dbeafe',
        border: '2px solid #3b82f6',
        padding: '1rem',
        borderRadius: '8px',
        zIndex: 9999,
        maxWidth: '400px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <div><strong>API_URL:</strong> {apiUrl}</div>
        <div><strong>NEXT_PUBLIC_API_URL:</strong> {envVar}</div>
      </div>
    )
  }

  return null
}

