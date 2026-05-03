import type { Screen } from '@/types';

export const SUPER_ADMIN_ROLE = 'super-admin';

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
  musica: new Set(['home', 'alabanzas']),
  devocional: new Set(['home', 'devocional']),
  anuncios: new Set(['home', 'avisos', 'history']),
  agenda: new Set(['home', 'agenda-view']),
  encargado: new Set(['home']),
};

export function screensForRole(rol: string | null | undefined): ReadonlySet<Screen> {
  if (!rol) return new Set<Screen>(['home']);
  const set = ROLE_SCREENS[rol.trim()];
  if (!set) return new Set<Screen>(['home']);
  return set;
}

export function canAccessScreen(rol: string | null | undefined, screen: Screen): boolean {
  return screensForRole(rol).has(screen);
}

export function isSuperAdmin(rol: string | null | undefined): boolean {
  return rol?.trim() === SUPER_ADMIN_ROLE;
}

/** Roles que puede asignar un super-admin en /admin/usuarios */
export const ASSIGNABLE_ROLES: { value: string; label: string }[] = [
  { value: SUPER_ADMIN_ROLE, label: 'Super administrador' },
  { value: 'musica', label: 'Música / Alabanzas' },
  { value: 'devocional', label: 'Devocionales' },
  { value: 'anuncios', label: 'Anuncios / Avisos' },
  { value: 'agenda', label: 'Agenda / Calendario' },
  { value: 'encargado', label: 'Encargado (solo inicio)' },
];

export const ASSIGNABLE_ROLE_VALUES = new Set(ASSIGNABLE_ROLES.map((r) => r.value));

export type HomeCard = { id: Screen; title: string; iconPath: string };

const HOME_CARDS: HomeCard[] = [
  { id: 'devocional', title: 'Devocionales', iconPath: '/icons/logo_devocionales.png' },
  { id: 'avisos', title: 'Anuncios', iconPath: '/icons/logo_avisos.png' },
  { id: 'alabanzas', title: 'Alabanzas', iconPath: '/icons/alabanza.png' },
  { id: 'agenda-view', title: 'Calendario', iconPath: '/icons/logo_agenda.png' },
];

export function homeCardsForRole(rol: string | null | undefined): HomeCard[] {
  const allowed = screensForRole(rol);
  return HOME_CARDS.filter((c) => allowed.has(c.id));
}
