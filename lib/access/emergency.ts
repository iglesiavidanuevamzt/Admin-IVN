import type { NextRequest } from 'next/server';

/**
 * BYPASS DE EMERGENCIA (solo operaciones / recuperación de acceso)
 * ----------------------------------------------------------------
 * Actívalo en `.env.local`:
 *   ACCESS_EMERGENCY_BYPASS=true
 *
 * O visita cualquier URL con: ?access_bypass=1
 * (el middleware puede guardar cookie `ivn_access_bypass=1` por 24 h)
 *
 * REVERTIR: pon ACCESS_EMERGENCY_BYPASS=false, borra cookie ivn_access_bypass
 * y elimina el query param. El flujo de login normal no se modifica.
 */
export const ACCESS_BYPASS_COOKIE = 'ivn_access_bypass';

export function isEmergencyAccessBypass(request: NextRequest): boolean {
  if (process.env.ACCESS_EMERGENCY_BYPASS === 'true') return true;
  if (request.nextUrl.searchParams.get('access_bypass') === '1') return true;
  if (request.cookies.get(ACCESS_BYPASS_COOKIE)?.value === '1') return true;
  return false;
}

/** Cookie opcional cuando se usa ?access_bypass=1 en la URL */
export function shouldSetBypassCookie(request: NextRequest): boolean {
  return request.nextUrl.searchParams.get('access_bypass') === '1';
}
