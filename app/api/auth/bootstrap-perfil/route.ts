import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  DEFAULT_BOOTSTRAP_ROLE,
  isInvitedAuthUser,
  sanitizeSelfServiceBootstrapRoles,
} from '@/lib/auth/bootstrap-roles';
import { parseRoles } from '@/lib/roles';

const DEFAULT_ROLES = [DEFAULT_BOOTSTRAP_ROLE];

function adminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveBootstrapRoles(
  bodyRoles: unknown,
  user: { invited_at?: string | null; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }
): Promise<string[]> {
  if (isInvitedAuthUser(user)) {
    return DEFAULT_ROLES;
  }

  const fromBody = Array.isArray(bodyRoles) ? bodyRoles : [];
  const meta = user.user_metadata?.registration_roles;
  const metaArr = Array.isArray(meta) ? meta : [];
  const requested = [...parseRoles(fromBody), ...parseRoles(metaArr)];

  return sanitizeSelfServiceBootstrapRoles(requested);
}

/**
 * Crea la fila en `perfiles` si no existe. Solo rol visitante desde el cliente; módulos vía admin.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Servidor sin SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 });
  }

  const email = user.email?.trim();
  if (!email) {
    return NextResponse.json({ error: 'La sesión no incluye correo.' }, { status: 400 });
  }

  let bodyRoles: unknown;
  try {
    const text = await request.text();
    if (text.trim()) {
      const json = JSON.parse(text) as { roles?: unknown };
      bodyRoles = json?.roles;
    }
  } catch {
    bodyRoles = undefined;
  }

  const rolesToInsert = await resolveBootstrapRoles(bodyRoles, {
    invited_at: user.invited_at,
    user_metadata: user.user_metadata as Record<string, unknown>,
    app_metadata: user.app_metadata as Record<string, unknown>,
  });

  const { data: existing } = await admin.from('perfiles').select('user_id').eq('user_id', user.id).maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, created: false });
  }

  const tryInsert = async (rol: string[]) => {
    return admin.from('perfiles').insert({
      user_id: user.id,
      email,
      rol,
    });
  };

  let { error: insErr } = await tryInsert(rolesToInsert);
  if (insErr) {
    const { data: afterRace } = await admin.from('perfiles').select('user_id').eq('user_id', user.id).maybeSingle();
    if (afterRace) {
      return NextResponse.json({ ok: true, created: false });
    }
    return NextResponse.json({ error: insErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, created: true });
}
