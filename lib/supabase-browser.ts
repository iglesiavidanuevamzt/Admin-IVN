'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente browser con PKCE para sesión/cookies.
 * Solo importar desde componentes cliente.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
    },
  }
);
