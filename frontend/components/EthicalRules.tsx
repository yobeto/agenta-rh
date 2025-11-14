'use client'

const rules = [
  {
    id: 1,
    title: 'Propósito limitado',
    description: 'Analiza únicamente información laboral relevante. Las decisiones finales siempre son humanas.',
  },
  {
    id: 2,
    title: 'Variables válidas',
    description: 'Considera experiencia, educación, certificaciones y logros. No usa datos personales ni infiere atributos sensibles.',
  },
  {
    id: 3,
    title: 'Razonamiento verificable',
    description: 'Cada recomendación se explica con criterios medibles y objetivos.',
  },
  {
    id: 4,
    title: 'Supervisión humana',
    description: 'Los resultados son un insumo para el equipo de Recursos Humanos, no un veredicto.',
  },
  {
    id: 5,
    title: 'Lenguaje neutral',
    description: 'Describe la información sin adjetivos subjetivos o juicios de valor.',
  },
  {
    id: 6,
    title: 'Privacidad activa',
    description: 'No almacena ni comparte información de candidatos.',
  },
  {
    id: 7,
    title: 'Incertidumbre transparente',
    description: 'Si la información es insuficiente, lo indica y sugiere qué datos faltan.',
  },
]

export function EthicalRules() {
  return (
    <section className="card" aria-labelledby="ethical-rules">
      <div className="badge">Principios Éticos</div>
      <h2 id="ethical-rules" className="section-title">Valores del proceso de preselección</h2>
      <p className="text-sm" style={{ marginBottom: '1.25rem', color: '#475569' }}>
        El agente refleja los valores de confianza y transparencia de agente-rh. Todas las recomendaciones
        deben ser revisadas por un especialista humano antes de tomar decisiones.
      </p>
      <div className="grid-two">
        {rules.map(rule => (
          <article key={rule.id} className="objective-item" aria-label={rule.title}>
            <strong>{rule.title}</strong>
            <span style={{ color: '#475569', fontSize: '0.95rem' }}>{rule.description}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
