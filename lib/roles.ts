import type { Screen } from '@/types';

export const SUPER_ADMIN_ROLE = 'super-admin';
export const ADMIN_ROLE = 'admin';

/** Pantallas que pueden abrirse desde la navegación (incluye subpantallas). */
const ALL_SCREENS: ReadonlySet<Screen> = new Set([
  'home',
  'devocional',
  'avisos',
  'alabanzas',
  'agenda-view',
  'history',
]);

/**
 * Rol → módulos permitidos. Amplía aquí nuevos roles (p. ej. `medios`).
 * Rol desconocido o sin fila en `perfiles`: solo inicio (sin tarjetas de módulo).
 */
const ROLE_SCREENS: Record<string, ReadonlySet<Screen>> = {
  [SUPER_ADMIN_ROLE]: ALL_SCREENS,
  [ADMIN_ROLE]: ALL_SCREENS,
  musica: new Set(['home', 'alabanzas']),
  devocional: new Set(['home', 'devocional']),
  devocionales: new Set(['home', 'devocional']),
  anuncios: new Set(['home', 'avisos', 'history']),
  avisos: new Set(['home', 'avisos', 'history']),
  agenda: new Set(['home', 'agenda-view']),
  calendario: new Set(['home', 'agenda-view']),
  encargado: new Set(['home']),
  /** Cuenta recién registrada: solo inicio hasta que un admin asigne roles. */
  visitante: new Set(['home']),
  /** Módulo biblias: por ahora mismo alcance que visitante en UI; el rol queda en BD para el administrador. */
  biblias: new Set(['home']),
};

function normalizeRole(role: string): string {
  return role
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function parseRoles(input: string | string[] | null | undefined): string[] {
  if (Array.isArray(input)) {
    return input
      .map(normalizeRole)
      .filter(Boolean);
  }
  if (!input) return [];
  return input
    .split(',')
    .map(normalizeRole)
    .filter(Boolean);
}

export function screensForRoles(rolesInput: string | string[] | null | undefined): ReadonlySet<Screen> {
  const roles = parseRoles(rolesInput);
  if (roles.length === 0) return new Set<Screen>(['home']);

  const merged = new Set<Screen>(['home']);
  for (const role of roles) {
    const set = ROLE_SCREENS[role];
    if (!set) continue;
    for (const screen of set) merged.add(screen);
  }
  return merged;
}

export function canAccessScreen(rolesInput: string | string[] | null | undefined, screen: Screen): boolean {
  return screensForRoles(rolesInput).has(screen);
}

export function isSuperAdmin(rolesInput: string | string[] | null | undefined): boolean {
  return parseRoles(rolesInput).includes(SUPER_ADMIN_ROLE);
}

export function isAdminOrSuperAdmin(rolesInput: string | string[] | null | undefined): boolean {
  const roles = parseRoles(rolesInput);
  return roles.includes(SUPER_ADMIN_ROLE) || roles.includes(ADMIN_ROLE);
}

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

/** Checkboxes habilitados en /admin/usuarios (delegación operativa). */
export const ADMIN_USER_EDIT_ROLES: { value: string; label: string }[] = [
  { value: 'musica', label: 'Alabanzas' },
  { value: 'devocional', label: 'Devocionales' },
  { value: 'anuncios', label: 'Avisos' },
  { value: 'agenda', label: 'Calendario' },
  { value: ADMIN_ROLE, label: 'Administrador' },
];

export const ADMIN_USER_EDIT_ROLE_VALUES = new Set(ADMIN_USER_EDIT_ROLES.map((r) => r.value));

/**
 * Categorías en /registro (checkboxes). Debe coincidir con valores válidos en `perfiles.rol` (text[]).
 */
export const REGISTRO_CATEGORIAS: { value: string; label: string }[] = [
  { value: 'devocional', label: 'Devocionales' },
  { value: 'anuncios', label: 'Avisos (Anuncios)' },
  { value: 'musica', label: 'Alabanzas (Música)' },
  { value: 'agenda', label: 'Calendario (Agenda)' },
];

export const REGISTRO_ROLE_VALUES = new Set(REGISTRO_CATEGORIAS.map((r) => r.value));

export type HomeCard = { id: Screen; title: string; iconPath: string };

const HOME_CARDS: HomeCard[] = [
  { id: 'devocional', title: 'Devocionales', iconPath: '/icons/logo_devocionales.png' },
  { id: 'avisos', title: 'Anuncios', iconPath: '/icons/logo_avisos.png' },
  { id: 'alabanzas', title: 'Alabanzas', iconPath: '/icons/alabanza.png' },
  { id: 'agenda-view', title: 'Calendario', iconPath: '/icons/logo_agenda.png' },
];

export function homeCardsForRoles(rolesInput: string | string[] | null | undefined): HomeCard[] {
  const allowed = screensForRoles(rolesInput);
  return HOME_CARDS.filter((c) => allowed.has(c.id));
}
