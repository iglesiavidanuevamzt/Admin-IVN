import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';
import { parseRoles, REGISTRO_ROLE_VALUES, SUPER_ADMIN_ROLE } from '@/lib/roles';

const DEFAULT_ROLES = ['visitante'];

function adminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function pickRoles(bodyRoles: unknown, userMetadata: Record<string, unknown> | undefined): string[] {
  const fromBody = Array.isArray(bodyRoles) ? bodyRoles : [];
  const filteredBody = [...new Set(parseRoles(fromBody).filter((r) => REGISTRO_ROLE_VALUES.has(r)))];
  if (filteredBody.length > 0) return filteredBody;

  const meta = userMetadata?.registration_roles;
  const metaArr = Array.isArray(meta) ? meta : [];
  const filteredMeta = [...new Set(parseRoles(metaArr).filter((r) => REGISTRO_ROLE_VALUES.has(r)))];
  if (filteredMeta.length > 0) return filteredMeta;

  return DEFAULT_ROLES;
}

async function readSuperAdminFlag(admin: ReturnType<typeof adminClient>): Promise<boolean | null> {
  if (!admin) return null;
  const { data, error } = await admin.from('system_flags').select('super_admin_created').eq('id', 1).maybeSingle();
  if (error) return null;
  return data?.super_admin_created === true;
}

async function writeSuperAdminFlag(admin: ReturnType<typeof adminClient>): Promise<void> {
  if (!admin) return;
  await admin
    .from('system_flags')
    .upsert({ id: 1, super_admin_created: true, updated_at: new Date().toISOString() }, { onConflict: 'id' });
}

/**
 * Crea la fila en `perfiles` si no existe. Roles: cuerpo JSON, metadatos de registro en Auth, o valor por defecto.
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

  let rolesToInsert = pickRoles(bodyRoles, user.user_metadata as Record<string, unknown> | undefined);

  if (rolesToInsert.includes(SUPER_ADMIN_ROLE)) {
    const flagValue = await readSuperAdminFlag(admin);
    if (flagValue === true) {
      rolesToInsert = rolesToInsert.filter((r) => r !== SUPER_ADMIN_ROLE);
      if (rolesToInsert.length === 0) rolesToInsert = DEFAULT_ROLES;
    } else if (flagValue === null) {
      const { data: superAdminRows, error: superAdminErr } = await admin
        .from('perfiles')
        .select('user_id')
        .contains('rol', [SUPER_ADMIN_ROLE])
        .limit(1);
      if (superAdminErr) {
        return NextResponse.json({ error: superAdminErr.message }, { status: 400 });
      }
      if ((superAdminRows?.length ?? 0) > 0) {
        rolesToInsert = rolesToInsert.filter((r) => r !== SUPER_ADMIN_ROLE);
        if (rolesToInsert.length === 0) rolesToInsert = DEFAULT_ROLES;
      }
    }
  }

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

  if (rolesToInsert.includes(SUPER_ADMIN_ROLE)) {
    await writeSuperAdminFlag(admin);
  }

  return NextResponse.json({ ok: true, created: true });
}
