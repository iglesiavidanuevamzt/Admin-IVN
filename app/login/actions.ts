'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export type SignInResult = { ok: true } | { ok: false; error: string };

/** Inicio de sesión en servidor (cookies) sin fetch a /api. */
export async function signInAction(email: string, password: string): Promise<SignInResult> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  await supabase.auth.getUser();
  return { ok: true };
}
