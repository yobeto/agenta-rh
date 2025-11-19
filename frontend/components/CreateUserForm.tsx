'use client'

import { useState, useMemo } from 'react'
import { createUser } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, AlertCircle, CheckCircle2, UserPlus, Mail, Building2, Shield, Lock, Eye, EyeOff, Check, X } from 'lucide-react'

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
  const [success, setSuccess] = useState<string | null>(null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (!formData.email.endsWith('@inbursa.com')) {
      setError('El email debe ser del dominio @inbursa.com')
      return
    }

    if (formData.department !== 'RH' && formData.department !== 'Recursos Humanos') {
      setError('El departamento debe ser RH o Recursos Humanos')
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
      setSuccess('Usuario creado exitosamente')
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        department: 'RH',
        role: 'user'
      })
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Error al crear usuario')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#003b71] to-[#0b5ca8] flex items-center justify-center text-white shadow-lg">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Crear nuevo usuario
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Crea usuarios del departamento RH con email @inbursa.com
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-lg flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Error al crear usuario</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-5 py-4 rounded-lg flex items-start gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Usuario creado exitosamente</p>
              <p className="text-sm mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* Sección: Información básica */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-200">
            Información básica
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-2">
                Nombre de usuario *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserPlus className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none transition text-slate-900 placeholder-slate-400"
                  placeholder="usuario"
                  disabled={isLoading}
                  pattern="[a-zA-Z0-9_]{3,50}"
                  title="3-50 caracteres, solo letras, números y guiones bajos"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">3-50 caracteres, solo letras, números y guiones bajos</p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Correo electrónico *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none transition text-slate-900 placeholder-slate-400"
                  placeholder="usuario@inbursa.com"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Debe ser del dominio @inbursa.com</p>
            </div>
          </div>
        </div>

        {/* Sección: Contraseña */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-200">
            Seguridad
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#003b71] outline-none transition text-slate-900 placeholder-slate-400 ${
                    formData.password.length > 0
                      ? isPasswordValid
                        ? 'border-green-300 focus:border-green-500'
                        : 'border-red-300 focus:border-red-500'
                      : 'border-slate-300 focus:border-[#003b71]'
                  }`}
                  placeholder="Mínimo 8 caracteres"
                  disabled={isLoading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.password.length > 0 && (
                <div className="mt-3 space-y-2">
                  {Object.entries({
                    minLength: 'Mínimo 8 caracteres',
                    hasUpperCase: 'Una letra mayúscula',
                    hasLowerCase: 'Una letra minúscula',
                    hasNumber: 'Un número',
                    hasSpecial: 'Un carácter especial',
                  }).map(([key, label]) => {
                    const isValid = passwordValidation[key as keyof typeof passwordValidation]
                    return (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        {isValid ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-slate-300" />
                        )}
                        <span className={isValid ? 'text-green-700' : 'text-slate-500'}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                Confirmar contraseña *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#003b71] outline-none transition text-slate-900 placeholder-slate-400 ${
                    formData.confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-green-300 focus:border-green-500'
                        : 'border-red-300 focus:border-red-500'
                      : 'border-slate-300 focus:border-[#003b71]'
                  }`}
                  placeholder="Repite la contraseña"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.confirmPassword.length > 0 && (
                <div className="mt-3">
                  {passwordsMatch ? (
                    <div className="flex items-center gap-2 text-xs text-green-700">
                      <Check className="h-4 w-4" />
                      <span>Las contraseñas coinciden</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-red-600">
                      <X className="h-4 w-4" />
                      <span>Las contraseñas no coinciden</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección: Configuración */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-200">
            Configuración
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="department" className="block text-sm font-semibold text-slate-700 mb-2">
                Departamento *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none transition bg-white text-slate-900"
                  disabled={isLoading}
                >
                  <option value="RH">RH</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-2">
                Rol *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none transition bg-white text-slate-900"
                  disabled={isLoading}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de acción */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            disabled={isLoading || !isPasswordValid || !passwordsMatch}
            className="px-8 py-3 bg-gradient-to-r from-[#003b71] to-[#0b5ca8] text-white rounded-lg font-semibold hover:from-[#002d56] hover:to-[#0a4a87] focus:outline-none focus:ring-2 focus:ring-[#003b71] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creando usuario...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Crear usuario</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

