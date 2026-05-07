'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';

export default function PerfilPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

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
          <h1 className="font-serif text-xl font-bold text-[#1b3a4a]">Perfil</h1>
          <p className="mt-1 text-sm text-slate-600">{userEmail}</p>
          <p className="mt-2 text-xs text-slate-500">
            El acceso es solo con correo y contraseña. Los permisos de módulos los define tu rol en la base de datos
            (un administrador puede ajustarlos en Gestión de usuarios).
          </p>

          {message && <p className="mt-4 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>}
          {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          {canInvite === true && (
            <section className="mt-8 border-t border-slate-100 pt-8">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Invitar usuario</h2>
              <p className="mt-1 text-xs text-slate-500">Super-admin o correos en INVITER_EMAILS.</p>
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
