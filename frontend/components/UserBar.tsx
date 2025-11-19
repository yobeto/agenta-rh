'use client'

import { useMemo, useState, useEffect } from 'react'
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

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--brand-primary, #003b71), var(--brand-accent, #0b5ca8))',
      padding: isMobile ? '0.75rem 1rem' : '0.75rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: isMobile ? '0.5rem' : '1rem',
      boxShadow: '0 2px 8px rgba(0, 59, 113, 0.15)',
      marginBottom: '2rem',
      flexWrap: 'wrap'
    }}>
      {/* Información del usuario */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? '0.5rem' : '1rem',
        flexWrap: 'wrap',
        width: isMobile ? '100%' : 'auto',
        justifyContent: isMobile ? 'space-between' : 'flex-end'
      }}>
        {/* Avatar y nombre */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '0.5rem' : '0.75rem',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: isMobile ? '0.375rem 0.75rem' : '0.5rem 1rem',
          borderRadius: '0.75rem',
          backdropFilter: 'blur(10px)',
          flex: isMobile ? '1 1 auto' : '0 1 auto'
        }}>
          <div style={{
            width: isMobile ? '2rem' : '2.5rem',
            height: isMobile ? '2rem' : '2.5rem',
            borderRadius: '0.75rem',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: isMobile ? '0.875rem' : '1rem',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            flexShrink: 0
          }}>
            {displayInitial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', minWidth: 0 }}>
            <span style={{ 
              color: 'white', 
              fontSize: isMobile ? '0.8rem' : '0.875rem', 
              fontWeight: 600,
              lineHeight: '1.2',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {displayName}
            </span>
            {displayEmail && !isMobile && (
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
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
            padding: isMobile ? '0.25rem 0.5rem' : '0.375rem 0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            flexShrink: 0
          }}>
            <Shield size={isMobile ? 10 : 12} />
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
            padding: isMobile ? '0.375rem 0.75rem' : '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0.5rem',
            color: 'white',
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            flexShrink: 0
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
          <LogOut size={isMobile ? 14 : 16} />
          {!isMobile && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  )
}

