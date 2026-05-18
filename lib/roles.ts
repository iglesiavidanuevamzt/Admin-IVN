import type { Screen } from '@/types';
import {
  ACCESS_MODULES,
  ADMIN_ROLE,
  SUPER_ADMIN_ROLE,
  canAccessScreen,
  isAdminOrSuperAdmin,
  isSuperAdmin,
  parseRoles,
  rolesFromPerfilRow,
  resolveAccess,
  screensForRoles,
  type AccessResolution,
} from '@/lib/access';

export {
  SUPER_ADMIN_ROLE,
  ADMIN_ROLE,
  parseRoles,
  rolesFromPerfilRow,
  canAccessScreen,
  isSuperAdmin,
  isAdminOrSuperAdmin,
  screensForRoles,
  resolveAccess,
  ACCESS_MODULES,
  type AccessResolution,
};

/** Roles que puede asignar un super-admin en /admin/usuarios */
export const ASSIGNABLE_ROLES: { value: string; label: string }[] = [
  { value: SUPER_ADMIN_ROLE, label: 'Super administrador' },
  { value: ADMIN_ROLE, label: 'Administrador' },
  { value: 'musica', label: 'Música / Alabanzas' },
  { value: 'biblias', label: 'Biblias' },
  { value: 'devocional', label: 'Devocionales' },
  { value: 'anuncios', label: 'Anuncios / Avisos' },
  { value: 'agenda', label: 'Agenda / Calendario' },
  { value: 'encargado', label: 'Encargado (solo inicio)' },
  { value: 'visitante', label: 'Visitante (solo inicio)' },
];

export const ASSIGNABLE_ROLE_VALUES = new Set(ASSIGNABLE_ROLES.map((r) => r.value));

/**
 * Checkboxes en /admin/usuarios — sincronizado con lib/access/modules.ts (módulos granulares).
 * REVERTIR: restaura el array anterior en git y borra lib/access/.
 */
export const ADMIN_USER_EDIT_ROLES: { value: string; label: string }[] = [
  ...ACCESS_MODULES.map((m) => ({ value: m.roleId, label: m.label })),
  { value: ADMIN_ROLE, label: 'Administrador' },
];

export const ADMIN_USER_EDIT_ROLE_VALUES = new Set(ADMIN_USER_EDIT_ROLES.map((r) => r.value));

export const REGISTRO_CATEGORIAS: { value: string; label: string }[] = [
  { value: SUPER_ADMIN_ROLE, label: 'Super administrador (alta inicial)' },
  ...ACCESS_MODULES.map((m) => ({ value: m.roleId, label: m.label })),
];

export const REGISTRO_ROLE_VALUES = new Set(REGISTRO_CATEGORIAS.map((r) => r.value));

export type HomeCard = { id: Screen; title: string; iconPath: string };

const HOME_CARDS: HomeCard[] = [
  { id: 'devocional', title: 'Devocionales', iconPath: '/icons/logo_devocionales.png' },
  { id: 'avisos', title: 'Anuncios', iconPath: '/icons/logo_avisos.png' },
  { id: 'alabanzas', title: 'Alabanzas', iconPath: '/icons/alabanza.png' },
  { id: 'agenda-view', title: 'Calendario', iconPath: '/icons/logo_agenda.png' },
];

/** Tarjetas del inicio según módulos resueltos (única fuente de verdad con canAccessScreen). */
export function homeCardsForRoles(rolesInput: string | string[] | null | undefined): HomeCard[] {
  const allowed = screensForRoles(rolesInput);
  return HOME_CARDS.filter((c) => allowed.has(c.id));
}
