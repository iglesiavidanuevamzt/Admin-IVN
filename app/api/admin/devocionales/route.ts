import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { canAccessScreen, isAdminOrSuperAdmin } from '@/lib/roles';
import { getSessionAndRol } from '@/lib/admin/session-profile';

function adminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function canManageDevocionales(roles: string[]) {
  return isAdminOrSuperAdmin(roles) || canAccessScreen(roles, 'devocional');
}

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

export async function PATCH(request: Request) {
  const session = await getSessionAndRol();
  if (!session.user) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  if (!canManageDevocionales(session.rol)) {
    return NextResponse.json({ error: 'Sin permiso para editar devocionales.' }, { status: 403 });
  }

  const admin = adminClient();
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
  if (!canManageDevocionales(session.rol)) {
    return NextResponse.json({ error: 'Sin permiso para crear devocionales.' }, { status: 403 });
  }

  const admin = adminClient();
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
