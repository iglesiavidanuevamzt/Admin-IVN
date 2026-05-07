import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Intercambia `?code=` del correo de Supabase (flujo PKCE) por sesión y redirige sin 404.
 * Añade esta URL en Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextRaw = searchParams.get('next') ?? '/';
  const next = nextRaw.startsWith('/') ? nextRaw : '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            } catch {
              /* cookies de solo lectura en algunos contextos */
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const fail = new URL('/login', origin);
      fail.searchParams.set('error', 'confirmacion');
      return NextResponse.redirect(fail);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
