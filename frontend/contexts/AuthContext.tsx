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
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        let errorMessage = 'Error al iniciar sesión'
        try {
          const error = await response.json()
          errorMessage = error.detail || errorMessage
        } catch {
          errorMessage = `Error ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Guardar token y usuario en localStorage
      localStorage.setItem(TOKEN_KEY, data.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      
      // También establecer cookie para el middleware de Next.js
      document.cookie = `agente-rh-token=${data.access_token}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax`
      
      setToken(data.access_token)
      setUser(data.user)
      
      // Redirigir a la página principal
      router.push('/')
    } catch (error: any) {
      console.error('Login error:', error)
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

