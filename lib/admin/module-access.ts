import type { Screen } from '@/types';
import {
  denyTokenFor,
  MODULE_ACTIONS,
  moduleIdForScreen,
  type ModuleAction,
} from '@/lib/access/modules';
import { canAccessScreen, isAdminOrSuperAdmin, parseRoles } from '@/lib/roles';

/**
 * ¿Puede ver/usar el módulo? (sin distinguir acciones).
 * Compatibilidad: hasta ahora «poder ver» implicaba crear/editar/eliminar.
 */
export function canManageModule(
  roles: string | string[] | null | undefined,
  screen: Screen
): boolean {
  return canAccessScreen(roles, screen);
}

/**
 * Permiso granular por acción dentro del módulo.
 * - admin / super-admin: siempre true.
 * - Sin acceso al módulo: false.
 * - Por defecto: true (no rompe roles existentes que solo tienen el módulo).
 * - Si el rol incluye `${moduleId}:sin-${accion}`, esa acción queda denegada.
 */
export function canPerformModuleAction(
  roles: string | string[] | null | undefined,
  screen: Screen,
  action: ModuleAction
): boolean {
  const normalized = parseRoles(roles);
  if (isAdminOrSuperAdmin(normalized)) return true;
  if (!canAccessScreen(normalized, screen)) return false;

  const moduleId = moduleIdForScreen(screen);
  if (!moduleId) return false;
  return !normalized.includes(denyTokenFor(moduleId, action));
}

export type ModuleCapabilities = {
  view: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
};

export function moduleCapabilities(
  roles: string | string[] | null | undefined,
  screen: Screen
): ModuleCapabilities {
  const view = canManageModule(roles, screen);
  return {
    view,
    crear: view && canPerformModuleAction(roles, screen, 'crear'),
    editar: view && canPerformModuleAction(roles, screen, 'editar'),
    eliminar: view && canPerformModuleAction(roles, screen, 'eliminar'),
  };
}

export { MODULE_ACTIONS, type ModuleAction };
