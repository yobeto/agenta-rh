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

export async function analyzeCandidates(payload: AnalyzeRequestPayload): Promise<CandidateAnalysisResult[]> {
  const response = await apiClient.post<CandidateAnalysisResult[]>('/api/analyze', payload)
  return response.data
}

export async function extractTextFromPdf(file: File): Promise<{ text: string; warnings: string[] }> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await axios.post<{ text: string; warnings: string[] }>(`${API_URL}/api/extract-text`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
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
