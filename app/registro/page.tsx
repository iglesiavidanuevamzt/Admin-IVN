'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus } from 'lucide-react';
import { redirectImplicitAuthHashToSetPassword } from '@/lib/auth/redirect-invite-hash';
import { supabase } from '@/lib/supabase-browser';

async function bootstrapPerfilVisitante(): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/auth/bootstrap-perfil', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roles: ['visitante'] }),
  });
  const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok) {
    return { ok: false, error: body.error ?? 'No se pudo crear el perfil.' };
  }
  return { ok: true };
}

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [redirectingInvite, setRedirectingInvite] = useState(true);

  const authCallbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

  useEffect(() => {
    if (redirectImplicitAuthHashToSetPassword()) return;
    setRedirectingInvite(false);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: authCallbackUrl,
        },
      });
      if (signErr) throw signErr;

      if (data.session) {
        const boot = await bootstrapPerfilVisitante();
        if (!boot.ok) {
          setError(boot.error ?? 'Cuenta creada pero no se pudo preparar tu perfil. Contacta al administrador.');
          return;
        }
        router.refresh();
        router.push('/');
        return;
      }

      setInfo(
        'Te enviamos un correo de confirmación. Un administrador te asignará los módulos cuando apruebe tu cuenta.'
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  if (redirectingInvite) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#1b3a4a]/35" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <h1 className="text-center font-serif text-2xl font-bold text-[#1b3a4a]">Crear cuenta</h1>
        <p className="mt-2 text-center text-xs text-slate-500">
          Solo para alta voluntaria. Si te invitaron por correo, usa el enlace de invitación (no esta página). Los módulos
          los asigna un administrador.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="reg-email"
              className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500"
            >
              Correo
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none focus:border-[#1b3a4a]/40"
              required
            />
          </div>
          <div>
            <label
              htmlFor="reg-password"
              className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500"
            >
              Contraseña
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none focus:border-[#1b3a4a]/40"
              required
              minLength={6}
            />
          </div>
          <div>
            <label
              htmlFor="reg-confirm"
              className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500"
            >
              Confirmar contraseña
            </label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 outline-none focus:border-[#1b3a4a]/40"
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          {info && <p className="text-center text-sm text-[#1b3a4a]">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b3a4a] py-3.5 text-sm font-black uppercase tracking-widest text-white transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Registrarme
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-bold text-[#1b3a4a] underline underline-offset-2">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
