'use client'

export default function TestPage() {
  return (
    <div style={{ padding: '2rem', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '2rem', marginBottom: '1rem' }}>
        ✅ Página de Prueba
      </h1>
      <p style={{ color: '#666', fontSize: '1.2rem' }}>
        Si puedes ver esto, Next.js está funcionando correctamente.
      </p>
      <div style={{ marginTop: '2rem', padding: '1rem', background: 'white', borderRadius: '8px' }}>
        <h2>Información del entorno:</h2>
        <ul>
          <li>API URL: {process.env.NEXT_PUBLIC_API_URL || 'NO CONFIGURADA'}</li>
          <li>NODE_ENV: {process.env.NODE_ENV || 'NO DEFINIDO'}</li>
          <li>Timestamp: {new Date().toISOString()}</li>
        </ul>
      </div>
      <a 
        href="/" 
        style={{ 
          display: 'inline-block', 
          marginTop: '2rem', 
          padding: '0.75rem 1.5rem', 
          background: '#003b71', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '8px' 
        }}
      >
        Ir a la página principal
      </a>
    </div>
  )
}

