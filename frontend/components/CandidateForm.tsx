'use client'

import { useState, ChangeEvent } from 'react'
import { extractTextFromPdf } from '@/lib/api'
import type { CandidateDocumentPayload } from '@/types'
import { UploadCloud, Loader2, AlertTriangle, CheckCircle2, Trash2, Users } from 'lucide-react'

interface Props {
  onCandidatesChange: (candidates: CandidateDocumentPayload[]) => void
  onSummaryChange?: (summary: {
    total: number
    ready: number
    loading: number
    errors: number
  }) => void
}

interface CandidateItem {
  id: string
  filename: string
  status: 'loading' | 'ready' | 'error'
  content: string
  warnings: string[]
  errorMessage?: string
}

const MAX_TEXT_LENGTH = 15000

function deriveCandidateId(filename: string) {
  return filename.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || undefined
}

const statusLabels: Record<CandidateItem['status'], string> = {
  ready: 'Listo',
  loading: 'Procesando',
  error: 'Revisar',
}

export function CandidateForm({ onCandidatesChange, onSummaryChange }: Props) {
  const [items, setItems] = useState<CandidateItem[]>([])

  const syncCandidates = (updated: CandidateItem[]) => {
    const ready = updated.filter(item => item.status === 'ready' && item.content)
    onCandidatesChange(
      ready.map(item => ({
        filename: item.filename,
        content: item.content,
        candidateId: deriveCandidateId(item.filename),
      }))
    )
    if (onSummaryChange) {
      const summary = updated.reduce(
        (acc, item) => {
          acc.total += 1
          if (item.status === 'ready') acc.ready += 1
          if (item.status === 'loading') acc.loading += 1
          if (item.status === 'error') acc.errors += 1
          return acc
        },
        { total: 0, ready: 0, loading: 0, errors: 0 }
      )
      onSummaryChange(summary)
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return

    const newItems: CandidateItem[] = []
    const updatedItems = [...items]

    for (const file of Array.from(files)) {
      if (file.type !== 'application/pdf') {
        newItems.push({
          id: `${file.name}-${Date.now()}`,
          filename: file.name,
          status: 'error',
          content: '',
          warnings: [],
          errorMessage: 'Solo se aceptan archivos PDF (.pdf).',
        })
        continue
      }

      const tempItem: CandidateItem = {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        filename: file.name,
        status: 'loading',
        content: '',
        warnings: [],
      }

      updatedItems.push(tempItem)
      setItems([...updatedItems])

      try {
        const { text, warnings } = await extractTextFromPdf(file)
        tempItem.status = 'ready'
        tempItem.content = text.slice(0, MAX_TEXT_LENGTH)
        tempItem.warnings = warnings || []
      } catch (error: any) {
        tempItem.status = 'error'
        tempItem.errorMessage = error?.response?.data?.detail || 'No fue posible procesar el PDF.'
      }

      setItems([...updatedItems])
      syncCandidates(updatedItems)
    }

    if (newItems.length > 0) {
      const withErrors = [...updatedItems, ...newItems]
      setItems(withErrors)
      syncCandidates(withErrors)
    }

    event.target.value = ''
  }

  const handleRemove = (id: string) => {
    const filtered = items.filter(item => item.id !== id)
    setItems(filtered)
    syncCandidates(filtered)
  }

  const totals = items.reduce(
    (acc, item) => {
      acc.total += 1
      acc[item.status] += 1
      return acc
    },
    { total: 0, ready: 0, loading: 0, error: 0 }
  )

  return (
    <section className="card upload-card" aria-labelledby="candidate-uploads">
      <div className="upload-card__header">
        <div className="badge">Paso 2</div>
        <h2 id="candidate-uploads" className="section-title">
          CVs de candidatos
        </h2>
        <p>Procesa múltiples CVs en PDF para obtener una evaluación equilibrada y comparable.</p>
      </div>

      <label htmlFor="candidate-upload-input" className="upload-dropzone upload-dropzone--multiple">
        <UploadCloud size={24} aria-hidden="true" />
        <span className="upload-dropzone__title">Arrastra o selecciona uno o varios PDFs</span>
        <span className="upload-dropzone__hint">Puedes cargar por lotes hasta 10 archivos</span>
        <input
          id="candidate-upload-input"
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>

      <div className="upload-card__meta" aria-live="polite">
        {totals.total === 0 ? (
          <span>Consejo: selecciona varios CVs para comparar candidatos en un solo paso.</span>
        ) : (
          <span>
            {totals.total} archivos · {totals.ready} listos · {totals.loading} procesando
            {totals.error > 0 ? ` · ${totals.error} con aviso` : ''}
          </span>
        )}
      </div>

      <div className="candidate-list">
        {items.map(item => {
          const words = item.content.trim().split(/\s+/).filter(Boolean).length
          return (
            <article key={item.id} className={`candidate-item candidate-item--${item.status}`}>
              <div className="candidate-item__header">
                <div className="candidate-item__avatar" aria-hidden="true">
                  <Users size={18} />
                </div>
                <div className="candidate-item__title">
                  <h3>{item.filename}</h3>
                  <span className={`candidate-item__tag candidate-item__tag--${item.status}`}>
                    {statusLabels[item.status]}
                  </span>
                </div>
                <button
                  type="button"
                  className="candidate-item__remove"
                  onClick={() => handleRemove(item.id)}
                  aria-label={`Quitar ${item.filename}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="candidate-item__body" aria-live="polite">
                {item.status === 'loading' && (
                  <div className="candidate-item__progress">
                    <Loader2 size={16} className="candidate-item__spinner" />
                    <span>Extrayendo texto…</span>
                  </div>
                )}
                {item.status === 'ready' && (
                  <div className="candidate-item__success">
                    <CheckCircle2 size={16} />
                    <span>{words} palabras extraídas correctamente.</span>
                  </div>
                )}
                {item.status === 'error' && (
                  <div className="candidate-item__error">
                    <AlertTriangle size={16} />
                    <span>{item.errorMessage}</span>
                  </div>
                )}

                {item.status === 'ready' && item.warnings.length > 0 && (
                  <ul className="candidate-item__warnings">
                    {item.warnings.map((warning, index) => (
                      <li key={`${item.id}-warning-${index}`}>{warning}</li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
