import type { User } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';

export async function getSessionAndRol(): Promise<
  { user: User; rol: string | null } | { user: null; rol: null }
> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { user: null, rol: null };
  }
  const { data } = await supabase.from('perfiles').select('rol').eq('user_id', user.id).maybeSingle();
  const rol = typeof data?.rol === 'string' ? data.rol.trim() : null;
  return { user, rol };
}
