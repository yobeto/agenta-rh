'use client'

import { useState, useEffect } from 'react'
import type { CandidateAnalysisResult } from '@/types'
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
  const [showBulkActions, setShowBulkActions] = useState(false)
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

  const handleActionConfirm = async (reason: string) => {
    if (!actionModal.candidateId || !actionModal.action || !actionModal.result) return

    const candidateId = actionModal.candidateId
    const status = actionModal.action
    const result = actionModal.result

    try {
      // Enviar al backend
      await registerCandidateAction({
        candidate_id: candidateId,
        candidate_filename: result.filename,
        action: status,
        reason: reason || undefined
      })
      
      // Actualizar estado local
      setCandidateActions(prev => ({
        ...prev,
        [candidateId]: { candidateId, status, notes: reason }
      }))
      setSelectedCandidates(prev => {
        const next = new Set(prev)
        next.delete(candidateId)
        return next
      })
    } catch (error) {
      console.error('Error registrando acción:', error)
      // Aún así actualizar el estado local para feedback inmediato
      setCandidateActions(prev => ({
        ...prev,
        [candidateId]: { candidateId, status, notes: reason }
      }))
    } finally {
      setActionModal({ isOpen: false, candidateId: null, action: null, result: null })
    }
  }

  const applyAction = async (candidateId: string, status: CandidateStatus, result: CandidateAnalysisResult, reason: string = '') => {
    try {
      // Enviar al backend
      await registerCandidateAction({
        candidate_id: candidateId,
        candidate_filename: result.filename,
        action: status,
        reason: reason || undefined
      })
      
      // Actualizar estado local
      setCandidateActions(prev => ({
        ...prev,
        [candidateId]: { candidateId, status, notes: reason }
      }))
      setSelectedCandidates(prev => {
        const next = new Set(prev)
        next.delete(candidateId)
        return next
      })
    } catch (error) {
      console.error('Error registrando acción:', error)
      // Aún así actualizar el estado local para feedback inmediato
      setCandidateActions(prev => ({
        ...prev,
        [candidateId]: { candidateId, status, notes: reason }
      }))
    }
  }

  const applyBulkAction = async (status: CandidateStatus, reason: string = '') => {
    const updates: Record<string, CandidateAction> = {}
    const promises: Promise<void>[] = []
    
    selectedCandidates.forEach(id => {
      // Encontrar el resultado correspondiente
      const result = results.find(r => getCandidateId(r) === id)
      if (result) {
        promises.push(
          registerCandidateAction({
            candidate_id: id,
            candidate_filename: result.filename,
            action: status,
            reason: reason || undefined
          }).then(() => {
            updates[id] = { candidateId: id, status, notes: reason }
          }).catch(error => {
            console.error(`Error registrando acción para ${id}:`, error)
            // Aún así actualizar localmente
            updates[id] = { candidateId: id, status, notes: reason }
          })
        )
      }
    })
    
    await Promise.all(promises)
    setCandidateActions(prev => ({ ...prev, ...updates }))
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

  const handleBulkActionConfirm = async (reason: string) => {
    if (!actionModal.action) return
    
    const status = actionModal.action
    await applyBulkAction(status, reason)
    setActionModal({ isOpen: false, candidateId: null, action: null, result: null })
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
          const riskItems = [] as string[]
          if (result.ethical_compliance === false) {
            riskItems.push('Requiere revisión ética antes de avanzar.')
          }
          if (result.missing_information && result.missing_information.length > 0) {
            riskItems.push(...result.missing_information)
          }
          if (riskItems.length === 0) {
            riskItems.push('Sin alertas relevantes detectadas.')
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
                  <h4>Fortalezas detectadas</h4>
                  <ul>
                    {strengths.length > 0 ? (
                      strengths.map((criterion, index) => (
                        <li key={`${cardId}-strength-${index}`}>{criterion.name}: {criterion.value}</li>
                      ))
                    ) : (
                      <li>No se identificaron fortalezas destacadas.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4>Riesgos y alertas</h4>
                  <ul>
                    {riskItems.map((item, index) => (
                      <li key={`${cardId}-risk-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {isExpanded && (
                <div className="candidate-result__details">
                  <div className="candidate-result__panel">
                    <h4>Criterios objetivos evaluados</h4>
                    {result.objective_criteria.length === 0 && <p>No se proporcionaron criterios objetivos.</p>}
                    {result.objective_criteria.map((criterion, index) => {
                      const contribution =
                        totalWeight > 0 && criterion.weight !== undefined && criterion.weight !== null
                          ? Math.round((Math.max(0, criterion.weight) / totalWeight) * 100)
                          : null
                      return (
                        <div key={`${cardId}-criterion-${index}`} className="criterion-bar">
                          <div className="criterion-bar__label">
                            <strong>{criterion.name}</strong>
                            {criterion.weight !== undefined && criterion.weight !== null && (
                              <span>{Math.round(Math.max(0, criterion.weight) * 100)}%</span>
                            )}
                          </div>
                          <p>{criterion.value}</p>
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
