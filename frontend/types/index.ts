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
  id?: string
  type: 'user' | 'assistant'
  message: string
  timestamp?: string
}

// Position types
export interface Position {
  id: string
  code: string
  title: string
  department: string
  location: string
  status: 'active' | 'closed' | 'draft'
  created_at: string
  created_by: string
  updated_at: string
  updated_by: string
  job_description: {
    raw_text: string
    pdf_path?: string
    word_count: number
    extracted_at: string
  }
  metadata: {
    salary_range?: string
    experience_required?: string
    education_level?: string
    employment_type?: string
  }
  statistics: {
    times_used: number
    candidates_analyzed: number
    last_used: string | null
  }
}

export interface PositionsResponse {
  positions: Position[]
  total: number
}

// Candidate Actions
export interface CandidateActionRequest {
  candidate_id: string
  candidate_filename: string
  action: 'interview' | 'rejected' | 'on_hold'
  reason?: string
}

export interface CandidateActionResponse {
  candidate_id: string
  candidate_filename: string
  action: string
  username: string
  timestamp: string
  reason?: string
}

// Audit Log
export interface AuditLogEntry {
  candidate_id: string
  candidate_filename: string
  action: string
  username: string
  timestamp: string
  reason?: string
}

export interface AuditLogResponse {
  entries: AuditLogEntry[]
  total: number
}
