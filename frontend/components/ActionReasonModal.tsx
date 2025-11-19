'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle, CheckCircle, Clock, XCircle, Sparkles } from 'lucide-react'

type CandidateStatus = 'interview' | 'rejected' | 'on_hold'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  action: CandidateStatus
  candidateName: string
  isRequired: boolean
}

// Plantillas rápidas por tipo de acción
const REASON_TEMPLATES: Record<CandidateStatus, string[]> = {
  rejected: [
    'No cumple con los requisitos técnicos mínimos del puesto',
    'Experiencia insuficiente para el nivel requerido',
    'Falta de certificaciones o credenciales necesarias',
    'Mejor perfil encontrado entre otros candidatos',
    'No alineado con los valores y cultura organizacional',
    'Expectativas salariales fuera del rango presupuestado',
    'Disponibilidad no compatible con los horarios requeridos'
  ],
  interview: [
    'Cumple con todos los criterios objetivos del puesto',
    'Perfil destacado que merece evaluación más profunda',
    'Experiencia relevante y certificaciones en orden',
    'Buen ajuste cultural y profesional',
    'Potencial de crecimiento identificado'
  ],
  on_hold: [
    'Esperando respuesta de otros candidatos prioritarios',
    'Requiere información adicional antes de decidir',
    'Posición en proceso de redefinición de requisitos',
    'Candidato interesante pero no es el momento adecuado',
    'En espera de aprobación presupuestaria'
  ]
}

const ACTION_LABELS: Record<CandidateStatus, string> = {
  rejected: 'Rechazar candidato',
  interview: 'Pasar a entrevista',
  on_hold: 'Poner en espera'
}

const ACTION_ICONS: Record<CandidateStatus, typeof XCircle> = {
  rejected: XCircle,
  interview: CheckCircle,
  on_hold: Clock
}

const ACTION_COLORS: Record<CandidateStatus, string> = {
  rejected: '#dc2626',
  interview: '#16a34a',
  on_hold: '#f59e0b'
}

export function ActionReasonModal({ isOpen, onClose, onConfirm, action, candidateName, isRequired }: Props) {
  const [reason, setReason] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setReason('')
      setSelectedTemplate(null)
      setError(null)
    }
  }, [isOpen])

  const handleTemplateSelect = (template: string) => {
    setReason(template)
    setSelectedTemplate(template)
    setError(null)
  }

  const handleConfirm = () => {
    const trimmedReason = reason.trim()
    
    if (isRequired && trimmedReason.length < 20) {
      setError('La razón es obligatoria y debe tener al menos 20 caracteres')
      return
    }

    if (!isRequired && trimmedReason.length > 0 && trimmedReason.length < 20) {
      setError('Si proporcionas una razón, debe tener al menos 20 caracteres')
      return
    }

    onConfirm(trimmedReason || '')
    onClose()
  }

  const handleClose = () => {
    if (!isRequired || reason.trim().length === 0) {
      onClose()
    }
  }

  if (!isOpen) return null

  const Icon = ACTION_ICONS[action]
  const color = ACTION_COLORS[action]
  const templates = REASON_TEMPLATES[action]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '1rem',
          boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.3)',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: `linear-gradient(135deg, ${color}15, ${color}08)`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                background: `${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color
              }}
            >
              <Icon size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                {ACTION_LABELS[action]}
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                {candidateName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9'
              e.currentTarget.style.color = '#0f172a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = '#64748b'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Mensaje informativo */}
          <div
            style={{
              padding: '1rem',
              background: isRequired ? '#fef2f2' : '#f0f9ff',
              border: `1px solid ${isRequired ? '#fecaca' : '#bae6fd'}`,
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '0.75rem'
            }}
          >
            <AlertCircle
              size={20}
              style={{ color: isRequired ? '#dc2626' : '#0284c7', flexShrink: 0, marginTop: '0.125rem' }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                {isRequired
                  ? 'Razón obligatoria'
                  : 'Razón opcional (recomendada)'}
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                {isRequired
                  ? 'Para rechazos, debes proporcionar una razón de al menos 20 caracteres. Esto ayuda a mantener transparencia y cumplimiento.'
                  : 'Proporcionar una razón ayuda a mantener un registro claro de las decisiones. Mínimo 20 caracteres si decides incluirla.'}
              </p>
            </div>
          </div>

          {/* Plantillas rápidas */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Sparkles size={16} style={{ color: '#64748b' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                Plantillas rápidas
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {templates.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  style={{
                    padding: '0.75rem 1rem',
                    background: selectedTemplate === template ? `${color}15` : '#f8fafc',
                    border: `1px solid ${selectedTemplate === template ? color : '#e2e8f0'}`,
                    borderRadius: '0.5rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#475569',
                    transition: 'all 0.2s',
                    fontWeight: selectedTemplate === template ? 500 : 400
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTemplate !== template) {
                      e.currentTarget.style.background = '#f1f5f9'
                      e.currentTarget.style.borderColor = '#cbd5e1'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTemplate !== template) {
                      e.currentTarget.style.background = '#f8fafc'
                      e.currentTarget.style.borderColor = '#e2e8f0'
                    }
                  }}
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          {/* Campo de texto */}
          <div>
            <label
              htmlFor="reason-input"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#0f172a'
              }}
            >
              Razón {isRequired && <span style={{ color: '#dc2626' }}>*</span>}
            </label>
            <textarea
              id="reason-input"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError(null)
              }}
              placeholder={isRequired ? 'Describe la razón del rechazo (mínimo 20 caracteres)...' : 'Describe la razón de esta acción (opcional, mínimo 20 caracteres si decides incluirla)...'}
              required={isRequired}
              minLength={isRequired ? 20 : 0}
              style={{
                width: '100%',
                padding: '0.875rem',
                border: error ? '1px solid #dc2626' : '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '100px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = color
                e.target.style.boxShadow = `0 0 0 3px ${color}20`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? '#dc2626' : '#cbd5e1'
                e.target.style.boxShadow = 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              {error && (
                <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={12} />
                  {error}
                </span>
              )}
              <span
                style={{
                  fontSize: '0.75rem',
                  color: reason.length < 20 ? '#f59e0b' : '#16a34a',
                  marginLeft: 'auto'
                }}
              >
                {reason.length} {reason.length < 20 ? '/ 20 (mínimo)' : 'caracteres'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1.5rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
            background: '#f8fafc'
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'white',
              border: '1px solid #cbd5e1',
              borderRadius: '0.5rem',
              color: '#475569',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9'
              e.currentTarget.style.borderColor = '#94a3b8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.borderColor = '#cbd5e1'
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isRequired && reason.trim().length < 20}
            style={{
              padding: '0.625rem 1.25rem',
              background: isRequired && reason.trim().length < 20 ? '#cbd5e1' : color,
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isRequired && reason.trim().length < 20 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: isRequired && reason.trim().length < 20 ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!(isRequired && reason.trim().length < 20)) {
                e.currentTarget.style.opacity = '0.9'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = isRequired && reason.trim().length < 20 ? 0.6 : 1
              e.currentTarget.style.transform = 'none'
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

