'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { ASSIGNABLE_ROLES, ASSIGNABLE_ROLE_VALUES } from '@/lib/roles';

type UsuarioRow = { userId: string; email: string; rol: string | null };

export default function AdminUsuariosPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [inviteErr, setInviteErr] = useState<string | null>(null);
  const [rowSaving, setRowSaving] = useState<string | null>(null);

  const loadUsuarios = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/usuarios');
      const body = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setAllowed(false);
        setUsuarios([]);
        return;
      }
      if (!res.ok) throw new Error(body.error || 'No se pudo cargar la lista.');
      setAllowed(true);
      setUsuarios(body.usuarios ?? []);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Error de red.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsuarios();
  }, [loadUsuarios]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteErr(null);
    setInviteMsg(null);
    setInviteLoading(true);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Error al invitar');
      setInviteMsg(body.message || 'Invitación enviada.');
      setInviteEmail('');
      await loadUsuarios();
    } catch (e: unknown) {
      setInviteErr(e instanceof Error ? e.message : 'Error al enviar invitación.');
    } finally {
      setInviteLoading(false);
    }
  };

  const changeRol = async (userId: string, rol: string) => {
    setRowSaving(userId);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rol }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'No se pudo actualizar el rol.');
      setUsuarios((prev) => prev.map((u) => (u.userId === userId ? { ...u, rol } : u)));
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Error al guardar.');
    } finally {
      setRowSaving(null);
    }
  };

  if (loading && allowed === null && !loadError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#1b3a4a]/40" />
      </div>
    );
  }

  if (allowed === false) {
    return (
      <div className="min-h-dvh bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <p className="text-slate-700">No tienes permiso para gestionar usuarios.</p>
          <Link href="/" className="mt-6 inline-block text-sm font-bold text-[#1b3a4a] underline">
            Volver al panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#1b3a4a] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al panel
        </Link>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
          <h1 className="font-serif text-xl font-bold text-[#1b3a4a]">Gestión de usuarios</h1>
          <p className="mt-1 text-sm text-slate-600">Correos registrados y rol en la tabla perfiles.</p>

          {loadError && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
          )}

          <section className="mt-8 border-t border-slate-100 pt-8">
            <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
              <Mail className="h-3.5 w-3.5" /> Invitar encargado
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Se envía un correo de invitación de Supabase (registro público desactivado).
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
                className="rounded-xl bg-[#1b3a4a] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
              >
                {inviteLoading ? 'Enviando…' : 'Invitar por correo'}
              </button>
            </form>
            {inviteMsg && <p className="mt-3 text-sm text-green-700">{inviteMsg}</p>}
            {inviteErr && <p className="mt-3 text-sm text-red-600">{inviteErr}</p>}
          </section>

          <section className="mt-8 border-t border-slate-100 pt-8">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Usuarios</h2>
            {loading ? (
              <div className="mt-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#1b3a4a]/30" />
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full min-w-[320px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Correo</th>
                      <th className="px-4 py-3">Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => (
                      <tr key={u.userId} className="border-b border-slate-50 last:border-0">
                        <td className="max-w-[200px] truncate px-4 py-3 text-slate-800">{u.email || '—'}</td>
                        <td className="px-4 py-2">
                          <select
                            className="w-full max-w-[220px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"
                            value={u.rol ?? ''}
                            disabled={rowSaving === u.userId}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (!v) return;
                              void changeRol(u.userId, v);
                            }}
                          >
                            <option value="" disabled>
                              Sin perfil — asignar rol
                            </option>
                            {u.rol && !ASSIGNABLE_ROLE_VALUES.has(u.rol) && (
                              <option value={u.rol}>{`Actual: ${u.rol}`}</option>
                            )}
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {usuarios.length === 0 && !loading && (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">No hay usuarios en Auth.</p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
