import type { SupabaseClient } from '@supabase/supabase-js';
import { messageForAuthUrlError } from './invite-link-errors';
import { parseAuthParamsFromUrl } from './parse-auth-url';

/**
 * Intenta crear sesión desde el enlace del correo (hash implícito u OTP en query).
 */
export async function establishInviteSessionFromUrl(
  supabase: SupabaseClient
): Promise<{ session: import('@supabase/supabase-js').Session | null; errorMessage?: string }> {
  const params = parseAuthParamsFromUrl();

  if (params.error) {
    return {
      session: null,
      errorMessage: messageForAuthUrlError(params),
    };
  }

  if (params.code) {
    return {
      session: null,
      errorMessage:
        'Este enlace usa un formato distinto. Pide al administrador reenviar la invitación.',
    };
  }

  if (params.token_hash) {
    const otpType = (params.type === 'recovery' ? 'recovery' : 'invite') as 'invite' | 'recovery';
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: otpType,
    });
    if (error) return { session: null, errorMessage: error.message };
    if (data.session) return { session: data.session };
  }

  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) return { session: null, errorMessage: error.message };
    if (data.session) return { session: data.session };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return { session };

  if (params.access_token && !params.refresh_token) {
    return {
      session: null,
      errorMessage:
        'El enlace llegó incompleto (falta refresh_token). Abre el botón del correo en Chrome o Safari, no en vista previa de Gmail.',
    };
  }

  return { session: null };
}
