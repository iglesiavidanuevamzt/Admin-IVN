'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail, X } from 'lucide-react';
import { ADMIN_USER_EDIT_ROLES } from '@/lib/roles';
import {
  MODULE_ACTIONS,
  MODULE_ACTION_LABELS,
  MODULE_ROLE_IDS,
  denyTokenFor,
  type ModuleAction,
} from '@/lib/access';
import { copyTextToClipboard } from '@/lib/copy-to-clipboard';

type UsuarioRow = { userId: string; email: string; roles: string[] };
type AdminMe = { userId: string; isSuperAdmin: boolean };

export default function AdminUsuariosPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [inviteErr, setInviteErr] = useState<string | null>(null);
  const [inviteSetupLink, setInviteSetupLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [rowSaving, setRowSaving] = useState<string | null>(null);
  const [rowDeleting, setRowDeleting] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UsuarioRow | null>(null);
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [adminMe, setAdminMe] = useState<AdminMe | null>(null);

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
      setUsuarios(Array.isArray(body.usuarios) ? body.usuarios : []);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Error de red.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsuarios();
  }, [loadUsuarios]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/me');
        const body = (await res.json().catch(() => ({}))) as { userId?: string; isSuperAdmin?: boolean };
        if (!res.ok || cancelled) return;
        if (typeof body.userId === 'string') {
          setAdminMe({ userId: body.userId, isSuperAdmin: body.isSuperAdmin === true });
        }
      } catch {
        // Si falla, mantenemos UI funcional y dejamos la validación al backend.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteErr(null);
    setInviteMsg(null);
    setInviteSetupLink(null);
    setInviteLoading(true);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) throw new Error(body.error || 'Error al invitar');
      setInviteMsg(body.message || 'Invitación enviada.');
      setInviteSetupLink(null);
      setInviteEmail('');
      await loadUsuarios();
    } catch (e: unknown) {
      setInviteErr(e instanceof Error ? e.message : 'Error al enviar invitación.');
    } finally {
      setInviteLoading(false);
    }
  };

  const generateSetupLink = async () => {
    const email = inviteEmail.trim();
    if (!email) {
      setInviteErr('Escribe el correo antes de generar el enlace.');
      return;
    }
    setInviteErr(null);
    setInviteMsg(null);
    setInviteSetupLink(null);
    setLinkCopied(false);
    setLinkLoading(true);
    try {
      const res = await fetch('/api/admin/invite-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        setupLink?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error || 'No se pudo generar el enlace.');
      setInviteMsg(body.message || 'Enlace generado.');
      setInviteSetupLink(body.setupLink ?? null);
      await loadUsuarios();
    } catch (e: unknown) {
      setInviteErr(e instanceof Error ? e.message : 'Error al generar enlace.');
    } finally {
      setLinkLoading(false);
    }
  };

  const copySetupLink = async () => {
    if (!inviteSetupLink) return;
    setInviteErr(null);
    const ok = await copyTextToClipboard(inviteSetupLink);
    if (ok) {
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2500);
    } else {
      setInviteErr('No se pudo copiar. Selecciona el enlace de arriba y usa Ctrl+C (o mantén pulsado para copiar).');
    }
  };

  const changeRoles = async (userId: string, roles: string[]) => {
    setRowSaving(userId);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roles }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'No se pudieron actualizar los roles.');
      setUsuarios((prev) => prev.map((u) => (u.userId === userId ? { ...u, roles } : u)));
      setEditingUser((prev) => (prev?.userId === userId ? { ...prev, roles } : prev));
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Error al guardar.');
    } finally {
      setRowSaving(null);
    }
  };

  const removeUser = async (usuario: UsuarioRow) => {
    if (!adminMe?.isSuperAdmin) return;
    const identifier = (usuario.email || usuario.userId).trim();
    const ok = window.confirm(`¿Eliminar la cuenta de ${identifier}?\nEsta acción no se puede deshacer.`);
    if (!ok) return;
    const typed = window.prompt(`Confirmación final: escribe exactamente "${identifier}" para eliminar este usuario.`);
    if (typed === null) return;
    if (typed.trim() !== identifier) {
      setLoadError('Confirmación inválida. No se eliminó el usuario.');
      return;
    }
    setRowDeleting(usuario.userId);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: usuario.userId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'No se pudo eliminar el usuario.');
      setUsuarios((prev) => prev.filter((u) => u.userId !== usuario.userId));
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Error al eliminar usuario.');
    } finally {
      setRowDeleting(null);
    }
  };

  const openEditor = (usuario: UsuarioRow) => {
    setEditingUser(usuario);
    setDraftRoles(usuario.roles ?? []);
  };

  const getEditRestriction = (usuario: UsuarioRow): string | null => {
    if (!adminMe) return null;
    if (!adminMe.isSuperAdmin && usuario.userId === adminMe.userId) {
      return 'No puedes editar tus propios roles.';
    }
    if (!adminMe.isSuperAdmin && usuario.roles.includes('super-admin')) {
      return 'Solo un super-admin puede editar esta cuenta.';
    }
    return null;
  };

  const toggleDraftRole = (value: string) => {
    setDraftRoles((prev) => {
      if (prev.includes(value)) {
        if (MODULE_ROLE_IDS.has(value as never)) {
          /** Al desmarcar un módulo, también quitamos sus tokens de acción para no dejar basura. */
          return prev.filter((r) => r !== value && !r.startsWith(`${value}:sin-`));
        }
        return prev.filter((r) => r !== value);
      }
      return [...prev, value];
    });
  };

  const isModuleAllowed = (moduleId: string, action: ModuleAction): boolean => {
    return !draftRoles.includes(denyTokenFor(moduleId, action));
  };

  const toggleModuleAction = (moduleId: string, action: ModuleAction) => {
    const token = denyTokenFor(moduleId, action);
    setDraftRoles((prev) =>
      prev.includes(token) ? prev.filter((r) => r !== token) : [...prev, token]
    );
  };

  const saveDraftRoles = async () => {
    if (!editingUser) return;
    await changeRoles(editingUser.userId, draftRoles);
    setEditingUser(null);
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
          <p className="mt-1 text-sm text-slate-600">Correos registrados y roles actuales en la tabla perfiles.</p>

          {loadError && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
          )}

          <section className="mt-8 border-t border-slate-100 pt-8">
            <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
              <Mail className="h-3.5 w-3.5" /> Invitar encargado
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Correo o enlace por WhatsApp. No uses ambos a la vez: si envías correo, no pulses «Generar enlace» después
              (invalida el correo). Si el enlace expiró, solo «Generar enlace».
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
                disabled={inviteLoading || linkLoading}
                className="rounded-xl bg-[#1b3a4a] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
              >
                {inviteLoading ? 'Enviando…' : 'Invitar por correo'}
              </button>
              <button
                type="button"
                disabled={inviteLoading || linkLoading}
                onClick={() => void generateSetupLink()}
                className="rounded-xl border border-[#1b3a4a] bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-[#1b3a4a] disabled:opacity-50"
              >
                {linkLoading ? 'Generando…' : 'Generar enlace'}
              </button>
            </form>
            {inviteMsg && <p className="mt-3 text-sm text-green-700">{inviteMsg}</p>}
            {inviteSetupLink && (
              <div className="mt-3 rounded-xl border border-[#1b3a4a]/15 bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Enlace para WhatsApp (válido una sola apertura)
                </p>
                <p className="mt-1 break-all text-xs text-slate-700">{inviteSetupLink}</p>
                <button
                  type="button"
                  onClick={() => void copySetupLink()}
                  className="mt-2 rounded-lg border border-[#1b3a4a]/25 bg-white px-3 py-1.5 text-xs font-bold text-[#1b3a4a] transition-colors hover:bg-[#1b3a4a]/5"
                >
                  {linkCopied ? '¡Copiado!' : 'Copiar enlace'}
                </button>
                <p className="mt-2 text-[11px] text-slate-500">
                  Copia y envía por WhatsApp. El invitado debe abrirlo una vez en Chrome o Safari (no vista previa de
                  Gmail).
                </p>
              </div>
            )}
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
                      <th className="px-4 py-3">Roles</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => (
                      <tr key={u.userId} className="border-b border-slate-50 last:border-0">
                        <td className="max-w-[200px] truncate px-4 py-3 text-slate-800">{u.email || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-700">
                          {u.roles.length > 0 ? u.roles.join(', ') : <span className="text-slate-400">visitante</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(() => {
                            const restriction = getEditRestriction(u);
                            const disabled = Boolean(restriction);
                            const deleteDisabled =
                              !adminMe?.isSuperAdmin ||
                              rowDeleting === u.userId ||
                              u.userId === adminMe.userId ||
                              u.roles.includes('super-admin');
                            return (
                              <>
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEditor(u)}
                                    disabled={disabled}
                                    title={restriction ?? 'Editar roles'}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#1b3a4a] hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void removeUser(u)}
                                    disabled={deleteDisabled}
                                    title={
                                      adminMe?.isSuperAdmin
                                        ? u.roles.includes('super-admin')
                                          ? 'No puedes eliminar otro super-admin aquí.'
                                          : u.userId === adminMe.userId
                                            ? 'No puedes eliminar tu propia cuenta.'
                                            : 'Eliminar usuario'
                                        : 'Solo super-admin puede eliminar usuarios.'
                                    }
                                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
                                  >
                                    {rowDeleting === u.userId ? 'Eliminando…' : 'Eliminar'}
                                  </button>
                                </div>
                                {restriction && <p className="mt-1 text-[11px] text-slate-400">{restriction}</p>}
                              </>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {usuarios.length === 0 && !loading && (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">No hay perfiles registrados.</p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-[#1b3a4a]">Editar módulos</h3>
                <p className="mt-1 text-xs text-slate-500">{editingUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-2">
              {ADMIN_USER_EDIT_ROLES.map((role) => {
                const isModule = MODULE_ROLE_IDS.has(role.value as never);
                const checked = draftRoles.includes(role.value);
                return (
                  <div key={role.value} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2">
                    <label className="flex items-center gap-2 px-1 py-1 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={checked}
                        onChange={() => toggleDraftRole(role.value)}
                        disabled={rowSaving === editingUser.userId}
                      />
                      {role.label}
                      <span className="text-xs text-slate-400">({role.value})</span>
                    </label>
                    {isModule && checked && (
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 pl-7">
                        {MODULE_ACTIONS.map((action) => (
                          <label
                            key={action}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-600"
                          >
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-slate-300"
                              checked={isModuleAllowed(role.value, action)}
                              onChange={() => toggleModuleAction(role.value, action)}
                              disabled={rowSaving === editingUser.userId}
                            />
                            {MODULE_ACTION_LABELS[action]}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Marca el módulo para dar acceso; destilda Crear, Editar o Eliminar para restringir esa acción. Si no
              destildas nada, el usuario tiene todo (compatibilidad con permisos actuales).
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void saveDraftRoles()}
                disabled={rowSaving === editingUser.userId}
                className="rounded-lg bg-[#1b3a4a] px-3 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
              >
                {rowSaving === editingUser.userId ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
