import { getSetPasswordRedirectUrl } from '@/lib/site-url';
import { parseAuthParamsFromUrl } from './parse-auth-url';

/** JWT de Supabase suele ser > 200 caracteres; plantillas rotas ponen {{ .Token }} (número corto). */
export function looksLikeMalformedInviteHash(): boolean {
  const p = parseAuthParamsFromUrl();
  if (p.refresh_token || p.token_hash) return false;
  if (!p.access_token) return false;
  if (p.access_token.split('.').length === 3) return false;
  return p.access_token.length < 120;
}

/**
 * Si el correo armó mal la URL (#access_token=número), reenvía al verify de Supabase
 * para obtener el hash completo en /set-password.
 */
export function tryRepairMalformedInviteUrl(): boolean {
  if (typeof window === 'undefined') return false;
  if (!looksLikeMalformedInviteHash()) return false;

  const params = parseAuthParamsFromUrl();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const redirectTo = getSetPasswordRedirectUrl() || `${window.location.origin}/set-password`;
  if (!supabaseUrl || !params.access_token) return false;

  const verify = new URL(`${supabaseUrl}/auth/v1/verify`);
  verify.searchParams.set('token', params.access_token);
  verify.searchParams.set('type', params.type === 'recovery' ? 'recovery' : 'invite');
  verify.searchParams.set('redirect_to', redirectTo);

  window.location.replace(verify.toString());
  return true;
}
