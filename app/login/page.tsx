'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
      router.refresh();
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const signInWithPasskey = async () => {
    setError(null);
    setPasskeyLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPasskey();
      if (err) throw err;
      router.refresh();
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo usar la biometría o el PIN del dispositivo.');
    } finally {
      setPasskeyLoading(false);
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

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="bg-white px-3">o</span>
          </div>
        </div>

        <button
          type="button"
          onClick={signInWithPasskey}
          disabled={passkeyLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1b3a4a]/20 bg-slate-50 py-3.5 text-sm font-black uppercase tracking-widest text-[#1b3a4a] transition-colors hover:bg-slate-100 disabled:opacity-50"
        >
          {passkeyLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Fingerprint className="h-5 w-5" />}
          Entrar con biometría / PIN
        </button>
        <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-400">
          En PC puede pedirse el PIN de Windows o macOS; en móvil, Face ID o huella según el dispositivo.
        </p>
      </div>
    </div>
  );
}
