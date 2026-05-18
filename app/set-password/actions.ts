'use server';

import { finishInviteSetupOnServer } from '@/lib/auth/finish-invite-setup-server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import {
  DEFAULT_BOOTSTRAP_ROLE,
  isInvitedAuthUser,
  sanitizeSelfServiceBootstrapRoles,
} from '@/lib/auth/bootstrap-roles';

export type SavePasswordResult = { ok: true } | { ok: false; error: string };

/**
 * Guarda contraseña de invitado y deja sesión en cookies (sin fetch a /api → evita 405 del middleware).
 */
export async function saveInvitePasswordAction(input: {
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
}): Promise<SavePasswordResult> {
  const setup = await finishInviteSetupOnServer({
    email: input.email,
    password: input.password,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
  });
  if (!setup.ok) return setup;

  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user?.email) {
    return { ok: false, error: 'Sesión no válida tras guardar la contraseña.' };
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return { ok: false, error: 'Servidor sin clave de servicio.' };
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const roles = isInvitedAuthUser(user)
    ? [DEFAULT_BOOTSTRAP_ROLE]
    : sanitizeSelfServiceBootstrapRoles(['visitante']);

  const { data: existing } = await admin
    .from('perfiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existing) {
    const { error: insErr } = await admin.from('perfiles').insert({
      user_id: user.id,
      email: user.email.trim(),
      rol: roles,
    });
    if (insErr) {
      return { ok: false, error: insErr.message };
    }
  }

  return { ok: true };
}
