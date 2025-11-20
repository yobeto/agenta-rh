'use client'

import { useState, useEffect } from 'react'
import { getPositions, getPosition } from '@/lib/api'
import { Search, Building2, MapPin, BarChart3, Clock, CheckCircle2, Loader2, AlertTriangle, ChevronDown } from 'lucide-react'
import type { Position } from '@/types'

interface Props {
  jobDescription: string
  onJobDescriptionChange: (value: string) => void
  onPositionSelect?: (position: Position) => void
}

export function PositionSelector({ jobDescription, onJobDescriptionChange, onPositionSelect }: Props) {
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  // Cargar posiciones al montar
  useEffect(() => {
    loadPositions()
  }, [])

  // Resetear posición seleccionada cuando el JD se limpia
  useEffect(() => {
    if (!jobDescription || jobDescription.trim() === '') {
      setSelectedPosition(null)
    }
  }, [jobDescription])

  const loadPositions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getPositions({ status: 'active' })
      setPositions(response.positions)
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Error al cargar posiciones'
      setError(detail)
      console.error('Error cargando posiciones:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar posiciones
  const filteredPositions = positions.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.department.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDept = selectedDepartment === 'all' || p.department === selectedDepartment
    return matchesSearch && matchesDept
  })

  // Obtener departamentos únicos
  const departments = ['all', ...Array.from(new Set(positions.map(p => p.department)))]

  const formatLastUsed = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'hoy'
    if (diffDays === 1) return 'ayer'
    if (diffDays < 7) return `hace ${diffDays} días`
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`
    return `hace ${Math.floor(diffDays / 30)} meses`
  }

  const handleSelectPosition = async (position: Position) => {
    setSelectedPosition(position)
    setShowDropdown(false)
    // Cargar el texto completo del JD si no está en la posición básica
    if (position.job_description?.raw_text) {
      onJobDescriptionChange(position.job_description.raw_text)
      onPositionSelect?.(position)
    } else {
      // Si no está, obtener la posición completa
      try {
        const fullPosition = await getPosition(position.id)
        onJobDescriptionChange(fullPosition.job_description.raw_text)
        onPositionSelect?.(fullPosition)
      } catch (err) {
        console.error('Error obteniendo posición completa:', err)
        setError('Error al cargar el Job Description de la posición')
      }
    }
  }

  const wordCount = jobDescription ? jobDescription.trim().split(/\s+/).filter(Boolean).length : 0

  return (
    <section className="card upload-card" aria-labelledby="job-description">
      <div className="upload-card__header">
        <div className="badge">Paso 1</div>
        <h2 id="job-description" className="section-title">
          Seleccionar Posición Abierta
        </h2>
        <p>Selecciona la posición para la cual deseas analizar candidatos. La IA utilizará los criterios de esta posición.</p>
      </div>

      {error && (
        <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={20} />
          <span>Cargando posiciones disponibles...</span>
        </div>
      ) : (
        <>
          {/* Selector de posición */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#003b71'
              }}
              onMouseLeave={(e) => {
                if (!showDropdown) {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                }
              }}
            >
              <span style={{ color: selectedPosition ? '#0f172a' : '#64748b' }}>
                {selectedPosition ? selectedPosition.title : 'Selecciona una posición...'}
              </span>
              <ChevronDown size={20} style={{ color: '#64748b', transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.5rem',
                background: 'white',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                maxHeight: '400px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Barra de búsqueda */}
                <div style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ position: 'relative' }}>
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar posiciones..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Filtros */}
                <div style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {departments.map(dept => (
                    <button
                      key={dept}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDepartment(dept)
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid',
                        borderColor: selectedDepartment === dept ? '#003b71' : '#cbd5e1',
                        background: selectedDepartment === dept ? '#003b71' : 'white',
                        color: selectedDepartment === dept ? 'white' : '#475569',
                        fontSize: '0.75rem',
                        fontWeight: selectedDepartment === dept ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {dept === 'all' ? 'Todos' : dept}
                    </button>
                  ))}
                </div>

                {/* Lista de posiciones */}
                <div style={{ overflowY: 'auto', maxHeight: '300px' }}>
                  {filteredPositions.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      <p>No se encontraron posiciones que coincidan con tu búsqueda.</p>
                    </div>
                  ) : (
                    filteredPositions.map(position => (
                      <button
                        key={position.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectPosition(position)
                        }}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          border: 'none',
                          borderBottom: '1px solid #f1f5f9',
                          background: selectedPosition?.id === position.id ? '#f8fafc' : 'white',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8fafc'
                        }}
                        onMouseLeave={(e) => {
                          if (selectedPosition?.id !== position.id) {
                            e.currentTarget.style.background = 'white'
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" style={{ marginTop: '0.125rem' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                              {position.title}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <Building2 className="h-4 w-4" />
                                <span>{position.department}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <MapPin className="h-4 w-4" />
                                <span>{position.location}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <BarChart3 className="h-3 w-3" />
                                <span>{position.statistics.candidates_analyzed} analizados</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock className="h-3 w-3" />
                                <span>{formatLastUsed(position.statistics.last_used)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Estado de selección */}
          {selectedPosition && (
            <div style={{
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0',
              marginTop: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Posición seleccionada</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                <div><strong>{selectedPosition.title}</strong></div>
                <div style={{ marginTop: '0.25rem' }}>
                  {selectedPosition.department} · {selectedPosition.location}
                </div>
                {wordCount > 0 && (
                  <div style={{ marginTop: '0.5rem', color: '#475569' }}>
                    {wordCount} palabras cargadas del Job Description
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Click fuera para cerrar dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </section>
  )
}

