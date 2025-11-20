'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, AlertCircle, ShieldCheck, Lock, User as UserIcon } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(true) // Iniciar como true para que sea visible inmediatamente
  const [isMobile, setIsMobile] = useState(false)
  
  // Obtener login del contexto (siempre se llama)
  const auth = useAuth()
  const loginFn = auth.login

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await loginFn(username, password)
      // La redirección se maneja en el contexto
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4" 
      style={{ 
        background: 'linear-gradient(135deg, rgba(0, 59, 113, 0.05) 0%, rgba(0, 168, 89, 0.03) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decoración de fondo sutil */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 59, 113, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-15%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 168, 89, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div 
        style={{ 
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          zIndex: 1,
          opacity: 1, // Siempre visible
          transform: 'translateY(0)', // Sin animación inicial
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          margin: '0 auto',
          visibility: 'visible' // Siempre visible
        }}
      >
        <div 
          className="card" 
          style={{ 
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            borderRadius: '1.25rem',
            boxShadow: '0 20px 60px -12px rgba(0, 47, 108, 0.25), 0 0 0 1px rgba(0, 47, 108, 0.05)',
            padding: isMobile ? '1.5rem' : '2.5rem',
            border: '1px solid rgba(0, 47, 108, 0.1)',
            margin: '0 auto',
            width: '100%'
          }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="relative mx-auto mb-6" style={{
              width: isMobile ? '150px' : '200px',
              height: isMobile ? '150px' : '200px',
              filter: 'drop-shadow(0 4px 16px rgba(0, 59, 113, 0.2))',
              marginBottom: isMobile ? '1rem' : '1.5rem'
            }}>
              <Image
                src="/logo.png"
                alt="Inbursa"
                fill
                priority
                style={{ objectFit: 'contain' }}
                sizes={isMobile ? '150px' : '200px'}
              />
            </div>
            <div style={{
              padding: '0.75rem 1.25rem',
              background: 'linear-gradient(135deg, rgba(0, 59, 113, 0.08), rgba(0, 168, 89, 0.06))',
              borderRadius: '0.75rem',
              display: 'inline-block',
              marginBottom: '1rem'
            }}>
              <h1 className="text-2xl font-bold mb-1" style={{ 
                color: 'var(--brand-primary, #003b71)',
                letterSpacing: '-0.02em',
                margin: 0
              }}>
                agente-rh
              </h1>
            </div>
            <p style={{ 
              color: 'var(--text-secondary, #475569)', 
              fontSize: '0.9rem',
              fontWeight: 500,
              margin: 0
            }}>
              Inicia sesión para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && (
              <div style={{
                background: 'rgba(254, 226, 226, 0.9)',
                border: '1px solid rgba(248, 113, 113, 0.4)',
                color: '#b91c1c',
                padding: '0.875rem 1rem',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'start',
                gap: '0.75rem',
                animation: 'shake 0.4s ease'
              }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, margin: 0, marginBottom: '0.25rem', fontSize: '0.9rem' }}>Error de autenticación</p>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{error}</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="username" style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary, #0f172a)'
              }}>
                Usuario
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none',
                  zIndex: 1
                }}>
                  <UserIcon size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="tu.usuario"
                  disabled={isLoading}
                  autoComplete="username"
                  style={{
                    paddingLeft: '2.75rem',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--brand-primary, #003b71)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 59, 113, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5f5'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary, #0f172a)'
              }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none',
                  zIndex: 1
                }}>
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="current-password"
                  style={{ 
                    paddingLeft: '2.75rem',
                    paddingRight: '3rem',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--brand-primary, #003b71)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 59, 113, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5f5'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '0.375rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--brand-primary, #003b71)'
                    e.currentTarget.style.background = 'rgba(0, 59, 113, 0.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#64748b'
                    e.currentTarget.style.background = 'transparent'
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.125rem', height: '1.125rem' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.367 5.119m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.125rem', height: '1.125rem' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                padding: '0.875rem 2rem',
                borderRadius: '9999px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--brand-primary, #003b71), var(--brand-accent, #0b5ca8))',
                color: 'white',
                fontWeight: 600,
                letterSpacing: '0.01em',
                boxShadow: '0 22px 45px -22px rgba(0, 59, 113, 0.55), 0 16px 35px -28px rgba(0, 47, 108, 0.45)',
                transition: 'all 0.2s ease',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                width: '100%',
                fontSize: '0.95rem'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 26px 55px -25px rgba(0, 59, 113, 0.6), 0 18px 38px -30px rgba(0, 47, 108, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = '0 22px 45px -22px rgba(0, 59, 113, 0.55), 0 16px 35px -28px rgba(0, 47, 108, 0.45)'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Iniciar sesión</span>
                </>
              )}
            </button>
          </form>

          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(0, 47, 108, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: 'rgba(0, 168, 89, 0.04)',
            marginLeft: '-2.5rem',
            marginRight: '-2.5rem',
            marginBottom: '-2.5rem',
            paddingBottom: '1.25rem',
            paddingLeft: '2.5rem',
            paddingRight: '2.5rem',
            borderBottomLeftRadius: '1.25rem',
            borderBottomRightRadius: '1.25rem'
          }}>
            <ShieldCheck style={{ width: '1rem', height: '1rem', color: 'var(--brand-secondary, #00a859)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #475569)', fontWeight: 500 }}>
              Solo personal autorizado de @inbursa.com - Departamento RH
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}
