import type { AuthUrlParams } from './parse-auth-url';

export function messageForAuthUrlError(params: AuthUrlParams): string {
  if (params.error_code === 'otp_expired') {
    return 'Este enlace ya expiró o ya se usó. Pide al administrador que genere un enlace nuevo (botón «Generar enlace») y ábrelo una sola vez en Chrome o Safari.';
  }
  if (params.error === 'access_denied') {
    return (
      params.error_description ??
      'Acceso denegado. Solicita una invitación nueva al administrador.'
    );
  }
  return params.error_description ?? params.error ?? 'Enlace de invitación no válido.';
}
