import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';

const DEFAULT_ROLES = ['visitante'];

function adminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Crea la fila en `perfiles` con rol visitante si no existe (p. ej. tras signUp o confirmación por correo).
 * Solo actúa sobre el usuario de la sesión actual.
 */
export async function POST() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }

  const admin = adminClient();
  if (!admin) {
    return NextResponse.json({ error: 'Servidor sin SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 });
  }

  const email = user.email?.trim();
  if (!email) {
    return NextResponse.json({ error: 'La sesión no incluye correo.' }, { status: 400 });
  }

  const { data: existing } = await admin.from('perfiles').select('user_id').eq('user_id', user.id).maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, created: false });
  }

  const tryInsert = async (rol: string[] | string) => {
    return admin.from('perfiles').insert({
      user_id: user.id,
      email,
      rol,
    });
  };

  let { error: insErr } = await tryInsert(DEFAULT_ROLES);
  if (insErr) {
    const { data: afterRace } = await admin.from('perfiles').select('user_id').eq('user_id', user.id).maybeSingle();
    if (afterRace) {
      return NextResponse.json({ ok: true, created: false });
    }
    const retry = await tryInsert(DEFAULT_ROLES.join(','));
    insErr = retry.error;
  }
  if (insErr) {
    const { data: afterFail } = await admin.from('perfiles').select('user_id').eq('user_id', user.id).maybeSingle();
    if (afterFail) {
      return NextResponse.json({ ok: true, created: false });
    }
    return NextResponse.json({ error: insErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, created: true });
}
