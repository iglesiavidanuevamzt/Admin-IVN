import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isSamePasswordError } from '@/lib/auth/password-errors';

export type FinishInviteSetupInput = {
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
};

export type FinishInviteSetupResult = { ok: true } | { ok: false; error: string };

/**
 * Lógica de /api/auth/finish-invite-setup (sin HTTP).
 * Escribe cookies de sesión en el servidor para que el middleware reconozca al usuario.
 */
export async function finishInviteSetupOnServer(
  input: FinishInviteSetupInput
): Promise<FinishInviteSetupResult> {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return { ok: false, error: 'Servidor sin SUPABASE_SERVICE_ROLE_KEY.' };
    }

    const email = input.email.trim().toLowerCase();
    const password = input.password;
    const access_token = input.accessToken;
    const refresh_token = input.refreshToken;

    if (!email || password.length < 8) {
      return { ok: false, error: 'Correo y contraseña (mínimo 8 caracteres) requeridos.' };
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const verifier = createClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${access_token}` } },
    });
    const {
      data: { user: tokenUser },
      error: verifyErr,
    } = await verifier.auth.getUser();

    if (verifyErr || !tokenUser?.id) {
      return {
        ok: false,
        error: `Invitación no válida: ${verifyErr?.message ?? 'sin usuario'}`,
      };
    }

    const userEmail = tokenUser.email?.trim().toLowerCase() ?? '';
    if (userEmail !== email) {
      return { ok: false, error: 'El correo no coincide con la invitación.' };
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: updateErr } = await admin.auth.admin.updateUserById(tokenUser.id, {
      password,
      email_confirm: true,
    });
    if (updateErr && !isSamePasswordError(updateErr.message)) {
      return { ok: false, error: `Contraseña: ${updateErr.message}` };
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    const { error: sessErr } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (!sessErr) {
      const {
        data: { user: cookieUser },
        error: userErr,
      } = await supabase.auth.getUser();
      if (!userErr && cookieUser) {
        return { ok: true };
      }
    }

    const delays = [0, 400, 900, 1500];
    let lastSignError = sessErr?.message ?? 'setSession falló';
    for (const ms of delays) {
      if (ms > 0) await new Promise((r) => setTimeout(r, ms));
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });
      if (!signErr) {
        await supabase.auth.getUser();
        return { ok: true };
      }
      lastSignError = signErr.message;
    }

    return { ok: false, error: `Inicio de sesión: ${lastSignError}` };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error interno' };
  }
}
