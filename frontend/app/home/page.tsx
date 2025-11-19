'use client'

export default function HomePage() {
  return (
    <div style={{ 
      padding: '2rem', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '3rem', 
        borderRadius: '12px', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#003b71' }}>
          ✅ Next.js está funcionando
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
          Si puedes ver esta página, Next.js está renderizando correctamente.
        </p>
        <div style={{ marginTop: '2rem' }}>
          <a 
            href="/" 
            style={{ 
              display: 'inline-block',
              padding: '1rem 2rem', 
              background: '#003b71', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '8px',
              marginRight: '1rem'
            }}
          >
            Ir a página principal
          </a>
          <a 
            href="/login" 
            style={{ 
              display: 'inline-block',
              padding: '1rem 2rem', 
              background: '#00a859', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '8px'
            }}
          >
            Ir a login
          </a>
        </div>
      </div>
    </div>
  )
}

