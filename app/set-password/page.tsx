'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { createInviteRecoverySupabaseClient } from '@/lib/supabase-invite-recovery-client';

const MIN_LENGTH = 8;

/** Indica si la URL parece un retorno de Auth (hash implícito o código PKCE). */
function urlLooksLikeAuthRedirect(): boolean {
  if (typeof window === 'undefined') return false;
  const { hash, search } = window.location;
  const h = hash.toLowerCase();
  return (
    h.includes('access_token') ||
    h.includes('type=invite') ||
    h.includes('type%3dinvite') ||
    h.includes('type=recovery') ||
    h.includes('type%3drecovery') ||
    h.includes('error=') ||
    search.includes('code=')
  );
}

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createInviteRecoverySupabaseClient(), []);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const applySession = (session: import('@supabase/supabase-js').Session | null) => {
      if (cancelled) return;
      setHasSession(!!session);
      setChecking(false);
    };

    const readSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    };

    /** Respaldo si detectSessionInUrl no aplicó (p. ej. hidratación / orden de efectos). */
    const trySessionFromHash = async (): Promise<import('@supabase/supabase-js').Session | null> => {
      if (typeof window === 'undefined') return null;
      const raw = window.location.hash.replace(/^#/, '');
      if (!raw) return null;
      const params = new URLSearchParams(raw);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (!access_token || !refresh_token) return null;
      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) return null;
      return data.session;
    };

    const { data: subWrap } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (
        session &&
        (event === 'INITIAL_SESSION' ||
          event === 'SIGNED_IN' ||
          event === 'PASSWORD_RECOVERY' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED')
      ) {
        applySession(session);
      }
    });

    void (async () => {
      let session = await readSession();
      if (session) {
        applySession(session);
        return;
      }

      if (urlLooksLikeAuthRedirect()) {
        session = await trySessionFromHash();
        if (session) {
          applySession(session);
          return;
        }
        const delays = [0, 80, 200, 450, 900, 1600, 2600];
        for (const ms of delays) {
          if (cancelled) return;
          if (ms > 0) await new Promise((r) => setTimeout(r, ms));
          session = await readSession();
          if (session) {
            applySession(session);
            return;
          }
        }
      }

      applySession(await readSession());
    })();

    return () => {
      cancelled = true;
      subWrap.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setSuccess(true);
      await supabase.auth.signOut();
      await new Promise((r) => setTimeout(r, 1600));
      router.refresh();
      router.push('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1b3a4a]/10 text-[#1b3a4a]">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-center font-serif text-2xl font-bold text-[#1b3a4a]">Admin IVN</h1>
        <p className="mt-2 text-center text-xs text-slate-500">
          Establece tu contraseña para acceder al panel. Si llegaste desde un correo de invitación, este es el último paso.
        </p>

        {checking ? (
          <div className="mt-10 flex flex-col items-center gap-2">
            <Loader2 className="h-9 w-9 animate-spin text-[#1b3a4a]/35" />
            <p className="text-center text-[10px] text-slate-400">
              Comprobando enlace de invitación…
            </p>
          </div>
        ) : !hasSession ? (
          <div className="mt-8 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-center text-sm text-amber-900">
            <p>No hay una sesión de invitación activa. El enlace puede haber expirado o ya se usó.</p>
            <p className="mt-2 text-[11px] text-amber-800/90">
              Abre el enlace en este mismo navegador y evita previsualizar el correo dentro de apps que no pasan el fragmento (#) de la URL.
            </p>
            <Link href="/login" className="mt-3 inline-block text-sm font-bold text-[#1b3a4a] underline">
              Ir al inicio de sesión
            </Link>
          </div>
        ) : success ? (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" aria-hidden />
            <p className="text-sm font-medium text-green-800">Contraseña guardada correctamente.</p>
            <p className="text-xs text-slate-500">Te llevamos al inicio de sesión…</p>
            <Loader2 className="h-6 w-6 animate-spin text-[#1b3a4a]/30" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500"
              >
                Nueva contraseña
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none focus:border-[#1b3a4a]/40"
                required
                minLength={MIN_LENGTH}
              />
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none focus:border-[#1b3a4a]/40"
                required
                minLength={MIN_LENGTH}
              />
            </div>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b3a4a] py-3.5 text-sm font-black uppercase tracking-widest text-white transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Guardar contraseña
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-[10px] text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-bold text-[#1b3a4a] underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
