import { parseAuthParamsFromUrl } from './parse-auth-url';

/** Hash de invitación o recuperación (#access_token…&type=invite|recovery). */
export function urlHasImplicitAuthHash(): boolean {
  if (typeof window === 'undefined') return false;
  const p = parseAuthParamsFromUrl();
  if (p.error) return true;
  if (p.access_token) return true;
  const t = (p.type ?? '').toLowerCase();
  return t === 'invite' || t === 'recovery';
}

/**
 * Si la URL trae tokens de invitación, manda a /set-password conservando hash.
 * Devuelve true si redirigió (el caller debe dejar de renderizar).
 */
export function redirectImplicitAuthHashToSetPassword(): boolean {
  if (typeof window === 'undefined') return false;
  if (!urlHasImplicitAuthHash()) return false;
  if (window.location.pathname === '/set-password') return false;
  window.location.replace(`/set-password${window.location.search}${window.location.hash}`);
  return true;
}
