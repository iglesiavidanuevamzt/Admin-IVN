import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPER_ADMIN_ROLE } from '@/lib/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const noStore = { 'Cache-Control': 'no-store, must-revalidate' };

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ disponible: true }, { headers: noStore });
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: flagRow, error: flagErr } = await admin
    .from('system_flags')
    .select('super_admin_created')
    .eq('id', 1)
    .maybeSingle();

  // Fuente de verdad: solo `true` bloquea el alta. Cualquier otro valor (false, null, ausente) permite el primer super-admin.
  if (!flagErr && flagRow != null) {
    return NextResponse.json({ disponible: flagRow.super_admin_created !== true }, { headers: noStore });
  }

  const { data, error } = await admin
    .from('perfiles')
    .select('user_id')
    .contains('rol', [SUPER_ADMIN_ROLE])
    .limit(1);

  if (error) {
    return NextResponse.json({ disponible: true }, { headers: noStore });
  }

  return NextResponse.json({ disponible: (data?.length ?? 0) === 0 }, { headers: noStore });
}
