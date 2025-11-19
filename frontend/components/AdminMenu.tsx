'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserPlus, FileText, X, Shield } from 'lucide-react'
import { CreateUserForm } from './CreateUserForm'
import { AuditLog } from './AuditLog'

type AdminView = 'none' | 'create-user' | 'audit-log'

export function AdminMenu() {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState<AdminView>('none')

  if (user?.role !== 'admin') {
    return null
  }

  const menuItems = [
    {
      id: 'create-user' as AdminView,
      label: 'Crear Usuario',
      icon: UserPlus,
    },
    {
      id: 'audit-log' as AdminView,
      label: 'Bitácora',
      icon: FileText,
    },
  ]

  const closeView = () => {
    setActiveView('none')
  }

  return (
    <>
      {/* Barra de menú de administración */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand-primary, #003b71), var(--brand-accent, #0b5ca8))',
        padding: '0.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: '0 2px 8px rgba(0, 59, 113, 0.15)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
          <Shield size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Administración</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: activeView === item.id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'white',
                  fontWeight: activeView === item.id ? 600 : 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (activeView !== item.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeView !== item.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido de la sección activa */}
      {activeView !== 'none' && (
        <section className="workspace" style={{ marginTop: '2rem' }}>
          <div className="workspace__primary">
            <div className="card">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(148, 163, 184, 0.2)'
              }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--brand-primary, #003b71)' }}>
                  {activeView === 'create-user' ? 'Crear Usuario' : 'Bitácora de Acciones'}
                </h2>
                <button
                  type="button"
                  onClick={closeView}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              {activeView === 'create-user' && <CreateUserForm />}
              {activeView === 'audit-log' && <AuditLog />}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

