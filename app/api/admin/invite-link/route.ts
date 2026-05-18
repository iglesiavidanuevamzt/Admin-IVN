import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailMayInvite } from '@/lib/admin/inviters';
import { getSessionAndRol } from '@/lib/admin/session-profile';
import { getInviteWhatsAppCallbackRedirectUrl } from '@/lib/site-url';

/**
 * Solo genera un enlace de invitación (sin enviar correo).
 * No invalida el enlace de un correo enviado por inviteUserByEmail si se usa por separado.
 */
export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 });
  }

  const session = await getSessionAndRol();
  if (!session.user?.email) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  if (!emailMayInvite(session.user.email, session.rol)) {
    return NextResponse.json({ error: 'No tienes permiso.' }, { status: 403 });
  }

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const inviteEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!inviteEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
    return NextResponse.json({ error: 'Correo inválido.' }, { status: 400 });
  }

  const redirectTo = getInviteWhatsAppCallbackRedirectUrl();
  if (!redirectTo) {
    return NextResponse.json({ error: 'Falta NEXT_PUBLIC_SITE_URL.' }, { status: 500 });
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: inviteEmail,
    options: { redirectTo },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const props = linkData?.properties;
  const hashedToken = props?.hashed_token;
  const verificationType = props?.verification_type ?? 'invite';

  /** Enlace directo a nuestra app (query), sin pasar por verify de Supabase — más fiable en WhatsApp. */
  let setupLink: string | null = null;
  if (hashedToken && redirectTo) {
    const callback = new URL(redirectTo);
    callback.searchParams.set('token_hash', hashedToken);
    callback.searchParams.set('type', verificationType);
    setupLink = callback.toString();
  } else {
    setupLink = props?.action_link ?? null;
  }

  if (!setupLink) {
    return NextResponse.json({ error: 'No se pudo generar el enlace.' }, { status: 500 });
  }

  const userId = linkData.user?.id;
  if (userId) {
    const { data: existingPerfil } = await admin
      .from('perfiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (!existingPerfil) {
      await admin.from('perfiles').insert({
        user_id: userId,
        email: inviteEmail,
        rol: ['visitante'],
      });
    }
  }

  return NextResponse.json({
    message:
      'Enlace generado. Envíalo por WhatsApp; que lo abra una sola vez en Chrome o Safari (menú ⋮ → Abrir en navegador). No reutilices enlaces viejos.',
    setupLink,
  });
}
