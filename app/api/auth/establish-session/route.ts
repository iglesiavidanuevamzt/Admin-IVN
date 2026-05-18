import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler';

export async function POST(request: Request) {
  let body: { access_token?: string; refresh_token?: string };
  try {
    body = (await request.json()) as { access_token?: string; refresh_token?: string };
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const access_token = typeof body.access_token === 'string' ? body.access_token : '';
  const refresh_token = typeof body.refresh_token === 'string' ? body.refresh_token : '';
  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: 'Faltan tokens de sesión.' }, { status: 400 });
  }

  const { supabase, successResponse } = await createSupabaseRouteHandlerClient();
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  await supabase.auth.getUser();
  return successResponse();
}
