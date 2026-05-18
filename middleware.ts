import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/** Punto de entrada middleware — no aplica a /api/* (ver lib/supabase/middleware.ts). */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Excluye /api/* (POST de auth), estáticos y páginas públicas de auth.
     * api/ con barra evita que POST a /api/auth/... reciba redirect 405 a /login.
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|login|registro|auth/callback|auth/invite|set-password).*)',
  ],
};
