import { NextResponse } from 'next/server';
import { canManageModule, canPerformModuleAction } from '@/lib/admin/module-access';
import { getSessionAndRol } from '@/lib/admin/session-profile';
import { createServiceRoleClient } from '@/lib/admin/supabase-service';

type DevocionalPayload = {
  fecha: string;
  reflexion: string;
};

function parsePayload(body: Record<string, unknown>): DevocionalPayload | null {
  const fecha = typeof body.fecha === 'string' ? body.fecha.trim() : '';
  const reflexion = typeof body.reflexion === 'string' ? body.reflexion.trim() : '';
  if (!fecha || !reflexion) return null;
  return { fecha, reflexion };
}

function forbidden(action?: 'crear' | 'editar' | 'eliminar') {
  const detalle = action ? ` (${action})` : '';
  return NextResponse.json(
    {
      error: `Sin permiso para ${action ?? 'gestionar'} devocionales${detalle}. Pide al administrador el permiso correspondiente.`,
    },
    { status: 403 }
  );
}

export async function PATCH(request: Request) {
  const session = await getSessionAndRol();
  if (!session.user) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  if (!canManageModule(session.rol, 'devocional') || !canPerformModuleAction(session.rol, 'devocional', 'editar')) {
    return forbidden('editar');
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: 'Servidor sin clave de servicio.' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id.trim() : '';
  if (!id) {
    return NextResponse.json({ error: 'id del devocional requerido.' }, { status: 400 });
  }

  const payload = parsePayload(body);
  if (!payload) {
    return NextResponse.json({ error: 'Fecha y reflexión son requeridos.' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('devocionales')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: 'No se encontró el devocional.' }, { status: 404 });
  }

  return NextResponse.json({ devocional: data });
}

export async function POST(request: Request) {
  const session = await getSessionAndRol();
  if (!session.user) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  if (!canManageModule(session.rol, 'devocional') || !canPerformModuleAction(session.rol, 'devocional', 'crear')) {
    return forbidden('crear');
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: 'Servidor sin clave de servicio.' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const payload = parsePayload(body);
  if (!payload) {
    return NextResponse.json({ error: 'Fecha y reflexión son requeridos.' }, { status: 400 });
  }

  const { data, error } = await admin.from('devocionales').insert([payload]).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: 'No se pudo crear el devocional.' }, { status: 500 });
  }

  return NextResponse.json({ devocional: data });
}

export async function DELETE(request: Request) {
  const session = await getSessionAndRol();
  if (!session.user) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  if (!canManageModule(session.rol, 'devocional') || !canPerformModuleAction(session.rol, 'devocional', 'eliminar')) {
    return forbidden('eliminar');
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: 'Servidor sin clave de servicio.' }, { status: 500 });
  }

  const id = new URL(request.url).searchParams.get('id')?.trim() ?? '';
  if (!id) {
    return NextResponse.json({ error: 'id del devocional requerido.' }, { status: 400 });
  }

  const { error } = await admin.from('devocionales').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
