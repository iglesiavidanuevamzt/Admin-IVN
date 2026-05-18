'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { establishInviteSessionFromUrl } from '@/lib/auth/establish-invite-session';
import { messageForAuthUrlError } from '@/lib/auth/invite-link-errors';
import { parseAuthParamsFromUrl, urlLooksLikeAuthRedirect } from '@/lib/auth/parse-auth-url';
import { saveInvitePasswordAction } from './actions';
import {
  checkInviteServerSessionAction,
  getServerInviteSessionTokensAction,
} from './session-actions';
import { isSamePasswordError, translateAuthError } from '@/lib/auth/password-errors';
import { isInAppBrowser } from '@/lib/auth/detect-in-app-browser';
import { tryRepairMalformedInviteUrl } from '@/lib/auth/repair-invite-url';
import { createInviteRecoverySupabaseClient } from '@/lib/supabase-invite-recovery-client';

const MIN_LENGTH = 8;

export default function SetPasswordPage() {
  const supabase = useMemo(() => createInviteRecoverySupabaseClient(), []);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  /** Sesión en cookies SSR tras /auth/callback (enlace WhatsApp). */
  const [hasServerSession, setHasServerSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;
    if (path !== '/set-password' && path.startsWith('/set-password')) {
      window.location.replace(`/set-password${window.location.search}${window.location.hash}`);
      return;
    }
    if (tryRepairMalformedInviteUrl()) return;

    const params = parseAuthParamsFromUrl();
    if (params.token_hash) {
      const u = new URL('/auth/invite', window.location.origin);
      u.searchParams.set('token_hash', params.token_hash);
      if (params.type) u.searchParams.set('type', params.type);
      window.location.replace(u.toString());
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const finish = (
      session: import('@supabase/supabase-js').Session | null,
      errMsg?: string,
      serverSession = false
    ) => {
      if (cancelled) return;
      setHasSession(!!session || serverSession);
      setHasServerSession(serverSession);
      if (!session && !serverSession && errMsg) setLinkError(errMsg);
      setChecking(false);
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
        finish(session);
      }
    });

    void (async () => {
      const params = parseAuthParamsFromUrl();
      if (params.error) {
        finish(null, messageForAuthUrlError(params));
        if (typeof window !== 'undefined' && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        return;
      }

      const first = await establishInviteSessionFromUrl(supabase);
      if (first.session) {
        finish(first.session);
        return;
      }

      if (urlLooksLikeAuthRedirect()) {
        const delays = [80, 200, 450, 900, 1600, 2600];
        for (const ms of delays) {
          if (cancelled) return;
          await new Promise((r) => setTimeout(r, ms));
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            finish(session);
            return;
          }
        }
        finish(null, first.errorMessage);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        finish(session);
        return;
      }

      const serverCheck = await checkInviteServerSessionAction();
      if (serverCheck.ok) {
        finish(null, undefined, true);
        return;
      }

      finish(null, first.errorMessage);
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
      let email: string | undefined;
      let accessToken: string | undefined;
      let refreshToken: string | undefined;

      if (hasServerSession) {
        const serverTokens = await getServerInviteSessionTokensAction();
        if (!serverTokens) {
          throw new Error(
            'La sesión del enlace expiró. Pide un enlace nuevo (Generar enlace) y ábrelo una sola vez en Chrome o Safari.'
          );
        }
        email = serverTokens.email;
        accessToken = serverTokens.accessToken;
        refreshToken = serverTokens.refreshToken;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        email = user?.email?.trim();
        if (!email) {
          throw new Error('No se encontró el correo de la invitación. Abre el enlace del correo de nuevo.');
        }

        const { error: updateErr } = await supabase.auth.updateUser({ password });
        if (updateErr && !isSamePasswordError(updateErr.message)) {
          throw new Error(translateAuthError(updateErr.message));
        }

        const refreshed = await supabase.auth.refreshSession();
        const session = refreshed.data.session ?? (await supabase.auth.getSession()).data.session;
        accessToken = session?.access_token;
        refreshToken = session?.refresh_token;
      }

      if (!email || !accessToken || !refreshToken) {
        throw new Error(
          'La sesión de invitación se perdió. Abre de nuevo el enlace (Generar enlace) y guarda la contraseña sin recargar.'
        );
      }

      const saved = await saveInvitePasswordAction({
        email,
        password,
        accessToken,
        refreshToken,
      });
      if (!saved.ok) {
        throw new Error(saved.error);
      }

      if (!hasServerSession) {
        await supabase.auth.signOut();
      }

      setSuccess(true);
      await new Promise((r) => setTimeout(r, 600));
      window.location.assign('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo guardar la contraseña.';
      setError(translateAuthError(msg));
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
            {linkError && <p className="mt-2 text-[11px] font-medium text-amber-950">{linkError}</p>}
            <p className="mt-2 text-[11px] text-amber-800/90">
              No reutilices enlaces viejos. El administrador debe pulsar <strong>Generar enlace</strong> (sin enviar otro
              correo) y enviarte ese enlace nuevo por WhatsApp.
            </p>
            {isInAppBrowser() && (
              <p className="mt-2 text-[11px] font-medium text-amber-950">
                Si abriste desde WhatsApp: menú <strong>⋮</strong> → <strong>Abrir en Safari</strong> o{' '}
                <strong>Chrome</strong>, genera un enlace nuevo y pulsa <strong>Continuar</strong> en la primera pantalla.
              </p>
            )}
            <Link href="/login" className="mt-3 inline-block text-sm font-bold text-[#1b3a4a] underline">
              Ir al inicio de sesión
            </Link>
          </div>
        ) : success ? (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" aria-hidden />
            <p className="text-sm font-medium text-green-800">Contraseña guardada correctamente.</p>
            <p className="text-xs text-slate-500">Entrando al panel…</p>
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
