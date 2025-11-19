'use client'

import { useState } from 'react'
import { createUser } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, AlertCircle, CheckCircle2, UserPlus, Mail, Building2, Shield } from 'lucide-react'

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
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Crear nuevo usuario
        </h2>
        <p className="text-slate-600 text-sm">
          Crea usuarios del departamento RH con email @inbursa.com
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Éxito</p>
              <p className="text-sm mt-1">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-2">
              Usuario *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserPlus className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none transition"
                placeholder="usuario"
                disabled={isLoading}
                pattern="[a-zA-Z0-9_]{3,50}"
                title="3-50 caracteres, solo letras, números y guiones bajos"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
              Email *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none transition"
                placeholder="usuario@inbursa.com"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
              Contraseña *
            </label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none transition"
              placeholder="Mínimo 8 caracteres"
              disabled={isLoading}
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
              Confirmar contraseña *
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none transition"
              placeholder="Repite la contraseña"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showPassword"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="w-4 h-4 text-[#003b71] border-slate-300 rounded focus:ring-[#003b71]"
          />
          <label htmlFor="showPassword" className="text-sm text-slate-600">
            Mostrar contraseñas
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="department" className="block text-sm font-semibold text-slate-700 mb-2">
              Departamento *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-4 w-4 text-slate-400" />
              </div>
              <select
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none transition bg-white"
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
                <Shield className="h-4 w-4 text-slate-400" />
              </div>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none transition bg-white"
                disabled={isLoading}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Requisitos de contraseña:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Mínimo 8 caracteres</li>
              <li>Al menos una letra mayúscula</li>
              <li>Al menos una letra minúscula</li>
              <li>Al menos un número</li>
              <li>Al menos un carácter especial</li>
            </ul>
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#003b71] to-[#0b5ca8] text-white py-3 rounded-lg font-semibold hover:from-[#002d56] hover:to-[#0a4a87] focus:outline-none focus:ring-2 focus:ring-[#003b71] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creando usuario...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Crear usuario</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}

