/**
 * EJEMPLO: Componente de Selección de Posiciones
 * 
 * Este es un ejemplo visual de cómo se vería el selector de posiciones.
 * Reemplazaría al componente JobDescriptionInput actual.
 */

'use client'

import { useState } from 'react'
import { Search, Building2, MapPin, BarChart3, Clock, Eye, CheckCircle2 } from 'lucide-react'

interface Position {
  id: string
  title: string
  department: string
  location: string
  status: 'active' | 'closed' | 'draft'
  statistics: {
    candidates_analyzed: number
    times_used: number
    last_used: string
  }
}

// Ejemplo de datos
const examplePositions: Position[] = [
  {
    id: 'position_001',
    title: 'Analista de Datos Senior',
    department: 'Tecnología',
    location: 'CDMX - Híbrido',
    status: 'active',
    statistics: {
      candidates_analyzed: 23,
      times_used: 5,
      last_used: '2024-01-25T14:30:00Z'
    }
  },
  {
    id: 'position_002',
    title: 'Desarrollador Full Stack',
    department: 'Tecnología',
    location: 'Remoto',
    status: 'active',
    statistics: {
      candidates_analyzed: 15,
      times_used: 3,
      last_used: '2024-01-20T11:15:00Z'
    }
  },
  {
    id: 'position_003',
    title: 'Gerente de Proyectos',
    department: 'Operaciones',
    location: 'CDMX',
    status: 'active',
    statistics: {
      candidates_analyzed: 8,
      times_used: 2,
      last_used: '2024-01-18T16:45:00Z'
    }
  }
]

export function PositionSelectorExample() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const departments = ['all', 'Tecnología', 'RH', 'Finanzas', 'Operaciones']
  const filteredPositions = examplePositions.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.department.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDept = selectedDepartment === 'all' || p.department === selectedDepartment
    return matchesSearch && matchesDept && p.status === 'active'
  })

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'hoy'
    if (diffDays === 1) return 'ayer'
    if (diffDays < 7) return `hace ${diffDays} días`
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`
    return `hace ${Math.floor(diffDays / 30)} meses`
  }

  return (
    <section className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="badge">Paso 1</div>
        <h2 className="section-title" style={{ marginTop: '0.5rem' }}>
          Seleccionar Posición Abierta
        </h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Selecciona la posición para la cual deseas analizar candidatos. La IA utilizará los criterios de esta posición.
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar posiciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003b71] focus:border-[#003b71] outline-none"
            style={{ fontSize: '0.95rem' }}
          />
        </div>

        {/* Filtros por departamento */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid',
                borderColor: selectedDepartment === dept ? '#003b71' : '#cbd5e1',
                background: selectedDepartment === dept ? '#003b71' : 'white',
                color: selectedDepartment === dept ? 'white' : '#475569',
                fontSize: '0.875rem',
                fontWeight: selectedDepartment === dept ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {dept === 'all' ? 'Todos' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de posiciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredPositions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <p>No se encontraron posiciones que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          filteredPositions.map(position => (
            <div
              key={position.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                background: 'white',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#003b71'
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 59, 113, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      {position.title}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', fontSize: '0.875rem' }}>
                      <Building2 className="h-4 w-4" />
                      <span>{position.department}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', fontSize: '0.875rem' }}>
                      <MapPin className="h-4 w-4" />
                      <span>{position.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', fontSize: '0.875rem' }}>
                  <BarChart3 className="h-4 w-4" />
                  <span>{position.statistics.candidates_analyzed} candidatos analizados</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', fontSize: '0.875rem' }}>
                  <Clock className="h-4 w-4" />
                  <span>Último uso: {formatLastUsed(position.statistics.last_used)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  onClick={() => {
                    setSelectedPosition(position)
                    setShowPreview(true)
                  }}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    color: '#475569',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#003b71'
                    e.currentTarget.style.color = '#003b71'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1'
                    e.currentTarget.style.color = '#475569'
                  }}
                >
                  <Eye className="h-4 w-4" />
                  Ver detalles
                </button>
                <button
                  onClick={() => {
                    // Aquí se seleccionaría la posición y se continuaría con el flujo
                    console.log('Posición seleccionada:', position.id)
                  }}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.5rem',
                    background: 'linear-gradient(135deg, #003b71, #0b5ca8)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0, 59, 113, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 59, 113, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 59, 113, 0.2)'
                  }}
                >
                  Seleccionar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredPositions.length > 0 && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
          Mostrando {filteredPositions.length} de {examplePositions.length} posiciones activas
        </div>
      )}
    </section>
  )
}

