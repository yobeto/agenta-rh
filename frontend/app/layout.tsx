import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'agente-rh',
  description: 'Asistente ético para la preselección de candidatos de nivel medio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{
          __html: `
            body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
            #root-fallback { 
              position: fixed; 
              top: 0; 
              left: 0; 
              right: 0; 
              bottom: 0; 
              background: #f8fafc; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              z-index: 9999;
            }
          `
        }} />
      </head>
      <body className="bg-slate-50 text-slate-800 min-h-screen">
        <noscript>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>JavaScript requerido</h1>
            <p>Esta aplicación requiere JavaScript para funcionar.</p>
          </div>
        </noscript>
        <div id="app-root">
          <ErrorBoundary>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ErrorBoundary>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Fallback: si después de 5 segundos no hay contenido, mostrar mensaje
              setTimeout(function() {
                const root = document.getElementById('app-root');
                if (root && root.children.length === 0) {
                  root.innerHTML = '<div style="padding: 2rem; text-align: center; min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column;"><h1 style="color: #003b71; margin-bottom: 1rem;">Cargando aplicación...</h1><p style="color: #64748b;">Si esto persiste, recarga la página.</p><button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #003b71; color: white; border: none; border-radius: 8px; cursor: pointer;">Recargar</button></div>';
                }
              }, 5000);
            `,
          }}
        />
      </body>
    </html>
  )
}
