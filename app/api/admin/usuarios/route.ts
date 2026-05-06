import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ASSIGNABLE_ROLE_VALUES, isSuperAdmin, parseRoles } from '@/lib/roles';
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
    roles: parseRoles(rolByUser.get(u.id) ?? null),
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

  let body: { userId?: string; rol?: string; roles?: string[] };
  try {
    body = (await request.json()) as { userId?: string; rol?: string; roles?: string[] };
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const roles = Array.isArray(body.roles)
    ? body.roles.map((r) => r.trim()).filter(Boolean)
    : typeof body.rol === 'string'
      ? [body.rol.trim()].filter(Boolean)
      : [];
  if (!userId || roles.length === 0 || roles.some((r) => !ASSIGNABLE_ROLE_VALUES.has(r))) {
    return NextResponse.json({ error: 'userId o roles inválidos.' }, { status: 400 });
  }
  const rolesUnique = Array.from(new Set(roles));
  const rolCsv = rolesUnique.join(',');

  const { data: authUser, error: authLookupErr } = await admin.auth.admin.getUserById(userId);
  if (authLookupErr || !authUser.user) {
    return NextResponse.json({ error: 'Usuario no encontrado en Auth.' }, { status: 404 });
  }
  const email = authUser.user.email?.trim();
  if (!email) {
    return NextResponse.json(
      { error: 'Este usuario no tiene correo en Auth; no se puede crear la fila en perfiles.' },
      { status: 400 }
    );
  }

  const { data: existing } = await admin.from('perfiles').select('user_id').eq('user_id', userId).maybeSingle();

  const runUpdate = async (payload: { rol: string[] | string; email: string }) => {
    const { data, error, count } = await admin
      .from('perfiles')
      .update(payload)
      .eq('user_id', userId)
      .select('user_id');
    console.log('[admin/usuarios PATCH] update result', {
      userId,
      payloadRolType: Array.isArray(payload.rol) ? 'array' : 'string',
      count,
      rows: data?.length ?? 0,
      error: error?.message ?? null,
    });
    return { data, error, count };
  };

  const runInsert = async (payload: { rol: string[] | string; email: string }) => {
    const { data, error, count } = await admin
      .from('perfiles')
      .insert({ user_id: userId, ...payload })
      .select('user_id');
    console.log('[admin/usuarios PATCH] insert result', {
      userId,
      payloadRolType: Array.isArray(payload.rol) ? 'array' : 'string',
      count,
      rows: data?.length ?? 0,
      error: error?.message ?? null,
    });
    return { data, error, count };
  };

  let error: { message: string } | null = null;
  if (existing) {
    // 1) Intentar como text[] (si rol migró a arreglo)
    let updated = await runUpdate({ rol: rolesUnique, email });
    // 2) Fallback a CSV para esquema legacy (rol text)
    if (updated.error) {
      updated = await runUpdate({ rol: rolCsv, email });
    }
    if (!updated.error && (updated.count ?? updated.data?.length ?? 0) === 0) {
      error = { message: 'No se actualizó ninguna fila. Verifica que la clave sea user_id.' };
    } else {
      error = updated.error;
    }
  } else {
    // 1) Intentar como text[] (si rol migró a arreglo)
    let inserted = await runInsert({ rol: rolesUnique, email });
    // 2) Fallback a CSV para esquema legacy (rol text)
    if (inserted.error) {
      inserted = await runInsert({ rol: rolCsv, email });
    }
    if (!inserted.error && (inserted.count ?? inserted.data?.length ?? 0) === 0) {
      error = { message: 'No se insertó ninguna fila en perfiles.' };
    } else {
      error = inserted.error;
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, userId, roles: rolesUnique });
}
