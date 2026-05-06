'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import {
  isUserVerifyingPlatformAuthenticatorUsable,
  isWebAuthnBrowserSupported,
} from '@/lib/webauthn-capabilities';

function credentialToJSON(credential: PublicKeyCredential): unknown {
  const anyCredential = credential as PublicKeyCredential & { toJSON?: () => unknown };
  if (typeof anyCredential.toJSON === 'function') {
    return anyCredential.toJSON();
  }
  throw new Error('El navegador no soporta serialización WebAuthn requerida.');
}

function isTokenStorageError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('refresh token') ||
    msg.includes('invalid token') ||
    msg.includes('jwt') ||
    msg.includes('auth session missing') ||
    msg.includes('session')
  );
}

function clearSupabaseLocalStorage(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (key.startsWith('sb-') || key.includes('supabase')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => window.localStorage.removeItem(k));
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaHint, setMfaHint] = useState<string>(
    'Tras validar tu correo y contraseña podrás entrar al panel. El segundo factor es opcional en este flujo.'
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const browser = isWebAuthnBrowserSupported();
      const platform = browser ? await isUserVerifyingPlatformAuthenticatorUsable() : false;
      if (cancelled) return;
      if (!browser) {
        setMfaHint(
          'En este entorno no hay WebAuthn (HTTPS + navegador compatible). Entra solo con correo y contraseña confirmados.'
        );
      } else if (!platform) {
        setMfaHint(
          'No se detectó Windows Hello / huella / Face ID en este equipo: no pediremos WebAuthn al entrar. Solo correo y contraseña.'
        );
      } else {
        setMfaHint(
          'Si tienes MFA WebAuthn activado, puede pedirse Hello, huella o PIN del sistema; si cancelas o falla, igual entras al panel. TOTP podrá añadirse más adelante.'
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Refuerzo MFA opcional: solo en equipos con autenticador de plataforma; nunca bloquea el acceso al panel.
   */
  const tryCompleteMfaWebAuthnIfPossible = async () => {
    if (!isWebAuthnBrowserSupported()) return;
    const platformOk = await isUserVerifyingPlatformAuthenticatorUsable();
    if (!platformOk) return;

    try {
      const { data: factorsData, error: factorsErr } = await supabase.auth.mfa.listFactors();
      if (factorsErr) return;

      const webauthnFactor = factorsData.all.find(
        (factor) => factor.factor_type === 'webauthn' && factor.status === 'verified'
      );
      if (!webauthnFactor) return;

      const rpId = window.location.hostname;
      const rpOrigins = [window.location.origin];

      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: webauthnFactor.id,
        webauthn: { rpId, rpOrigins },
      });
      if (challengeErr || !challengeData || !('webauthn' in challengeData) || challengeData.webauthn.type !== 'request') {
        return;
      }

      const assertion = await navigator.credentials.get({
        publicKey: challengeData.webauthn.credential_options.publicKey as PublicKeyCredentialRequestOptions,
      });
      if (!assertion || !(assertion instanceof PublicKeyCredential)) return;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: webauthnFactor.id,
        challengeId: challengeData.id,
        webauthn: {
          type: 'request',
          rpId,
          rpOrigins,
          credential_response: credentialToJSON(assertion) as never,
        },
      });
      if (verifyErr) return;
    } catch {
      /* Usuario canceló, hardware ausente o MFA deshabilitado en proyecto: el acceso sigue con contraseña. */
    }
  };

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
      await tryCompleteMfaWebAuthnIfPossible();
      router.refresh();
      router.push('/');
    } catch (err: unknown) {
      if (isTokenStorageError(err)) {
        clearSupabaseLocalStorage();
      }
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <h1 className="text-center font-serif text-2xl font-bold text-[#1b3a4a]">Admin IVN</h1>
        <p className="mt-2 text-center text-xs text-slate-500">
          Acceso al panel IVN. Las cuentas nuevas empiezan como visitante hasta que un administrador asigne módulos.
        </p>

        <form onSubmit={signInWithPassword} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">
              Correo
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none focus:border-[#1b3a4a]/40"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none focus:border-[#1b3a4a]/40"
              required
            />
          </div>
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b3a4a] py-3.5 text-sm font-black uppercase tracking-widest text-white transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Es tu primera vez?{' '}
          <Link href="/registro" className="font-bold text-[#1b3a4a] underline underline-offset-2">
            Regístrate aquí
          </Link>
        </p>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-500">{mfaHint}</p>
      </div>
    </div>
  );
}
