import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailMayInvite } from '@/lib/admin/inviters';
import { getSessionAndRol } from '@/lib/admin/session-profile';

export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '';

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
   * inviteUserByEmail usa flujo implícito: tokens van en el hash (#access_token…&type=invite).
   * Debe abrirse una página con cliente auth `flowType: 'implicit'` (ver /set-password), no /registro (PKCE).
   */
  const redirectTo = siteUrl ? `${siteUrl}/set-password` : undefined;
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
