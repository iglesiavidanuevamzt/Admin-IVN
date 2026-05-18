import type { User } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { rolesFromPerfilRow } from '@/lib/roles';
import { createServerSupabase } from '@/lib/supabase/server';

async function readRolWithClient(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase.from('perfiles').select('rol').eq('user_id', userId).maybeSingle();
  if (error || !data) return [];
  return rolesFromPerfilRow(data.rol);
}

async function readRolWithServiceRole(userId: string): Promise<string[]> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return [];
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await admin.from('perfiles').select('rol').eq('user_id', userId).maybeSingle();
  return rolesFromPerfilRow(data?.rol);
}

export async function getSessionAndRol(): Promise<
  { user: User; rol: string[] } | { user: null; rol: [] }
> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { user: null, rol: [] };
  }

  let rol = await readRolWithClient(supabase, user.id);
  /** Si RLS de perfiles bloquea la lectura, el API no debe denegar por rol vacío. */
  if (rol.length === 0) {
    rol = await readRolWithServiceRole(user.id);
  }

  return { user, rol };
}
