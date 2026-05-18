import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/** Punto de entrada middleware — lógica en lib/supabase/middleware.ts (bypass documentado allí). */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|api|login|registro|auth/callback|set-password|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
    '/',
  ],
};
