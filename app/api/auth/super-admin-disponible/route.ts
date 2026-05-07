import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPER_ADMIN_ROLE } from '@/lib/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ disponible: true }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: flagRow, error: flagErr } = await admin
    .from('system_flags')
    .select('super_admin_created')
    .eq('id', 1)
    .maybeSingle();
  if (!flagErr && flagRow?.super_admin_created === true) {
    return NextResponse.json({ disponible: false }, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (!flagErr && flagRow?.super_admin_created === false) {
    return NextResponse.json({ disponible: true }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const { data, error } = await admin
    .from('perfiles')
    .select('user_id')
    .contains('rol', [SUPER_ADMIN_ROLE])
    .limit(1);

  if (error) {
    return NextResponse.json({ disponible: true }, { headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json(
    { disponible: (data?.length ?? 0) === 0 },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
