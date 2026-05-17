import type { Screen } from '@/types';
import { ACCESS_MODULES, ALL_NAVIGABLE_SCREENS, MODULE_ROLE_IDS } from './modules';

export const SUPER_ADMIN_ROLE = 'super-admin';
export const ADMIN_ROLE = 'admin';
const DEFAULT_ROLE = 'visitante';

export type AccessResolution = {
  roles: string[];
  screens: ReadonlySet<Screen>;
  isSuperAdmin: boolean;
  isAdminOrSuperAdmin: boolean;
  /** true = se aplicó fallback seguro (no bloquear al operador) */
  usedFallback: boolean;
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
    return [...new Set(input.map(normalizeRole).filter(Boolean))];
  }
  if (!input) return [];
  return [...new Set(input.split(',').map(normalizeRole).filter(Boolean))];
}

function moduleScreensForRole(role: string): readonly Screen[] | null {
  const hit = ACCESS_MODULES.find((m) => m.roleId === role || m.aliases.includes(role));
  return hit?.screens ?? null;
}

/** Roles legacy sin módulo propio (solo inicio). */
const LEGACY_HOME_ONLY: Record<string, readonly Screen[]> = {
  visitante: ['home'],
  biblias: ['home'],
  encargado: ['home'],
};

function mergeScreensForRoles(roles: string[]): Set<Screen> {
  const merged = new Set<Screen>(['home']);
  for (const role of roles) {
    const screens = moduleScreensForRole(role) ?? LEGACY_HOME_ONLY[role];
    if (!screens) continue;
    for (const s of screens) merged.add(s);
  }
  return merged;
}

/** Fallback: acceso completo de administrador (no rompe operación si el mapa falla) */
function fullAdminResolution(inputRoles: string | string[] | null | undefined): AccessResolution {
  const roles = parseRoles(inputRoles);
  return {
    roles: roles.length > 0 ? roles : [ADMIN_ROLE],
    screens: ALL_NAVIGABLE_SCREENS,
    isSuperAdmin: roles.includes(SUPER_ADMIN_ROLE),
    isAdminOrSuperAdmin: true,
    usedFallback: true,
  };
}

/**
 * Resuelve permisos de forma aislada. Si algo falla o un admin queda sin pantallas por error de mapa,
 * aplica fallback de administrador en lugar de dejar la app inutilizable.
 */
export function resolveAccess(
  rolesInput: string | string[] | null | undefined,
  options?: { allowAdminFallback?: boolean }
): AccessResolution {
  const allowFallback = options?.allowAdminFallback !== false;

  try {
    const roles = parseRoles(rolesInput);
    const isSuper = roles.includes(SUPER_ADMIN_ROLE);
    const isAdmin = roles.includes(ADMIN_ROLE);

    if (isSuper || isAdmin) {
      return {
        roles,
        screens: ALL_NAVIGABLE_SCREENS,
        isSuperAdmin: isSuper,
        isAdminOrSuperAdmin: true,
        usedFallback: false,
      };
    }

    const screens = mergeScreensForRoles(roles);

    const onlyHome =
      screens.size <= 1 && (screens.has('home') || screens.size === 0);

    if (allowFallback && onlyHome && roles.length === 0) {
      return {
        roles: [DEFAULT_ROLE],
        screens: new Set<Screen>(['home']),
        isSuperAdmin: false,
        isAdminOrSuperAdmin: false,
        usedFallback: false,
      };
    }

    return {
      roles: roles.length > 0 ? roles : [DEFAULT_ROLE],
      screens,
      isSuperAdmin: false,
      isAdminOrSuperAdmin: false,
      usedFallback: false,
    };
  } catch {
    if (!allowFallback) {
      return {
        roles: [DEFAULT_ROLE],
        screens: new Set<Screen>(['home']),
        isSuperAdmin: false,
        isAdminOrSuperAdmin: false,
        usedFallback: false,
      };
    }
    return fullAdminResolution(rolesInput ?? []);
  }
}

export function canAccessScreen(
  rolesInput: string | string[] | null | undefined,
  screen: Screen
): boolean {
  return resolveAccess(rolesInput).screens.has(screen);
}

export function isSuperAdmin(rolesInput: string | string[] | null | undefined): boolean {
  return resolveAccess(rolesInput).isSuperAdmin;
}

export function isAdminOrSuperAdmin(rolesInput: string | string[] | null | undefined): boolean {
  return resolveAccess(rolesInput).isAdminOrSuperAdmin;
}

export function screensForRoles(rolesInput: string | string[] | null | undefined): ReadonlySet<Screen> {
  return resolveAccess(rolesInput).screens;
}

/** Roles asignables por checkbox (delegación operativa) */
export function editableModuleRolesFromCheckboxes(checked: string[]): string[] {
  return [...new Set(checked.map(normalizeRole).filter((r) => MODULE_ROLE_IDS.has(r as never)))];
}
