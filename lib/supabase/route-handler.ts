import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type RouteAuthClient = {
  supabase: ReturnType<typeof createServerClient>;
  /** Respuesta JSON { ok: true } con cookies de sesión ya adjuntas. */
  successResponse: () => NextResponse;
};

export async function createSupabaseRouteHandlerClient(): Promise<RouteAuthClient> {
  const cookieStore = await cookies();
  let response = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              /* solo lectura en algunos contextos */
            }
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return {
    supabase,
    successResponse: () => response,
  };
}
