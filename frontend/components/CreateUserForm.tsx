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
    <div className="max-w-4xl mx-auto">
      {/* Header mejorado */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003b71] to-[#0b5ca8] flex items-center justify-center text-white shadow-lg">
            <UserPlus className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Crear nuevo usuario
          </h2>
        </div>
        <p className="text-sm text-slate-600 ml-13">
          Completa el formulario para crear un nuevo usuario del sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mensajes de estado */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-5 py-4 rounded-lg flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Error al crear usuario</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-5 py-4 rounded-lg flex items-start gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Usuario creado exitosamente</p>
              <p className="text-sm mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* Sección: Información básica */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-200">
            <UserPlus className="w-5 h-5 text-[#003b71] flex-shrink-0" />
            <h3 className="text-lg font-bold text-slate-900">
              Información básica
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="username" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <UserPlus className="h-4 w-4 text-[#003b71] flex-shrink-0" />
                <span>Nombre de usuario *</span>
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none transition-all text-slate-900 placeholder-slate-400 text-sm hover:border-slate-400"
                placeholder="usuario"
                disabled={isLoading}
                pattern="[a-zA-Z0-9_]{3,50}"
                title="3-50 caracteres, solo letras, números y guiones bajos"
              />
              <p className="text-xs text-slate-500 mt-1.5 ml-6">3-50 caracteres, solo letras, números y guiones bajos</p>
            </div>

            <div>
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Mail className="h-4 w-4 text-[#003b71] flex-shrink-0" />
                <span>Correo electrónico *</span>
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none transition-all text-slate-900 placeholder-slate-400 text-sm hover:border-slate-400"
                placeholder="usuario@inbursa.com"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Sección: Seguridad */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-200">
            <Lock className="w-5 h-5 text-[#003b71] flex-shrink-0" />
            <h3 className="text-lg font-bold text-slate-900">
              Seguridad
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Lock className="h-4 w-4 text-[#003b71] flex-shrink-0" />
                <span>Contraseña *</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className={`w-full px-4 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#003b71] outline-none transition-all text-slate-900 placeholder-slate-400 text-sm hover:border-slate-400 ${
                    formData.password.length > 0
                      ? isPasswordValid
                        ? 'border-green-400 focus:border-green-500 bg-green-50/30'
                        : 'border-red-300 focus:border-red-500 bg-red-50/30'
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.password.length > 0 && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Requisitos de contraseña:</p>
                  <div className="space-y-1.5">
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
                            <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                          )}
                          <span className={isValid ? 'text-green-700 font-medium' : 'text-slate-500'}>
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
              <label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Lock className="h-4 w-4 text-[#003b71] flex-shrink-0" />
                <span>Confirmar contraseña *</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className={`w-full px-4 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#003b71] outline-none transition-all text-slate-900 placeholder-slate-400 text-sm hover:border-slate-400 ${
                    formData.confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-green-400 focus:border-green-500 bg-green-50/30'
                        : 'border-red-300 focus:border-red-500 bg-red-50/30'
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
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword.length > 0 && (
                <div className="mt-3">
                  {passwordsMatch ? (
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                      <Check className="h-4 w-4" />
                      <span className="font-medium">Las contraseñas coinciden</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                      <X className="h-4 w-4" />
                      <span className="font-medium">Las contraseñas no coinciden</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección: Configuración */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-200">
            <Shield className="w-5 h-5 text-[#003b71] flex-shrink-0" />
            <h3 className="text-lg font-bold text-slate-900">
              Configuración
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="department" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Building2 className="h-4 w-4 text-[#003b71] flex-shrink-0" />
                <span>Departamento *</span>
              </label>
              <select
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none transition-all bg-white text-slate-900 text-sm hover:border-slate-400 cursor-pointer"
                disabled={isLoading}
              >
                <option value="RH">RH</option>
              </select>
            </div>

            <div>
              <label htmlFor="role" className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Shield className="h-4 w-4 text-[#003b71] flex-shrink-0" />
                <span>Rol *</span>
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none transition-all bg-white text-slate-900 text-sm hover:border-slate-400 cursor-pointer"
                disabled={isLoading}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botón de acción */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            disabled={isLoading || !isPasswordValid || !passwordsMatch}
            className="px-8 py-3 bg-gradient-to-r from-[#003b71] to-[#0b5ca8] text-white rounded-lg font-semibold hover:from-[#002d56] hover:to-[#0a4a87] focus:outline-none focus:ring-2 focus:ring-[#003b71] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm"
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
