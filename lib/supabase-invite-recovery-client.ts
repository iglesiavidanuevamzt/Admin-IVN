import { createClient } from '@supabase/supabase-js';

/**
 * Cliente para enlaces de invitación o recuperación enviados por correo.
 *
 * Supabase documenta que **inviteUserByEmail no usa PKCE** (quien invita y quien
 * acepta suelen ser navegadores distintos). Esas URLs llevan tokens en el **hash**
 * (#access_token=…&type=invite), flujo implícito.
 *
 * `createBrowserClient` de `@supabase/ssr` / `@supabase/auth-helpers-nextjs`
 * **fuerza `flowType: 'pkce'`** después de las opciones, así que no puede
 * consumir bien esa sesión. Aquí usamos `createClient` con `implicit`.
 *
 * @see https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
 */
export function createInviteRecoverySupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
}
