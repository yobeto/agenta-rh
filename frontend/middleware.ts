import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('agente-rh-token')
  const { pathname } = request.nextUrl

  // Si está en la página de login y ya tiene token, redirigir a home
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Si no está en login y no tiene token, permitir acceso
  // (el componente ProtectedRoute manejará la redirección en el cliente)
  // Esto evita problemas con SSR donde localStorage no está disponible
  if (pathname !== '/login' && !token) {
    // Permitir que el componente ProtectedRoute maneje la redirección
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

