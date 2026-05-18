/**
 * Finaliza invitación: servidor confirma usuario, guarda contraseña y deja cookies listas.
 */
export async function completeInviteLoginAfterPassword(options: {
  email: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { email, password, accessToken, refreshToken } = options;

  if (!accessToken) {
    return {
      ok: false,
      error: 'La sesión de invitación expiró. Cierra esta pestaña y abre de nuevo el enlace del correo o WhatsApp.',
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

  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    return { ok: false, error: body.error ?? 'No se pudo completar el acceso.' };
  }

  return { ok: true };
}
