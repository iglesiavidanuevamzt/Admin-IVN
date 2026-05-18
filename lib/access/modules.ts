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

/**
 * Permisos granulares por módulo (denylist, NO rompe a usuarios existentes).
 *
 * - Tener `anuncios` en `perfiles.rol` sigue dando ver + crear + editar + eliminar.
 * - Añadir `anuncios:sin-crear` quita SOLO la capacidad de crear.
 * - Idem `:sin-editar` y `:sin-eliminar`.
 * - admin / super-admin ignoran estos tokens.
 */
export const MODULE_ACTIONS = ['crear', 'editar', 'eliminar'] as const;
export type ModuleAction = (typeof MODULE_ACTIONS)[number];

export const MODULE_ACTION_LABELS: Record<ModuleAction, string> = {
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
};

export function denyTokenFor(moduleId: string, action: ModuleAction): string {
  return `${moduleId}:sin-${action}`;
}

export const MODULE_ACTION_DENY_TOKENS: readonly string[] = ACCESS_MODULES.flatMap((m) =>
  MODULE_ACTIONS.map((a) => denyTokenFor(m.roleId, a))
);

export const MODULE_ACTION_DENY_TOKEN_SET = new Set<string>(MODULE_ACTION_DENY_TOKENS);

export function isModuleDenyToken(role: string): boolean {
  return MODULE_ACTION_DENY_TOKEN_SET.has(role);
}

const SCREEN_TO_MODULE_ID = ACCESS_MODULES.reduce<Record<string, string>>((acc, m) => {
  for (const s of m.screens) acc[s] = m.roleId;
  return acc;
}, {});

export function moduleIdForScreen(screen: string): string | null {
  return SCREEN_TO_MODULE_ID[screen] ?? null;
}

export const ALL_NAVIGABLE_SCREENS: ReadonlySet<Screen> = new Set([
  'home',
  'devocional',
  'avisos',
  'history',
  'alabanzas',
  'agenda-view',
]);
