import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * - _next/static, _next/image (archivos de Next.js)
     * - favicon.ico, icons, manifest.json, sw.js (archivos estáticos)
     * - Imágenes (svg, png, jpg, etc.)
     * - login (página pública de acceso)
     * - set-password (página pública para invitados)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|login|set-password|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
    '/',
  ],
};