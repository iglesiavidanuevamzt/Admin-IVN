import { NextResponse } from 'next/server';
import { emailMayInvite } from '@/lib/admin/inviters';
import { getSessionAndRol } from '@/lib/admin/session-profile';

export async function GET() {
  const session = await getSessionAndRol();
  if (!session.user) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }
  const canInvite = emailMayInvite(session.user.email, session.rol);
  return NextResponse.json({
    rol: session.rol,
    canInvite,
    email: session.user.email ?? null,
  });
}
