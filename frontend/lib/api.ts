import axios from 'axios'
import type {
  AnalyzeRequestPayload,
  CandidateAnalysisResult,
  AIModel,
  ChatRequestPayload,
  ChatResponsePayload,
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar el token a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('agente-rh-token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      if (typeof window !== 'undefined') {
        localStorage.removeItem('agente-rh-token')
        localStorage.removeItem('agente-rh-user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export async function analyzeCandidates(payload: AnalyzeRequestPayload): Promise<CandidateAnalysisResult[]> {
  const response = await apiClient.post<CandidateAnalysisResult[]>('/api/analyze', payload)
  return response.data
}

export async function extractTextFromPdf(file: File): Promise<{ text: string; warnings: string[] }> {
  const formData = new FormData()
  formData.append('file', file)
  
  // Usar apiClient para incluir el token automáticamente
  const token = typeof window !== 'undefined' ? localStorage.getItem('agente-rh-token') : null
  const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await axios.post<{ text: string; warnings: string[] }>(`${API_URL}/api/extract-text`, formData, {
    headers,
  })
  return response.data
}

export async function sendChatMessage(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
  const response = await apiClient.post<ChatResponsePayload>('/api/chat', payload)
  return response.data
}

export async function getModels(): Promise<AIModel[]> {
  const response = await apiClient.get<{ models: AIModel[] }>('/api/models')
  return response.data.models
}

export async function getEthicalPrinciples() {
  const response = await apiClient.get('/api/ethical-principles')
  return response.data
}

export async function createUser(payload: {
  username: string
  password: string
  email: string
  department: string
  role?: string
}) {
  const response = await apiClient.post('/api/auth/create-user', payload)
  return response.data
}
