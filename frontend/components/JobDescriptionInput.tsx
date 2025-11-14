'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { extractTextFromPdf } from '@/lib/api'
import { UploadCloud, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'

type UploadState = 'idle' | 'loading' | 'error' | 'ready'

const statusLabels: Record<UploadState, string> = {
  idle: 'Pendiente',
  loading: 'Procesando',
  error: 'Revisar',
  ready: 'Listo',
}

interface Props {
  jobDescription: string
  onJobDescriptionChange: (value: string) => void
  onUploadStatusChange?: (state: UploadState, info?: { fileName?: string; wordCount?: number }) => void
}

export function JobDescriptionInput({ jobDescription, onJobDescriptionChange, onUploadStatusChange }: Props) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const wordCount = jobDescription ? jobDescription.trim().split(/\s+/).filter(Boolean).length : 0

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setErrorMessage('Solo se aceptan archivos PDF (.pdf).')
      setUploadState('error')
      onUploadStatusChange?.('error', { fileName: file.name })
      return
    }

    setUploadState('loading')
    setErrorMessage(null)
    setWarnings([])
    onUploadStatusChange?.('loading', { fileName: file.name })

    try {
      const { text, warnings: parserWarnings } = await extractTextFromPdf(file)
      const normalized = text.slice(0, 12000)
      onJobDescriptionChange(normalized)
      setWarnings(parserWarnings || [])
      setUploadState('ready')
      setFileName(file.name)
      const newWordCount = normalized.trim().split(/\s+/).filter(Boolean).length
      onUploadStatusChange?.('ready', { fileName: file.name, wordCount: newWordCount })
    } catch (error: any) {
      setUploadState('error')
      const detail = error?.response?.data?.detail
      setErrorMessage(detail || 'No fue posible leer el PDF. Intenta con otro archivo.')
      onUploadStatusChange?.('error', { fileName: file.name })
    }
  }

  useEffect(() => {
    if (!jobDescription) {
      onUploadStatusChange?.('idle')
      return
    }
    if (uploadState !== 'loading') {
      onUploadStatusChange?.('ready', { wordCount, fileName: fileName ?? undefined })
    }
  }, [jobDescription, uploadState, wordCount, fileName, onUploadStatusChange])

  return (
    <section className="card upload-card" aria-labelledby="job-description">
      <div className="upload-card__header">
        <div className="badge">Paso 1</div>
        <h2 id="job-description" className="section-title">
          Job Description (PDF)
        </h2>
        <p>La IA extrae automáticamente los criterios clave de la posición.</p>
      </div>

      <label
        htmlFor="job-description-file"
        className={`upload-dropzone upload-dropzone--${uploadState}`}
      >
        <UploadCloud size={24} aria-hidden="true" />
        <span className="upload-dropzone__title">
          {fileName ? 'Reemplazar archivo PDF' : 'Arrastra o selecciona un PDF'}
        </span>
        <span className="upload-dropzone__hint">Máx. 12 000 palabras procesadas automáticamente</span>
        <input
          id="job-description-file"
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
          className="sr-only"
        />
      </label>

      <div className="upload-card__status">
        <span className={`status-tag status-tag--${uploadState}`}>{statusLabels[uploadState]}</span>
        {uploadState === 'loading' && <Loader2 size={16} className="upload-card__icon upload-card__icon--spin" />}
        {uploadState === 'ready' && <CheckCircle2 size={16} className="upload-card__icon upload-card__icon--success" />}
        {uploadState === 'error' && <AlertTriangle size={16} className="upload-card__icon upload-card__icon--error" />}
      </div>

      <div className="upload-card__meta" aria-live="polite">
        {uploadState === 'loading' && <span>Procesando PDF…</span>}
        {uploadState === 'ready' && (
          <span>
            {fileName ? `${fileName} · ${wordCount} palabras` : 'PDF listo para analizar'}
          </span>
        )}
        {uploadState === 'error' && errorMessage && <span className="upload-card__error">{errorMessage}</span>}
      </div>

      {warnings.length > 0 && (
        <div className="upload-card__warnings">
          <span>Observaciones del archivo:</span>
          <ul>
            {warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
