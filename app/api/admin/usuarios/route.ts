import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ASSIGNABLE_ROLE_VALUES, isSuperAdmin } from '@/lib/roles';
import { getSessionAndRol } from '@/lib/admin/session-profile';

function adminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET() {
  const session = await getSessionAndRol();
  if (!session.user) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  if (!isSuperAdmin(session.rol)) {
    return NextResponse.json({ error: 'Solo super-administradores.' }, { status: 403 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Servidor sin clave de servicio.' }, { status: 500 });
  }

  const { data: authData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 400 });
  }

  const users = authData?.users ?? [];
  const ids = users.map((u) => u.id);

  let rolByUser = new Map<string, string | null>();
  if (ids.length > 0) {
    const { data: rows, error: perfErr } = await admin.from('perfiles').select('user_id, rol').in('user_id', ids);
    if (perfErr) {
      return NextResponse.json({ error: perfErr.message }, { status: 400 });
    }
    rolByUser = new Map((rows ?? []).map((r: { user_id: string; rol: string | null }) => [r.user_id, r.rol]));
  }

  const list = users.map((u) => ({
    userId: u.id,
    email: u.email ?? '',
    rol: rolByUser.get(u.id) ?? null,
  }));

  return NextResponse.json({ usuarios: list });
}

export async function PATCH(request: Request) {
  const session = await getSessionAndRol();
  if (!session.user) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  if (!isSuperAdmin(session.rol)) {
    return NextResponse.json({ error: 'Solo super-administradores.' }, { status: 403 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Servidor sin clave de servicio.' }, { status: 500 });
  }

  let body: { userId?: string; rol?: string };
  try {
    body = (await request.json()) as { userId?: string; rol?: string };
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const rol = typeof body.rol === 'string' ? body.rol.trim() : '';
  if (!userId || !rol || !ASSIGNABLE_ROLE_VALUES.has(rol)) {
    return NextResponse.json({ error: 'userId o rol inválido.' }, { status: 400 });
  }

  const { data: existing } = await admin.from('perfiles').select('user_id').eq('user_id', userId).maybeSingle();

  const { error } = existing
    ? await admin.from('perfiles').update({ rol }).eq('user_id', userId)
    : await admin.from('perfiles').insert({ user_id: userId, rol });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
