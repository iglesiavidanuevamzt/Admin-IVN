async function readApiError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const json = JSON.parse(text) as { error?: string };
    if (json.error) return json.error;
  } catch {
    /* no json */
  }
  if (text.trim()) return text.slice(0, 200);
  return `Error del servidor (${res.status})`;
}

/**
 * Tras guardar contraseña en el cliente de invitación, el servidor escribe cookies de sesión.
 */
export async function completeInviteLoginAfterPassword(options: {
  email: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { email, password, accessToken, refreshToken } = options;

  if (!accessToken || !refreshToken) {
    return {
      ok: false,
      error:
        'Sesión incompleta. Abre de nuevo el enlace de invitación (Generar enlace) y guarda la contraseña sin recargar la página.',
    };
  }

  const res = await fetch('/api/auth/finish-invite-setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email,
      password,
      access_token: accessToken,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    return { ok: false, error: await readApiError(res) };
  }

  return { ok: true };
}
