'use client'

import { useState } from 'react'
import { UploadCloud, Loader2, CheckCircle2, AlertTriangle, Building2, MapPin, FileText } from 'lucide-react'
import axios from 'axios'

export function CreatePositionForm() {
  const [formData, setFormData] = useState({
    title: '',
    department: 'RH',
    location: 'CDMX',
    file: null as File | null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const departments = ['RH', 'Tecnología', 'Finanzas', 'Operaciones', 'Ventas', 'Marketing', 'Legal']
  const locations = ['CDMX', 'CDMX - Híbrido', 'Remoto', 'Guadalajara', 'Monterrey', 'Otra']

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Solo se aceptan archivos PDF (.pdf)')
      return
    }

    setFormData(prev => ({ ...prev, file }))
    setFileName(file.name)
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validaciones
    if (!formData.title.trim()) {
      setError('El título de la posición es requerido')
      return
    }

    if (!formData.file) {
      setError('Debes subir un archivo PDF del Job Description')
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem('agente-rh-token')
      if (!token) {
        throw new Error('No hay sesión activa')
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title.trim())
      formDataToSend.append('department', formData.department)
      formDataToSend.append('location', formData.location)
      formDataToSend.append('file', formData.file)

      const response = await axios.post(`${API_URL}/api/positions`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      setSuccess(true)
      // Reset form
      setFormData({
        title: '',
        department: 'RH',
        location: 'CDMX',
        file: null,
      })
      setFileName(null)
      
      // Limpiar el input de archivo
      const fileInput = document.getElementById('position-file') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }

      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Error al crear la posición'
      setError(detail)
      console.error('Error creando posición:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Mensajes de éxito/error */}
      {success && (
        <div style={{
          padding: '1rem',
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '0.5rem',
          color: '#166534',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <CheckCircle2 size={20} />
          <div>
            <strong>Posición creada exitosamente</strong>
            <p style={{ margin: 0, fontSize: '0.875rem', marginTop: '0.25rem' }}>
              La posición está disponible para que los usuarios la seleccionen.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '0.5rem',
          color: '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertTriangle size={20} />
          <div>
            <strong>Error</strong>
            <p style={{ margin: 0, fontSize: '0.875rem', marginTop: '0.25rem' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Título */}
      <div>
        <label htmlFor="position-title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#0f172a' }}>
          Título de la Posición *
        </label>
        <input
          type="text"
          id="position-title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          placeholder="Ej: Analista de Datos Senior"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #cbd5e1',
            borderRadius: '0.5rem',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#003b71'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
        />
      </div>

      {/* Departamento y Ubicación en fila */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="position-department" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#0f172a' }}>
            <Building2 size={16} />
            Departamento *
          </label>
          <select
            id="position-department"
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '0.5rem',
              fontSize: '0.95rem',
              outline: 'none',
              background: 'white',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#003b71'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="position-location" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, color: '#0f172a' }}>
            <MapPin size={16} />
            Ubicación *
          </label>
          <select
            id="position-location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '0.5rem',
              fontSize: '0.95rem',
              outline: 'none',
              background: 'white',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#003b71'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
          >
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Archivo PDF */}
      <div>
        <label htmlFor="position-file" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#0f172a' }}>
          Job Description (PDF) *
        </label>
        <label
          htmlFor="position-file"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            border: '2px dashed #cbd5e1',
            borderRadius: '0.5rem',
            background: '#f8fafc',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#003b71'
            e.currentTarget.style.background = '#f1f5f9'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1'
            e.currentTarget.style.background = '#f8fafc'
          }}
        >
          <UploadCloud size={32} style={{ color: '#64748b', marginBottom: '0.75rem' }} />
          <span style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
            {fileName ? 'Reemplazar archivo PDF' : 'Arrastra o selecciona un PDF'}
          </span>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {fileName || 'Solo archivos PDF (.pdf)'}
          </span>
          {fileName && (
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669' }}>
              <FileText size={16} />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{fileName}</span>
            </div>
          )}
        </label>
        <input
          type="file"
          id="position-file"
          accept="application/pdf"
          onChange={handleFileChange}
          required
          style={{ display: 'none' }}
        />
      </div>

      {/* Botón de envío */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
        <button
          type="submit"
          disabled={isLoading || !formData.title.trim() || !formData.file}
          style={{
            padding: '0.75rem 2rem',
            background: isLoading || !formData.title.trim() || !formData.file
              ? '#cbd5e1'
              : 'linear-gradient(135deg, #003b71, #0b5ca8)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: isLoading || !formData.title.trim() || !formData.file ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            boxShadow: isLoading || !formData.title.trim() || !formData.file
              ? 'none'
              : '0 2px 4px rgba(0, 59, 113, 0.2)'
          }}
          onMouseEnter={(e) => {
            if (!isLoading && formData.title.trim() && formData.file) {
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 59, 113, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && formData.title.trim() && formData.file) {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 59, 113, 0.2)'
            }
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Creando posición...</span>
            </>
          ) : (
            <>
              <FileText size={18} />
              <span>Crear Posición</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

