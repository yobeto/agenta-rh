'use client'

import { useState } from 'react'
import type { CandidateAnalysisResult } from '@/types'
import { AlertTriangle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'

interface Props {
  results: CandidateAnalysisResult[]
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
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId],
    }))
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
      </div>

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

          return (
            <article key={cardId} className={`candidate-result candidate-result--${tone}`}>
              <header className="candidate-result__header">
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
                <div className="candidate-result__chips">
                  <span className={`chip chip--confidence-${result.confidence_level}`}>
                    {confidenceLabels[result.confidence_level] || 'Confianza no disponible'}
                  </span>
                  <span className={`chip chip--ethics-${result.ethical_compliance === false ? 'alert' : 'ok'}`}>
                    {result.ethical_compliance === false ? 'Requiere revisión ética' : 'Cumplimiento ético'}
                  </span>
                </div>
                <button
                  type="button"
                  className="candidate-result__toggle"
                  onClick={() => toggleCard(cardId)}
                >
                  {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                </button>
              </header>

              <p className="candidate-result__summary">{isExpanded ? result.recommendation : summary}</p>

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
    </section>
  )
}
