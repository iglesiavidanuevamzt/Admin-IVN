'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import { REGISTRO_CATEGORIAS, SUPER_ADMIN_ROLE } from '@/lib/roles';

async function bootstrapPerfilFromClient(roles: string[]): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/auth/bootstrap-perfil', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roles }),
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
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [superAdminDisponible, setSuperAdminDisponible] = useState(false);

  const toggle = useCallback((value: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }, []);

  const rolesForSignup = useMemo(() => Array.from(selected), [selected]);
  const categoriasDisponibles = useMemo(
    () =>
      superAdminDisponible
        ? REGISTRO_CATEGORIAS
        : REGISTRO_CATEGORIAS.filter((c) => c.value !== SUPER_ADMIN_ROLE),
    [superAdminDisponible]
  );

  const authCallbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/super-admin-disponible');
        const body = (await res.json().catch(() => ({}))) as { disponible?: boolean };
        if (!res.ok || cancelled) return;
        setSuperAdminDisponible(body.disponible === true);
      } catch {
        if (!cancelled) setSuperAdminDisponible(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
      const effectiveRoles = superAdminDisponible
        ? rolesForSignup
        : rolesForSignup.filter((r) => r !== SUPER_ADMIN_ROLE);
      const { data, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: authCallbackUrl,
          data: {
            registration_roles: effectiveRoles,
          },
        },
      });
      if (signErr) throw signErr;

      if (data.session) {
        const boot = await bootstrapPerfilFromClient(effectiveRoles);
        if (!boot.ok) {
          setError(boot.error ?? 'Cuenta creada pero no se pudo preparar tu perfil. Contacta al administrador.');
          return;
        }
        router.refresh();
        router.push('/');
        return;
      }

      setInfo('Te enviamos un correo de confirmación. Abre el enlace y entrarás directo al panel principal.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <h1 className="text-center font-serif text-2xl font-bold text-[#1b3a4a]">Crear cuenta</h1>
        <p className="mt-2 text-center text-xs text-slate-500">Elige uno o varios módulos para tu panel principal.</p>

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

          <fieldset className="rounded-xl border border-slate-200 p-4">
            <legend className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Categorías / módulos
            </legend>
            <ul className="mt-2 max-h-52 space-y-2 overflow-y-auto text-sm">
              {categoriasDisponibles.map((cat) => (
                <li key={cat.value} className="flex items-start gap-2">
                  <input
                    id={`cat-${cat.value}`}
                    type="checkbox"
                    checked={selected.has(cat.value)}
                    onChange={() => toggle(cat.value)}
                    className="mt-1 rounded border-slate-300"
                  />
                  <label htmlFor={`cat-${cat.value}`} className="cursor-pointer text-slate-700">
                    {cat.label}
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              El rol Super Administrador solo está disponible durante el alta inicial del sistema.
            </p>
          </fieldset>

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
