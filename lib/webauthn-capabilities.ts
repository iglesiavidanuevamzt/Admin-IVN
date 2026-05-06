/**
 * Comprueba si el entorno puede usar la API WebAuthn (HTTPS + PublicKeyCredential).
 */
export function isWebAuthnBrowserSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof window.PublicKeyCredential !== 'undefined'
  );
}

/**
 * Indica si hay un autenticador de plataforma con verificación de usuario
 * (Windows Hello, Touch ID, Face ID, etc.). Sin esto, muchos PCs no pueden completar passkeys locales.
 * Las llaves de seguridad USB no cuentan aquí; el registro MFA WebAuthn en este proyecto se orienta al autenticador de plataforma.
 */
export async function isUserVerifyingPlatformAuthenticatorUsable(): Promise<boolean> {
  if (!isWebAuthnBrowserSupported()) return false;
  const fn = PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable;
  if (typeof fn !== 'function') return false;
  try {
    return await fn.call(PublicKeyCredential);
  } catch {
    return false;
  }
}
