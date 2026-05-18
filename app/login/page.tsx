'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Lock } from 'lucide-react';
import { redirectImplicitAuthHashToSetPassword } from '@/lib/auth/redirect-invite-hash';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectingInvite, setRedirectingInvite] = useState(true);

  useEffect(() => {
    if (redirectImplicitAuthHashToSetPassword()) return;
    setRedirectingInvite(false);
  }, []);

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? 'No se pudo iniciar sesión.');
      }
      window.location.assign('/');
    } catch (err: unknown) {
      if (isTokenStorageError(err)) {
        clearSupabaseLocalStorage();
      }
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
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
        <h1 className="text-center font-serif text-2xl font-bold text-[#1b3a4a]">Admin IVN</h1>
        <p className="mt-2 text-center text-xs text-slate-500">
          Acceso con correo y contraseña. Si recibiste invitación por correo, abre ese enlace (no uses Registrarse).
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
      </div>
    </div>
  );
}
