import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase as appSupabase } from '@/lib/supabase-browser';

/**
 * La invitación usa cliente implicit + storageKey propio; el panel usa PKCE + cookies.
 * Tras establecer contraseña, copia la sesión al cliente de la app para que el middleware la vea.
 */
export async function syncInviteSessionToAppClient(
  inviteClient: SupabaseClient,
  existing?: Session | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session =
    existing ??
    (await inviteClient.auth.getSession()).data.session;

  if (!session?.access_token || !session.refresh_token) {
    return { ok: false, error: 'No hay sesión activa tras configurar la contraseña.' };
  }

  const { error } = await appSupabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
