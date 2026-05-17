import type { Screen } from '@/types';

/** Rol almacenado en `perfiles.rol` (text[]) */
export type ModuleRoleId = 'devocional' | 'anuncios' | 'musica' | 'agenda';

export type AccessModule = {
  /** Valor persistido en BD (checkbox en /admin/usuarios) */
  roleId: ModuleRoleId;
  label: string;
  /** Pantallas de la SPA que desbloquea */
  screens: readonly Screen[];
  /** Alias legacy en BD (compatibilidad) */
  aliases: readonly string[];
};

/**
 * Mapa único módulo → pantallas. Para asignar a Carlo: marcar devocional + anuncios + agenda.
 * REVERTIR cambios: edita solo este archivo y ADMIN_USER_EDIT_ROLES en lib/roles.ts.
 */
export const ACCESS_MODULES: readonly AccessModule[] = [
  {
    roleId: 'devocional',
    label: 'Devocionales',
    screens: ['home', 'devocional'],
    aliases: ['devocionales'],
  },
  {
    roleId: 'anuncios',
    label: 'Anuncios / Avisos',
    screens: ['home', 'avisos', 'history'],
    aliases: ['avisos'],
  },
  {
    roleId: 'musica',
    label: 'Alabanzas',
    screens: ['home', 'alabanzas'],
    aliases: [],
  },
  {
    roleId: 'agenda',
    label: 'Calendario',
    screens: ['home', 'agenda-view'],
    aliases: ['calendario'],
  },
] as const;

export const MODULE_ROLE_IDS = new Set(ACCESS_MODULES.map((m) => m.roleId));

export const ALL_NAVIGABLE_SCREENS: ReadonlySet<Screen> = new Set([
  'home',
  'devocional',
  'avisos',
  'history',
  'alabanzas',
  'agenda-view',
]);
