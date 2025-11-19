'use client'

import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut, Mail, Shield } from 'lucide-react'

export function UserBar() {
  const { user, logout } = useAuth()

  const displayName = useMemo(() => {
    const raw = user?.username?.trim()
    if (!raw) return 'Usuario'
    if (raw.includes('@')) {
      const [beforeAt] = raw.split('@')
      return beforeAt || raw
    }
    return raw
  }, [user?.username])

  const displayInitial = displayName.charAt(0).toUpperCase()
  const displayEmail = user?.email || (user?.username?.includes('@') ? user?.username : undefined)

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--brand-primary, #003b71), var(--brand-accent, #0b5ca8))',
      padding: '0.75rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '1rem',
      boxShadow: '0 2px 8px rgba(0, 59, 113, 0.15)',
      marginBottom: '2rem'
    }}>
      {/* Información del usuario */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem'
      }}>
        {/* Avatar y nombre */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '0.5rem 1rem',
          borderRadius: '0.75rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.75rem',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            {displayInitial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            <span style={{ 
              color: 'white', 
              fontSize: '0.875rem', 
              fontWeight: 600,
              lineHeight: '1.2'
            }}>
              {displayName}
            </span>
            {displayEmail && (
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <Mail size={10} />
                {displayEmail}
              </span>
            )}
          </div>
        </div>

        {/* Badge de rol */}
        {user?.role && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '0.375rem 0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}>
            <Shield size={12} />
            {user.role}
          </div>
        )}

        {/* Botón de cerrar sesión */}
        <button
          onClick={logout}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0.5rem',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}

