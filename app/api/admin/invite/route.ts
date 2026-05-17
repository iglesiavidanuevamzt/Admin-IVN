import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailMayInvite } from '@/lib/admin/inviters';
import { getSessionAndRol } from '@/lib/admin/session-profile';
import { getSetPasswordRedirectUrl } from '@/lib/site-url';

export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return NextResponse.json(
      { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.' },
      { status: 500 }
    );
  }

  const session = await getSessionAndRol();
  if (!session.user?.email) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }

  if (!emailMayInvite(session.user.email, session.rol)) {
    return NextResponse.json({ error: 'No tienes permiso para enviar invitaciones.' }, { status: 403 });
  }

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON inválido.' }, { status: 400 });
  }

  const inviteEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!inviteEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
    return NextResponse.json({ error: 'Correo inválido.' }, { status: 400 });
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  /**
   * inviteUserByEmail → redirectTo absoluto, una sola vez /set-password.
   * Con Site URL = https://admin-ivn.vercel.app y env igual, Supabase redirige a:
   *   https://admin-ivn.vercel.app/set-password#access_token=…&type=invite
   * (nunca /set-password/set-password). Tokens en hash; consumir en /set-password con flowType implicit.
   */
  const redirectTo = getSetPasswordRedirectUrl() || undefined;
  if (!redirectTo) {
    return NextResponse.json(
      {
        error:
          'Falta NEXT_PUBLIC_SITE_URL (solo dominio, ej. https://admin-ivn.vercel.app, sin /set-password).',
      },
      { status: 500 }
    );
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(inviteEmail, {
    redirectTo,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message:
      'Invitación enviada. El invitado debe abrir el enlace del correo y establecer su contraseña en la pantalla que aparece.',
  });
}
