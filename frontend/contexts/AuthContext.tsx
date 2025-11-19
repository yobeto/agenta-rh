'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  username: string
  email?: string
  role?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'agente-rh-token'
const USER_KEY = 'agente-rh-user'

// Logging para debuggear
if (typeof window !== 'undefined') {
  console.log('🔧 AuthContext - API_URL:', API_URL)
  console.log('🔧 AuthContext - NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Cargar token y usuario del localStorage al iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      console.log('🔐 Iniciando login para:', username)
      console.log('🔐 URL del API:', `${API_URL}/api/auth/login`)
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      console.log('🔐 Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        let errorMessage = 'Error al iniciar sesión'
        try {
          const error = await response.json()
          errorMessage = error.detail || errorMessage
          console.error('🔐 Error del servidor:', error)
        } catch {
          errorMessage = `Error ${response.status}: ${response.statusText}`
          console.error('🔐 Error al parsear respuesta:', errorMessage)
        }
        throw new Error(errorMessage)
      }

      console.log('🔐 Parseando respuesta JSON...')
      const data = await response.json()
      console.log('🔐 Datos recibidos:', { 
        hasToken: !!data.access_token, 
        hasUser: !!data.user,
        user: data.user 
      })
      
      // Guardar token y usuario en localStorage
      console.log('🔐 Guardando en localStorage...')
      localStorage.setItem(TOKEN_KEY, data.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      
      // También establecer cookie para el middleware de Next.js
      document.cookie = `agente-rh-token=${data.access_token}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax`
      console.log('🔐 Cookie establecida')
      
      console.log('🔐 Actualizando estado...')
      setToken(data.access_token)
      setUser(data.user)
      
      console.log('🔐 Estado actualizado, esperando un momento antes de redirigir...')
      // Pequeño delay para asegurar que el estado se actualice
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log('🔐 Redirigiendo a /...')
      // Usar window.location para una redirección más confiable
      window.location.href = '/'
      console.log('🔐 Login completado exitosamente')
    } catch (error: any) {
      console.error('🔐 Login error completo:', error)
      console.error('🔐 Stack trace:', error.stack)
      // Mejorar mensajes de error
      if (error.message?.includes('fetch')) {
        throw new Error('No se pudo conectar con el servidor. Por favor, intenta nuevamente.')
      }
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    // Eliminar cookie
    document.cookie = 'agente-rh-token=; path=/; max-age=0'
    setToken(null)
    setUser(null)
    router.push('/login')
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!token && !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

