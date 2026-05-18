import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isSamePasswordError } from '@/lib/auth/password-errors';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler';

export async function POST(request: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: 'Servidor sin SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 });
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
      return NextResponse.json(
        { error: 'Correo y contraseña (mínimo 8 caracteres) requeridos.' },
        { status: 400 }
      );
    }
    if (!access_token || !refresh_token) {
      return NextResponse.json(
        {
          error:
            'Faltan datos de sesión. Cierra la pestaña, abre de nuevo el enlace de invitación y guarda la contraseña sin recargar.',
        },
        { status: 401 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const verifier = createClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${access_token}` } },
    });
    const {
      data: { user: tokenUser },
      error: verifyErr,
    } = await verifier.auth.getUser();

    if (verifyErr || !tokenUser?.id) {
      return NextResponse.json(
        { error: `Invitación no válida: ${verifyErr?.message ?? 'sin usuario'}` },
        { status: 401 }
      );
    }
    const userEmail = tokenUser.email?.trim().toLowerCase() ?? '';
    if (userEmail !== email) {
      return NextResponse.json({ error: 'El correo no coincide con la invitación.' }, { status: 403 });
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: updateErr } = await admin.auth.admin.updateUserById(tokenUser.id, {
      password,
      email_confirm: true,
    });
    if (updateErr && !isSamePasswordError(updateErr.message)) {
      return NextResponse.json({ error: `Contraseña: ${updateErr.message}` }, { status: 400 });
    }

    const { supabase, successResponse } = await createSupabaseRouteHandlerClient();

    const { error: sessErr } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (!sessErr) {
      const {
        data: { user: cookieUser },
        error: userErr,
      } = await supabase.auth.getUser();
      if (!userErr && cookieUser) {
        return successResponse();
      }
    }

    const delays = [0, 400, 900, 1500];
    let lastSignError = sessErr?.message ?? 'setSession falló';
    for (const ms of delays) {
      if (ms > 0) await new Promise((r) => setTimeout(r, ms));
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });
      if (!signErr) {
        await supabase.auth.getUser();
        return successResponse();
      }
      lastSignError = signErr.message;
    }

    return NextResponse.json(
      { error: `Inicio de sesión: ${lastSignError}` },
      { status: 401 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
