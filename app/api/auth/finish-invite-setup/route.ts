import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler';

/**
 * Tras invitación: confirma correo, guarda contraseña (service role) e inicia sesión con cookies.
 * Requiere access_token válido de la misma sesión de invitación (seguridad).
 */
export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: 'Servidor sin clave de servicio.' }, { status: 500 });
  }

  let body: {
    email?: string;
    password?: string;
    access_token?: string;
    refresh_token?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const access_token = typeof body.access_token === 'string' ? body.access_token : '';
  const refresh_token = typeof body.refresh_token === 'string' ? body.refresh_token : '';

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: 'Correo y contraseña (mín. 8 caracteres) requeridos.' }, { status: 400 });
  }
  if (!access_token) {
    return NextResponse.json(
      { error: 'Sesión de invitación expirada. Pide un enlace nuevo al administrador.' },
      { status: 401 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const verifier = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user: tokenUser },
    error: verifyErr,
  } = await verifier.auth.getUser(access_token);

  if (verifyErr || !tokenUser?.id) {
    return NextResponse.json(
      { error: 'Enlace de invitación inválido o expirado. Genera un enlace nuevo.' },
      { status: 401 }
    );
  }
  if (tokenUser.email?.toLowerCase() !== email) {
    return NextResponse.json({ error: 'El correo no coincide con la invitación.' }, { status: 403 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: updateErr } = await admin.auth.admin.updateUserById(tokenUser.id, {
    password,
    email_confirm: true,
  });
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  const { supabase, successResponse } = await createSupabaseRouteHandlerClient();
  const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });

  if (signErr) {
    if (refresh_token) {
      const { error: sessErr } = await supabase.auth.setSession({ access_token, refresh_token });
      if (!sessErr) {
        await supabase.auth.getUser();
        return successResponse();
      }
    }
    return NextResponse.json(
      { error: signErr.message || 'No se pudo iniciar sesión tras guardar la contraseña.' },
      { status: 401 }
    );
  }

  await supabase.auth.getUser();
  return successResponse();
}
