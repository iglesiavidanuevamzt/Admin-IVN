import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type RouteAuthClient = {
  supabase: ReturnType<typeof createServerClient>;
  successResponse: () => NextResponse;
};

/** Patrón oficial Supabase: recrear la respuesta en setAll para que las cookies viajen al navegador. */
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
              /* solo lectura en Server Components */
            }
          });
          response = NextResponse.json({ ok: true });
          cookiesToSet.forEach(({ name, value, options }) => {
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
