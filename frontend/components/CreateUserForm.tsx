'use client'

import { useState, useMemo } from 'react'
import { createUser } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, AlertTriangle, CheckCircle2, UserPlus, Mail, Building2, Shield, Lock, Eye, EyeOff, Check, X } from 'lucide-react'

export function CreateUserForm() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    department: 'RH',
    role: 'user'
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Validación de contraseña en tiempo real
  const passwordValidation = useMemo(() => {
    const pwd = formData.password
    return {
      minLength: pwd.length >= 8,
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    }
  }, [formData.password])

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0

  // Solo mostrar si es admin
  if (user?.role !== 'admin') {
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validaciones
    if (!formData.username.trim()) {
      setError('El nombre de usuario es requerido')
      return
    }

    if (!formData.email.trim()) {
      setError('El correo electrónico es requerido')
      return
    }

    if (!formData.email.endsWith('@inbursa.com')) {
      setError('El email debe ser del dominio @inbursa.com')
      return
    }

    if (!isPasswordValid) {
      setError('La contraseña no cumple con los requisitos mínimos')
      return
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.department !== 'RH') {
      setError('El departamento debe ser RH')
      return
    }

    setIsLoading(true)
    try {
      await createUser({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        department: formData.department,
        role: formData.role
      })
      setSuccess(true)
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        department: 'RH',
        role: 'user'
      })
      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Error al crear usuario')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Mensajes de éxito/error */}
        {success && (
          <div style={{
            padding: '1rem',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '0.5rem',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <CheckCircle2 size={20} />
            <div>
              <strong>Usuario creado exitosamente</strong>
              <p style={{ margin: 0, fontSize: '0.875rem', marginTop: '0.25rem' }}>
                El usuario está disponible para iniciar sesión.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '0.5rem',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <AlertTriangle size={20} />
            <div>
              <strong>Error</strong>
              <p style={{ margin: 0, fontSize: '0.875rem', marginTop: '0.25rem' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Nombre de usuario y Email en fila */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="username" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#0f172a' }}>
              <UserPlus size={16} />
              Nombre de usuario *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder="usuario"
              disabled={isLoading}
              pattern="[a-zA-Z0-9_]{3,50}"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#003b71'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
            />
          </div>

          <div>
            <label htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#0f172a' }}>
              <Mail size={16} />
              Correo electrónico *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="usuario@inbursa.com"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#003b71'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
            />
          </div>
        </div>

        {/* Contraseña y Confirmar contraseña en fila */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#0f172a' }}>
              <Lock size={16} />
              Contraseña *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Mínimo 8 caracteres"
                disabled={isLoading}
                minLength={8}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '2.5rem',
                  border: `1px solid ${formData.password.length > 0
                    ? isPasswordValid
                      ? '#86efac'
                      : '#fca5a5'
                    : '#cbd5e1'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  background: formData.password.length > 0
                    ? isPasswordValid
                      ? '#f0fdf4'
                      : '#fef2f2'
                    : 'white'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#003b71'}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = formData.password.length > 0
                    ? isPasswordValid
                      ? '#86efac'
                      : '#fca5a5'
                    : '#cbd5e1'
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
                  display: 'flex',
                  alignItems: 'center'
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.password.length > 0 && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem', margin: 0 }}>Requisitos de contraseña:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {Object.entries({
                    minLength: 'Mínimo 8 caracteres',
                    hasUpperCase: 'Una letra mayúscula',
                    hasLowerCase: 'Una letra minúscula',
                    hasNumber: 'Un número',
                    hasSpecial: 'Un carácter especial',
                  }).map(([key, label]) => {
                    const isValid = passwordValidation[key as keyof typeof passwordValidation]
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                        {isValid ? (
                          <Check size={14} style={{ color: '#059669', flexShrink: 0 }} />
                        ) : (
                          <X size={14} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                        )}
                        <span style={{ color: isValid ? '#059669' : '#64748b', fontWeight: isValid ? 500 : 400 }}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#0f172a' }}>
              <Lock size={16} />
              Confirmar contraseña *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Repite la contraseña"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '2.5rem',
                  border: `1px solid ${formData.confirmPassword.length > 0
                    ? passwordsMatch
                      ? '#86efac'
                      : '#fca5a5'
                    : '#cbd5e1'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  background: formData.confirmPassword.length > 0
                    ? passwordsMatch
                      ? '#f0fdf4'
                      : '#fef2f2'
                    : 'white'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#003b71'}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = formData.confirmPassword.length > 0
                    ? passwordsMatch
                      ? '#86efac'
                      : '#fca5a5'
                    : '#cbd5e1'
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center'
                }}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.confirmPassword.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                {passwordsMatch ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#059669', background: '#f0fdf4', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #86efac' }}>
                    <Check size={16} />
                    <span style={{ fontWeight: 500 }}>Las contraseñas coinciden</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#dc2626', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #fca5a5' }}>
                    <X size={16} />
                    <span style={{ fontWeight: 500 }}>Las contraseñas no coinciden</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Departamento y Rol en fila */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="department" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#0f172a' }}>
              <Building2 size={16} />
              Departamento *
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                outline: 'none',
                background: 'white',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#003b71'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <option value="RH">RH</option>
            </select>
          </div>

          <div>
            <label htmlFor="role" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#0f172a' }}>
              <Shield size={16} />
              Rol *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                outline: 'none',
                background: 'white',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#003b71'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        {/* Botón de envío */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
          <button
            type="submit"
            disabled={isLoading || !isPasswordValid || !passwordsMatch || !formData.username.trim() || !formData.email.trim()}
            style={{
              padding: '0.75rem 2rem',
              background: isLoading || !isPasswordValid || !passwordsMatch || !formData.username.trim() || !formData.email.trim()
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #003b71, #0b5ca8)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: isLoading || !isPasswordValid || !passwordsMatch || !formData.username.trim() || !formData.email.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              boxShadow: isLoading || !isPasswordValid || !passwordsMatch || !formData.username.trim() || !formData.email.trim()
                ? 'none'
                : '0 2px 4px rgba(0, 59, 113, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && isPasswordValid && passwordsMatch && formData.username.trim() && formData.email.trim()) {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 59, 113, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && isPasswordValid && passwordsMatch && formData.username.trim() && formData.email.trim()) {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 59, 113, 0.2)'
              }
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Creando usuario...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Crear Usuario</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
