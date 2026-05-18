/**
 * Tras guardar contraseña: inicia sesión en el servidor (cookies) para que el middleware reconozca al usuario.
 */
export async function completeInviteLoginAfterPassword(options: {
  email: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { email, password, accessToken, refreshToken } = options;

  const signIn = await fetch('/api/auth/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const signBody = (await signIn.json().catch(() => ({}))) as { error?: string };
  if (signIn.ok) {
    return { ok: true };
  }

  if (accessToken && refreshToken) {
    const est = await fetch('/api/auth/establish-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
      }),
    });
    const estBody = (await est.json().catch(() => ({}))) as { error?: string };
    if (est.ok) {
      return { ok: true };
    }
    return {
      ok: false,
      error: signBody.error ?? estBody.error ?? 'No se pudo iniciar sesión. Intenta de nuevo en unos segundos.',
    };
  }

  return {
    ok: false,
    error: signBody.error ?? 'No se pudo iniciar sesión con la nueva contraseña.',
  };
}
