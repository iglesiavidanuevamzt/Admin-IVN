'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';

function credentialToJSON(credential: PublicKeyCredential): unknown {
  const anyCredential = credential as PublicKeyCredential & { toJSON?: () => unknown };
  if (typeof anyCredential.toJSON === 'function') {
    return anyCredential.toJSON();
  }
  throw new Error('El navegador no soporta serialización WebAuthn requerida.');
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      window.isSecureContext &&
      typeof window.PublicKeyCredential !== 'undefined';
    setPasskeySupported(supported);
  }, []);

  const completeMfaWebAuthnIfNeeded = async () => {
    if (!passkeySupported) return;

    const { data: factorsData, error: factorsErr } = await supabase.auth.mfa.listFactors();
    if (factorsErr) throw factorsErr;

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
    if (challengeErr) throw challengeErr;
    if (!challengeData || !('webauthn' in challengeData) || challengeData.webauthn.type !== 'request') {
      throw new Error('No se obtuvo challenge válido de WebAuthn para MFA.');
    }

    const assertion = await navigator.credentials.get({
      publicKey: challengeData.webauthn.credential_options.publicKey as PublicKeyCredentialRequestOptions,
    });
    if (!assertion || !(assertion instanceof PublicKeyCredential)) {
      throw new Error('No se recibió credencial WebAuthn para validar MFA.');
    }

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
    if (verifyErr) throw verifyErr;
  };

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
      await completeMfaWebAuthnIfNeeded();
      router.refresh();
      router.push('/');
    } catch (err: unknown) {
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
          Acceso restringido. El registro público está desactivado; solo cuentas invitadas.
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

        <p className={`mt-6 text-center text-[10px] leading-relaxed ${passkeySupported ? 'text-slate-400' : 'text-amber-600'}`}>
          {passkeySupported
            ? 'Si tu usuario tiene Passkey MFA registrada, después de validar correo y contraseña se pedirá huella/Face ID/PIN.'
            : 'WebAuthn MFA requiere navegador compatible y contexto seguro (HTTPS).'}
        </p>
      </div>
    </div>
  );
}
