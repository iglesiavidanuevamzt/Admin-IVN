'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Fingerprint, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import {
  isUserVerifyingPlatformAuthenticatorUsable,
  isWebAuthnBrowserSupported,
} from '@/lib/webauthn-capabilities';

type WebauthnFactorRow = { id: string; friendly_name?: string | null };

function credentialToJSON(credential: PublicKeyCredential): unknown {
  const anyCredential = credential as PublicKeyCredential & { toJSON?: () => unknown };
  if (typeof anyCredential.toJSON === 'function') {
    return anyCredential.toJSON();
  }
  throw new Error('El navegador no soporta serialización WebAuthn requerida.');
}

export default function PerfilPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [factors, setFactors] = useState<WebauthnFactorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [canInvite, setCanInvite] = useState<boolean | null>(null);
  /** null = aún comprobando si hay autenticador de plataforma (Hello, huella, etc.) */
  const [canOfferWebAuthnMfa, setCanOfferWebAuthnMfa] = useState<boolean | null>(null);
  const [browserWebAuthnOk, setBrowserWebAuthnOk] = useState(false);

  useEffect(() => {
    setBrowserWebAuthnOk(isWebAuthnBrowserSupported());
    let cancelled = false;
    (async () => {
      const usable = await isUserVerifyingPlatformAuthenticatorUsable();
      if (!cancelled) setCanOfferWebAuthnMfa(usable);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);

      const meRes = await fetch('/api/admin/me');
      if (meRes.ok) {
        const me = (await meRes.json()) as { canInvite?: boolean };
        setCanInvite(!!me.canInvite);
      } else {
        setCanInvite(false);
      }

      const { data: factorData, error: factorErr } = await supabase.auth.mfa.listFactors();
      if (!factorErr && factorData?.all) {
        const webauthn = factorData.all
          .filter((f) => f.factor_type === 'webauthn')
          .map((f) => ({ id: f.id, friendly_name: f.friendly_name ?? null }));
        setFactors(webauthn);
      } else {
        setFactors([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const registerDevice = async () => {
    setError(null);
    setMessage(null);
    setRegistering(true);
    try {
      if (canOfferWebAuthnMfa !== true) {
        throw new Error('Este equipo no tiene un autenticador compatible listo para WebAuthn MFA.');
      }
      const rpId = window.location.hostname;
      const rpOrigins = [window.location.origin];
      const friendlyName = `Dispositivo – ${new Date().toLocaleString('es-MX')}`;

      const { data: enrolled, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: 'webauthn',
        friendlyName,
      });
      if (enrollErr) throw enrollErr;

      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: enrolled.id,
        webauthn: { rpId, rpOrigins },
      });
      if (challengeErr) throw challengeErr;
      if (!challengeData || !('webauthn' in challengeData) || challengeData.webauthn.type !== 'create') {
        throw new Error('No se obtuvo challenge válido para registrar WebAuthn.');
      }

      const createdCredential = await navigator.credentials.create({
        publicKey: challengeData.webauthn.credential_options.publicKey as PublicKeyCredentialCreationOptions,
      });
      if (!createdCredential || !(createdCredential instanceof PublicKeyCredential)) {
        throw new Error('No se recibió credencial WebAuthn para completar el registro.');
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: enrolled.id,
        challengeId: challengeData.id,
        webauthn: {
          type: 'create',
          rpId,
          rpOrigins,
          credential_response: credentialToJSON(createdCredential) as never,
        },
      });
      if (verifyErr) throw verifyErr;

      setMessage('Dispositivo registrado correctamente con MFA WebAuthn.');
      await load();
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'No se pudo registrar WebAuthn MFA.';
      const hint =
        /mfa enroll is disabled|webauthn/i.test(raw)
          ? ' En Supabase: Authentication → Multi-factor → habilita WebAuthn si quieres usar este método.'
          : '';
      setError(`${raw}${hint}`);
    } finally {
      setRegistering(false);
    }
  };

  const deletePasskey = async (id: string) => {
    setError(null);
    try {
      const { error: err } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (err) throw err;
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el factor WebAuthn.');
    }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setInviteLoading(true);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Error al invitar');
      setMessage(body.message || 'Invitación enviada.');
      setInviteEmail('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar invitación.');
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#1b3a4a]/40" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#1b3a4a] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al panel
        </Link>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
          <h1 className="font-serif text-xl font-bold text-[#1b3a4a]">Perfil del administrador</h1>
          <p className="mt-1 text-sm text-slate-600">{userEmail}</p>
          <p className="mt-2 text-xs text-slate-500">
            El segundo factor con huella, cara o PIN del sistema (WebAuthn) es opcional. Puedes usar solo correo y
            contraseña. Más adelante podrás añadir un código de app (TOTP) si lo habilitamos en el proyecto.
          </p>

          {message && <p className="mt-4 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>}
          {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <section className="mt-8 border-t border-slate-100 pt-8">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500">WebAuthn MFA (opcional)</h2>

            {canOfferWebAuthnMfa === null && (
              <p className="mt-4 text-sm text-slate-500">Comprobando si este equipo puede usar Windows Hello, huella o Face ID…</p>
            )}

            {canOfferWebAuthnMfa === true && (
              <>
                <button
                  type="button"
                  onClick={registerDevice}
                  disabled={registering}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b3a4a] py-3.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
                >
                  {registering ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
                  Registrar mi dispositivo (MFA)
                </button>
                <Link
                  href="/"
                  className="mt-3 flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold uppercase tracking-widest text-[#1b3a4a] hover:bg-slate-50"
                >
                  Saltar por ahora
                </Link>
                <p className="mt-2 text-[11px] text-slate-400">
                  Solo se muestra esta opción cuando el navegador detecta un autenticador de plataforma disponible.
                </p>
              </>
            )}

            {canOfferWebAuthnMfa === false && (
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                <p>
                  En este equipo no se detectó un autenticador compatible (p. ej. Windows Hello o lector de huellas).
                  Puedes seguir usando el panel solo con correo y contraseña.
                </p>
                {!browserWebAuthnOk && (
                  <p className="mt-2 text-xs text-amber-700">
                    WebAuthn requiere HTTPS y un navegador actual. Si estás en HTTP local, prueba con la URL segura del
                    proyecto.
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Plan B: más adelante podremos activar códigos de app (TOTP); no es obligatorio para entrar ahora.
                </p>
                <Link
                  href="/"
                  className="mt-3 inline-flex text-xs font-bold uppercase tracking-widest text-[#1b3a4a] underline underline-offset-2"
                >
                  Ir al panel
                </Link>
              </div>
            )}

            {factors.length > 0 && (
              <ul className="mt-6 space-y-2">
                {factors.map((pk) => (
                  <li
                    key={pk.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-slate-700">{pk.friendly_name || pk.id}</span>
                    <button
                      type="button"
                      onClick={() => deletePasskey(pk.id)}
                      className="shrink-0 rounded-lg p-2 text-red-500 hover:bg-red-50"
                      aria-label="Eliminar passkey"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {canInvite === true && (
            <section className="mt-8 border-t border-slate-100 pt-8">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Invitar usuario</h2>
              <p className="mt-1 text-xs text-slate-500">
                Super-admin o correos en INVITER_EMAILS.
              </p>
              <form onSubmit={sendInvite} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
                >
                  {inviteLoading ? '…' : 'Invitar'}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
