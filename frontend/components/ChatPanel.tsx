'use client'

import { useEffect, useRef, useState } from 'react'
import { ChatMessageItem, ChatHistoryItem } from '@/types'
import { sendChatMessage } from '@/lib/api'
import { Bot, MessageCircle, Send, X, Sparkles, Loader2 } from 'lucide-react'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedModel?: string
  onPreviewChange?: (messages: ChatMessageItem[]) => void
}

export function ChatPanel({ isOpen, onClose, selectedModel, onPreviewChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [welcomeInjected, setWelcomeInjected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  useEffect(() => {
    if (!isOpen) {
      setError(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || welcomeInjected || messages.length > 0) return

    const timestamp = new Date().toISOString()
    const welcomeMessage: ChatMessageItem = {
      id: `${timestamp}-assistant-welcome`,
      type: 'assistant',
      message: '¡Hola! Soy tu asistente de IA. Estoy aquí para ayudarte a interpretar el análisis y responder dudas sobre criterios éticos.',
      timestamp,
    }

    setMessages([welcomeMessage])
    setChatHistory([{ role: 'assistant', content: welcomeMessage.message }])
    setWelcomeInjected(true)
  }, [isOpen, welcomeInjected, messages.length])

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!onPreviewChange) return
    if (messages.length === 0) {
      onPreviewChange([])
      return
    }
    onPreviewChange(messages.slice(-2))
  }, [messages, onPreviewChange])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isSending) return

    const timestamp = new Date().toISOString()
    const newMessage: ChatMessageItem = {
      id: `${timestamp}-user`,
      type: 'user',
      message: trimmed,
      timestamp,
    }

    setMessages(prev => [...prev, newMessage])
    setInput('')
    setIsSending(true)
    setError(null)

    const modelToUse = (selectedModel || 'gpt-4').toLowerCase()
    const historyForRequest: ChatHistoryItem[] = [...chatHistory, { role: 'user', content: trimmed }]

    try {
      const response = await sendChatMessage({
        message: trimmed,
        modelId: modelToUse,
        chatHistory: historyForRequest,
      })

      const aiTimestamp = new Date().toISOString()
      const aiMessage: ChatMessageItem = {
        id: `${aiTimestamp}-assistant`,
        type: 'assistant',
        message: response.message,
        timestamp: aiTimestamp,
      }

      setMessages(prev => [...prev, aiMessage])
      setChatHistory([...historyForRequest, { role: 'assistant', content: response.message }])
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'No fue posible obtener respuesta del asistente.'
      setError(detail)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <div className="chat-floating" role="dialog" aria-modal="true">
      <div className="chat-panel" ref={panelRef}>
        <header className="chat-header">
          <div className="chat-header__info">
            <div className="chat-avatar" aria-hidden="true">
              <Bot size={18} />
            </div>
            <div>
              <p className="chat-title">Chat con IA</p>
                          </div>
          </div>
          <div className="chat-actions">
            <button type="button" className="chat-close-button" onClick={onClose}>
              <X size={16} />
              <span>Cerrar</span>
            </button>
          </div>
        </header>

        <div className="chat-body">
          {messages.filter(message => message.type === 'user').length === 0 && (
            <div className="chat-preface">
              <MessageCircle size={18} />
              <div>
                <strong>¿No sabes qué preguntar?</strong>
                <p>Prueba con “¿Qué significa la confianza media?” o “¿Cómo sigo con este candidato?”.</p>
              </div>
            </div>
          )}

          <div className="chat-messages" aria-live="polite">
            {messages.map(message => (
              <div key={message.id} className={`chat-bubble chat-bubble--${message.type}`}>
                <p className="chat-bubble__text">{message.message}</p>
                <time className="chat-bubble__time">{new Date(message.timestamp).toLocaleTimeString()}</time>
              </div>
            ))}
            {isSending && (
              <div className="chat-bubble chat-bubble--assistant chat-bubble--pending" aria-live="assertive">
                <Loader2 className="chat-bubble__loader" size={16} />
                <span>La IA está pensando…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {error && <div className="chat-error">{error}</div>}

        <div className="chat-input">
          <label htmlFor="chat-message" className="sr-only">
            Escribe tu mensaje para el asistente de IA
          </label>
          <textarea
            id="chat-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Haz preguntas sobre el análisis o los criterios aplicados…"
            aria-label="Enviar mensaje al asistente"
          />
          <div className="chat-input__actions">
            <div className="chat-input__hint">
              <Sparkles size={14} />
              <span>Shift + Enter para salto de línea</span>
            </div>
            <button
              type="button"
              className="chat-send-button"
              onClick={handleSend}
              disabled={isSending || !input.trim()}
            >
              {isSending ? <Loader2 className="chat-send-spinner" size={16} /> : <Send size={16} />}
              <span>{isSending ? 'Enviando…' : 'Enviar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
