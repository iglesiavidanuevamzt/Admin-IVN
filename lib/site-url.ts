/** Ruta única post-invitación (sin barra final). */
export const SET_PASSWORD_PATH = '/set-password';

/**
 * Origen del sitio (protocolo + host), sin rutas.
 * Aunque NEXT_PUBLIC_SITE_URL traiga `/set-password` u otra ruta por error, solo devuelve el origin.
 *
 * Ej. `https://admin-ivn.vercel.app/set-password` → `https://admin-ivn.vercel.app`
 */
export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim();
  if (!raw) return '';

  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProtocol).origin;
  } catch {
    return raw.replace(/\/$/, '').replace(/\/set-password\/?$/i, '');
  }
}

/**
 * URL de redirectTo para inviteUserByEmail — exactamente una vez /set-password.
 * Resultado esperado: `https://admin-ivn.vercel.app/set-password`
 */
export function getSetPasswordRedirectUrl(): string {
  const base = getSiteUrl();
  if (!base) return '';
  return `${base}${SET_PASSWORD_PATH}`;
}
