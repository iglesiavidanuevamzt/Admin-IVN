import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { canAccessScreen, isAdminOrSuperAdmin, parseRoles } from '@/lib/roles';
import { getSessionAndRol } from '@/lib/admin/session-profile';

function adminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function canManageAnuncios(roles: string[]) {
  const normalized = parseRoles(roles);
  if (isAdminOrSuperAdmin(normalized)) return true;
  if (canAccessScreen(normalized, 'avisos')) return true;
  return normalized.some((r) => r === 'anuncios' || r === 'avisos' || r === 'encargado');
}

type AnuncioPayload = {
  titulo: string;
  ministerio: string;
  urgencia: string;
  fecha_expiracion: string;
  fecha_publicacion: string;
  imagen_url: string;
  mensaje: string;
  es_fijo: boolean;
};

function parsePayload(body: Record<string, unknown>): AnuncioPayload | null {
  const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : '';
  if (!titulo) return null;
  return {
    titulo,
    ministerio: typeof body.ministerio === 'string' && body.ministerio.trim() ? body.ministerio.trim() : 'General',
    urgencia: typeof body.urgencia === 'string' && body.urgencia.trim() ? body.urgencia.trim() : 'informativo',
    fecha_expiracion: typeof body.fecha_expiracion === 'string' ? body.fecha_expiracion : '',
    fecha_publicacion: typeof body.fecha_publicacion === 'string' ? body.fecha_publicacion : '',
    imagen_url: typeof body.imagen_url === 'string' ? body.imagen_url : '',
    mensaje: typeof body.mensaje === 'string' ? body.mensaje : '',
    es_fijo: body.es_fijo === true,
  };
}

export async function PATCH(request: Request) {
  const session = await getSessionAndRol();
  if (!session.user) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  if (!canManageAnuncios(session.rol)) {
    return NextResponse.json({ error: 'Sin permiso para editar avisos.' }, { status: 403 });
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
    return NextResponse.json({ error: 'id del aviso requerido.' }, { status: 400 });
  }

  const payload = parsePayload(body);
  if (!payload) {
    return NextResponse.json({ error: 'Título requerido.' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('anuncios')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: 'No se encontró el aviso.' }, { status: 404 });
  }

  return NextResponse.json({ anuncio: data });
}

export async function POST(request: Request) {
  const session = await getSessionAndRol();
  if (!session.user) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  if (!canManageAnuncios(session.rol)) {
    return NextResponse.json({ error: 'Sin permiso para crear avisos.' }, { status: 403 });
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
    return NextResponse.json({ error: 'Título requerido.' }, { status: 400 });
  }

  const { data, error } = await admin.from('anuncios').insert([payload]).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: 'No se pudo crear el aviso.' }, { status: 500 });
  }

  return NextResponse.json({ anuncio: data });
}
