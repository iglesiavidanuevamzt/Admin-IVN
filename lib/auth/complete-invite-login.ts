/**
 * Tras guardar contraseña en /set-password: sesión en cookies vía API (middleware la ve).
 */
export async function completeInviteLoginAfterPassword(options: {
  email: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { email, password, accessToken, refreshToken } = options;

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
    if (est.ok) return { ok: true };
    if (est.status !== 401) {
      return { ok: false, error: estBody.error ?? 'No se pudo establecer la sesión.' };
    }
  }

  const signIn = await fetch('/api/auth/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const signBody = (await signIn.json().catch(() => ({}))) as { error?: string };
  if (!signIn.ok) {
    return { ok: false, error: signBody.error ?? 'No se pudo iniciar sesión con la nueva contraseña.' };
  }

  return { ok: true };
}
