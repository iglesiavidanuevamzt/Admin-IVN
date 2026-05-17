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

function canManageAlabanzas(roles: string[]) {
  return isAdminOrSuperAdmin(roles) || canAccessScreen(roles, 'alabanzas');
}

type AlabanzaPayload = {
  titulo: string;
  letra: string;
  autor: string | null;
};

function parsePayload(body: Record<string, unknown>): AlabanzaPayload | null {
  const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : '';
  const letra = typeof body.letra === 'string' ? body.letra.trim() : '';
  if (!titulo || !letra) return null;
  const autorRaw = typeof body.autor === 'string' ? body.autor.trim() : '';
  return {
    titulo,
    letra,
    autor: autorRaw || null,
  };
}

export async function PATCH(request: Request) {
  const session = await getSessionAndRol();
  if (!session.user) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  if (!canManageAlabanzas(session.rol)) {
    return NextResponse.json({ error: 'Sin permiso para editar alabanzas.' }, { status: 403 });
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
    return NextResponse.json({ error: 'id de la alabanza requerido.' }, { status: 400 });
  }

  const payload = parsePayload(body);
  if (!payload) {
    return NextResponse.json({ error: 'Título y letra son requeridos.' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('alabanzas')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: 'No se encontró la alabanza.' }, { status: 404 });
  }

  return NextResponse.json({ alabanza: data });
}

export async function POST(request: Request) {
  const session = await getSessionAndRol();
  if (!session.user) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  if (!canManageAlabanzas(session.rol)) {
    return NextResponse.json({ error: 'Sin permiso para crear alabanzas.' }, { status: 403 });
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
    return NextResponse.json({ error: 'Título y letra son requeridos.' }, { status: 400 });
  }

  const { data, error } = await admin.from('alabanzas').insert([payload]).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: 'No se pudo crear la alabanza.' }, { status: 500 });
  }

  return NextResponse.json({ alabanza: data });
}
