'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Fingerprint, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';

type PasskeyRow = { id: string; friendly_name?: string | null };

export default function PerfilPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [canInvite, setCanInvite] = useState<boolean | null>(null);

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

      const passkeyApi = (supabase.auth as unknown as { passkey?: { list: () => Promise<{ data: unknown; error: Error | null }> } }).passkey;
      if (passkeyApi?.list) {
        const { data, error: listErr } = await passkeyApi.list();
        if (!listErr && data && typeof data === 'object' && 'passkeys' in data) {
          setPasskeys((data as { passkeys: PasskeyRow[] }).passkeys ?? []);
        } else if (Array.isArray(data)) {
          setPasskeys(data as PasskeyRow[]);
        } else {
          setPasskeys([]);
        }
      } else {
        setPasskeys([]);
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
      const { data, error: err } = await supabase.auth.registerPasskey();
      if (err) throw err;
      const friendly = `Dispositivo – ${new Date().toLocaleString('es-MX')}`;
      if (data?.id) {
        const { error: renameErr } = await supabase.auth.passkey.update({
          passkeyId: data.id,
          friendlyName: friendly,
        });
        if (renameErr) throw renameErr;
      }
      setMessage('Dispositivo registrado correctamente.');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el passkey.');
    } finally {
      setRegistering(false);
    }
  };

  const deletePasskey = async (id: string) => {
    setError(null);
    try {
      const passkeyApi = (supabase.auth as unknown as {
        passkey?: { delete: (p: { passkeyId: string }) => Promise<{ error: Error | null }> };
      }).passkey;
      if (!passkeyApi?.delete) return;
      const { error: err } = await passkeyApi.delete({ passkeyId: id });
      if (err) throw err;
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el passkey.');
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
            Vincula tu dispositivo con passkey (Windows Hello, Face ID, huella, etc.).
          </p>

          {message && <p className="mt-4 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>}
          {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <section className="mt-8 border-t border-slate-100 pt-8">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Passkeys</h2>
            <button
              type="button"
              onClick={registerDevice}
              disabled={registering}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b3a4a] py-3.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
            >
              {registering ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
              Registrar mi dispositivo
            </button>
            <p className="mt-2 text-[11px] text-slate-400">
              Debes haber iniciado sesión con correo y contraseña al menos una vez en este navegador.
            </p>

            {passkeys.length > 0 && (
              <ul className="mt-6 space-y-2">
                {passkeys.map((pk) => (
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
                Super-admin o correos en INVITER_EMAILS. El registro público sigue desactivado en Supabase.
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
