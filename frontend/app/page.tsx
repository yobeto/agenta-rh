'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { CandidateForm } from '@/components/CandidateForm'
import { AnalysisResult } from '@/components/AnalysisResult'
import { JobDescriptionInput } from '@/components/JobDescriptionInput'
import { ChatPanel } from '@/components/ChatPanel'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminMenu } from '@/components/AdminMenu'
import { UserBar } from '@/components/UserBar'
import { analyzeCandidates } from '@/lib/api'
import type {
  AnalyzeRequestPayload,
  CandidateDocumentPayload,
  CandidateAnalysisResult,
  ChatMessageItem,
} from '@/types'
import {
  MessageCircle,
  ShieldCheck,
  FileText,
  Users,
  BarChart3,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

const MODEL_ID = 'gpt-4'
const MAX_PREVIEW_LENGTH = 90
const CONFIDENCE_BASE: Record<string, number> = {
  high: 92,
  medium: 76,
  low: 58,
  insufficient: 45,
}

function truncate(text: string, limit = MAX_PREVIEW_LENGTH) {
  const normalized = text.trim().replace(/\s+/g, ' ')
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, limit).trim()}…`
}

function computeScore(result: CandidateAnalysisResult): number {
  const base = CONFIDENCE_BASE[result.confidence_level] ?? 70
  const penalty = result.missing_information && result.missing_information.length > 0 ? 10 : 0
  const bonus = result.objective_criteria.length >= 3 ? 5 : 0
  const score = base - penalty + bonus
  return Math.max(30, Math.min(100, Math.round(score)))
}

export default function Home() {
  const [jobDescription, setJobDescription] = useState('')
  const [candidateDocuments, setCandidateDocuments] = useState<CandidateDocumentPayload[]>([])
  const [analysisResults, setAnalysisResults] = useState<CandidateAnalysisResult[]>([])
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatPreview, setChatPreview] = useState<ChatMessageItem[]>([])

  useEffect(() => {
    const handleHotkey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'm') {
        event.preventDefault()
        setIsChatOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleHotkey)
    return () => window.removeEventListener('keydown', handleHotkey)
  }, [])

  const isReadyToAnalyze = useMemo(() => {
    return Boolean(jobDescription.trim()) && candidateDocuments.length > 0
  }, [jobDescription, candidateDocuments.length])

  const analysisSnapshot = useMemo(() => {
    if (!analysisResults.length) return null
    const scored = analysisResults.map(result => ({ result, score: computeScore(result) }))
    const maxScore = Math.max(...scored.map(item => item.score))
    const bestMatches = scored.filter(item => item.score === maxScore)
    const average = Math.round(
      scored.reduce((sum, item) => sum + item.score, 0) / Math.max(1, scored.length)
    )
    const flagged = analysisResults.filter(result => result.ethical_compliance === false).length
    return { average, bestMatches, maxScore, flagged }
  }, [analysisResults])

  const lastAssistantPreview = useMemo(() => {
    return [...chatPreview].reverse().find(message => message.type === 'assistant') || null
  }, [chatPreview])

  const lastUserPreview = useMemo(() => {
    return [...chatPreview].reverse().find(message => message.type === 'user') || null
  }, [chatPreview])

  const chatPreviewText = lastAssistantPreview
    ? truncate(lastAssistantPreview.message)
    : 'Disponible para resolver dudas al instante.'
  const chatPreviewUserText = lastUserPreview ? truncate(lastUserPreview.message, 70) : null

  const handleAnalyze = async () => {
    if (!isReadyToAnalyze) {
      setAnalysisError('Carga la descripción del puesto y al menos un CV para habilitar el análisis.')
      return
    }

    const payload: AnalyzeRequestPayload = {
      jobDescription,
      candidates: candidateDocuments,
      modelId: MODEL_ID,
    }

    try {
      setIsAnalyzing(true)
      setAnalysisError(null)
      const results = await analyzeCandidates(payload)
      setAnalysisResults(results)
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'No fue posible generar el análisis. Intenta nuevamente.'
      setAnalysisError(detail)
      setAnalysisResults([])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const openChat = () => setIsChatOpen(true)

  return (
    <ProtectedRoute>
      <main className="page-shell">
        {/* Barra de información del usuario (siempre visible) */}
        <UserBar />
        
        {/* Menú de administración (solo para admins) */}
        <AdminMenu />

        <header className="hero" aria-labelledby="intro">
        <div className="hero__content">
          <div className="hero__logo hero__logo--large">
            <Image
              src="/logo.png"
              alt="agente-rh"
              fill
              priority
              style={{ objectFit: 'contain' }}
              sizes="320px"
            />
          </div>
          <h1 id="intro" className="hero__title">
            Asistente GPT de RH para la pre-selección de candidatos
          </h1>
          <p className="hero__description">
            Carga la descripción del puesto y los CVs en PDF. Nuestro asistente genera comparativos objetivos,
            destaca riesgos éticos y te acompaña en la toma de decisiones.
          </p>
          <div className="hero__pills" role="list">
            <span role="listitem"><ShieldCheck size={16} /> Cumplimiento ético automatizado</span>
            <span role="listitem"><BarChart3 size={16} /> Puntajes comparativos inmediatos</span>
            <span role="listitem"><Sparkles size={16} /> Flujos guiados en 3 pasos</span>
          </div>
          <div className="hero__actions">
            <button type="button" className="btn-outline hero__chat" onClick={openChat}>
              <MessageCircle size={18} />
              <span>Abrir chat con IA</span>
            </button>
          </div>
        </div>
        <aside className="hero-sidecard" aria-label="Ruta guiada del proceso">
          <p className="hero-sidecard__title">Ruta guiada</p>
          <ul className="hero-sidecard__list">
            <li>
              <div className="hero-sidecard__icon" aria-hidden="true">
                <FileText size={18} />
              </div>
              <div>
                <strong>Job Description</strong>
                <span>Sube el PDF para extraer criterios clave.</span>
              </div>
            </li>
            <li>
              <div className="hero-sidecard__icon" aria-hidden="true">
                <Users size={18} />
              </div>
              <div>
                <strong>CVs de talento</strong>
                <span>Procesa varios currículums en segundos.</span>
              </div>
            </li>
            <li>
              <div className="hero-sidecard__icon" aria-hidden="true">
                <BarChart3 size={18} />
              </div>
              <div>
                <strong>Insight accionable</strong>
                <span>Obtén síntesis y puntajes comparativos.</span>
              </div>
            </li>
          </ul>
          <div className="hero-sidecard__footer">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>Procesamiento seguro bajo estándares agente-rh.</span>
          </div>
        </aside>
      </header>

      <section className="workspace">
        <div className="workspace__primary">
          <div className="intake-grid">
            <JobDescriptionInput
              jobDescription={jobDescription}
              onJobDescriptionChange={value => {
                setJobDescription(value)
                setAnalysisResults([])
              }}
            />

            <CandidateForm
              onCandidatesChange={docs => {
                setCandidateDocuments(docs)
                setAnalysisResults([])
              }}
            />
          </div>

          <section
            className={`analysis-callout card${isAnalyzing ? ' analysis-callout--loading' : ''}`}
            aria-live="polite"
          >
            <div className="analysis-callout__info">
              <Sparkles size={18} aria-hidden="true" />
              <div>
                <h2>El asistente GPT de RH analiza la posición y los candidatos cargados</h2>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary btn-primary--large"
              onClick={handleAnalyze}
              disabled={!isReadyToAnalyze || isAnalyzing}
            >
              {isAnalyzing ? 'Analizando…' : 'Generar análisis'}
              <ArrowRight size={16} />
            </button>
            {!isReadyToAnalyze && !isAnalyzing && (
              <p className="analysis-callout__hint">
                Carga la descripción del puesto y al menos un CV para habilitar el análisis.
              </p>
            )}
          </section>

          {analysisError && (
            <div role="alert" className="alert alert--error">
              {analysisError}
            </div>
          )}

          {analysisSnapshot && (
            <section className="card analysis-summary" aria-label="Resumen del análisis">
              <div className="analysis-summary__item">
                <span className="analysis-summary__label">Puntaje promedio</span>
                <strong>{analysisSnapshot.average}</strong>
              </div>
              <div className="analysis-summary__item">
                <span className="analysis-summary__label">Mejor match</span>
                <div>
                  {analysisSnapshot.bestMatches.length === 1 ? (
                    <>
                      <strong>
                        {analysisSnapshot.bestMatches[0].result.candidateId || analysisSnapshot.bestMatches[0].result.filename}
                      </strong>
                      <span>{analysisSnapshot.maxScore}/100</span>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        {analysisSnapshot.bestMatches.length} empates ({analysisSnapshot.maxScore}/100)
                      </span>
                      {analysisSnapshot.bestMatches.map((match, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.9rem' }}>
                            {match.result.candidateId || match.result.filename}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="analysis-summary__item analysis-summary__item--accent">
                <span className="analysis-summary__label">Alertas éticas</span>
                <strong>{analysisSnapshot.flagged}</strong>
              </div>
            </section>
          )}

          <AnalysisResult results={analysisResults} />
        </div>
      </section>

      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        selectedModel={MODEL_ID}
        onPreviewChange={setChatPreview}
      />
      </main>
    </ProtectedRoute>
  )
}
