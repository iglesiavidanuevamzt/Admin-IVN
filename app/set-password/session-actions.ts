'use server';

import { createServerSupabase } from '@/lib/supabase/server';

/** Sesión creada por /auth/callback (enlace WhatsApp) vive en cookies SSR, no en ivn-invite-recovery-auth. */
export async function checkInviteServerSessionAction(): Promise<{ ok: boolean; email?: string }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.email) return { ok: false };
  return { ok: true, email: user.email.trim() };
}

export async function getServerInviteSessionTokensAction(): Promise<{
  email: string;
  accessToken: string;
  refreshToken: string;
} | null> {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token || !session.refresh_token || !session.user?.email) {
    return null;
  }
  return {
    email: session.user.email.trim(),
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  };
}
