import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ADMIN_USER_EDIT_ROLE_VALUES, isAdminOrSuperAdmin, isSuperAdmin, parseRoles } from '@/lib/roles';
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
  if (!isAdminOrSuperAdmin(session.rol)) {
    return NextResponse.json({ error: 'Solo administradores.' }, { status: 403 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Servidor sin clave de servicio.' }, { status: 500 });
  }

  const { data: perfiles, error: perfErr } = await admin
    .from('perfiles')
    .select('user_id, email, rol')
    .order('email', { ascending: true });
  if (perfErr) {
    return NextResponse.json({ error: perfErr.message }, { status: 400 });
  }

  const list = (perfiles ?? []).map((p: { user_id: string; email: string | null; rol: string[] | string | null }) => ({
    userId: p.user_id,
    email: p.email ?? '',
    roles: parseRoles(p.rol),
  }));

  return NextResponse.json({ usuarios: list });
}

export async function PATCH(request: Request) {
  const session = await getSessionAndRol();
  if (!session.user) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  if (!isAdminOrSuperAdmin(session.rol)) {
    return NextResponse.json({ error: 'Solo administradores.' }, { status: 403 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Servidor sin clave de servicio.' }, { status: 500 });
  }

  let body: { userId?: string; roles?: string[] };
  try {
    body = (await request.json()) as { userId?: string; roles?: string[] };
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  if (!userId) {
    return NextResponse.json({ error: 'userId inválido.' }, { status: 400 });
  }

  const incoming = Array.isArray(body.roles) ? body.roles.map((r) => r.trim()).filter(Boolean) : [];
  const actorIsSuperAdmin = isSuperAdmin(session.rol);

  // Guardrail: un admin no puede editar su propia cuenta para evitar bloqueo/escalación accidental.
  if (!actorIsSuperAdmin && userId === session.user.id) {
    return NextResponse.json({ error: 'Un admin no puede modificar sus propios roles.' }, { status: 403 });
  }

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

  // Guardrail: solo super-admin puede modificar cuentas que ya tengan super-admin.
  const { data: targetPerfil } = await admin.from('perfiles').select('user_id, rol').eq('user_id', userId).maybeSingle();
  const rowExists = Boolean(targetPerfil?.user_id);
  const targetRoles = parseRoles(
    Array.isArray(targetPerfil?.rol) ? targetPerfil.rol : typeof targetPerfil?.rol === 'string' ? targetPerfil.rol : null
  );
  if (!actorIsSuperAdmin && isSuperAdmin(targetRoles)) {
    return NextResponse.json({ error: 'Solo super-admin puede modificar esa cuenta.' }, { status: 403 });
  }

  /**
   * El cliente envía todos los roles del modal (p. ej. visitante + módulos). Solo estos valores son editables por checkbox:
   * musica, devocional, anuncios, agenda, admin. El resto (visitante, super-admin, biblias, …) se conserva desde BD
   * y se sustituye el bloque editable por lo que marcó el admin.
   */
  const editableIncoming = incoming.filter((r) => ADMIN_USER_EDIT_ROLE_VALUES.has(r));
  /** El modal puede enviar `visitante` aunque aún no exista fila en perfiles (target vacío). */
  const ignorableExtra = new Set(['visitante']);
  const unknown = incoming.filter(
    (r) =>
      !ADMIN_USER_EDIT_ROLE_VALUES.has(r) &&
      !targetRoles.includes(r) &&
      !ignorableExtra.has(r)
  );
  if (unknown.length > 0) {
    return NextResponse.json(
      { error: `Rol no permitido en esta acción: ${unknown.join(', ')}.` },
      { status: 400 }
    );
  }

  const preserved = targetRoles.filter((r) => !ADMIN_USER_EDIT_ROLE_VALUES.has(r));
  let rolesUnique = [...new Set([...preserved, ...editableIncoming])];
  if (editableIncoming.length > 0) {
    rolesUnique = rolesUnique.filter((r) => r !== 'visitante');
  }
  if (rolesUnique.length === 0) {
    rolesUnique = ['visitante'];
  }

  const runUpdate = async (payload: { rol: string[]; email: string }) => {
    const { data, error, count } = await admin
      .from('perfiles')
      .update(payload)
      .eq('user_id', userId)
      .select('user_id');
    console.log('[admin/usuarios PATCH] update result', {
      userId,
      payloadRolType: 'array',
      count,
      rows: data?.length ?? 0,
      error: error?.message ?? null,
    });
    return { data, error, count };
  };

  const runInsert = async (payload: { rol: string[]; email: string }) => {
    const { data, error, count } = await admin
      .from('perfiles')
      .insert({ user_id: userId, ...payload })
      .select('user_id');
    console.log('[admin/usuarios PATCH] insert result', {
      userId,
      payloadRolType: 'array',
      count,
      rows: data?.length ?? 0,
      error: error?.message ?? null,
    });
    return { data, error, count };
  };

  let error: { message: string } | null = null;
  if (rowExists) {
    const updated = await runUpdate({ rol: rolesUnique, email });
    if (!updated.error && (updated.count ?? updated.data?.length ?? 0) === 0) {
      error = { message: 'No se actualizó ninguna fila. Verifica que la clave sea user_id.' };
    } else {
      error = updated.error;
    }
  } else {
    const inserted = await runInsert({ rol: rolesUnique, email });
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
