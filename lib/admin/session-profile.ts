import type { User } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';
import { parseRoles } from '@/lib/roles';

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
  const { data } = await supabase.from('perfiles').select('rol').eq('user_id', user.id).maybeSingle();
  const rol = parseRoles(Array.isArray(data?.rol) ? data.rol : typeof data?.rol === 'string' ? data.rol : null);
  return { user, rol };
}
