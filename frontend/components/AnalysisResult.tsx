'use client'

import { useState, useEffect } from 'react'
import type { CandidateAnalysisResult, Risk } from '@/types'
import { AlertTriangle, CheckCircle2, ShieldCheck, Sparkles, Users, X, CheckCircle, Clock, XCircle } from 'lucide-react'
import { registerCandidateAction } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { ActionReasonModal } from './ActionReasonModal'

interface Props {
  results: CandidateAnalysisResult[]
}

type CandidateStatus = 'interview' | 'rejected' | 'on_hold'

interface CandidateAction {
  candidateId: string
  status: CandidateStatus
  notes?: string
}

interface PendingAction {
  candidateId: string
  candidateFilename: string
  status: CandidateStatus
  reason: string
}

const confidenceLabels: Record<string, string> = {
  high: 'Confianza alta',
  medium: 'Confianza media',
  low: 'Confianza baja',
  insufficient: 'Confianza insuficiente',
}

const confidenceScores: Record<string, number> = {
  high: 92,
  medium: 76,
  low: 58,
  insufficient: 45,
}

const SUMMARY_LIMIT = 240

function summarize(text: string): string {
  const normalized = text.trim().replace(/\s+/g, ' ')
  if (normalized.length <= SUMMARY_LIMIT) return normalized
  const truncated = normalized.slice(0, SUMMARY_LIMIT)
  const lastSentence = truncated.lastIndexOf('.')
  if (lastSentence > SUMMARY_LIMIT * 0.6) {
    return `${truncated.slice(0, lastSentence + 1)}`
  }
  return `${truncated}…`
}

function getScore(result: CandidateAnalysisResult): number {
  const base = confidenceScores[result.confidence_level] ?? 70
  const penalty = result.missing_information && result.missing_information.length > 0 ? 10 : 0
  const bonus = result.objective_criteria.length >= 3 ? 5 : 0
  const score = base - penalty + bonus
  return Math.max(30, Math.min(100, Math.round(score)))
}

function getScoreTone(score: number): 'alto' | 'medio' | 'bajo' {
  if (score >= 85) return 'alto'
  if (score >= 70) return 'medio'
  return 'bajo'
}

export function AnalysisResult({ results }: Props) {
  const { user } = useAuth()
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set())
  const [candidateActions, setCandidateActions] = useState<Record<string, CandidateAction>>({})
  const [pendingActions, setPendingActions] = useState<Record<string, PendingAction>>({})
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean
    candidateId: string | null
    action: CandidateStatus | null
    result: CandidateAnalysisResult | null
  }>({
    isOpen: false,
    candidateId: null,
    action: null,
    result: null
  })

  // Cargar acciones guardadas del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('candidate-actions')
    if (saved) {
      try {
        setCandidateActions(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading candidate actions:', e)
      }
    }
  }, [])

  // Guardar acciones en localStorage
  useEffect(() => {
    if (Object.keys(candidateActions).length > 0) {
      localStorage.setItem('candidate-actions', JSON.stringify(candidateActions))
    }
  }, [candidateActions])

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId],
    }))
  }

  const getCandidateId = (result: CandidateAnalysisResult) => {
    return `${result.filename}-${result.candidateId || 'default'}`
  }

  const toggleSelection = (candidateId: string) => {
    setSelectedCandidates(prev => {
      const next = new Set(prev)
      if (next.has(candidateId)) {
        next.delete(candidateId)
      } else {
        next.add(candidateId)
      }
      return next
    })
  }

  const selectAll = () => {
    const allIds = new Set(results.map(r => getCandidateId(r)))
    setSelectedCandidates(allIds)
    setShowBulkActions(true)
  }

  const deselectAll = () => {
    setSelectedCandidates(new Set())
    setShowBulkActions(false)
  }

  const handleActionClick = (candidateId: string, status: CandidateStatus, result: CandidateAnalysisResult) => {
    setActionModal({
      isOpen: true,
      candidateId,
      action: status,
      result
    })
  }

  const handleActionConfirm = (reason: string) => {
    if (!actionModal.candidateId || !actionModal.action || !actionModal.result) return

    const candidateId = actionModal.candidateId
    const status = actionModal.action
    const result = actionModal.result

    // Guardar como acción pendiente (NO enviar al backend todavía)
    setPendingActions(prev => ({
      ...prev,
      [candidateId]: {
        candidateId,
        candidateFilename: result.filename,
        status,
        reason: reason || ''
      }
    }))
    
    // Actualizar estado visual local (para mostrar que la acción está seleccionada)
    setCandidateActions(prev => ({
      ...prev,
      [candidateId]: { candidateId, status, notes: reason }
    }))
    
    // Cerrar modal
    setActionModal({ isOpen: false, candidateId: null, action: null, result: null })
  }

  const applyAction = (candidateId: string, status: CandidateStatus, result: CandidateAnalysisResult, reason: string = '') => {
    // Guardar como acción pendiente (NO enviar al backend todavía)
    setPendingActions(prev => ({
      ...prev,
      [candidateId]: {
        candidateId,
        candidateFilename: result.filename,
        status,
        reason: reason || ''
      }
    }))
    
    // Actualizar estado visual local
    setCandidateActions(prev => ({
      ...prev,
      [candidateId]: { candidateId, status, notes: reason }
    }))
  }

  const applyBulkAction = (status: CandidateStatus, reason: string = '') => {
    const pendingUpdates: Record<string, PendingAction> = {}
    const visualUpdates: Record<string, CandidateAction> = {}
    
    selectedCandidates.forEach(id => {
      // Encontrar el resultado correspondiente
      const result = results.find(r => getCandidateId(r) === id)
      if (result) {
        // Guardar como acción pendiente
        pendingUpdates[id] = {
          candidateId: id,
          candidateFilename: result.filename,
          status,
          reason: reason || ''
        }
        // Actualizar estado visual
        visualUpdates[id] = { candidateId: id, status, notes: reason }
      }
    })
    
    setPendingActions(prev => ({ ...prev, ...pendingUpdates }))
    setCandidateActions(prev => ({ ...prev, ...visualUpdates }))
    setSelectedCandidates(new Set())
    setShowBulkActions(false)
  }

  const handleBulkActionClick = (status: CandidateStatus) => {
    // Para acciones en lote, también pedir razón si es rechazo
    if (status === 'rejected') {
      // Abrir modal para razón
      setActionModal({
        isOpen: true,
        candidateId: 'bulk',
        action: status,
        result: null
      })
    } else {
      // Para otras acciones, aplicar directamente sin razón
      applyBulkAction(status, '')
    }
  }

  const handleBulkActionConfirm = (reason: string) => {
    if (!actionModal.action) return
    
    const status = actionModal.action
    applyBulkAction(status, reason)
    setActionModal({ isOpen: false, candidateId: null, action: null, result: null })
  }

  const handleSubmitDecisions = async () => {
    if (Object.keys(pendingActions).length === 0) return

    setIsSubmitting(true)
    const errors: string[] = []
    const successful: string[] = []

    try {
      // Enviar todas las acciones pendientes al backend
      const promises = Object.values(pendingActions).map(async (pendingAction) => {
        try {
          await registerCandidateAction({
            candidate_id: pendingAction.candidateId,
            candidate_filename: pendingAction.candidateFilename,
            action: pendingAction.status,
            reason: pendingAction.reason || undefined
          })
          successful.push(pendingAction.candidateId)
        } catch (error) {
          console.error(`Error registrando acción para ${pendingAction.candidateId}:`, error)
          errors.push(pendingAction.candidateId)
        }
      })

      await Promise.all(promises)

      // Si hubo errores, mostrar mensaje
      if (errors.length > 0) {
        alert(`Se registraron ${successful.length} decisiones exitosamente, pero ${errors.length} fallaron. Por favor, intenta nuevamente.`)
      } else {
        // Resetear todo el estado después de enviar exitosamente
        setPendingActions({})
        setCandidateActions({})
        setSelectedCandidates(new Set())
        setShowBulkActions(false)
        setExpandedCards({})
        
        // Mostrar mensaje de éxito
        alert(`Se registraron exitosamente ${successful.length} decisión${successful.length > 1 ? 'es' : ''} en la bitácora.`)
      }
    } catch (error) {
      console.error('Error enviando decisiones:', error)
      alert('Hubo un error al enviar las decisiones. Por favor, intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusLabel = (status: CandidateStatus): string => {
    switch (status) {
      case 'interview': return 'Pasar a entrevista'
      case 'rejected': return 'Rechazar'
      case 'on_hold': return 'En espera'
      default: return 'Pendiente'
    }
  }

  const getStatusIcon = (status: CandidateStatus) => {
    switch (status) {
      case 'interview': return <CheckCircle size={16} />
      case 'rejected': return <XCircle size={16} />
      case 'on_hold': return <Clock size={16} />
      default: return null
    }
  }

  return (
    <section className="card analysis-results" aria-labelledby="analysis-result">
      <div className="analysis-results__head">
        <div className="badge">Resultados preliminares</div>
        <div>
          <h2 id="analysis-result" className="section-title">
            Insight generado por IA
          </h2>
          <p>
            Usa estas recomendaciones como guía objetiva. Verifica la información con entrevistas y decisiones humanas
            antes de avanzar a la siguiente etapa.
          </p>
        </div>
        {results.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={selectedCandidates.size === results.length ? deselectAll : selectAll}
              className="btn-outline"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              {selectedCandidates.size === results.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
            {selectedCandidates.size > 0 && (
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {selectedCandidates.size} candidato{selectedCandidates.size !== 1 ? 's' : ''} seleccionado{selectedCandidates.size !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Panel de acciones pendientes y botón de envío */}
      {Object.keys(pendingActions).length > 0 && (
        <div className="card" style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(0, 168, 89, 0.08), rgba(0, 59, 113, 0.05))',
          border: '2px solid rgba(0, 168, 89, 0.3)',
          borderRadius: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={20} color="#00a859" />
              <div>
                <strong style={{ display: 'block', color: '#1e293b', marginBottom: '0.25rem' }}>
                  Decisiones pendientes de envío
                </strong>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {Object.keys(pendingActions).length} decisión{Object.keys(pendingActions).length > 1 ? 'es' : ''} lista{Object.keys(pendingActions).length > 1 ? 's' : ''} para registrar en la bitácora
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmitDecisions}
              disabled={isSubmitting}
              className="btn-primary"
              style={{ 
                fontSize: '0.875rem', 
                padding: '0.625rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600,
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <>
                  <Clock size={16} />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Enviar decisión{Object.keys(pendingActions).length > 1 ? 'es' : ''}
                </>
              )}
            </button>
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '0.5rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(0, 168, 89, 0.2)'
          }}>
            {Object.values(pendingActions).map((action) => {
              const result = results.find(r => getCandidateId(r) === action.candidateId)
              return (
                <span
                  key={action.candidateId}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.5rem',
                    background: action.status === 'interview' 
                      ? 'rgba(0, 168, 89, 0.1)' 
                      : action.status === 'rejected'
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(148, 163, 184, 0.1)',
                    color: action.status === 'interview'
                      ? '#00a859'
                      : action.status === 'rejected'
                      ? '#dc2626'
                      : '#64748b',
                    border: `1px solid ${
                      action.status === 'interview' 
                        ? 'rgba(0, 168, 89, 0.3)' 
                        : action.status === 'rejected'
                        ? 'rgba(239, 68, 68, 0.3)'
                        : 'rgba(148, 163, 184, 0.3)'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {getStatusIcon(action.status)}
                  <span>{result?.candidateId || result?.filename || action.candidateId}</span>
                  <button
                    type="button"
                    onClick={() => {
                      // Remover de acciones pendientes
                      setPendingActions(prev => {
                        const next = { ...prev }
                        delete next[action.candidateId]
                        return next
                      })
                      // Remover del estado visual
                      setCandidateActions(prev => {
                        const next = { ...prev }
                        delete next[action.candidateId]
                        return next
                      })
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.125rem',
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: '0.25rem'
                    }}
                    title="Cancelar decisión"
                  >
                    <X size={14} />
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Panel de acciones en lote */}
      {showBulkActions && selectedCandidates.size > 0 && (
        <div className="card" style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(0, 59, 113, 0.05), rgba(0, 168, 89, 0.03))',
          border: '1px solid rgba(0, 59, 113, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} />
              <strong>Acciones en lote ({selectedCandidates.size} candidatos)</strong>
            </div>
            <button
              type="button"
              onClick={() => setShowBulkActions(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleBulkActionClick('interview')}
              className="btn-primary"
              style={{ fontSize: '0.875rem', padding: '0.625rem 1.25rem' }}
            >
              <CheckCircle size={16} style={{ marginRight: '0.5rem' }} />
              Pasar a entrevista
            </button>
            <button
              type="button"
              onClick={() => handleBulkActionClick('on_hold')}
              className="btn-outline"
              style={{ fontSize: '0.875rem', padding: '0.625rem 1.25rem' }}
            >
              <Clock size={16} style={{ marginRight: '0.5rem' }} />
              En espera
            </button>
            <button
              type="button"
              onClick={() => handleBulkActionClick('rejected')}
              style={{ 
                fontSize: '0.875rem', 
                padding: '0.625rem 1.25rem',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <XCircle size={16} />
              Rechazar
            </button>
          </div>
        </div>
      )}

      {(!results || results.length === 0) && (
        <div className="status-empty status-empty--accent">
          <Sparkles size={20} aria-hidden="true" />
          <div>
            <p>No hay análisis disponibles todavía.</p>
            <span>Cuando cargues los archivos y ejecutes el proceso, verás aquí un resumen por candidato.</span>
          </div>
        </div>
      )}

      <div className="candidate-results">
        {results.map(result => {
          const cardId = `${result.filename}-${result.candidateId || 'default'}`
          const isExpanded = Boolean(expandedCards[cardId])
          const summary = summarize(result.recommendation)
          const score = getScore(result)
          const tone = getScoreTone(score)
          const strengths = [...result.objective_criteria]
            .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
            .slice(0, 3)
            .filter(criterion => criterion.value)
          // Procesar riesgos estructurados
          const riskItems: Array<{category: string, level: 'alto' | 'medio' | 'bajo', description: string}> = []
          const riskLabels: Record<string, string> = {
            'técnico': 'Técnico',
            'experiencia': 'Experiencia',
            'formación': 'Formación',
            'área_funcional': 'Área Funcional',
            'cumplimiento': 'Cumplimiento'
          }
          
          // Si hay riesgos estructurados, usarlos
          if (result.risks && Array.isArray(result.risks) && result.risks.length > 0) {
            riskItems.push(...result.risks.map((r: Risk) => ({
              category: riskLabels[r.category] || r.category || 'General',
              level: r.level || 'medio',
              description: r.description || 'Riesgo no especificado'
            })))
          } else {
            // Fallback: usar missing_information como riesgos
          if (result.ethical_compliance === false) {
              riskItems.push({
                category: 'Cumplimiento',
                level: 'alto',
                description: 'Requiere revisión ética antes de avanzar.'
              })
          }
          if (result.missing_information && result.missing_information.length > 0) {
              result.missing_information.forEach((info: string) => {
                riskItems.push({
                  category: 'Cumplimiento',
                  level: 'medio',
                  description: info
                })
              })
          }
          if (riskItems.length === 0) {
              riskItems.push({
                category: 'General',
                level: 'bajo',
                description: 'Sin alertas relevantes detectadas.'
              })
            }
          }
          const followUps = result.missing_information && result.missing_information.length > 0
            ? result.missing_information
            : [
                'Profundiza en motivaciones y expectativas salariales.',
                'Valida referencias laborales y logros cuantificables.',
                'Asegura disponibilidad para los hitos críticos del puesto.',
              ]
          const totalWeight = result.objective_criteria.reduce((acc, criterion) => {
            if (criterion.weight !== undefined && criterion.weight !== null && !Number.isNaN(criterion.weight)) {
              return acc + Math.max(0, criterion.weight)
            }
            return acc
          }, 0)

          const candidateId = getCandidateId(result)
          const isSelected = selectedCandidates.has(candidateId)
          const action = candidateActions[candidateId]

          return (
            <article key={cardId} className={`candidate-result candidate-result--${tone}`}>
              <header className="candidate-result__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      toggleSelection(candidateId)
                      if (!isSelected) setShowBulkActions(true)
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                <div className="candidate-result__identity">
                  <div className={`candidate-result__score candidate-result__score--${tone}`}>
                    <span>{score}</span>
                    <small>/100</small>
                  </div>
                  <div>
                    <h3>{result.candidateId || result.filename}</h3>
                    <p>{result.filename}</p>
                    </div>
                  </div>
                </div>
                <div className="candidate-result__chips">
                  <span className={`chip chip--confidence-${result.confidence_level}`}>
                    {confidenceLabels[result.confidence_level] || 'Confianza no disponible'}
                  </span>
                  <span className={`chip chip--ethics-${result.ethical_compliance === false ? 'alert' : 'ok'}`}>
                    {result.ethical_compliance === false ? 'Requiere revisión ética' : 'Cumplimiento ético'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {action && (
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      background: action.status === 'interview' 
                        ? 'rgba(0, 168, 89, 0.1)' 
                        : action.status === 'rejected'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(148, 163, 184, 0.1)',
                      color: action.status === 'interview'
                        ? '#00a859'
                        : action.status === 'rejected'
                        ? '#dc2626'
                        : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 600
                    }}>
                      {getStatusIcon(action.status)}
                      {getStatusLabel(action.status)}
                    </span>
                  )}
                <button
                  type="button"
                  className="candidate-result__toggle"
                  onClick={() => toggleCard(cardId)}
                >
                  {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                </button>
                </div>
              </header>

              {/* Resumen ejecutivo */}
              <div style={{
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Match:</span>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 600,
                      color: score >= 75 ? '#00a859' : score >= 60 ? '#d97706' : '#dc2626'
                    }}>
                      {score >= 75 ? 'Alto' : score >= 60 ? 'Medio' : 'Bajo'} ({score}%)
                    </span>
                  </div>
                  {strengths.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} color="#00a859" />
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {strengths.length} insight{strengths.length > 1 ? 's' : ''} destacado{strengths.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {riskItems.filter(r => r.level === 'alto').length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={16} color="#dc2626" />
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 500 }}>
                        {riskItems.filter(r => r.level === 'alto').length} riesgo{riskItems.filter(r => r.level === 'alto').length > 1 ? 's' : ''} alto{riskItems.filter(r => r.level === 'alto').length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="candidate-result__summary">{isExpanded ? result.recommendation : summary}</p>

              {/* Acciones rápidas */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  onClick={() => handleActionClick(candidateId, 'interview', result)}
                  style={{
                    fontSize: '0.875rem',
                    padding: '0.5rem 1rem',
                    background: action?.status === 'interview' 
                      ? 'rgba(0, 168, 89, 0.15)' 
                      : 'rgba(0, 168, 89, 0.08)',
                    color: action?.status === 'interview' ? '#00a859' : '#00a859',
                    border: `1px solid ${action?.status === 'interview' ? '#00a859' : 'rgba(0, 168, 89, 0.3)'}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (action?.status !== 'interview') {
                      e.currentTarget.style.background = 'rgba(0, 168, 89, 0.12)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (action?.status !== 'interview') {
                      e.currentTarget.style.background = 'rgba(0, 168, 89, 0.08)'
                    }
                  }}
                >
                  <CheckCircle size={16} />
                  Pasar a entrevista
                </button>
                <button
                  type="button"
                  onClick={() => handleActionClick(candidateId, 'on_hold', result)}
                  style={{
                    fontSize: '0.875rem',
                    padding: '0.5rem 1rem',
                    background: action?.status === 'on_hold'
                      ? 'rgba(148, 163, 184, 0.15)'
                      : 'rgba(148, 163, 184, 0.08)',
                    color: action?.status === 'on_hold' ? '#475569' : '#64748b',
                    border: `1px solid ${action?.status === 'on_hold' ? '#94a3b8' : 'rgba(148, 163, 184, 0.3)'}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  <Clock size={16} />
                  En espera
                </button>
                <button
                  type="button"
                  onClick={() => handleActionClick(candidateId, 'rejected', result)}
                  style={{
                    fontSize: '0.875rem',
                    padding: '0.5rem 1rem',
                    background: action?.status === 'rejected'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(239, 68, 68, 0.08)',
                    color: action?.status === 'rejected' ? '#dc2626' : '#ef4444',
                    border: `1px solid ${action?.status === 'rejected' ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  <XCircle size={16} />
                  Rechazar
                </button>
              </div>

              <div className="candidate-result__highlights">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0 }}>Insights</h4>
                    {strengths.length > 0 && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        background: 'rgba(0, 168, 89, 0.1)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontWeight: 500
                      }}>
                        {strengths.length} {strengths.length === 1 ? 'insight' : 'insights'}
                      </span>
                    )}
                  </div>
                  {strengths.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {strengths.map((criterion, index) => {
                        // Detectar tipo de coincidencia en el valor
                        const valueLower = criterion.value.toLowerCase()
                        const matchType = valueLower.includes('coincidencia: exacta') ? 'EXACTA' :
                                         valueLower.includes('coincidencia: parcial') ? 'PARCIAL' :
                                         valueLower.includes('coincidencia: ninguna') ? 'NINGUNA' : null
                        
                        return (
                          <div 
                            key={`${cardId}-strength-${index}`}
                            style={{
                              padding: '0.875rem',
                              background: 'rgba(0, 168, 89, 0.05)',
                              border: '1px solid rgba(0, 168, 89, 0.15)',
                              borderRadius: '0.5rem',
                              borderLeft: '3px solid #00a859',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <strong style={{ 
                                display: 'block',
                                fontSize: '0.875rem',
                                color: '#00a859',
                                fontWeight: 600,
                                flex: 1
                              }}>
                                {criterion.name}
                              </strong>
                              {matchType && (
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  padding: '0.2rem 0.4rem',
                                  borderRadius: '0.25rem',
                                  background: matchType === 'EXACTA' ? 'rgba(0, 168, 89, 0.15)' :
                                            matchType === 'PARCIAL' ? 'rgba(245, 158, 11, 0.15)' :
                                            'rgba(239, 68, 68, 0.15)',
                                  color: matchType === 'EXACTA' ? '#00a859' :
                                        matchType === 'PARCIAL' ? '#d97706' :
                                        '#dc2626',
                                  textTransform: 'uppercase'
                                }}>
                                  {matchType}
                                </span>
                              )}
                              {criterion.weight !== undefined && criterion.weight !== null && (
                                <span style={{
                                  fontSize: '0.7rem',
                                  color: '#64748b',
                                  fontWeight: 500
                                }}>
                                  {Math.round(criterion.weight * 100)}%
                                </span>
                              )}
                            </div>
                            <p style={{
                              margin: 0,
                              fontSize: '0.875rem',
                              color: '#1e293b',
                              lineHeight: '1.6',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {criterion.value}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontSize: '0.875rem', fontStyle: 'italic', margin: 0 }}>
                      No se identificaron insights destacados.
                    </p>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0 }}>Riesgos y alertas</h4>
                    {riskItems.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {riskItems.filter(r => r.level === 'alto').length > 0 && (
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#dc2626',
                            background: 'rgba(239, 68, 68, 0.1)',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '0.25rem',
                            fontWeight: 600
                          }}>
                            {riskItems.filter(r => r.level === 'alto').length} alto{riskItems.filter(r => r.level === 'alto').length > 1 ? 's' : ''}
                          </span>
                        )}
                        {riskItems.filter(r => r.level === 'medio').length > 0 && (
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#d97706',
                            background: 'rgba(245, 158, 11, 0.1)',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '0.25rem',
                            fontWeight: 600
                          }}>
                            {riskItems.filter(r => r.level === 'medio').length} medio{riskItems.filter(r => r.level === 'medio').length > 1 ? 's' : ''}
                          </span>
                        )}
                        {riskItems.filter(r => r.level === 'bajo').length > 0 && (
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#64748b',
                            background: 'rgba(148, 163, 184, 0.1)',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '0.25rem',
                            fontWeight: 600
                          }}>
                            {riskItems.filter(r => r.level === 'bajo').length} bajo{riskItems.filter(r => r.level === 'bajo').length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {riskItems.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {riskItems.map((item, index) => {
                        // Normalizar la descripción del riesgo para que indique claramente lo que falta
                        let normalizedDescription = item.description
                        const lowerDesc = normalizedDescription.toLowerCase()
                        
                        // Si la descripción no indica claramente que algo falta, agregarlo
                        if (!lowerDesc.startsWith('no se menciona') && 
                            !lowerDesc.startsWith('faltan') && 
                            !lowerDesc.startsWith('falta') &&
                            !lowerDesc.startsWith('ausencia') &&
                            !lowerDesc.startsWith('no se encontró') &&
                            !lowerDesc.startsWith('no se encontraron') &&
                            !lowerDesc.includes('no coincide') &&
                            !lowerDesc.includes('no está') &&
                            !lowerDesc.includes('no cumple')) {
                          // Si parece ser un requisito específico, agregar "No se menciona"
                          normalizedDescription = `No se menciona ${normalizedDescription.toLowerCase()}`
                        }
                        
                        const levelColors: Record<string, {bg: string, text: string, border: string}> = {
                          'alto': { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', border: 'rgba(239, 68, 68, 0.3)' },
                          'medio': { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', border: 'rgba(245, 158, 11, 0.3)' },
                          'bajo': { bg: 'rgba(148, 163, 184, 0.1)', text: '#64748b', border: 'rgba(148, 163, 184, 0.3)' }
                        }
                        const colors = levelColors[item.level] || levelColors['medio']
                        return (
                          <div 
                            key={`${cardId}-risk-${index}`}
                            style={{
                              padding: '0.75rem',
                              background: colors.bg,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '0.5rem',
                              borderLeft: `4px solid ${colors.text}`
                            }}
                          >
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              gap: '0.5rem',
                              flexWrap: 'wrap',
                              marginBottom: '0.5rem'
                            }}>
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: colors.text,
                                textTransform: 'uppercase',
                                padding: '0.25rem 0.5rem',
                                background: colors.bg,
                                borderRadius: '0.25rem',
                                border: `1px solid ${colors.border}`
                              }}>
                                {item.level}
                              </span>
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                color: '#64748b'
                              }}>
                                {item.category}
                              </span>
                            </div>
                            <p style={{
                              margin: 0,
                              fontSize: '0.875rem',
                              color: '#1e293b',
                              lineHeight: '1.5'
                            }}>
                              {normalizedDescription}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontSize: '0.875rem', fontStyle: 'italic' }}>
                      Sin alertas relevantes detectadas.
                    </p>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="candidate-result__details">
                  <div className="candidate-result__panel">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0 }}>Criterios objetivos evaluados</h4>
                      {result.objective_criteria.length > 0 && (
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          background: 'rgba(59, 130, 246, 0.1)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontWeight: 500
                        }}>
                          {result.objective_criteria.length} {result.objective_criteria.length === 1 ? 'criterio' : 'criterios'}
                        </span>
                      )}
                    </div>
                    {result.objective_criteria.length === 0 && <p>No se proporcionaron criterios objetivos.</p>}
                    {result.objective_criteria.map((criterion, index) => {
                      const contribution =
                        totalWeight > 0 && criterion.weight !== undefined && criterion.weight !== null
                          ? Math.round((Math.max(0, criterion.weight) / totalWeight) * 100)
                          : null
                      return (
                        <div key={`${cardId}-criterion-${index}`} className="criterion-bar" style={{ marginBottom: '1rem' }}>
                          <div className="criterion-bar__label">
                            <strong>{criterion.name}</strong>
                            {criterion.weight !== undefined && criterion.weight !== null && (
                              <span>{Math.round(Math.max(0, criterion.weight) * 100)}%</span>
                            )}
                          </div>
                          <p style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>{criterion.value}</p>
                          {contribution !== null && (
                        <div className="criterion-bar__track">
                              <div style={{ width: `${Math.min(100, contribution)}%` }} />
                          <span>{contribution}%</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="candidate-result__panel">
                    <h4>Nivel de confianza</h4>
                    <div className="confidence-card">
                      <ShieldCheck size={18} aria-hidden="true" />
                      <div>
                        <strong>{confidenceLabels[result.confidence_level] || 'No disponible'}</strong>
                        <span>{result.confidence_explanation}</span>
                      </div>
                    </div>
                    <h4>Seguimiento recomendado</h4>
                    <ul className="follow-up-list">
                      {followUps.map((item, index) => (
                        <li key={`${cardId}-follow-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="candidate-result__panel">
                    <h4>Checklist para entrevista</h4>
                    <div className="checklist-card">
                      <CheckCircle2 size={18} aria-hidden="true" />
                      <span>
                        Confirma logros cuantificables y solicita evidencias de proyectos donde aplicó las competencias clave
                        señaladas en el análisis.
                      </span>
                    </div>
                    <div className="checklist-card checklist-card--warning">
                      <AlertTriangle size={18} aria-hidden="true" />
                      <span>
                        Atiende cualquier observación ética antes de avanzar el expediente del candidato a etapas finales.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {/* Modal para capturar razón */}
      {actionModal.isOpen && actionModal.action && (
        <ActionReasonModal
          isOpen={actionModal.isOpen}
          onClose={() => setActionModal({ isOpen: false, candidateId: null, action: null, result: null })}
          onConfirm={actionModal.candidateId === 'bulk' ? handleBulkActionConfirm : handleActionConfirm}
          action={actionModal.action}
          candidateName={
            actionModal.candidateId === 'bulk'
              ? `${selectedCandidates.size} candidatos seleccionados`
              : actionModal.result
              ? actionModal.result.candidateId || actionModal.result.filename
              : 'Candidato'
          }
          isRequired={actionModal.action === 'rejected'}
        />
      )}
    </section>
  )
}
