import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPER_ADMIN_ROLE } from '@/lib/roles';

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ disponible: false });
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin
    .from('perfiles')
    .select('user_id')
    .contains('rol', [SUPER_ADMIN_ROLE])
    .limit(1);

  if (error) {
    return NextResponse.json({ disponible: false });
  }

  return NextResponse.json({ disponible: (data?.length ?? 0) === 0 });
}
