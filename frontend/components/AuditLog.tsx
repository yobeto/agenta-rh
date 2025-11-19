'use client'

import { useState, useEffect } from 'react'
import { getAuditLog } from '@/lib/api'
import type { AuditLogEntry } from '@/types'
import { FileText, User, Clock, CheckCircle, XCircle, Filter, X, RefreshCw } from 'lucide-react'

export function AuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    username?: string
    candidate_id?: string
    action?: string
  }>({})
  const [showFilters, setShowFilters] = useState(false)

  const loadAuditLog = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getAuditLog({
        username: filters.username || undefined,
        candidate_id: filters.candidate_id || undefined,
        action: filters.action || undefined,
        limit: 100
      })
      setEntries(response.entries)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Error al cargar la bitácora')
      console.error('Error cargando bitácora:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAuditLog()
  }, [filters])

  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'interview': return 'Pasar a entrevista'
      case 'rejected': return 'Rechazar'
      case 'on_hold': return 'En espera'
      default: return action
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'interview': return <CheckCircle size={16} className="text-green-600" />
      case 'rejected': return <XCircle size={16} className="text-red-600" />
      case 'on_hold': return <Clock size={16} className="text-slate-500" />
      default: return null
    }
  }

  const formatDate = (timestamp: string): string => {
    try {
      const date = new Date(timestamp)
      return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } catch {
      return timestamp
    }
  }

  const clearFilters = () => {
    setFilters({})
    setShowFilters(false)
  }

  return (
    <section className="card" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>Bitácora de Acciones</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Historial completo de acciones realizadas sobre candidatos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            <Filter size={16} style={{ marginRight: '0.5rem' }} />
            Filtros
          </button>
          <button
            type="button"
            onClick={loadAuditLog}
            className="btn-outline"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div style={{
          padding: '1rem',
          background: 'rgba(0, 59, 113, 0.03)',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(0, 59, 113, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <strong>Filtros</strong>
            <button
              type="button"
              onClick={clearFilters}
              style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}
            >
              Limpiar
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                Usuario
              </label>
              <input
                type="text"
                value={filters.username || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, username: e.target.value || undefined }))}
                placeholder="Filtrar por usuario"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5f5',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                Candidato
              </label>
              <input
                type="text"
                value={filters.candidate_id || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, candidate_id: e.target.value || undefined }))}
                placeholder="Filtrar por candidato"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5f5',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                Acción
              </label>
              <select
                value={filters.action || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value || undefined }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5f5',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="">Todas</option>
                <option value="interview">Pasar a entrevista</option>
                <option value="rejected">Rechazar</option>
                <option value="on_hold">En espera</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.75rem',
          color: '#dc2626',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
          <p style={{ color: 'var(--text-secondary)' }}>Cargando bitácora...</p>
        </div>
      ) : entries.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--text-secondary)'
        }}>
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>No hay registros en la bitácora</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {entries.map((entry, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                background: 'white',
                borderRadius: '0.75rem',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'start'
              }}
            >
              <div style={{
                padding: '0.5rem',
                background: entry.action === 'interview'
                  ? 'rgba(0, 168, 89, 0.1)'
                  : entry.action === 'rejected'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(148, 163, 184, 0.1)',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getActionIcon(entry.action)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{getActionLabel(entry.action)}</strong>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FileText size={14} />
                        {entry.candidate_filename}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={14} />
                        {entry.username}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} />
                    {formatDate(entry.timestamp)}
                  </span>
                </div>
                {entry.notes && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    {entry.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length > 0 && (
        <div style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(148, 163, 184, 0.2)',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}>
          Mostrando {entries.length} registro{entries.length !== 1 ? 's' : ''}
        </div>
      )}
    </section>
  )
}

