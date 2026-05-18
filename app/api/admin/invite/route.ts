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

  const { data: inviteData, error } = await admin.auth.admin.inviteUserByEmail(inviteEmail, {
    redirectTo,
    data: { invited_by_ivn: true },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const invitedUserId = inviteData?.user?.id;
  if (invitedUserId) {
    const { data: existingPerfil } = await admin
      .from('perfiles')
      .select('user_id')
      .eq('user_id', invitedUserId)
      .maybeSingle();

    if (!existingPerfil) {
      await admin.from('perfiles').insert({
        user_id: invitedUserId,
        email: inviteEmail,
        rol: ['visitante'],
      });
    }
  }

  /** Enlace válido de Supabase (por si la plantilla del correo está mal). */
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: inviteEmail,
    options: { redirectTo },
  });
  const setupLink =
    linkData?.properties?.action_link ??
    (linkData?.properties as { action_link?: string } | undefined)?.action_link ??
    null;

  return NextResponse.json({
    message:
      'Invitación enviada. El invitado debe abrir el enlace y establecer su contraseña en /set-password.',
    setupLink,
    emailTemplateNote:
      'En Supabase → Authentication → Email Templates → Invite user: el botón debe usar href="{{ .ConfirmationURL }}" (no armar la URL con {{ .Token }}).',
  });
}
