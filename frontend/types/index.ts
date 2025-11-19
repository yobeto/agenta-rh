export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient'

export interface ObjectiveCriterion {
  name: string
  value: string
  weight?: number | null
}

export interface CandidateDocumentPayload {
  filename: string
  content: string
  candidateId?: string
}

export interface CandidateAnalysisResult {
  candidateId?: string
  filename: string
  recommendation: string
  objective_criteria: ObjectiveCriterion[]
  confidence_level: ConfidenceLevel
  confidence_explanation: string
  missing_information?: string[] | null
  ethical_compliance?: boolean
}

export interface AnalyzeRequestPayload {
  jobDescription: string
  candidates: CandidateDocumentPayload[]
  modelId?: string
}

export interface AIModel {
  id: string
  name: string
  provider: string
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequestPayload {
  message: string
  modelId: string
  chatHistory?: ChatHistoryItem[]
}

export interface ChatResponsePayload {
  message: string
  modelId: string
}

export interface ChatMessageItem {
  id: string
  type: 'user' | 'assistant'
  message: string
  timestamp: string
}

export interface CreateUserRequest {
  username: string
  password: string
  email: string
  department: string
  role?: string
}

export interface CreateUserResponse {
  username: string
  email: string
  department: string
  role: string
  message: string
}

export interface CandidateActionRequest {
  candidate_id: string
  candidate_filename: string
  action: 'interview' | 'rejected' | 'on_hold'
  notes?: string
}

export interface CandidateActionResponse {
  candidate_id: string
  candidate_filename: string
  action: string
  username: string
  timestamp: string
  notes?: string
  message: string
}

export interface AuditLogEntry {
  candidate_id: string
  candidate_filename: string
  action: string
  username: string
  timestamp: string
  notes?: string
}

export interface AuditLogResponse {
  entries: AuditLogEntry[]
  total: number
}
