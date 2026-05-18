import { NextResponse } from 'next/server';
import { finishInviteSetupOnServer } from '@/lib/auth/finish-invite-setup-server';

/** POST /api/auth/finish-invite-setup — mismo flujo que la Server Action (evita 405 si el middleware bloquea fetch). */
export async function POST(request: Request) {
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

  const email = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const accessToken = typeof body.access_token === 'string' ? body.access_token : '';
  const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : '';

  const result = await finishInviteSetupOnServer({
    email,
    password,
    accessToken,
    refreshToken,
  });

  if (!result.ok) {
    const status = result.error.includes('Invitación') ? 401 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Usa POST con email, password, access_token y refresh_token.',
  });
}
